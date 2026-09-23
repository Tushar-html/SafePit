import * as THREE from "three";
import { ExitRouteModel } from "../data/exitRouteData";
import { makePuffs, smokeTexture, radialTex } from "./fxShared";

/* ============================================================
   4 exit-route scenarios with a properly rigged miner.
   Clean mine visuals: rough rock walls + wooden pit props.
   No stray wires, no half-circle arch clutter, no yellow
   lifelines — exactly per training description.
   ============================================================ */

const FLOOR_Y = 0;             // world ground plane (AR surface anchor)
const HIP_BASE = 0.30;         // hips joint local Y inside the rig
const ROOT_Y = FLOOR_Y + 0.075; // rig root height so boots touch floor top (-0.35)

export const MINE_FLOOR_Y = FLOOR_Y;
export const MINE_ROOT_Y = ROOT_Y;
export const MINE_HIP_BASE = HIP_BASE;

/* ---------------- miner rig ---------------- */

export interface MinerRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  legs: { l: LegArm; r: LegArm };
  arms: { l: LegArm; r: LegArm };
  lamp: THREE.PointLight;
}

export interface LegArm {
  upper: THREE.Group;
  lower: THREE.Group;
}

function joint(name: string, x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  return g;
}

/** Builds a realistic-proportioned miner (~1.75m scaled to ~0.62 world units tall) */
export function createMinerRig(): MinerRig {
  const root = new THREE.Group();
  root.name = "miner_root";

  const suitM = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.72 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.85 });
  const skinM = new THREE.MeshStandardMaterial({ color: 0xd9a06b, roughness: 0.8 });
  const helmM = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35, metalness: 0.25 });
  const reflM = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const bootM = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.9 });

  // --- hips (root of walk cycle) ---
  const hips = joint("hips", 0, 0.30, 0);
  root.add(hips);

  // pelvis
  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.05, 4, 10), darkM);
  pelvis.rotation.z = Math.PI / 2;
  pelvis.scale.set(1, 1, 0.8);
  hips.add(pelvis);

  // --- torso: attached above hips, can lean ---
  const torso = joint("torso", 0, 0.05, 0);
  hips.add(torso);
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.098, 0.16, 6, 12), suitM);
  chest.position.y = 0.13;
  chest.scale.set(1, 1, 0.78);
  torso.add(chest);
  // reflective stripes
  const stripeGeo = new THREE.CylinderGeometry(0.101, 0.101, 0.028, 14, 1, true);
  const s1 = new THREE.Mesh(stripeGeo, reflM);
  s1.position.y = 0.10;
  s1.scale.set(1, 1, 0.78);
  torso.add(s1);
  const s2 = new THREE.Mesh(stripeGeo, reflM);
  s2.position.y = 0.17;
  s2.scale.set(1, 1, 0.78);
  torso.add(s2);
  // SCSR on chest
  const scsr = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.04), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }));
  scsr.position.set(0.045, 0.13, -0.085);
  torso.add(scsr);

  // --- head + helmet (child of torso) ---
  const head = joint("neck", 0, 0.27, 0);
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 12), skinM);
  skull.position.y = 0.045;
  head.add(skull);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), helmM);
  dome.position.y = 0.055;
  head.add(dome);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.012, 16), helmM);
  brim.position.y = 0.03;
  head.add(brim);
  // cap lamp (front = +Z)
  const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.024, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  lampBody.rotation.x = Math.PI / 2;
  lampBody.position.set(0, 0.07, 0.068);
  head.add(lampBody);
  const lamp = new THREE.PointLight(0xffeedd, 1.2, 1.6);
  lamp.position.set(0, 0.07, 0.12);
  head.add(lamp);

  // --- legs: hip -> knee -> ankle ---
  const mkLeg = (side: -1 | 1): LegArm => {
    const hipJ = joint(side < 0 ? "l_hip" : "r_hip", side * 0.052, -0.01, 0);
    hips.add(hipJ);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.11, 4, 8), suitM);
    thigh.position.y = -0.075;
    hipJ.add(thigh);
    const kneeJ = joint("knee", 0, -0.15, 0);
    hipJ.add(kneeJ);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.1, 4, 8), darkM);
    shin.position.y = -0.07;
    kneeJ.add(shin);
    const ankleJ = joint("ankle", 0, -0.145, 0);
    kneeJ.add(ankleJ);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.1), bootM);
    boot.position.set(0, -0.02, 0.015);
    ankleJ.add(boot);
    return { upper: hipJ, lower: kneeJ };
  };
  const legs = { l: mkLeg(-1), r: mkLeg(1) };

  // --- arms: shoulder -> elbow -> hand ---
  const mkArm = (side: -1 | 1): LegArm => {
    const shJ = joint(side < 0 ? "l_shoulder" : "r_shoulder", side * 0.105, 0.20, 0);
    torso.add(shJ);
    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.09, 4, 8), suitM);
    upperArm.position.y = -0.06;
    shJ.add(upperArm);
    const elbowJ = joint("elbow", 0, -0.125, 0);
    shJ.add(elbowJ);
    const foreArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.023, 0.085, 4, 8), suitM);
    foreArm.position.y = -0.055;
    elbowJ.add(foreArm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 8), darkM);
    hand.position.y = -0.115;
    elbowJ.add(hand);
    return { upper: shJ, lower: elbowJ };
  };
  const arms = { l: mkArm(-1), r: mkArm(1) };

  return { root, hips, torso, head, legs, arms, lamp };
}

/* ---------------- walk cycle ---------------- */

/** phase: 0..1 covers one full stride (two steps). speed multiplies.
 *  The miner faces travel direction (root.rotation.y) and the cycle
 *  swings legs in the facing plane — never sideways drift. */
export function poseWalk(rig: MinerRig, cycle: number, intensity = 1): void {
  const p = cycle % 1;
  const a = p * Math.PI * 2;
  const swing = 0.55 * intensity;
  rig.legs.l.upper.rotation.x = Math.sin(a) * swing;
  rig.legs.r.upper.rotation.x = Math.sin(a + Math.PI) * swing;
  rig.legs.l.lower.rotation.x = Math.max(0, -Math.sin(a - 0.5) * 0.7 * intensity) * -1;
  rig.legs.r.lower.rotation.x = Math.max(0, -Math.sin(a + Math.PI - 0.5) * 0.7 * intensity) * -1;
  rig.arms.l.upper.rotation.x = Math.sin(a + Math.PI) * 0.45 * intensity;
  rig.arms.r.upper.rotation.x = Math.sin(a) * 0.45 * intensity;
  rig.arms.l.lower.rotation.x = -0.35 - 0.2 * intensity;
  rig.arms.r.lower.rotation.x = -0.35 - 0.2 * intensity;
  rig.arms.l.upper.rotation.z = 0.06;
  rig.arms.r.upper.rotation.z = -0.06;
  rig.hips.position.y = HIP_BASE + Math.abs(Math.sin(a)) * 0.012 * intensity - 0.006 * intensity;
  rig.hips.rotation.y = Math.sin(a) * 0.06 * intensity;
  rig.torso.rotation.y = -Math.sin(a) * 0.08 * intensity;
}

export function poseIdle(rig: MinerRig, t: number): void {
  const breathe = Math.sin(t * 1.8) * 0.02;
  rig.legs.l.upper.rotation.x = 0;
  rig.legs.r.upper.rotation.x = 0;
  rig.legs.l.lower.rotation.x = 0;
  rig.legs.r.lower.rotation.x = 0;
  rig.arms.l.upper.rotation.x = breathe;
  rig.arms.r.upper.rotation.x = -breathe;
  rig.arms.l.upper.rotation.z = 0.06;
  rig.arms.r.upper.rotation.z = -0.06;
  rig.arms.l.lower.rotation.x = -0.25;
  rig.arms.r.lower.rotation.x = -0.25;
  rig.hips.position.y = HIP_BASE + breathe * 0.3;
  rig.hips.rotation.y = 0;
  rig.torso.rotation.y = 0;
}

/* ---------------- clean mine dressing (wooden props, rock walls) ---------------- */

/** Builds the drift: floor, rough rock walls, roof, and WOODEN PIT PROPS
 *  (timber posts + caps) instead of steel arches. No cables, no ducts,
 *  no lifeline ropes — clean per training spec. */
export function addMineDrift(group: THREE.Group, opts?: { lights?: boolean; roofProps?: boolean }): void {
  const rockCols = [0x241f1a, 0x2b241e, 0x1e1a15, 0x27211b];
  const fm = new THREE.MeshStandardMaterial({ color: 0x17130f, roughness: 0.99 });

  // floor base + sparse ballast rubble
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.6), fm);
  floor.position.y = FLOOR_Y;
  group.add(floor);
  const ballastGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 22; i++) {
    const s = 0.02 + Math.random() * 0.03;
    const m = new THREE.Mesh(ballastGeo, new THREE.MeshStandardMaterial({
      color: rockCols[i % rockCols.length], roughness: 0.95, flatShading: true
    }));
    m.scale.set(s * 1.4, s * 0.5, s);
    m.position.set((Math.random() - 0.5) * 2.0, FLOOR_Y + 0.02, (Math.random() - 0.5) * 1.3);
    m.rotation.y = Math.random() * Math.PI;
    group.add(m);
  }

  // rough rock walls (overlapping irregular slabs both sides)
  const slabGeo = new THREE.BoxGeometry(1, 1, 1);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const h = 0.75 + Math.random() * 0.5;
      const m = new THREE.Mesh(slabGeo, new THREE.MeshStandardMaterial({
        color: rockCols[(i + (side > 0 ? 2 : 0)) % rockCols.length], roughness: 0.96, flatShading: true
      }));
      m.scale.set(0.16 + Math.random() * 0.1, h, 0.18 + Math.random() * 0.16);
      m.position.set(side * 1.18, FLOOR_Y + 0.03 + h * 0.32, -0.78 + i * 0.105);
      m.rotation.set((Math.random() - 0.5) * 0.14, Math.random() * 0.4, (Math.random() - 0.5) * 0.12);
      group.add(m);
    }
  }

  // roof slab — underside at 1.06: aligned with the prop caps' wedges,
  // clear above the miner's helmet (0.62)
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x201b16, roughness: 0.97 }));
  ceil.position.y = 1.095;
  group.add(ceil);

  // wooden pit props: vertical timber posts with horizontal caps every ~0.7m
  const woodM = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x57391f, roughness: 0.92 });
  for (const z of [-0.55, 0.15, 0.85]) {
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.98, 10), woodM);
      post.position.set(side * 0.82, FLOOR_Y + 0.03 + 0.49, z);
      post.rotation.z = (Math.random() - 0.5) * 0.03;
      group.add(post);
      // horizontal cap beam resting on the post
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.09), woodDark);
      cap.position.set(side * 0.82, FLOOR_Y + 0.03 + 0.99, z);
      cap.rotation.y = (Math.random() - 0.5) * 0.1;
      group.add(cap);
      // timber wedge between cap and roof (roof underside at 1.06)
      const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 6), woodM);
      wedge.position.set(side * 0.82, FLOOR_Y + 0.03 + 1.015, z);
      group.add(wedge);
    }
  }

  if (opts?.lights) {
    const lm = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    for (let i = -0.5; i <= 0.5; i += 0.5) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), lm);
      bulb.position.set(i * 1.6, 0.99, 0); // hung from the raised roof
      group.add(bulb);
      const pl = new THREE.PointLight(0xfff8e0, 0.5, 1.6);
      pl.position.set(i * 1.6, 0.95, 0);
      group.add(pl);
    }
  }
}

/* ---------------- per-scenario state ---------------- */

type Scenario = "primary" | "secondary" | "shaft" | "refuge";

interface ExitState {
  scenario: Scenario;
  rig: MinerRig;
  tickers: Array<(t: number, delta: number) => void>;
  disposers: Array<() => void>;
}

const EXAM = new Map<string, ExitState>();

export function create3DExitRouteModel(type: ExitRouteModel["modelType"]): THREE.Group {
  const group = new THREE.Group();
  group.name = "exit_model_" + type;

  const state: ExitState = { scenario: "primary", tickers: [], disposers: [] } as ExitState;
  const rig = createMinerRig();
  state.rig = rig;
  group.add(rig.root);

  const mapType: Record<string, Scenario> = {
    primary_escapeway: "primary",
    secondary_escapeway: "secondary",
    escape_shafts: "shaft",
    refuge_chambers: "refuge"
  };
  state.scenario = mapType[type] ?? "primary";

  /* ============ PRIMARY ESCAPEWAY ============
     Mine passageway with wooden props; big exit portal on one
     end with "MAIN EXIT" text above it. The miner walks from
     the far side straight through the exit and out. */
  if (state.scenario === "primary") {
    addMineDrift(group, { lights: true });

    // ---- EXIT PORTAL on the +X end ----
    // portal frame (dark timber surround)
    const frameM = new THREE.MeshStandardMaterial({ color: 0x3b2a18, roughness: 0.85 });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 1.1), frameM);
    lintel.position.set(1.08, 0.5, 0);
    group.add(lintel);
    for (const s of [-1, 1]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.12), frameM);
      jamb.position.set(1.08, FLOOR_Y + 0.03 + 0.475, s * 0.5);
      group.add(jamb);
    }
    // glowing white exit opening
    const opening = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.82),
      new THREE.MeshBasicMaterial({ color: 0xfff8e0, transparent: true, opacity: 0.92 })
    );
    opening.rotation.y = -Math.PI / 2;
    opening.position.set(1.09, FLOOR_Y + 0.03 + 0.41, 0);
    group.add(opening);
    const exitGlow = new THREE.PointLight(0xfff4d6, 1.6, 2.4);
    exitGlow.position.set(0.92, FLOOR_Y + 0.4, 0);
    group.add(exitGlow);

    // ---- "MAIN EXIT" text sign above the portal ----
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext("2d")!;
    sctx.fillStyle = "#15803d";
    sctx.fillRect(0, 0, 512, 128);
    sctx.strokeStyle = "#ffffff";
    sctx.lineWidth = 8;
    sctx.strokeRect(8, 8, 496, 112);
    sctx.fillStyle = "#ffffff";
    sctx.font = "bold 64px Arial, sans-serif";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText("MAIN EXIT", 256, 68);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.155),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    sign.rotation.y = -Math.PI / 2;
    sign.position.set(1.02, FLOOR_Y + 0.03 + 0.62, 0);
    group.add(sign);
    state.disposers.push(() => signTex.dispose());

    // painted exit arrow on floor leading to portal
    const arrowTex = radialTex([[0, "rgba(0,220,90,0.95)"], [0.5, "rgba(0,170,60,0.55)"], [1, "rgba(0,0,0,0)"]], 64, "exitarrow");
    for (let i = 0; i < 5; i++) {
      const a = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex, transparent: true, depthWrite: false, opacity: 0.75 }));
      a.position.set(0.15 + i * 0.18, FLOOR_Y + 0.03, 0);
      a.scale.setScalar(0.18);
      group.add(a);
      state.tickers.push(() => {
        (a.material as THREE.SpriteMaterial).opacity = 0.4 + 0.4 * Math.abs(Math.sin(performance.now() * 0.002 + i));
      });
    }

    // miner starts on the left end, walks straight through the exit
    rig.root.position.set(-0.9, ROOT_Y, 0);
    rig.root.rotation.y = Math.PI / 2; // facing +X (toward the exit)

    const LOOP = 8.0;
    state.tickers.push((t) => {
      const lt = t % LOOP;
      // single straight walk: -0.9 -> 1.15 (through the portal), pause, reset
      let x: number;
      let walking = true;
      let cycle = 0;
      if (lt < 5.6) {
        const p = lt / 5.6;
        x = -0.9 + p * 2.05;
        cycle = lt * 1.55;
      } else if (lt < 6.4) {
        // stepped out — hidden beyond the portal
        x = 1.2;
        walking = false;
      } else {
        // fade back to start
        x = -0.9;
        walking = false;
      }
      rig.root.position.x = x;
      rig.root.rotation.y = Math.PI / 2;
      rig.root.visible = lt < 6.3;
      if (walking) {
        poseWalk(rig, cycle, 1);
      } else {
        poseIdle(rig, t);
      }
      rig.lamp.intensity = 1.15 + Math.sin(t * 8.3) * 0.1;
    });
  }

  /* ============ SECONDARY ESCAPEWAY ============
     Same clean drift (no yellow line, no half-circle markers):
     blocked main route rubble -> narrow alternate crosscut ->
     careful walk -> activate pull-station on the wall. */
  else if (state.scenario === "secondary") {
    addMineDrift(group);

    // blocked main route: rubble pile behind miner
    for (let i = 0; i < 6; i++) {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05 + Math.random() * 0.06, 0), new THREE.MeshStandardMaterial({ color: 0x3a352f, roughness: 0.95, flatShading: true }));
      r.position.set(-0.9 + Math.random() * 0.3, FLOOR_Y + 0.05 + Math.random() * 0.08, (Math.random() - 0.5) * 0.7);
      group.add(r);
    }
    // narrower crosscut walls ahead
    const xw1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x2d2a26, roughness: 0.92 }));
    xw1.position.set(0.5, 0.02, -0.55);
    group.add(xw1);
    const xw2 = xw1.clone();
    xw2.position.z = 0.55;
    group.add(xw2);

    // pull-station on right wall at x=0.75 — mounted ON the wall
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.1), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }));
    pull.position.set(1.1, 0.08, -0.5);
    group.add(pull);
    const pullHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.5 }));
    pullHandle.position.set(1.06, 0.08, -0.5);
    group.add(pullHandle);

    rig.root.position.set(-0.4, ROOT_Y, 0.05);
    rig.root.rotation.y = Math.PI / 2;

    // drifting smoke haze showing low visibility
    const haze = makePuffs({
      count: 26, areaX: 1.0, areaZ: 0.6, baseY: FLOOR_Y + 0.35, rise: 0.4, life: 4.0,
      sizeMin: 0.5, sizeGrow: 1.6, color: new THREE.Color(0.16, 0.15, 0.14), tex: smokeTexture(),
      opacity: 0.3, sway: 0.1, fadeIn: 0.35
    });
    group.add(haze.points);
    state.disposers.push(haze.dispose);

    const LOOP = 7.5;
    state.tickers.push((t) => {
      haze.tick(t);
      const lt = t % LOOP;
      const segs: Array<[number, number, number, number]> = [
        [-0.4, 0.0, 0.0, 1.6],    // walk in, visibility low
        [0.0, 0.0, 1.6, 2.3],     // pause, assess
        [0.0, 0.45, 2.3, 4.3],    // careful slow steps through the crosscut
        [0.45, 0.72, 4.3, 5.4],   // approach pull station
        [0.72, 0.72, 5.4, 6.1],   // pull handle
        [0.72, 0.85, 6.1, 7.5]    // continue
      ];
      let x = rig.root.position.x;
      let walking = false;
      let cycle = 0;
      for (const [x0, x1, from, to] of segs) {
        if (lt >= from && lt < to) {
          const p = (lt - from) / (to - from);
          x = x0 + (x1 - x0) * p;
          walking = x0 !== x1;
          cycle = (lt - from) * (x < 0.45 ? 1.2 : 1.6);
        }
      }
      rig.root.position.x = x;
      rig.root.rotation.y = Math.PI / 2; // always facing travel direction (+X)

      if (walking) {
        poseWalk(rig, cycle, x > 0 && x < 0.45 ? 0.8 : 1);
      } else {
        poseIdle(rig, t);
        if (lt >= 4.3 && lt < 6.1) {
          // reaching for pull handle on the right wall
          rig.arms.r.upper.rotation.x = -1.2;
          rig.arms.r.lower.rotation.x = -0.3;
        }
      }
      pullHandle.rotation.x = lt >= 5.4 ? Math.min(1.2, (lt - 5.4) * 3) : 0;
      rig.lamp.intensity = 1.2 + Math.sin(t * 9) * 0.12;
    });
  }

  /* ============ ESCAPE SHAFT / RAISE ============ */
  else if (state.scenario === "shaft") {
    // circular shaft: walls, ladder cage, rungs, rest platform, top hatch
    const wallM = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.95, side: THREE.BackSide });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.1, 20, 1, true), wallM);
    shaft.position.y = 0.62;
    group.add(shaft);
    const floorM = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.98 }));
    floorM.rotation.x = -Math.PI / 2;
    floorM.position.y = FLOOR_Y;
    group.add(floorM);

    // ladder with cage hoops on back wall (z = -0.45)
    const rm = new THREE.MeshStandardMaterial({ color: 0x8a9199, metalness: 0.85, roughness: 0.3 });
    const railGeo = new THREE.CylinderGeometry(0.011, 0.011, 1.85, 8);
    [-0.09, 0.09].forEach(off => {
      const rail = new THREE.Mesh(railGeo, rm);
      rail.position.set(off, 0.52, -0.45);
      group.add(rail);
    });
    const rungGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.19, 8);
    for (let i = 0; i <= 15; i++) {
      const rung = new THREE.Mesh(rungGeo, rm);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, FLOOR_Y + 0.12 + i * 0.115, -0.45);
      group.add(rung);
    }
    // rest platform at y≈0.55
    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.3), new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.85 }));
    platform.position.set(0, 0.55, -0.32);
    group.add(platform);
    // top hatch glow — daylight from above
    const dayLight = new THREE.PointLight(0xfffbe8, 1.6, 2.2);
    dayLight.position.set(0, 1.55, -0.3);
    group.add(dayLight);
    const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: 0xfff8e0, transparent: true, opacity: 0.9 }));
    hatch.rotation.x = Math.PI / 2;
    hatch.position.set(0, 1.6, -0.3);
    group.add(hatch);

    rig.root.position.set(0, ROOT_Y, -0.28);
    rig.root.rotation.y = Math.PI; // facing ladder (-Z)

    const CLIMB_V = 0.32;
    const TOP_Y = 1.35;
    const LOOP = 8.0;
    state.tickers.push((t) => {
      const lt = t % LOOP;
      let y = FLOOR_Y;
      let mode: "clip" | "climb" | "rest" | "top" = "climb";
      if (lt < 0.7) { mode = "clip"; y = FLOOR_Y; }
      else if (lt < 5.6) { mode = "climb"; y = FLOOR_Y + (lt - 0.7) * CLIMB_V; if (y > TOP_Y) y = TOP_Y; }
      else if (lt < 6.6) { mode = "rest"; y = 0.55 + 0.28; }
      else { mode = "top"; y = TOP_Y + (lt - 6.6) * 0.12; }

      if (mode === "clip") {
        poseIdle(rig, t);
        rig.arms.r.upper.rotation.x = -1.0;
        rig.arms.r.lower.rotation.x = -0.4;
        rig.torso.rotation.x = 0.1;
      } else if (mode === "climb") {
        const cycle = (lt - 0.7) * CLIMB_V / 0.115 * 0.5;
        rig.legs.l.upper.rotation.x = 0.9 + Math.sin(cycle * Math.PI * 2) * 0.5;
        rig.legs.r.upper.rotation.x = 0.9 + Math.sin(cycle * Math.PI * 2 + Math.PI) * 0.5;
        rig.legs.l.lower.rotation.x = -1.3 - Math.sin(cycle * Math.PI * 2) * 0.3;
        rig.legs.r.lower.rotation.x = -1.3 - Math.sin(cycle * Math.PI * 2 + Math.PI) * 0.3;
        rig.arms.l.upper.rotation.x = -1.7 + Math.sin(cycle * Math.PI * 2) * 0.45;
        rig.arms.r.upper.rotation.x = -1.7 + Math.sin(cycle * Math.PI * 2 + Math.PI) * 0.45;
        rig.arms.l.lower.rotation.x = -0.5;
        rig.arms.r.lower.rotation.x = -0.5;
        rig.torso.rotation.x = 0.12;
        rig.hips.position.y = HIP_BASE + Math.abs(Math.sin(cycle * Math.PI * 2)) * 0.02;
        rig.hips.rotation.y = 0;
      } else if (mode === "rest") {
        poseIdle(rig, t);
        rig.arms.r.upper.rotation.x = -0.9;
        rig.arms.r.lower.rotation.x = -1.2;
        rig.torso.rotation.x = -0.06;
      } else {
        poseIdle(rig, t);
        rig.arms.l.upper.rotation.x = -2.2;
        rig.arms.l.upper.rotation.z = 0.4;
      }
      rig.root.position.y = y + ROOT_Y - FLOOR_Y;
      dayLight.intensity = 1.4 + Math.sin(t * 1.2) * 0.2;
    });
  }

  /* ============ REFUGE CHAMBER ============
     Scripted per spec: miner WALKS in from one side -> reaches the
     airtight door -> light turns GREEN -> door opens -> he walks
     inside. No random sitting. */
  else {
    addMineDrift(group, { lights: true });

    // chamber wall + door frame on the back-right wall
    const wf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.1), new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7 }));
    wf.position.set(0.45, 0.12, -0.66);
    group.add(wf);

    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.06, 0.05, -0.6);
    group.add(doorPivot);
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.82, 0.05), new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.65, roughness: 0.35 }));
    doorPanel.position.set(0.26, 0, 0);
    doorPivot.add(doorPanel);
    // status light above the door: red -> green when ready
    const statusLight = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff2200 }));
    statusLight.position.set(0.26, 0.5, -0.58);
    group.add(statusLight);
    const statusGlow = new THREE.PointLight(0xff2200, 1.4, 1.2);
    statusGlow.position.set(0.26, 0.5, -0.5);
    group.add(statusGlow);
    // REFUGE sign
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext("2d")!;
    sctx.fillStyle = "#1d4ed8";
    sctx.fillRect(0, 0, 512, 128);
    sctx.fillStyle = "#ffffff";
    sctx.font = "bold 58px Arial, sans-serif";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText("REFUGE", 256, 66);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.rotation.y = 0;
    sign.position.set(0.26, 0.36, -0.6);
    group.add(sign);
    state.disposers.push(() => signTex.dispose());

    // interior warm glow (visible once inside)
    const innerGlow = new THREE.PointLight(0x86efac, 0, 1.0);
    innerGlow.position.set(0.45, 0.1, -0.5);
    group.add(innerGlow);

    const LOOP = 8.5;
    const WALK_START = new THREE.Vector3(-0.85, ROOT_Y, 0.18);
    const DOOR_SPOT = new THREE.Vector3(0.05, ROOT_Y, -0.25);
    const INSIDE_SPOT = new THREE.Vector3(0.42, ROOT_Y, -0.38);

    state.tickers.push((t) => {
      const lt = t % LOOP;
      let doorAngle = 0;
      let lightGreen = false;
      let pos = WALK_START.clone();
      let rotY = -0.45; // walking toward the door diagonally
      let walking = true;

      if (lt < 2.6) {
        // walk from the left side toward the door
        const p = lt / 2.6;
        pos.lerpVectors(WALK_START, DOOR_SPOT, p);
        walking = true;
      } else if (lt < 3.4) {
        // stand at the door — light flips green
        pos.copy(DOOR_SPOT);
        rotY = Math.PI; // face the door (-Z)
        walking = false;
        lightGreen = lt >= 2.8;
      } else if (lt < 4.3) {
        // door swings open (after green)
        pos.copy(DOOR_SPOT);
        rotY = Math.PI;
        walking = false;
        lightGreen = true;
        doorAngle = Math.min(1.7, ((lt - 3.4) / 0.9) * 1.9);
      } else if (lt < 6.0) {
        // walk inside through the doorway
        const p = (lt - 4.3) / 1.7;
        pos.lerpVectors(DOOR_SPOT, INSIDE_SPOT, p);
        rotY = Math.PI;
        walking = true;
        lightGreen = true;
        doorAngle = 1.7;
      } else {
        // inside — door swings shut, loop resets
        const p = (lt - 6.0) / 2.5;
        pos.copy(INSIDE_SPOT);
        rotY = Math.PI;
        walking = false;
        doorAngle = Math.max(0, 1.7 - p * 2.2);
        rig.root.visible = p < 0.9;
      }

      if (lt < 6.0) rig.root.visible = true;
      rig.root.position.copy(pos);
      rig.root.rotation.y = rotY;
      doorPivot.rotation.y = doorAngle;
      if (walking) poseWalk(rig, lt * 1.5, 1);
      else poseIdle(rig, t);

      // status light: red until ready, green from 2.8s
      const green = lightGreen;
      (statusLight.material as THREE.MeshBasicMaterial).color.set(green ? 0x22c55e : 0xff2200);
      statusGlow.color.set(green ? 0x22c55e : 0xff2200);
      statusGlow.intensity = green ? 1.5 + Math.sin(t * 4) * 0.3 : 1.0;
      innerGlow.intensity = lt >= 4.3 ? 1.1 : 0;
      rig.lamp.intensity = 1.15 + Math.sin(t * 8) * 0.1;
    });
  }

  EXAM.set(group.name, state);
  return group;
}

export function updateExitRouteAnimations(group: THREE.Group, _type: string, elapsed: number, delta: number): void {
  const s = EXAM.get(group.name);
  if (!s) return;
  for (const fn of s.tickers) fn(elapsed, delta);
}

export function disposeExitRouteModel(group: THREE.Group): void {
  const s = EXAM.get(group.name);
  if (s) {
    s.disposers.forEach(d => d());
    EXAM.delete(group.name);
  }
  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      const mats = Array.isArray((o as THREE.Mesh).material) ? (o as THREE.Mesh).material as THREE.Material[] : [(o as THREE.Mesh).material as THREE.Material];
      mats.forEach((m: THREE.Material) => { if ((m as THREE.SpriteMaterial).map) (m as THREE.SpriteMaterial).map?.dispose(); m.dispose(); });
    }
  });
}
