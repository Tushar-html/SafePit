import * as THREE from "three";
import { EvacuationStep } from "../data/evacuationData";
import { makePuffs, makeFlameCross, smokeTexture, makeGroundShadow, flickerLight, radialTex } from "./fxShared";
import { createMinerRig, poseWalk, poseIdle, MinerRig, MINE_ROOT_Y } from "./exitRouteModels3D";

/* ============================================================
   Evacuation Sequencing — 9 scripted scenes in a clean mine
   drift (wooden pit props, no half-circle arches / glowing
   clutter). Miners always FACE their travel direction and stay
   aligned to the floor (no sinking / no sideways shuffle).
   ============================================================ */

const FLOOR_Y = 0;

interface EvState {
  step: EvacuationStep["modelType"];
  tickers: Array<(t: number, delta: number) => void>;
  disposers: Array<() => void>;
}

const EVM = new Map<string, EvState>();

/* ---------- shared props ---------- */

function mkMiner(x: number, z: number, rotY: number): MinerRig {
  const rig = createMinerRig();
  rig.root.position.set(x, MINE_ROOT_Y, z);
  rig.root.rotation.y = rotY;
  return rig;
}

function mkDrift(group: THREE.Group): void {
  const rockCols = [0x241f1a, 0x2b241e, 0x1e1a15, 0x27211b];
  group.add(makeGroundShadow(2.6, 2.0, FLOOR_Y, 0.75));
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 1.7),
    new THREE.MeshStandardMaterial({ color: 0x17130f, roughness: 0.99 }));
  floor.position.y = FLOOR_Y;
  group.add(floor);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const h = 0.75 + Math.random() * 0.5;
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: rockCols[(i + (side > 0 ? 1 : 0)) % 4], roughness: 0.96, flatShading: true }));
      m.scale.set(0.16 + Math.random() * 0.1, h, 0.18 + Math.random() * 0.16);
      m.position.set(side * 1.22, FLOOR_Y + 0.03 + h * 0.32, -0.78 + i * 0.105);
      m.rotation.set((Math.random() - 0.5) * 0.12, Math.random() * 0.4, (Math.random() - 0.5) * 0.1);
      group.add(m);
    }
  }
  // roof underside at 1.06 — aligned with prop caps, clear of the miner's head
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.07, 1.7),
    new THREE.MeshStandardMaterial({ color: 0x201b16, roughness: 0.97 }));
  ceil.position.y = 1.095;
  group.add(ceil);

  // wooden pit props (replaces the half-circle steel arches)
  const woodM = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x57391f, roughness: 0.92 });
  for (const z of [-0.55, 0.35]) {
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.98, 10), woodM);
      post.position.set(side * 0.86, FLOOR_Y + 0.52, z);
      group.add(post);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.1), woodDark);
      cap.position.set(side * 0.86, FLOOR_Y + 1.02, z);
      group.add(cap);
    }
  }

  // tunnel lamp hung from the raised roof
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef9c3 }));
  bulb.position.set(0, 0.99, 0);
  group.add(bulb);
  const pl = new THREE.PointLight(0xfff8e0, 0.6, 1.8);
  pl.position.set(0, 0.95, 0);
  group.add(pl);
}

function mkEquipmentFire(group: THREE.Group, x: number, z: number, smokeOnly: boolean): {
  smoke: ReturnType<typeof makePuffs>;
  flame?: { group: THREE.Group; setLevel: (v: number) => void };
  light?: THREE.PointLight;
} {
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x27313b, roughness: 0.6, metalness: 0.5 }));
  box.position.set(x, FLOOR_Y + 0.13, z);
  group.add(box);
  const grill = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x141a20, roughness: 0.7 }));
  grill.position.set(x, FLOOR_Y + 0.235, z);
  group.add(grill);

  const smoke = makePuffs({
    count: 30, areaX: 0.1, areaZ: 0.1, baseY: FLOOR_Y + 0.26, rise: 1.1, life: 2.8,
    sizeMin: 0.14, sizeGrow: 2.4, color: new THREE.Color(0.16, 0.16, 0.17), tex: smokeTexture(),
    opacity: 0.42, sway: 0.07, fadeIn: 0.2
  });
  smoke.points.position.set(x, 0, z);
  group.add(smoke.points);

  if (!smokeOnly) {
    const flame = makeFlameCross({
      height: 0.3, width: 0.1, colorInner: "rgba(255,240,150,1)", colorOuter: "rgba(255,110,20,0.9)",
      intensity: 1.0, sway: 0.2, speed: 1.3, blades: 3
    });
    flame.group.position.set(x, FLOOR_Y + 0.24, z);
    group.add(flame.group);
    const light = new THREE.PointLight(0xff7018, 2.6, 2.0);
    light.position.set(x, FLOOR_Y + 0.4, z);
    group.add(light);
    return {
      smoke,
      flame: { group: flame.group, setLevel: (v) => flame.group.scale.setScalar(Math.max(0.02, v)) },
      light
    };
  }
  return { smoke };
}

/** Manual call point FIXED to the left wall with a downward lever. */
function mkCallPoint(group: THREE.Group, x: number): { lever: THREE.Mesh; strobe: THREE.Mesh; strobeLight: THREE.PointLight } {
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.45 }));
  body.position.set(x, FLOOR_Y + 0.34, -0.8);
  group.add(body);
  const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 }));
  backplate.position.set(x, FLOOR_Y + 0.34, -0.84);
  group.add(backplate);
  // downward pull lever hinged at the top of the box
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.5, roughness: 0.4 }));
  lever.position.set(x, FLOOR_Y + 0.38, -0.73);
  lever.geometry.translate(0, -0.05, 0); // pivot at top
  group.add(lever);
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x330000 }));
  strobe.position.set(x, FLOOR_Y + 0.5, -0.79);
  group.add(strobe);
  const strobeLight = new THREE.PointLight(0xff2020, 0, 2.2);
  strobeLight.position.copy(strobe.position);
  group.add(strobeLight);
  return { lever, strobe, strobeLight };
}

function mkBag(group: THREE.Group, x: number): THREE.Group {
  // a proper sized duffel bag (visibly a personal item)
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.13, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x4a5f7a, roughness: 0.8 }));
  bag.position.y = 0.065;
  g.add(bag);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.11),
    new THREE.MeshStandardMaterial({ color: 0x3a4f68, roughness: 0.75 }));
  flap.position.y = 0.13;
  g.add(flap);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x223044, roughness: 0.7 }));
  handle.position.y = 0.135;
  handle.rotation.x = Math.PI / 2;
  g.add(handle);
  for (const s of [-1, 1]) {
    const strapEnd = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x223044, roughness: 0.7 }));
    strapEnd.position.set(s * 0.06, 0.045, 0.052);
    g.add(strapEnd);
  }
  g.position.set(x, FLOOR_Y + 0.03, 0.42);
  group.add(g);
  return g;
}

function mkMusterPost(group: THREE.Group, x: number): THREE.Group {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.7, roughness: 0.3 }));
  post.position.y = 0.275;
  g.add(post);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x16a34a, emissiveIntensity: 0.5 }));
  sign.position.y = 0.5;
  g.add(sign);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.017),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  stripe.position.y = 0.5;
  g.add(stripe);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 24),
    new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.6 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = FLOOR_Y + 0.005;
  g.add(ring);
  g.position.set(x, FLOOR_Y, -0.1);
  group.add(g);
  return g;
}

/** distinct supervisor: white+navy outfit, gold helmet, clipboard */
function mkSupervisor(x: number, z: number, rotY: number): MinerRig {
  const rig = mkMiner(x, z, rotY);
  rig.root.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.material) {
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m.color && m.color.getHex() === 0xd97706) m.color.set(0x1e3a5f); // navy suit
      if (m.color && m.color.getHex() === 0x15803d) { m.color.set(0xfbbf24); m.metalness = 0.5; } // gold helmet
    }
  });
  // clipboard in left hand
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xd8c020, roughness: 0.5 }));
  board.position.set(-0.12, 0.16, 0.05);
  board.rotation.z = 0.3;
  rig.root.add(board);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7 }));
  clip.position.set(-0.12, 0.23, 0.05);
  rig.root.add(clip);
  return rig;
}

/* ---------- main builder ---------- */

export function create3DEvacuationModel(step: EvacuationStep["modelType"]): THREE.Group {
  const group = new THREE.Group();
  group.name = "evac_model_" + step;

  const state: EvState = { step, tickers: [], disposers: [] };
  const rig = mkMiner(-0.3, 0.25, 0.35);
  group.add(rig.root);
  const coworker = mkMiner(0.5, 0.1, -0.4);
  group.add(coworker.root);

  const LOOP = 8.0;

  switch (step) {

    /* 1 — RECOGNIZE: smoke rises, miner head-turn */
    case "recognize": {
      mkDrift(group);
      const fire = mkEquipmentFire(group, 0.55, -0.35, false);
      rig.root.position.set(-0.45, MINE_ROOT_Y, 0.3);
      rig.root.rotation.y = 0.9;
      state.tickers.push((t) => {
        const lt = t % LOOP;
        fire.smoke.tick(t);
        if (fire.flame) fire.flame.setLevel(lt > 1.0 ? Math.min(1, (lt - 1.0) * 2) : 0);
        if (fire.light) flickerLight(fire.light, lt > 1.0 ? 2.6 : 0, t, 12);
        if (lt < 1.0) {
          poseIdle(rig, t);
          rig.arms.r.upper.rotation.x = -0.8 + Math.sin(t * 3) * 0.15;
        } else if (lt < 2.2) {
          const p = (lt - 1.0) / 1.2;
          poseIdle(rig, t);
          rig.torso.rotation.y = p * 0.7;
          rig.head.rotation.y = p * 0.6;
          rig.arms.r.upper.rotation.x = -0.8 + p * 0.3;
        } else {
          poseIdle(rig, t);
          rig.torso.rotation.y = 0.7;
          rig.head.rotation.y = 0.6;
        }
        coworker.root.visible = false;
      });
      break;
    }

    /* 2 — ALARM: walk to the WALL call point, pull the lever DOWN, strobes */
    case "alarm": {
      mkDrift(group);
      const fire = mkEquipmentFire(group, 0.6, -0.3, false);
      const cp = mkCallPoint(group, -0.95);
      rig.root.position.set(0.25, MINE_ROOT_Y, 0.2);
      state.tickers.push((t) => {
        const lt = t % 6.0;
        fire.smoke.tick(t);
        if (fire.flame) fire.flame.setLevel(1);
        if (fire.light) flickerLight(fire.light, 2.6, t, 12);
        const alarmOn = lt >= 2.2;
        const strobing = alarmOn && Math.sin(t * 9) > 0;
        (cp.strobe.material as THREE.MeshBasicMaterial).color.set(strobing ? 0xff2020 : 0x330000);
        cp.strobeLight.intensity = strobing ? 3.0 : 0;

        // walk toward the wall-mounted call point (x=-0.82, z=-0.55 stand spot)
        const STAND = { x: -0.8, z: -0.5 };
        const START = { x: 0.25, z: 0.2 };
        if (lt < 2.2) {
          const p = lt / 2.2;
          rig.root.position.set(START.x + (STAND.x - START.x) * p, MINE_ROOT_Y, START.z + (STAND.z - START.z) * p);
          // face the direction of travel (toward the wall call point)
          const dx = STAND.x - START.x;
          const dz = STAND.z - START.z;
          rig.root.rotation.y = Math.atan2(dx, dz);
          poseWalk(rig, lt * 3.0, 1.1);
        } else if (lt < 3.0) {
          // stand at the wall and pull the lever DOWN
          rig.root.position.set(STAND.x, MINE_ROOT_Y, STAND.z);
          rig.root.rotation.y = Math.PI; // facing the wall (-Z)
          poseIdle(rig, t);
          // arm reaches up to the lever and pulls down
          const p = (lt - 2.2) / 0.8;
          rig.arms.r.upper.rotation.x = -1.6 + p * 0.5;
          rig.arms.r.lower.rotation.x = -0.3;
          rig.head.rotation.x = -0.2;
        } else if (lt < 5.2) {
          rig.root.position.set(STAND.x, MINE_ROOT_Y, STAND.z);
          rig.root.rotation.y = Math.PI;
          poseIdle(rig, t);
          rig.arms.r.upper.rotation.x = -1.1;
          rig.head.rotation.x = -0.3; // looking up at the strobe
        } else {
          // walk back out
          const p = (lt - 5.2) / 0.8;
          rig.root.position.set(STAND.x + p * (START.x - STAND.x), MINE_ROOT_Y, STAND.z + p * (START.z - STAND.z));
          rig.root.rotation.y = Math.atan2(START.x - STAND.x, START.z - STAND.z);
          poseWalk(rig, lt * 3.0, 0.9);
        }
        // lever pulled down while alarm active
        cp.lever.rotation.x = alarmOn ? 0.9 : 0;
        coworker.root.visible = false;
      });
      break;
    }

    /* 3 — ASSIST: unaware coworker looks away; miner walks over, alerts,
       then BOTH walk together toward the primary exit. */
    case "assist": {
      mkDrift(group);
      const fire = mkEquipmentFire(group, 0.65, -0.35, true);
      rig.root.position.set(-0.6, MINE_ROOT_Y, 0.32);
      const EXIT_DIR = -0.35; // heading toward the primary exit on the left
      state.tickers.push((t) => {
        const lt = t % LOOP;
        fire.smoke.tick(t);
        if (lt < 1.5) {
          // quick visual sweep
          rig.root.position.set(-0.6, MINE_ROOT_Y, 0.32);
          rig.root.rotation.y = 0.35 + (lt / 1.5) * Math.PI;
          poseIdle(rig, t);
          rig.head.rotation.y = 0.3;
          coworker.root.visible = true;
          poseIdle(coworker, t + 1.7);
          // coworker looks AWAY from the fire (facing his work on the right wall)
          coworker.root.rotation.y = 2.4;
          coworker.arms.r.upper.rotation.x = -0.7 + Math.sin((t + 1) * 3) * 0.2;
        } else if (lt < 3.2) {
          // miner walks TO the coworker, facing him while moving
          const p = (lt - 1.5) / 1.7;
          const from = new THREE.Vector3(-0.6, MINE_ROOT_Y, 0.32);
          const to = new THREE.Vector3(0.28, MINE_ROOT_Y, 0.12);
          rig.root.position.lerpVectors(from, to, p);
          const dx = to.x - from.x;
          const dz = to.z - from.z;
          rig.root.rotation.y = Math.atan2(dx, dz);
          poseWalk(rig, lt * 2.8, 1.0);
          coworker.root.visible = true;
          poseIdle(coworker, t + 1.7);
          coworker.root.rotation.y = 2.4;
          coworker.arms.r.upper.rotation.x = -0.7 + Math.sin((t + 1) * 3) * 0.2;
        } else if (lt < 4.6) {
          // tap shoulder + point to the exit; coworker turns to face the miner
          rig.root.position.set(0.28, MINE_ROOT_Y, 0.12);
          rig.root.rotation.y = 0.9;
          poseIdle(rig, t);
          const wave = Math.sin((lt - 3.2) * 7) * 0.35;
          rig.arms.r.upper.rotation.set(-2.2 + wave * 0.4, 0, -0.35);
          rig.arms.r.lower.rotation.x = -0.3;
          rig.arms.l.upper.rotation.set(-1.2, 0, 0.6);
          coworker.root.visible = true;
          const turn = Math.min(1, (lt - 3.4) / 0.8);
          coworker.root.rotation.y = 2.4 - turn * 2.9; // turns to face the miner/exit
          poseIdle(coworker, t);
        } else {
          // BOTH walk side by side toward the primary exit (left)
          const p = Math.min(1, (lt - 4.6) / 3.0);
          rig.root.position.set(0.28 - p * 1.35, MINE_ROOT_Y, 0.12 - p * 0.05);
          rig.root.rotation.y = Math.atan2(-1.35, -0.05);
          poseWalk(rig, lt * 2.8, 1.0);
          coworker.root.visible = true;
          coworker.root.position.set(0.42 - p * 1.4, MINE_ROOT_Y, 0.02 - p * 0.05);
          coworker.root.rotation.y = Math.atan2(-1.4, -0.05);
          poseWalk(coworker, lt * 2.8 + 0.35, 0.95);
        }
        void EXIT_DIR;
      });
      break;
    }

    /* 4 — JUDGMENT: fire grows & blocks path — turn away */
    case "judgment": {
      mkDrift(group);
      const fire = mkEquipmentFire(group, 0.35, -0.2, false);
      rig.root.position.set(-0.35, MINE_ROOT_Y, 0.3);
      state.tickers.push((t) => {
        const lt = t % 7.0;
        fire.smoke.tick(t);
        const grow = 0.4 + Math.min(1.2, (lt / 5.0) * 1.2);
        if (fire.flame) fire.flame.setLevel(grow);
        if (fire.light) flickerLight(fire.light, 2.0 * grow, t, 12);
        fire.smoke.points.scale.setScalar(0.7 + grow * 0.5);

        if (lt < 2.4) {
          const p = lt / 2.4;
          rig.root.position.set(-0.35 + p * 0.3, MINE_ROOT_Y, 0.3 - p * 0.08);
          rig.root.rotation.y = Math.atan2(0.3, -0.08);
          poseWalk(rig, lt * 1.6, 0.6);
        } else if (lt < 3.6) {
          rig.root.position.set(-0.05, MINE_ROOT_Y, 0.22);
          rig.root.rotation.y = 0.75;
          poseIdle(rig, t);
          rig.head.rotation.x = -0.2;
          rig.arms.r.upper.rotation.x = -0.5;
        } else if (lt < 4.2) {
          rig.root.position.set(-0.05, MINE_ROOT_Y, 0.22);
          rig.root.rotation.y = 0.75 - ((lt - 3.6) / 0.6) * Math.PI;
          poseIdle(rig, t);
        } else {
          const p = Math.min(1, (lt - 4.2) / 2.8);
          rig.root.position.set(-0.05 - p * 0.85, MINE_ROOT_Y, 0.22 + p * 0.1);
          rig.root.rotation.y = Math.atan2(-0.85, 0.1);
          poseWalk(rig, lt * 3.0, 1.05);
        }
        coworker.root.visible = false;
      });
      break;
    }

    /* 5 — MOVE TO EXIT: slow, straight, careful walk (per spec) */
    case "move_exit": {
      mkDrift(group);
      // painted floor arrows (subtle, not glowing lines)
      const arrowTex = radialTex([[0, "rgba(120,220,150,0.9)"], [0.5, "rgba(60,180,110,0.5)"], [1, "rgba(0,0,0,0)"]], 64, "evacfloor");
      for (let i = 0; i < 6; i++) {
        const a = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex, transparent: true, depthWrite: false, opacity: 0.5 }));
        a.position.set(-1.0 + i * 0.4, FLOOR_Y + 0.025, 0.18);
        a.scale.setScalar(0.16);
        group.add(a);
      }
      rig.root.position.set(-1.0, MINE_ROOT_Y, 0.18);
      state.tickers.push((t) => {
        const lt = t % 6.5;
        const p = Math.min(1, lt / 5.6);
        // straight line walk along +X, facing travel direction the whole time
        rig.root.position.set(-1.0 + p * 2.0, MINE_ROOT_Y, 0.18);
        rig.root.rotation.y = Math.PI / 2;
        poseWalk(rig, lt * 1.9, 0.85); // slower, cautious pace
        coworker.root.visible = false;
      });
      break;
    }

    /* 6 — AVOID LIFT: reach button (wall fixed), correct to ladderway */
    case "avoid_lift": {
      mkDrift(group);
      // lift cage on right
      const liftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.35 }));
      liftFrame.position.set(0.72, 0.05, -0.78);
      group.add(liftFrame);
      const liftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.7, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 }));
      liftDoor.position.set(0.72, 0.02, -0.73);
      group.add(liftDoor);
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.9 });
      const bar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.05), crossMat);
      bar1.rotation.z = 0.6;
      bar1.position.set(0.72, 0.05, -0.71);
      const bar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.05), crossMat);
      bar2.rotation.z = -0.6;
      bar2.position.set(0.72, 0.05, -0.715);
      group.add(bar1, bar2);
      // lift button FIXED on the wall next to the lift frame
      const liftBtn = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      liftBtn.position.set(0.44, FLOOR_Y + 0.38, -0.77);
      group.add(liftBtn);
      const btnPlate = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 }));
      btnPlate.position.set(0.44, FLOOR_Y + 0.38, -0.79);
      group.add(btnPlate);
      // ladderway on left
      const rm = new THREE.MeshStandardMaterial({ color: 0x8a9199, metalness: 0.85, roughness: 0.3 });
      [-0.07, 0.07].forEach(off => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.85, 6), rm);
        rail.position.set(-0.7 + off, FLOOR_Y + 0.42, -0.78);
        group.add(rail);
      });
      for (let i = 0; i < 8; i++) {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.15, 6), rm);
        rung.rotation.z = Math.PI / 2;
        rung.position.set(-0.7, FLOOR_Y + 0.1 + i * 0.1, -0.78);
        group.add(rung);
      }
      rig.root.position.set(-0.1, MINE_ROOT_Y, 0.15);
      state.tickers.push((t) => {
        const lt = t % 8.0;
        const crossOn = Math.sin(t * 5) > -0.4;
        crossMat.opacity = crossOn ? 0.9 : 0.25;

        const BTN_STAND = { x: 0.3, z: -0.35 };
        if (lt < 1.8) {
          // walk to the lift button stand spot, facing travel direction
          const p = lt / 1.8;
          const from = { x: -0.1, z: 0.15 };
          rig.root.position.set(from.x + (BTN_STAND.x - from.x) * p, MINE_ROOT_Y, from.z + (BTN_STAND.z - from.z) * p);
          rig.root.rotation.y = Math.atan2(BTN_STAND.x - from.x, BTN_STAND.z - from.z);
          poseWalk(rig, lt * 2.6, 1.0);
        } else if (lt < 2.9) {
          // stands right at the wall, reaches for the button ON the wall
          rig.root.position.set(BTN_STAND.x, MINE_ROOT_Y, BTN_STAND.z);
          rig.root.rotation.y = Math.PI; // facing the wall (-Z) — button is on the wall
          poseIdle(rig, t);
          const p = (lt - 1.8) / 1.1;
          rig.arms.r.upper.rotation.x = -0.8 - p * 0.55;
          rig.arms.r.lower.rotation.x = -0.2;
        } else if (lt < 3.7) {
          // correction: pulls back, head turns to the red cross
          rig.root.position.set(BTN_STAND.x, MINE_ROOT_Y, BTN_STAND.z + 0.12);
          rig.root.rotation.y = Math.PI;
          poseIdle(rig, t);
          const p = (lt - 2.9) / 0.8;
          rig.arms.r.upper.rotation.x = -1.35 + p * 1.1;
          rig.head.rotation.y = p * 0.7;
          rig.torso.rotation.y = p * 0.3;
        } else if (lt < 5.2) {
          // walk left to the ladderway, facing travel direction
          const p = (lt - 3.7) / 1.5;
          rig.root.position.set(BTN_STAND.x - p * 1.0, MINE_ROOT_Y, BTN_STAND.z + 0.2);
          rig.root.rotation.y = Math.atan2(-1.0, 0.2);
          poseWalk(rig, lt * 2.6, 0.9);
        } else if (lt < 7.4) {
          // descend ladder facing the wall
          const p = (lt - 5.2) / 2.2;
          rig.root.position.set(-0.7, MINE_ROOT_Y - p * 0.3, -0.6);
          rig.root.rotation.y = Math.PI;
          const c = (lt - 5.2) * 4.2;
          rig.arms.l.upper.rotation.x = -1.9 + Math.sin(c) * 0.35;
          rig.arms.r.upper.rotation.x = -1.9 + Math.sin(c + Math.PI) * 0.35;
          rig.arms.l.lower.rotation.x = -0.4;
          rig.arms.r.lower.rotation.x = -0.4;
          rig.legs.l.upper.rotation.x = 0.5 + Math.sin(c + Math.PI) * 0.35;
          rig.legs.r.upper.rotation.x = 0.5 + Math.sin(c) * 0.35;
          rig.legs.l.lower.rotation.x = -0.8;
          rig.legs.r.lower.rotation.x = -0.8;
        } else {
          const p = (lt - 7.4) / 0.6;
          rig.root.position.set(-0.7 + p * 0.6, MINE_ROOT_Y + 0.3, -0.6 + p * 0.7);
          rig.root.rotation.y = 0.1;
          poseWalk(rig, lt * 2.6, 0.8);
        }
        coworker.root.visible = false;
      });
      break;
    }

    /* 7 — NO RETURN: big bag, stops, looks at it, ignores it, walks on */
    case "no_return": {
      mkDrift(group);
      const bag = mkBag(group, 0.1);
      rig.root.position.set(-1.0, MINE_ROOT_Y, 0.2);
      state.tickers.push((t) => {
        const lt = t % 7.0;
        // segments: walk to bag (0-2), STOP & look (2-3.4), turn head back & walk on (3.4-6), reset (6-7)
        const WALK_END = 2.0;
        const LOOK_END = 3.6;
        const BAG_X = 0.1;
        if (lt < WALK_END) {
          const p = lt / WALK_END;
          rig.root.position.set(-1.0 + p * 1.05, MINE_ROOT_Y, 0.2);
          rig.root.rotation.y = Math.PI / 2; // facing travel
          poseWalk(rig, lt * 2.2, 1.0);
          rig.head.rotation.y = 0;
        } else if (lt < LOOK_END) {
          // stopped beside the bag — turns his head DOWN/back to look at it
          rig.root.position.set(0.05, MINE_ROOT_Y, 0.2);
          rig.root.rotation.y = Math.PI / 2;
          poseIdle(rig, t);
          // look over the shoulder at the bag behind (bag at z=0.42, miner facing +X)
          const lookP = Math.min(1, (lt - WALK_END) / 0.5);
          rig.head.rotation.y = -1.1 * lookP;
          rig.torso.rotation.y = -0.3 * lookP;
          rig.head.rotation.x = 0.25 * lookP; // looking down at it
        } else {
          // ignores it — head back forward, keeps walking to the exit
          const p = Math.min(1, (lt - LOOK_END) / 2.6);
          rig.root.position.set(0.05 + p * 1.0, MINE_ROOT_Y, 0.2);
          rig.root.rotation.y = Math.PI / 2;
          poseWalk(rig, lt * 2.2, 1.0);
          rig.head.rotation.y = 0;
          rig.torso.rotation.y = 0;
        }
        // subtle bag highlight while he looks
        const looking = lt >= WALK_END && lt < LOOK_END;
        bag.traverse(o => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && (mesh.material as THREE.MeshStandardMaterial).emissive) {
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = looking ? 0.25 + Math.sin(t * 8) * 0.15 : 0;
            (mesh.material as THREE.MeshStandardMaterial).emissive.set(0x38bdf8);
          }
        });
        coworker.root.visible = false;
      });
      break;
    }

    /* 8 — MUSTER: converge from different directions facing the sign, no overlap */
    case "muster": {
      mkDrift(group);
      const post = mkMusterPost(group, 0.3);
      const m2 = mkMiner(-0.95, 0.5, 0);
      const m3 = mkMiner(0.95, 0.45, 0);
      group.add(m2.root, m3.root);
      state.tickers.push((t) => {
        const lt = t % 7.0;
        const ring = post.children[2] as THREE.Mesh;
        const rs = (t % 1.6) / 1.6;
        ring.scale.setScalar(1 + rs * 0.5);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - rs);

        // each miner walks from a DIFFERENT direction toward the post,
        // facing the sign/painted marking as they converge.
        const POST = { x: 0.3, z: -0.02 };
        // main miner: from bottom-left, diagonal approach
        const p1 = Math.min(1, lt / 3.2);
        const s1 = { x: -0.85, z: 0.5 };
        rig.root.position.set(s1.x + (POST.x - s1.x) * p1, MINE_ROOT_Y, s1.z + (POST.z - s1.z) * p1 - (p1 >= 1 ? 0.12 : 0));
        if (p1 < 1) rig.root.rotation.y = Math.atan2(POST.x - s1.x, POST.z - s1.z);
        else rig.root.rotation.y = Math.atan2(POST.x - POST.x + 0.3, -1); // face the sign (front)
        if (p1 < 1) poseWalk(rig, lt * 2.4, 1.0); else poseIdle(rig, t);

        // m2 from the left, stops on the left side of the ring (no overlap)
        const p2 = Math.min(1, (lt - 0.5) / 3.2);
        const s2 = { x: -1.0, z: -0.1 };
        const stop2 = { x: POST.x - 0.28, z: POST.z + 0.18 };
        if (p2 > 0) {
          m2.root.position.set(s2.x + (stop2.x - s2.x) * p2, MINE_ROOT_Y, s2.z + (stop2.z - s2.z) * p2);
          if (p2 < 1) {
            m2.root.rotation.y = Math.atan2(stop2.x - s2.x, stop2.z - s2.z);
            poseWalk(m2, (lt - 0.5) * 2.4, 1.0);
          } else {
            m2.root.rotation.y = 0.5; // turned toward the post/sign
            poseIdle(m2, t);
          }
        }

        // m3 from the right, stops on the right side of the ring
        const p3 = Math.min(1, (lt - 1.0) / 3.2);
        const s3 = { x: 1.0, z: 0.3 };
        const stop3 = { x: POST.x + 0.26, z: POST.z + 0.14 };
        if (p3 > 0) {
          m3.root.position.set(s3.x + (stop3.x - s3.x) * p3, MINE_ROOT_Y, s3.z + (stop3.z - s3.z) * p3);
          if (p3 < 1) {
            m3.root.rotation.y = Math.atan2(stop3.x - s3.x, stop3.z - s3.z);
            poseWalk(m3, (lt - 1.0) * 2.4, 1.0);
          } else {
            m3.root.rotation.y = -0.5;
            poseIdle(m3, t);
          }
        }
      });
      break;
    }

    /* 9 — CHECK-IN: distinct supervisor, miner correctly on the floor */
    case "checkin":
    default: {
      mkDrift(group);
      const post = mkMusterPost(group, 0.35);
      const sup = mkSupervisor(0.42, -0.3, -0.15);
      group.add(sup.root);
      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.015),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 }));
      kiosk.position.set(0.35, FLOOR_Y + 0.42, -0.08);
      group.add(kiosk);
      const check = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0 }));
      check.position.set(0.35, FLOOR_Y + 0.42, -0.07);
      group.add(check);
      rig.root.position.set(-0.25, MINE_ROOT_Y, 0.22);
      state.tickers.push((t) => {
        const lt = t % 7.0;
        sup.root.visible = true;
        poseIdle(sup, t + 2.0);
        const checked = lt >= 3.2;
        (check.material as THREE.MeshBasicMaterial).opacity = checked ? 0.95 : 0;

        if (lt < 1.6) {
          // walk to supervisor — facing travel direction, on the floor
          const p = lt / 1.6;
          const from = { x: -0.25, z: 0.22 };
          const to = { x: 0.1, z: 0.14 };
          rig.root.position.set(from.x + (to.x - from.x) * p, MINE_ROOT_Y, from.z + (to.z - from.z) * p);
          rig.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
          poseWalk(rig, lt * 2.4, 0.9);
        } else {
          // stand at attention before the supervisor and raise hand
          rig.root.position.set(0.1, MINE_ROOT_Y, 0.14);
          // face the supervisor
          const dx = sup.root.position.x - rig.root.position.x;
          const dz = sup.root.position.z - rig.root.position.z;
          rig.root.rotation.y = Math.atan2(dx, dz);
          poseIdle(rig, t);
          if (lt < 3.2) {
            rig.arms.r.upper.rotation.set(-2.5 + Math.sin((lt - 1.6) * 5) * 0.1, 0, -0.2);
            rig.arms.r.lower.rotation.x = -0.15;
            rig.head.rotation.x = -0.1;
          } else {
            rig.arms.l.upper.rotation.set(-0.4, 0, 0.2);
            rig.arms.r.upper.rotation.set(-0.4, 0, -0.2);
          }
        }
        // supervisor nods subtly once check-in completes
        if (checked) {
          sup.head.rotation.x = Math.sin(t * 3) * 0.08 - 0.04;
        }
      });
      break;
    }
  }

  EVM.set(group.name, state);
  return group;
}

export function updateEvacuationAnimations(group: THREE.Group, elapsed: number, delta: number): void {
  const s = EVM.get(group.name);
  if (!s) return;
  for (const fn of s.tickers) fn(elapsed, delta);
}

export function disposeEvacuationModel(group: THREE.Group): void {
  const s = EVM.get(group.name);
  if (s) {
    s.disposers.forEach(d => d());
    EVM.delete(group.name);
  }
  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      const mats = Array.isArray((o as THREE.Mesh).material) ? (o as THREE.Mesh).material as THREE.Material[] : [(o as THREE.Mesh).material as THREE.Material];
      mats.forEach((m: THREE.Material) => { if ((m as THREE.SpriteMaterial).map) (m as THREE.SpriteMaterial).map?.dispose(); m.dispose(); });
    }
  });
}
