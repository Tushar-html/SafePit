import React, { useState, useEffect, useRef, ReactNode } from "react";
import * as THREE from "three";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Plus, Minus, Sparkles, RefreshCw, Volume2, VolumeX, Radar, AlertTriangle, Bug } from "lucide-react";
import { applyViewportScale } from "./fxShared";
import { useARGestures } from "../hooks/useARGestures";
import { useARTracking, TrackState } from "../hooks/useARTracking";
import { useCamera } from "../context/CameraContext";
import { useLanguage } from "../context/LanguageContext";
import { useVoiceNarration } from "../hooks/useVoiceNarration";

export interface ARShellProps {
  onBack: () => void;
  title: string;
  readyText: string;
  completedText: string;
  lineText: string;
  footerCaption: string;
  scanHint: string;
  badge?: ReactNode;
  createModel: () => THREE.Group;
  updateModel: (group: THREE.Group, elapsed: number, delta: number) => void;
  disposeModel: (group: THREE.Group) => void;
  modelKey: string | number;
  progressLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  completedSignal?: boolean;
  onRestart: () => void;
  /** text for the voice engine — lets Santali speak Hindi (Ol Chiki is not TTS-readable) */
  voiceText?: string;
}

type Phase = "detecting_surface" | "active_module" | "completed";

/** shortest signed angular difference (radians) */
const shortAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/* On-device debug HUD — live session numbers (bug icon in the AR controls). */
const DebugHUD: React.FC<{ tracking: ReturnType<typeof useARTracking> }> = ({ tracking }) => {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const iv = window.setInterval(() => {
      const d = tracking.debugRef.current;
      const pd = ((d.pitch * 180) / Math.PI).toFixed(0);
      const yd = ((d.yaw * 180) / Math.PI).toFixed(0);
      setLines([
        `pitch ${pd}°   yaw ${yd}°`,
        `cam   ${d.camX.toFixed(2)}  ${d.camY.toFixed(2)}  ${d.camZ.toFixed(2)}`,
        `dist  ${d.anchorDist.toFixed(2)} m   state ${["OK", "LIMITED", "LOST"][d.trackState]}`,
        `VO    ${d.voValid ? "valid" : "—"}   blocks ${d.textured}`,
        `flow  ${d.transX.toFixed(1)} ${d.transY.toFixed(1)}  rad ${d.radial.toFixed(3)}`,
        `gyro  ${d.gyroAge < 0 ? "never" : d.gyroAge + "ms"}   motion ${d.motionAge < 0 ? "never" : d.motionAge + "ms"}`,
      ]);
    }, 200);
    return () => window.clearInterval(iv);
  }, [tracking]);
  return (
    <div className="absolute top-2 left-2 z-40 pointer-events-none">
      <div className="px-2.5 py-2 rounded-xl bg-slate-950/85 border border-white/10 text-[9px] leading-[1.55] font-mono text-emerald-300 whitespace-pre">
        {lines.join("\n")}
      </div>
    </div>
  );
};

export const ARShell: React.FC<ARShellProps> = ({
  onBack,
  title,
  readyText,
  completedText,
  lineText,
  footerCaption,
  scanHint,
  badge,
  createModel,
  updateModel,
  disposeModel,
  modelKey,
  progressLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
  completedSignal,
  onRestart,
  voiceText
}) => {
  const [arPhase, setArPhase] = useState<Phase>("detecting_surface");
  const [narrationOn, setNarrationOn] = useState(true);

  const { stream, requestCamera, requestGyro } = useCamera();
  const { t } = useLanguage();
  const { speak, stop, speaking, supported: ttsSupported } = useVoiceNarration();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentGroupRef = useRef<THREE.Group | null>(null);
  const reticleGroupRef = useRef<THREE.Group | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const elapsedOffsetRef = useRef<number>(0);
  const updateRef = useRef(updateModel);
  updateRef.current = updateModel;

  const gestures = useARGestures();
  // Compact, eye-pleasing object size — the miner stands ≈ 0.37 m, a neat
  // tabletop figure that always fits the viewfinder at placement distance.
  // Pinch / +/- zoom still scales on top.
  const REAL_WORLD_SCALE = 0.6;
  const tracking = useARTracking({ videoRef });

  // re-place confirmation dialog
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  // debug HUD
  const [showHud, setShowHud] = useState(false);

  useEffect(() => {
    if (!stream) requestCamera();
    requestGyro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  /* Adaptive FOV: match the renderer to the REAL camera crop. The video is
     object-cover'ed into the viewfinder box, so the visible slice of the
     sensor frame is smaller than the full frame — using the guessed global
     FOV made the 3D world drift outside the video. This recomputes the
     vertical FOV from the live video size + box size whenever either changes. */
  useEffect(() => {
    if (!stream) return;
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      const cam = cameraRef.current;
      const box = boxRef.current;
      if (!cam || !box || !video.videoWidth || !video.videoHeight) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const bw = box.clientWidth || 1;
      const bh = box.clientHeight || 1;
      const s = Math.max(bw / vw, bh / vh); // object-cover scale
      const visW = bw / s;                  // visible slice of the sensor frame
      const visH = bh / s;
      // typical phone rear camera: ≈62° across the sensor's LONG axis
      const t = Math.tan((31 * Math.PI) / 180);
      const tanVisV = vw >= vh ? (t * visH) / vw : (t * visH) / vh;
      const vFov = THREE.MathUtils.clamp(2 * Math.atan(tanVisV) * (180 / Math.PI), 25, 70);
      cam.fov = vFov;
      cam.aspect = bw / bh;
      cam.updateProjectionMatrix();
    };
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("resize", sync);
    window.addEventListener("resize", sync);
    sync();
    return () => {
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("resize", sync);
      window.removeEventListener("resize", sync);
    };
  }, [stream]);

  // Voice narration: speak each new line automatically (voiceText lets
  // Santali fall back to Hindi speech — TTS engines cannot read Ol Chiki)
  useEffect(() => {
    if (arPhase !== "active_module") return;
    if (!narrationOn || !ttsSupported) return;
    const text = voiceText || lineText;
    if (!text) return;
    speak(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceText, lineText, arPhase, narrationOn, ttsSupported]);

  useEffect(() => {
    if (arPhase !== "active_module") stop();
  }, [arPhase, stop]);
  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (completedSignal && arPhase === "active_module") {
      stop();
      setArPhase("completed");
    }
  }, [completedSignal, arPhase, stop]);

  /* ---------------- Three.js init ---------------- */
  useEffect(() => {
    if (!boxRef.current || !canvasRef.current) return;
    const width = boxRef.current.clientWidth;
    const height = boxRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // FOV matched to a typical phone rear camera (~60° hFOV) cropped by the
    // 4/3.3 viewfinder box, so the 3D scene lines up with the real floor.
    const camera = new THREE.PerspectiveCamera(47, width / height, 0.05, 60);
    camera.position.set(0, 1.5, 0.01); // eye height at origin; overridden per-frame
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.7);
    keyLight.position.set(2, 4, 2.5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xcfe8ff, 0.6);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    /* Placement reticle: a small dotted disc + ring, 1.8 m ahead while
       scanning; hidden once anchored, then reused as the anchor pin. */
    const reticle = new THREE.Group();
    reticle.name = "placement_reticle";
    reticle.visible = false;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.065, 32),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    ring.rotation.x = -Math.PI / 2;
    reticle.add(ring);

    const dotGeo = new THREE.CircleGeometry(0.0045, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    for (let r = 1; r <= 3; r++) {
      const rad = r * 0.04;
      const n = r * 8;
      for (let i = 0; i < n; i++) {
        const d = new THREE.Mesh(dotGeo, dotMat);
        d.rotation.x = -Math.PI / 2;
        d.position.set(Math.cos((i / n) * Math.PI * 2) * rad, 0.0015, Math.sin((i / n) * Math.PI * 2) * rad);
        reticle.add(d);
      }
    }

    scene.add(reticle);
    reticleGroupRef.current = reticle;

    const handleResize = () => {
      if (!boxRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = boxRef.current.clientWidth;
      const h = boxRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      if (currentGroupRef.current) applyViewportScale(currentGroupRef.current, cameraRef.current, h);
    };
    window.addEventListener("resize", handleResize);

    /* Render loop — DEVICE-POSE camera: the virtual camera IS the phone.
       The model is parented to the scene-graph ANCHOR (added on placement),
       never to the camera. Position is driven only by the anchor. */
    const anchorGroup = new THREE.Group();
    anchorGroup.name = "ar_anchor";
    scene.add(anchorGroup);

    const viewDir = new THREE.Vector3();
    const orbitPos = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    const lookM = new THREE.Matrix4();
    const lookQ = new THREE.Quaternion();
    const upVec = new THREE.Vector3(0, 1, 0);
    let framingLatch = false;

    let lastElapsed = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clockRef.current.getElapsedTime() + elapsedOffsetRef.current;
      const delta = Math.min(0.05, Math.max(0.0001, elapsed - lastElapsed));
      lastElapsed = elapsed;

      const cam = cameraRef.current;
      if (!cam) return;

      const anchored = tracking.hasAnchorRef.current;
      const anchor = tracking.anchorRef.current;

      /* --- DEVICE-POSE camera — the phone IS the viewfinder.
         Orientation comes from the sensor-fused quaternion and position
         from visual-inertial odometry, so the model stays fixed in the
         ROOM while the view moves exactly like your eyes. No lookAt,
         no virtual orbit — the 3D world is the real world. --- */
      /* --- ORBIT AROUND THE ANCHOR, TRUE PHONE ORIENTATION — the model is
         fixed at its surface point; the camera moves around it.
         • Pan right/left from the placement pose → the camera orbits and
           the model slides across the view like a real object.
         • Tilt further down than placement → camera rises over the top.
         • Roll has no effect. Walking closer shrinks the radius (grows).
         At placement the camera is EXACTLY at the real pose, so the model
         sits under the crosshair, glued to the surface — never floating. */
      const yaw = tracking.yawRef.current;
      const pitch = tracking.pitchRef.current;
      if (anchored && anchor) {
        const radius = THREE.MathUtils.clamp(cam.position.distanceTo(anchor.position), 0.45, 5);
        const dYaw = shortAngle(yaw - anchor.yaw0); // pan around (relative)
        const elev = THREE.MathUtils.clamp(
          anchor.elev0 + (anchor.pitch0 - pitch), // tilt relative to placement
          -0.12,
          1.35
        );
        const az = anchor.yaw0 + dYaw; // camera azimuth around the anchor
        const rh = radius * Math.cos(elev);
        orbitPos.set(
          anchor.position.x - Math.sin(az) * rh,
          anchor.position.y + Math.max(0.1, radius * Math.sin(elev)),
          anchor.position.z + Math.cos(az) * rh
        );
        cam.position.lerp(orbitPos, 0.35);
        // TRUE phone orientation — the model shifts in view like a real
        // object instead of riding the center of the screen
        cam.quaternion.copy(tracking.camQuatRef.current);
      } else {
        // scanning: raw device-pose view so the reticle rides the real view
        cam.quaternion.copy(tracking.camQuatRef.current);
        cam.position.copy(tracking.camPosRef.current);
      }
      cam.updateMatrixWorld();

      /* --- FRAMING GUARANTEE: if the anchor leaves the viewfinder (pose
         drift, blocked sensors), the view gently turns back toward it. --- */
      if (anchored && anchor) {
        projVec.copy(anchor.position).project(cam);
        const ax = Math.abs(projVec.x);
        const ay = Math.abs(projVec.y);
        const off = projVec.z > 1 || ax > 0.85 || ay > 0.85;
        if (off) framingLatch = true;
        else if (ax < 0.5 && ay < 0.5 && projVec.z <= 1) framingLatch = false;
        if (framingLatch) {
          lookM.lookAt(cam.position, anchor.position, upVec);
          lookQ.setFromRotationMatrix(lookM);
          cam.quaternion.slerp(lookQ, 0.25);
          cam.updateMatrixWorld();
        }
      }

      /* --- placement reticle: true raycast of the view center onto the
         detected floor plane; hidden unless scanning with a surface --- */
      const ret = reticleGroupRef.current;
      if (ret) {
        const scanning =
          !anchored && tracking.reticleVisibleRef.current && arPhaseRef.current === "detecting_surface";
        if (scanning) {
          // CENTER-CROSSHAIR reticle — IDENTICAL math to the anchor placement:
          // the dot ring sits at the 3D point under the crosshair, so what
          // you see in the middle is exactly where the model will land, on
          // any surface (hand, bed, table, floor). Ring scales with distance.
          viewDir.set(0, 0, -1).applyQuaternion(cam.quaternion);
          const down = -viewDir.y;
          if (down > 0.05) {
            const d = THREE.MathUtils.clamp(
              (tracking.camHeightRef.current * Math.sqrt(Math.max(0, 1 - down * down))) / down,
              0.5,
              4.5
            );
            ret.position.copy(cam.position).addScaledVector(viewDir, d);
            ret.rotation.y = Math.atan2(viewDir.x, viewDir.z);
            ret.scale.setScalar(THREE.MathUtils.clamp(d / 2, 0.3, 1) * (1 + Math.sin(elapsed * 2.4) * 0.1));
            ret.visible = true;
          } else {
            ret.visible = false;
          }
        } else if (anchored && anchor && arPhaseRef.current === "active_module") {
          // anchor pin marker — small dot on the floor at the anchor
          ret.visible = tracking.trackState !== TrackState.TRK_LOST;
          ret.position.set(anchor.position.x, anchor.position.y + 0.002, anchor.position.z);
          ret.rotation.y = 0;
          ret.scale.setScalar(0.5);
        } else {
          ret.visible = false;
        }
      }

      /* --- WORLD-LOCKED model: base sunk 2 cm into the surface point so it
         visually CONTACTS it (no hover gap). The transform is never touched
         after placement — the orbiting phone only changes the VIEW. --- */
      const g = currentGroupRef.current;
      if (g) {
        if (anchored && anchor) {
          g.position.set(anchor.position.x, anchor.position.y - 0.02, anchor.position.z);
          g.visible = tracking.trackState !== TrackState.TRK_LOST;
        } else {
          g.visible = false;
        }
        g.scale.setScalar(REAL_WORLD_SCALE * gestures.refs.zoomRef.current);
        const { isDraggingRef, rotationVelocityRef, targetRotationRef } = gestures.refs;
        if (!isDraggingRef.current) {
          rotationVelocityRef.current *= 0.94;
          targetRotationRef.current += rotationVelocityRef.current;
        }
        g.rotation.y = targetRotationRef.current;
        updateRef.current(g, elapsed, delta);
      }

      renderer.render(scene, cam);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arPhaseRef = useRef<Phase>(arPhase);
  useEffect(() => {
    arPhaseRef.current = arPhase;
  }, [arPhase]);

  /* Model swap on step change: re-parent to the anchor */
  useEffect(() => {
    if (!sceneRef.current) return;
    const anchorGroup = sceneRef.current.getObjectByName("ar_anchor");
    if (currentGroupRef.current) {
      (anchorGroup ?? sceneRef.current).remove(currentGroupRef.current);
      disposeModel(currentGroupRef.current);
      currentGroupRef.current = null;
    }
    if (arPhase === "active_module") {
      elapsedOffsetRef.current = -clockRef.current.getElapsedTime() + 0.001;
      const g = createModel();
      g.position.set(0, 0, 0); // anchor-local: base on the plane
      g.scale.setScalar(REAL_WORLD_SCALE * gestures.refs.zoomRef.current);
      gestures.refs.targetRotationRef.current = 0;
      gestures.refs.rotationVelocityRef.current = 0;
      (anchorGroup ?? sceneRef.current).add(g);
      currentGroupRef.current = g;
      if (boxRef.current && cameraRef.current) {
        applyViewportScale(g, cameraRef.current, boxRef.current.clientHeight);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey, arPhase]);

  const toggleNarration = () => {
    if (narrationOn) {
      stop();
      setNarrationOn(false);
    } else {
      setNarrationOn(true);
      if (arPhase === "active_module" && lineText) speak(lineText);
    }
  };

  const trackStatus = tracking.status;
  const trackState = tracking.trackState;
  const searching = trackStatus === "searching";
  const found = trackStatus === "found";
  const unavailable = trackStatus === "unavailable";
  const trackingLost = arPhase === "active_module" && trackState === TrackState.TRK_LOST;

  // Re-arm scanning whenever the scan screen opens
  useEffect(() => {
    if (arPhase === "detecting_surface" && trackStatus !== "unavailable") {
      tracking.resetPlacement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arPhase]);

  // Start button: 4 s escape hatch — never locks the user out
  const [allowStartAnyway, setAllowStartAnyway] = useState(false);
  useEffect(() => {
    setAllowStartAnyway(false);
    if (arPhase !== "detecting_surface" || !searching) return;
    const timer = window.setTimeout(() => setAllowStartAnyway(true), 4000);
    return () => window.clearTimeout(timer);
  }, [arPhase, searching]);

  const startModule = () => {
    tracking.forcePlace(); // ALWAYS stamp an anchor before entering the module
    setArPhase("active_module");
  };

  const rePlace = () => {
    setShowReplaceDialog(false);
    stop();
    tracking.resetPlacement();
    setArPhase("detecting_surface");
  };

  return (
    <div className="min-h-screen bg-[#eef5fb] flex items-center justify-center p-0 sm:p-4 select-none font-sans">
      <div className="w-full max-w-md min-h-screen sm:min-h-[760px] bg-white sm:rounded-3xl shadow-lg flex flex-col justify-between p-5 sm:p-6 relative pt-[calc(1.25rem+env(safe-area-inset-top))]">

        {/* TOP HEADER */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#f0f7fe] text-[#0284c7] hover:bg-[#e0effd] transition-all flex items-center justify-center active:scale-95 shrink-0" title={t("back")}>
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <div className="flex-1 flex justify-center">
            <img src="logo.png" alt="SafePit" className="h-9 w-auto object-contain" />
          </div>
          <button onClick={toggleNarration} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 relative ${narrationOn ? "bg-[#0284c7] text-white" : "bg-[#f0f7fe] text-[#0284c7]"}`} title={t("narrationTitle")}>
            {narrationOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {speaking && narrationOn && <span className="absolute inset-0 rounded-full border-2 border-[#7dd3fc] animate-ping" />}
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2942] tracking-tight mt-6 mb-3 text-left">{title}</h1>

        {/* AR MODULE BOX */}
        <div id="ar-viewport" ref={boxRef} {...gestures.handlers} className="w-full aspect-[4/3.3] sm:h-[350px] rounded-3xl relative overflow-hidden bg-slate-900 shadow-inner select-none cursor-grab active:cursor-grabbing touch-none">
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#a1b8cb] via-[#b9cddc] to-[#c7d9e7] z-0" />
          )}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 block pointer-events-auto" />

          {/* PHASE 1: SCAN */}
          {arPhase === "detecting_surface" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-12 p-4 bg-slate-950/45">
              {unavailable ? (
                <div className="bg-white/95 rounded-2xl p-5 shadow-2xl border border-[#e2eaf2] text-center max-w-xs w-full space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0f7fe] text-[#0284c7] flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0f2942]">{t("surfaceIdentified")}</h3>
                    <p className="text-[11px] text-[#64748b] mt-1 leading-snug">{readyText}</p>
                  </div>
                  <button onClick={startModule} className="w-full py-2.5 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span>{t("startModule")}</span><ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-white/95 rounded-2xl p-5 shadow-2xl border border-[#e2eaf2] text-center max-w-xs w-full space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${found ? "bg-emerald-50 text-emerald-600" : "bg-[#f0f7fe] text-[#0284c7]"}`}>
                    {found ? <Sparkles className="w-5 h-5" /> : <Radar className="w-5 h-5 animate-pulse" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0f2942]">{found ? t("surfaceFound") : t("scanningSurface")}</h3>
                    <p className="text-[11px] text-[#64748b] mt-1 leading-snug">{found ? readyText : scanHint}</p>
                  </div>
                  <button onClick={startModule} disabled={searching && !allowStartAnyway} className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${found || allowStartAnyway ? "bg-[#0284c7] hover:bg-[#0369a1] text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                    <span>{t("startModule")}</span><ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {searching && (
                    <p className="text-[10px] text-[#94a3b8] leading-snug">{allowStartAnyway ? t("startAnywayHint") : t("keepPhoneSteadyHint")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* NO PLANE SURFACE popup while scanning */}
          {arPhase === "detecting_surface" && searching && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-16 z-30 w-[85%] max-w-[260px] pointer-events-none">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#7f1d1d]/95 text-white shadow-2xl border border-red-300/30 backdrop-blur-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-200" />
                <p className="text-[11px] font-semibold leading-snug">{t("noSurface")}</p>
              </div>
            </div>
          )}

          {/* PHASE 2: ACTIVE */}
          {arPhase === "active_module" && (
            <>
              {badge}

              {/* TRACKING LOST banner */}
              {trackingLost && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-[300px] pointer-events-none">
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#7f1d1d]/95 text-white shadow-2xl border border-red-300/30 backdrop-blur-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-200" />
                    <p className="text-[11px] font-semibold leading-snug">{t("trackingLost")}</p>
                  </div>
                </div>
              )}

              {/* LIMITED banner (camera moved too fast) */}
              {trackState === TrackState.TRK_LIMITED && !trackingLost && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-[280px] pointer-events-none">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-500/90 text-white shadow-lg">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-[10px] font-semibold leading-snug">{t("trackingLimited")}</p>
                  </div>
                </div>
              )}

              {/* AR Controls */}
              <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
                <button onClick={() => gestures.zoomBy(0.2)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0f2942] shadow-md flex items-center justify-center active:scale-90 transition-all" title="Zoom In"><Plus className="w-4 h-4 stroke-[2.5]" /></button>
                <button onClick={() => gestures.zoomBy(-0.2)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0f2942] shadow-md flex items-center justify-center active:scale-90 transition-all" title="Zoom Out"><Minus className="w-4 h-4 stroke-[2.5]" /></button>
                <button onClick={() => { gestures.recenter(); tracking.recalibrate(); }} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0f2942] shadow-md flex items-center justify-center active:scale-90 transition-all" title="Recenter"><RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" /></button>
                {/* RESET / RE-PLACE */}
                <button onClick={() => setShowReplaceDialog(true)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0f2942] shadow-md flex items-center justify-center active:scale-90 transition-all" title={t("rePlaceTitle")}>
                  <Radar className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                {/* DEBUG HUD */}
                <button onClick={() => setShowHud(v => !v)} className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center active:scale-90 transition-all ${showHud ? "bg-[#0284c7] text-white" : "bg-white/90 hover:bg-white text-[#0f2942]"}`} title="Debug HUD">
                  <Bug className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/55 text-[9.5px] font-medium text-white/90 border border-white/10 max-w-[70%]">
                  <span>{t("gyroHint")}</span>
                </div>
              </div>

              {speaking && narrationOn && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/60 text-[10px] font-semibold text-white border border-white/10">
                    <Volume2 className="w-3 h-3 animate-pulse text-sky-300" />
                    <span>{t("narrationPlaying")}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {showHud && <DebugHUD tracking={tracking} />}

          {/* Status chip */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/60 text-[10px] font-semibold text-white border border-white/10">
              {unavailable ? (
                <><span className="w-2 h-2 rounded-full bg-sky-400" /><span>{t("simulatedAr")}</span></>
              ) : (
                <><span className={`w-2 h-2 rounded-full ${trackingLost ? "bg-red-400" : found ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} /><span>{trackingLost ? t("trackingLostShort") : found ? t("arTracked") : t("arSearching")}</span></>
              )}
            </div>
          </div>

          {/* RE-PLACE confirm dialog */}
          {showReplaceDialog && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-slate-900/50">
              <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl border border-[#e2eaf2] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f0f7fe] text-[#0284c7] flex items-center justify-center mx-auto">
                  <Radar className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">{t("rePlaceBody")}</p>
                <div className="space-y-2 pt-1">
                  <button onClick={rePlace} className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs active:scale-95 transition-all">{t("rePlaceConfirm")}</button>
                  <button onClick={() => setShowReplaceDialog(false)} className="w-full py-2.5 rounded-xl border border-[#cfe6fa] text-[#0284c7] hover:bg-sky-50 font-bold text-xs transition-all active:scale-95">{t("cancel")}</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="min-h-[44px] flex items-center justify-center text-center px-2 my-3 sm:my-4">
          <p className="text-xs sm:text-[13px] text-[#334155] font-normal leading-relaxed">
            {arPhase === "detecting_surface" ? scanHint : lineText}
          </p>
        </div>

        {/* NAV */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <button onClick={onPrev} disabled={arPhase !== "active_module" || !canPrev} className="w-10 h-10 rounded-full bg-[#f0f7fe] text-[#0284c7] hover:bg-[#e0effd] transition-all flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 shrink-0" title={t("back")}>
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <span className="text-xs text-[#64748b] font-medium tracking-wider text-center">{progressLabel}</span>
          <button onClick={onNext} disabled={arPhase !== "active_module" || !canNext} className="w-10 h-10 rounded-full bg-[#f0f7fe] text-[#0284c7] hover:bg-[#e0effd] transition-all flex items-center justify-center disabled:opacity-35 active:scale-95 shrink-0" title={t("next")}>
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        <p className="text-[11px] text-[#94a3b8] text-center pb-1 pt-2 select-none tracking-tight">{footerCaption}</p>

        {/* COMPLETION */}
        {arPhase === "completed" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-900/50 rounded-3xl">
            <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl border border-[#e2eaf2] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f2942]">{t("moduleCompleted")}</h3>
                <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">{completedText}</p>
              </div>
              <div className="space-y-2 pt-2">
                <button onClick={() => { onRestart(); elapsedOffsetRef.current = -clockRef.current.getElapsedTime() + 0.001; setArPhase("active_module"); }} className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /><span>{t("reviewFromStart")}</span>
                </button>
                <button onClick={onBack} className="w-full py-2.5 rounded-xl border border-[#cfe6fa] text-[#0284c7] hover:bg-sky-50 font-bold text-xs transition-all active:scale-95">{t("backToSubModules")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
