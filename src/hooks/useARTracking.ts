import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { VisualOdometry, VOFrameResult } from "./useVisualOdometry";

/* ============================================================
   useARTracking — the AR session with full 6-DoF world tracking.

   Orientation (3-DoF): DeviceOrientation + devicemotion fusion
   (screen-compensated DeviceOrientationControls math) drives a
   DEVICE-POSE camera quaternion. The phone IS the camera.

   Position (3-DoF): useVisualOdometry tracks the camera feed
   frame-to-frame (gyro-compensated block matching) and converts
   residual flow into meters, so walking toward the model makes
   it grow and stepping sideways slides it — exactly like a real
   object seen through the lens.

   Plane detection: the phone must aim below the horizon at a
   level attitude with live sensors; the reticle raycasts onto
   the y = 0 plane and the anchor is created at that hit pose.
   The MODEL is parented to the anchor — never to the camera —
   and its transform is written exactly once at placement.

   Tracking state per frame:
     TRK_OK       vision + sensors agree
     TRK_LIMITED  camera shaken (accelerometer spike)
     TRK_LOST     camera blocked / moved too fast / sensors stale
                  → model hidden; recovery restores the SAME anchor.
   ============================================================ */

export type ARTrackStatus = "unavailable" | "searching" | "found";

/** Per-frame tracking quality of the session/anchor. */
export enum TrackState {
  TRK_OK = 0,
  TRK_LIMITED = 1,
  TRK_LOST = 2,
}

export interface ARAnchor {
  /** world position of the anchor (y = plane height) */
  position: THREE.Vector3;
  /** plane the anchor belongs to */
  planeY: number;
  planeType: "horizontal" | "vertical";
  /** placement view yaw (radians) — orbit azimuth is relative to this */
  yaw0: number;
  /** placement view pitch (radians, down = negative) */
  pitch0: number;
  /** camera elevation above the anchor at placement (radians) */
  elev0: number;
}

/** live session readout for the on-device debug HUD */
export interface ARDebugInfo {
  pitch: number; // radians, down = negative
  yaw: number;   // radians
  camX: number;  // camera position (m)
  camY: number;
  camZ: number;
  anchorDist: number; // camera→anchor distance (m), 0 = no anchor
  trackState: TrackState;
  voValid: boolean;   // last VO frame usable?
  textured: number;   // textured blocks seen by the VO
  transX: number;     // residual flow (px)
  transY: number;
  radial: number;
  gyroAge: number;    // ms since last orientation event (-1 = never)
  motionAge: number;  // ms since last motion event (-1 = never)
}

export interface ARTrackingOptions {
  /** live <video> element showing the rear camera — enables visual position tracking */
  videoRef?: React.MutableRefObject<HTMLVideoElement | null>;
}

export interface ARTracking {
  status: ARTrackStatus;
  supported: boolean;
  /** per-frame tracking quality */
  trackState: TrackState;
  /** calibrated yaw/pitch of the view (radians) */
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  /** device-pose camera quaternion (camera→world), per frame */
  camQuatRef: React.MutableRefObject<THREE.Quaternion>;
  /** device-pose camera POSITION in world meters (visual-inertial), per frame */
  camPosRef: React.MutableRefObject<THREE.Vector3>;
  /** camera height above the floor (m) — set from the hold-height selector */
  camHeightRef: React.MutableRefObject<number>;
  /** live debug readout for the on-device HUD */
  debugRef: React.MutableRefObject<ARDebugInfo>;
  /** true once a surface has been hit-tested and anchored */
  hasAnchorRef: React.MutableRefObject<boolean>;
  /** the current anchor (position + plane info) */
  anchorRef: React.MutableRefObject<ARAnchor | null>;
  /** placement reticle visibility (UI reads this) */
  reticleVisibleRef: React.MutableRefObject<boolean>;
  /** request an anchor at the current view (hit-test confirm) */
  hitTest: () => void;
  /** clear the anchor and restart scanning (re-place) */
  resetPlacement: () => void;
  /** alias of hitTest for the user override path */
  forcePlace: () => void;
  /** re-snap smoothing (after screen rotation) */
  recalibrate: () => void;
}

const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** −π/2 around X — maps the W3C device frame onto the WebGL camera
 *  frame so an upright phone looks at the HORIZON (pitch ≈ 0). */
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

/** assumed eye height above the floor (meters) — scale reference of the session */
export const CAM_HEIGHT = 1.45;

const VISION_STALE_MS = 700; // vision older than this while anchored → LOST (hysteresis: no flapping)
const VISION_RECOVER_MS = 250; // consistent frames for this long → OK again

function shortAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** the floor plane IS the detected surface: world y = 0. The anchor is
 *  placed ON that plane, at the ground distance implied by the view pitch
 *  and the camera's real height (user-selected: standing/sitting/table) —
 *  so the model base sits exactly on the real surface. */

export function useARTracking(options?: ARTrackingOptions): ARTracking {
  const videoRef = options?.videoRef;
  const [status, setStatus] = useState<ARTrackStatus>("unavailable");
  const [supported, setSupported] = useState(false);
  const [trackState, setTrackState] = useState<TrackState>(TrackState.TRK_OK);

  const statusRef = useRef<ARTrackStatus>("unavailable");
  const setStat = useCallback((s: ARTrackStatus) => {
    if (statusRef.current !== s) {
      statusRef.current = s;
      setStatus(s);
    }
  }, []);

  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const camQuatRef = useRef(new THREE.Quaternion());
  const camPosRef = useRef(new THREE.Vector3(0, CAM_HEIGHT, 0));
  const camHeightRef = useRef(CAM_HEIGHT);
  const debugRef = useRef<ARDebugInfo>({
    pitch: 0, yaw: 0, camX: 0, camY: 0, camZ: 0, anchorDist: 0,
    trackState: TrackState.TRK_OK, voValid: false, textured: 0,
    transX: 0, transY: 0, radial: 0, gyroAge: -1, motionAge: -1,
  });
  const hasAnchorRef = useRef(false);
  const anchorRef = useRef<ARAnchor | null>(null);
  const reticleVisibleRef = useRef(false);

  // ---- sensor state ----
  const rawRef = useRef<{ a: number; b: number; g: number } | null>(null);
  const gyroTsRef = useRef(-1e9);
  const motionTsRef = useRef(-1e9);
  const screenAngleRef = useRef(0);
  const startRef = useRef(performance.now());

  // ---- camera-motion quality (|a| from devicemotion) ----
  const accMagRef = useRef(9.81);
  const fastSinceRef = useRef(-1);

  // ---- fusion / probe / anchor bookkeeping ----
  const smoothQRef = useRef(new THREE.Quaternion());
  const haveSmoothRef = useRef(false);
  const probeRef = useRef(0);
  const lostSinceRef = useRef(-1);
  const trackStateRef = useRef<TrackState>(TrackState.TRK_OK);

  // ---- visual odometry ----
  const voRef = useRef<VisualOdometry | null>(null);
  const prevProcessedQRef = useRef<THREE.Quaternion | null>(null);
  const lastValidVisionTs = useRef(-1e9);
  const everHadVision = useRef(false);
  const visionLostSince = useRef(-1);

  // ---- UI-thread request counters ----
  const placeNowRef = useRef(0);
  const lastPlaceSeen = useRef(0);
  const resetNowRef = useRef(0);
  const lastResetSeen = useRef(0);

  /* ---------------- 1. sensor listeners ---------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      DeviceOrientationEvent?: unknown;
      screen?: { orientation?: { angle?: number } };
      orientation?: number;
    };
    if (!w.DeviceOrientationEvent) {
      setSupported(false);
      setStat("unavailable");
      return;
    }

    let absoluteSeen = false;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha == null && e.beta == null && e.gamma == null) return;
      // Chrome fires BOTH deviceorientation (relative, smoothed) and
      // deviceorientationabsolute (unsmoothed, different alpha convention).
      // Feeding both into one state made the pose fight itself — once an
      // absolute event has been seen, ignore the relative duplicates.
      if (e.absolute === true) absoluteSeen = true;
      else if (absoluteSeen) return;
      gyroTsRef.current = performance.now();
      rawRef.current = { a: e.alpha ?? 0, b: e.beta ?? 0, g: e.gamma ?? 0 };
    };
    const onMotion = (ev: DeviceMotionEvent) => {
      motionTsRef.current = performance.now();
      const a = ev.acceleration; // gravity-removed
      if (a && a.x != null) {
        const mag = Math.min(12, Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0));
        accMagRef.current = accMagRef.current * 0.9 + mag * 0.1;
      }
    };
    const onScreen = () => {
      const angle = w.screen?.orientation?.angle ?? w.orientation ?? 0;
      screenAngleRef.current = ((angle % 360) + 360) % 360;
      haveSmoothRef.current = false;
    };

    window.addEventListener("deviceorientation", onOrient, true);
    window.addEventListener("deviceorientationabsolute", onOrient as EventListener, true);
    window.addEventListener("devicemotion", onMotion, true);
    window.addEventListener("orientationchange", onScreen);
    window.addEventListener("resize", onScreen);
    onScreen();
    setSupported(true);
    startRef.current = performance.now();

    return () => {
      window.removeEventListener("deviceorientation", onOrient, true);
      window.removeEventListener("deviceorientationabsolute", onOrient as EventListener, true);
      window.removeEventListener("devicemotion", onMotion, true);
      window.removeEventListener("orientationchange", onScreen);
      window.removeEventListener("resize", onScreen);
    };
  }, [setStat]);

  /* ---------------- 2. per-frame session loop ---------------- */
  useEffect(() => {
    if (!supported) return;
    voRef.current = new VisualOdometry();
    let raf = 0;
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    const qTmp = new THREE.Quaternion();
    const qDelta = new THREE.Quaternion();
    const deviceQ = new THREE.Quaternion();
    const outQ = new THREE.Quaternion();
    const fwd = new THREE.Vector3();
    const rightW = new THREE.Vector3();
    const tCam = new THREE.Vector3();
    const vWorld = new THREE.Vector3();
    let lastTextured = 0;
    let lastTX = 0;
    let lastTY = 0;
    let lastRad = 0;
    let lastVoValid = false;

    /** PLACEMENT: anchor at the 3D point under the crosshair. Distance
     *  adapts to the aim — steep down (hand/table up close) places near,
     *  moderate down (floor) places far. The model lands exactly where the
     *  reticle points, on ANY surface, then stays world-locked there. */
    const placeAnchor = () => {
      fwd.set(0, 0, -1).applyQuaternion(outQ);
      const h = camHeightRef.current;
      const down = Math.max(0.05, -fwd.y);
      // ground distance = h / tan(pitch); pitch θ = asin(down)
      const d = THREE.MathUtils.clamp(
        (h * Math.sqrt(Math.max(0, 1 - down * down))) / down,
        0.5,
        4.5
      );
      const pos = new THREE.Vector3().copy(camPosRef.current).addScaledVector(fwd, d);
      const elev0 = Math.asin(THREE.MathUtils.clamp((camPosRef.current.y - pos.y) / Math.max(0.01, d), -1, 1));
      anchorRef.current = {
        position: pos,
        planeY: pos.y,
        planeType: "horizontal",
        yaw0: yawRef.current,
        pitch0: pitchRef.current,
        elev0,
      };
      hasAnchorRef.current = true;
      probeRef.current = 0;
      reticleVisibleRef.current = false;
      visionLostSince.current = -1;
      setStat("found");
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();

      const raw = rawRef.current;
      if (!raw) {
        // Sensors exist but never fired (blocked per-site or hardware).
        if (now - startRef.current > 6000) setStat("unavailable");
        else if (now - startRef.current > 1600) setStat("searching");
        // STILL honor placement requests — simulated fallback must be able
        // to place an anchor, otherwise the model can never appear.
        if (placeNowRef.current !== lastPlaceSeen.current) {
          lastPlaceSeen.current = placeNowRef.current;
          anchorRef.current = {
            position: new THREE.Vector3(0, 0, -4.0),
            planeY: 0,
            planeType: "horizontal",
            yaw0: 0,
            pitch0: 0,
            elev0: 0.35,
          };
          hasAnchorRef.current = true;
          reticleVisibleRef.current = false;
          setStat("found");
        }
        return;
      }

      // (a) device-pose quaternion — DeviceOrientationControls math
      euler.set(
        THREE.MathUtils.degToRad(raw.b),
        THREE.MathUtils.degToRad(raw.a),
        THREE.MathUtils.degToRad(-raw.g)
      );
      deviceQ.setFromEuler(euler);
      deviceQ.multiply(Q1);
      const orient = THREE.MathUtils.degToRad(screenAngleRef.current);
      if (orient !== 0) deviceQ.multiply(qTmp.setFromAxisAngle(Z_AXIS, -orient));

      // (b) smooth — fast slerp, 1:1 with the hand
      if (!haveSmoothRef.current || Math.abs(deviceQ.angleTo(smoothQRef.current)) > 0.6) {
        smoothQRef.current.copy(deviceQ);
        haveSmoothRef.current = true;
      } else {
        smoothQRef.current.slerp(deviceQ, 0.4);
      }
      outQ.copy(smoothQRef.current);
      camQuatRef.current.copy(outQ);
      // camera rides at the user's real hold height above the floor
      camPosRef.current.y = camHeightRef.current;

      // (c) freshness
      const gyroFresh = now - gyroTsRef.current < 400;
      const motionFresh = now - motionTsRef.current < 400;
      const fresh = gyroFresh || motionFresh;

      // (d) view direction + levelness
      // CRITICAL FIX: outQ IS the camera→world quaternion (it is copied
      // straight to camera.quaternion for rendering). The forward vector is
      // therefore outQ * (0,0,-1) — inverting it here flipped the pitch sign
      // (looking DOWN read as UP), which made detection rare and placed
      // anchors in the air. Do not invert.
      fwd.set(0, 0, -1).applyQuaternion(outQ);
      rightW.set(1, 0, 0).applyQuaternion(outQ);
      const pitch = Math.asin(THREE.MathUtils.clamp(fwd.y, -1, 1)); // down = negative
      const yaw = Math.atan2(fwd.x, -fwd.z);
      pitchRef.current = pitch;
      yawRef.current = yaw;

      // (e) VISUAL-INERTIAL ODOMETRY — camera position in world meters
      let voValidNow = false;
      const vo = voRef.current;
      const video = videoRef?.current ?? null;
      if (vo && video) {
        // angular delta since the last PROCESSED frame (camera→world quats)
        let omega: { x: number; y: number; z: number } | null = null;
        if (prevProcessedQRef.current) {
          qDelta.copy(outQ).multiply(qTmp.copy(prevProcessedQRef.current).invert());
          if (qDelta.w < 0) {
            qDelta.x *= -1; qDelta.y *= -1; qDelta.z *= -1; qDelta.w *= -1;
          }
          const ang = 2 * Math.acos(THREE.MathUtils.clamp(qDelta.w, -1, 1));
          const s2 = Math.sqrt(Math.max(1e-9, 1 - qDelta.w * qDelta.w));
          if (ang > 1e-4 && s2 > 1e-6) {
            const ax = qDelta.x / s2;
            const ay = qDelta.y / s2;
            const az = qDelta.z / s2;
            // three.js camera frame (y up, z back) → image frame (y down, z forward)
            omega = { x: ax * ang, y: -ay * ang, z: -az * ang };
          } else {
            omega = { x: 0, y: 0, z: 0 };
          }
        }
        if (omega) {
          const res: VOFrameResult | null = vo.process({
            video,
            rotOmega: omega,
            pitch,
            camHeight: camHeightRef.current,
          });
          prevProcessedQRef.current = outQ.clone();
          // while the camera is shaking (LIMITED) freeze translation entirely
          const shaking = trackStateRef.current === TrackState.TRK_LIMITED;
          if (res) {
            lastTextured = res.texturedBlocks;
            lastTX = res.transX;
            lastTY = res.transY;
            lastRad = res.radial;
            lastVoValid = res.valid;
          }
          if (res && res.valid && !shaking) {
            voValidNow = true;
            everHadVision.current = true;
            const f = 160 / 2 / Math.tan((60 * Math.PI) / 360); // FOCAL_PX mirror
            // depth: while anchored prefer the true anchor distance, so
            // walking toward the model makes it grow at the correct rate
            const Z =
              hasAnchorRef.current && anchorRef.current
                ? Math.max(0.6, camPosRef.current.distanceTo(anchorRef.current.position))
                : res.depthZ;
            // deadband: sub-pixel flow is sensor noise, not real movement —
            // treating it as zero keeps the anchor rock-steady when still
            const still =
              Math.abs(res.transX) < 0.6 &&
              Math.abs(res.transY) < 0.6 &&
              Math.abs(res.radial) < 0.002;
            if (!still) {
              // image-frame translation (x right, y down, z forward), meters
              const tx = (-res.transX * Z) / f;
              const ty = (-res.transY * Z) / f;
              const tz = res.radial * Z;
              // → three.js camera frame (y up, z back), → world
              tCam.set(tx, -ty, -tz).applyQuaternion(outQ);
              vWorld.copy(tCam);
              vWorld.y = 0; // walkers don't float; keep the head at fixed height
              const damp = 0.8; // low-pass: kills per-frame jitter
              vWorld.multiplyScalar(damp);
              const step = vWorld.length();
              if (step > 0.05) vWorld.multiplyScalar(0.05 / step); // clamp ≈1.5 m/s
              camPosRef.current.add(vWorld);
            }
          }
        }
      }

      // (f) tracking quality — fuse vision + inertial
      if (voValidNow) {
        lastValidVisionTs.current = now;
      }
      const movingFast = accMagRef.current > Math.max(5.5, 9.81 * 0.55);

      // camera blocked / moved too fast → vision dead → LOST (only if we ever had vision)
      let visionLost = false;
      if (everHadVision.current && hasAnchorRef.current) {
        if (now - lastValidVisionTs.current > VISION_STALE_MS) {
          if (visionLostSince.current < 0) visionLostSince.current = now;
          visionLost = now - visionLostSince.current > 300; // sustained loss only
        } else {
          visionLostSince.current = -1;
        }
      }

      let next = TrackState.TRK_OK;
      if (visionLost) next = TrackState.TRK_LOST;
      else if (movingFast && motionFresh) {
        if (fastSinceRef.current < 0) fastSinceRef.current = now;
        if (now - fastSinceRef.current > 350) next = TrackState.TRK_LIMITED;
      } else {
        fastSinceRef.current = -1;
      }
      if (!fresh && hasAnchorRef.current) next = TrackState.TRK_LOST; // sensors gone while walking

      if (next !== trackStateRef.current) {
        trackStateRef.current = next;
        setTrackState(next);
      }

      // (g) plane detection probe (before placement)
      if (!hasAnchorRef.current) {
        // floor/table detection only: the view must be aimed BELOW the horizon
        // (ceiling/wall hits rejected — the plane is the real floor, y = 0)
        const aimedAtSurface = pitch < -0.12;
        const level = Math.abs(rightW.y) < 0.65;
        reticleVisibleRef.current = aimedAtSurface && level && fresh;
        if (!reticleVisibleRef.current) {
          if (statusRef.current !== "searching") setStat("searching");
          probeRef.current = 0;
        } else {
          probeRef.current += 0.016;
          if (probeRef.current >= 0.25) {
            placeAnchor();
          }
        }
        }
      // Anchor is STICKY: it is never discarded automatically. Blocked or
      // shaken camera hides the model; the same anchor returns on recovery.
      // Only an explicit user re-place clears it.

      // (i) UI-thread requests
      if (placeNowRef.current !== lastPlaceSeen.current) {
        lastPlaceSeen.current = placeNowRef.current;
        if (!hasAnchorRef.current) {
          placeAnchor();
          if (trackStateRef.current === TrackState.TRK_LOST) {
            trackStateRef.current = TrackState.TRK_OK;
            setTrackState(TrackState.TRK_OK);
          }
        }
      }
      if (resetNowRef.current !== lastResetSeen.current) {
        lastResetSeen.current = resetNowRef.current;
        hasAnchorRef.current = false;
        anchorRef.current = null;
        probeRef.current = 0;
        reticleVisibleRef.current = false;
        visionLostSince.current = -1;
        setStat("searching");
      }

      // (j) debug HUD readout
      debugRef.current.pitch = pitch;
      debugRef.current.yaw = yaw;
      debugRef.current.camX = camPosRef.current.x;
      debugRef.current.camY = camPosRef.current.y;
      debugRef.current.camZ = camPosRef.current.z;
      debugRef.current.anchorDist =
        hasAnchorRef.current && anchorRef.current
          ? camPosRef.current.distanceTo(anchorRef.current.position)
          : 0;
      debugRef.current.trackState = trackStateRef.current;
      debugRef.current.voValid = lastVoValid;
      debugRef.current.textured = lastTextured;
      debugRef.current.transX = lastTX;
      debugRef.current.transY = lastTY;
      debugRef.current.radial = lastRad;
      debugRef.current.gyroAge = raw ? now - gyroTsRef.current : -1;
      debugRef.current.motionAge = now - motionTsRef.current;
    };
    tick();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, setStat, videoRef]);

  /* ---------------- 3. UI-thread API ---------------- */
  const hitTest = useCallback(() => {
    placeNowRef.current++;
  }, []);
  const resetPlacement = useCallback(() => {
    resetNowRef.current++;
  }, []);
  const forcePlace = useCallback(() => {
    placeNowRef.current++;
  }, []);
  const recalibrate = useCallback(() => {
    haveSmoothRef.current = false;
  }, []);

  return {
    status, supported, trackState, yawRef, pitchRef, camQuatRef, camPosRef,
    camHeightRef, debugRef, hasAnchorRef, anchorRef, reticleVisibleRef,
    hitTest, resetPlacement, forcePlace, recalibrate,
  };
}
