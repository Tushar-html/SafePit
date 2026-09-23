import * as THREE from "three";
import { ExtinguisherStep } from "../data/extinguisherData";
import { makePuffs, makeFlameCross, smokeTexture, makeGroundShadow, flickerLight } from "./fxShared";
import { createMinerRig, poseWalk, poseIdle, MinerRig, MINE_ROOT_Y } from "./exitRouteModels3D";

/* ============================================================
   Fire Extinguisher Use — one scripted drill loop (per spec):

   1. The character walks in from one side, extinguisher ALREADY
      in his hands.
   2. Stops in front of the fire, stands still.
   3. Removes the safety pin (pin yanked + drops).
   4. Aims at the fire (nozzle toward base).
   5. Squeezes the lever — white smoke jet erupts.
   6. Fire shrinks and is extinguished.
   7. Character holds extinguisher in one hand and gives a
      THUMBS UP with the other. Loop repeats.
   ============================================================ */

const FLOOR_Y = 0;

interface ExState {
  rig: MinerRig;
  tickers: Array<(t: number, delta: number) => void>;
  disposers: Array<() => void>;
}

const EXM = new Map<string, ExState>();

function buildExtinguisherCylinder(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.13, 14),
    new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.35, metalness: 0.45 })
  );
  body.position.y = 0.065;
  g.add(body);
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.032, 0.02, 14),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.75, roughness: 0.3 })
  );
  topCap.position.y = 0.14;
  g.add(topCap);
  const valve = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.018, 0.024),
    new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.8, roughness: 0.3 })
  );
  valve.position.y = 0.155;
  g.add(valve);
  // squeeze lever
  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.008, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.8, roughness: 0.3 })
  );
  lever.position.set(0, 0.165, 0.012);
  lever.name = "lever";
  g.add(lever);
  // carry handle
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.016, 0.004, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.8, roughness: 0.3 })
  );
  handle.position.y = 0.158;
  handle.rotation.x = Math.PI / 2;
  g.add(handle);
  // gauge
  const gauge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10),
    new THREE.MeshStandardMaterial({ color: 0xd4a800, metalness: 0.7, roughness: 0.3 })
  );
  gauge.rotation.z = Math.PI / 2;
  gauge.position.set(0.022, 0.152, 0);
  g.add(gauge);
  // hose + horn nozzle
  const hoseCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0.15, 0.01),
    new THREE.Vector3(0.05, 0.12, 0.05),
    new THREE.Vector3(0.07, 0.05, 0.03)
  );
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 12, 0.006, 6, false),
    new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.7 })
  );
  g.add(hose);
  const horn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.02, 0.045, 10),
    new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.6 })
  );
  horn.position.set(0.075, 0.028, 0.03);
  horn.rotation.x = 0.5;
  horn.name = "horn";
  g.add(horn);
  // ring pin + seal
  const pin = new THREE.Mesh(
    new THREE.TorusGeometry(0.01, 0.0022, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.25 })
  );
  pin.position.set(0, 0.168, 0.005);
  pin.name = "pin";
  g.add(pin);
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.002, 8),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 })
  );
  seal.position.set(0, 0.162, 0.005);
  seal.name = "seal";
  g.add(seal);
  return g;
}

export function create3DExtinguisherModel(_type: ExtinguisherStep["modelType"]): THREE.Group {
  const group = new THREE.Group();
  group.name = "extinguisher_model";

  const state: ExState = { rig: null as unknown as MinerRig, tickers: [], disposers: [] };
  group.add(makeGroundShadow(2.4, 1.9, FLOOR_Y, 0.8));

  // ---- clean mine alcove backdrop: floor, rock back wall, timber props ----
  const rockCols = [0x241f1a, 0x2b241e, 0x1e1a15];
  const fm = new THREE.MeshStandardMaterial({ color: 0x17130f, roughness: 0.99 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.7), fm);
  floor.position.y = FLOOR_Y;
  group.add(floor);
  const backWall = new THREE.Group();
  for (let i = 0; i < 22; i++) {
    const h = 0.8 + Math.random() * 0.5;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: rockCols[i % 3], roughness: 0.96, flatShading: true })
    );
    m.scale.set(0.15 + Math.random() * 0.1, h, 0.2 + Math.random() * 0.2);
    m.position.set(-1.0 + i * 0.095, FLOOR_Y + 0.03 + h * 0.32, -0.8);
    m.rotation.set((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1);
    backWall.add(m);
  }
  group.add(backWall);
  // wooden pit props (clean dressing, no wires/arches)
  const woodM = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  for (const x of [-0.85, 0.85]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.98, 10), woodM);
    post.position.set(x, FLOOR_Y + 0.52, -0.72);
    group.add(post);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.09), woodM);
    cap.position.set(x, FLOOR_Y + 1.02, -0.72);
    group.add(cap);
  }
  // roof slab — underside at 1.06, aligned with the prop caps and clear
  // above the miner's helmet (0.62)
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x201b16, roughness: 0.97 }));
  ceil.position.y = FLOOR_Y + 1.095;
  group.add(ceil);

  // ---- burning pallet (center-right) ----
  const pallet = new THREE.Group();
  pallet.name = "pallet";
  const plankM = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.055), plankM);
    plank.position.set(0, FLOOR_Y + 0.03, -0.16 + i * 0.08);
    pallet.add(plank);
  }
  for (const px of [-0.18, 0.18]) {
    const runner = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.45), plankM);
    runner.position.set(px, FLOOR_Y + 0.018, 0);
    pallet.add(runner);
  }
  pallet.position.set(0.35, 0, -0.1);
  group.add(pallet);

  // contained flame on the pallet
  const flame = makeFlameCross({
    height: 0.42, width: 0.15, colorInner: "rgba(255,240,150,1)", colorOuter: "rgba(255,110,20,0.9)",
    intensity: 1.0, sway: 0.18, speed: 1.2, blades: 3
  });
  flame.group.position.set(0.35, FLOOR_Y + 0.04, -0.1);
  group.add(flame.group);
  state.disposers.push(flame.dispose);

  // fire smoke
  const fireSmoke = makePuffs({
    count: 26, areaX: 0.12, areaZ: 0.12, baseY: FLOOR_Y + 0.42, rise: 0.9, life: 2.6,
    sizeMin: 0.16, sizeGrow: 2.2, color: new THREE.Color(0.14, 0.14, 0.15), tex: smokeTexture(),
    opacity: 0.4, sway: 0.06, fadeIn: 0.2
  });
  fireSmoke.points.position.set(0.35, 0, -0.1);
  group.add(fireSmoke.points);
  state.disposers.push(fireSmoke.dispose);

  const fireLight = new THREE.PointLight(0xff7018, 3.2, 2.4);
  fireLight.position.set(0.35, FLOOR_Y + 0.3, -0.1);
  group.add(fireLight);

  // ---- discharge smoke jet + cloud ----
  const powder = makePuffs({
    count: 90, areaX: 0.025, areaZ: 0.025, baseY: 0, rise: 0.85, life: 0.8,
    sizeMin: 0.07, sizeGrow: 2.0, color: new THREE.Color(0.94, 0.94, 0.9), tex: smokeTexture(),
    opacity: 0.6, sway: 0.06, fadeIn: 0.06, fadeSharp: 1.5, riseEase: 0.85
  });
  powder.points.visible = false;
  group.add(powder.points);
  state.disposers.push(powder.dispose);

  const cloud = makePuffs({
    count: 44, areaX: 0.18, areaZ: 0.16, baseY: FLOOR_Y + 0.08, rise: 0.45, life: 2.0,
    sizeMin: 0.2, sizeGrow: 2.2, color: new THREE.Color(0.92, 0.92, 0.88), tex: smokeTexture(),
    opacity: 0.42, sway: 0.08, fadeIn: 0.15
  });
  cloud.points.position.set(0.35, 0, -0.1);
  cloud.points.visible = false;
  group.add(cloud.points);
  state.disposers.push(cloud.dispose);

  // residual haze after extinguished
  const haze = makePuffs({
    count: 22, areaX: 0.2, areaZ: 0.18, baseY: FLOOR_Y + 0.08, rise: 0.7, life: 3.2,
    sizeMin: 0.22, sizeGrow: 2.6, color: new THREE.Color(0.75, 0.75, 0.72), tex: smokeTexture(),
    opacity: 0.22, sway: 0.07, fadeIn: 0.3
  });
  haze.points.position.set(0.35, 0, -0.1);
  haze.points.visible = false;
  group.add(haze.points);
  state.disposers.push(haze.dispose);

  // ---- miner rig ----
  const rig = createMinerRig();
  rig.root.position.set(-0.95, MINE_ROOT_Y, 0.28);
  rig.root.rotation.y = 0.75; // facing the fire diagonally
  group.add(rig.root);
  state.rig = rig;

  // extinguisher carried in hands from the start
  const ext = buildExtinguisherCylinder();
  ext.name = "extinguisher";
  const carryAnchor = new THREE.Group();
  carryAnchor.name = "carry_anchor";
  carryAnchor.scale.setScalar(0.9);
  rig.root.add(carryAnchor);
  carryAnchor.add(ext);

  const lever = ext.getObjectByName("lever") as THREE.Mesh;
  const horn = ext.getObjectByName("horn") as THREE.Mesh;
  const pin = ext.getObjectByName("pin") as THREE.Mesh;
  const seal = ext.getObjectByName("seal") as THREE.Mesh;

  // ---- scripted loop (10s) ----
  const LOOP = 10.0;
  // phase times
  const T_WALK_END = 2.2;      // walking in with extinguisher
  const T_STOP_END = 3.0;      // stands still at the fire
  const T_PIN_END = 3.8;       // removes safety pin
  const T_AIM_END = 4.6;       // aims at fire
  const T_SQUEEZE_END = 5.2;   // squeezes lever (discharge starts)
  const T_KNOCKDOWN_END = 7.6; // smoke kills the fire
  const T_THUMBS_END = 9.6;    // thumbs up hold

  state.tickers.push((t, delta) => {
    const lt = t % LOOP;

    // ---- flame intensity: full until knockdown phase, then dies ----
    let flameLevel = 1.0;
    if (lt >= T_SQUEEZE_END && lt < T_KNOCKDOWN_END) flameLevel = Math.max(0.05, 1 - ((lt - T_SQUEEZE_END) / (T_KNOCKDOWN_END - T_SQUEEZE_END)));
    else if (lt >= T_KNOCKDOWN_END) flameLevel = 0;
    flame.group.visible = flameLevel > 0.02;
    flame.group.scale.setScalar(Math.max(0.05, flameLevel));
    fireSmoke.points.visible = flameLevel > 0.02;
    (fireSmoke.points.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.4 * flameLevel;
    flickerLight(fireLight, 3.2 * flameLevel, t, 11);

    // ---- smoke jet while squeezing / sweeping ----
    const spraying = lt >= T_SQUEEZE_END - 0.15 && lt < T_KNOCKDOWN_END;
    powder.points.visible = spraying;
    cloud.points.visible = spraying;
    if (spraying) {
      const hornWorld = horn.getWorldPosition(new THREE.Vector3());
      const fireBase = new THREE.Vector3(0.35, FLOOR_Y + 0.08, -0.1);
      const dir = fireBase.clone().sub(hornWorld).normalize();
      powder.points.position.copy(group.worldToLocal(hornWorld.clone()));
      powder.points.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      powder.tick(t * 1.6);
      cloud.tick(t);
    }
    haze.points.visible = lt >= T_KNOCKDOWN_END;
    if (haze.points.visible) haze.tick(t);
    if (lt >= T_KNOCKDOWN_END && lt < T_KNOCKDOWN_END + 0.5) {
      // char the pallet slightly
      pallet.traverse(o => {
        if ((o as THREE.Mesh).isMesh) {
          const mm = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mm.color.lerp(new THREE.Color(0x3a3a3a), delta * 1.5);
        }
      });
    }

    // ---- pin: visible until removed; yank then hide ----
    const pinRemoved = lt >= T_PIN_END - 0.6;
    const pinGone = lt >= T_PIN_END;
    pin.visible = !pinGone;
    seal.visible = !pinGone;
    if (pinRemoved && !pinGone) {
      const p = (lt - (T_PIN_END - 0.6)) / 0.6;
      pin.position.set(0.02 + p * 0.05, 0.168, 0.005 + p * 0.03);
    } else if (!pinRemoved) {
      pin.position.set(0, 0.168, 0.005);
    }
    // reset pin for the next loop
    if (lt < 0.1) {
      pin.position.set(0, 0.168, 0.005);
      pin.visible = true;
      seal.visible = true;
      pallet.traverse(o => {
        if ((o as THREE.Mesh).isMesh) {
          const mm = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mm.color.lerp(new THREE.Color(0x6b4a2a), delta * 3);
        }
      });
    }

    // ---- miner movement + pose per phase ----
    const rig2 = state.rig;
    const WALK_FROM = new THREE.Vector3(-0.95, MINE_ROOT_Y, 0.28);
    const FIGHT_SPOT = new THREE.Vector3(-0.12, MINE_ROOT_Y, 0.32);

    if (lt < T_WALK_END) {
      // phase 1: walks in already holding the extinguisher
      const p = lt / T_WALK_END;
      rig2.root.position.lerpVectors(WALK_FROM, FIGHT_SPOT, p);
      rig2.root.rotation.y = 0.75;
      poseWalk(rig2, lt * 1.7, 1.0);
      // both hands carrying the cylinder at the chest
      rig2.arms.l.upper.rotation.set(-0.85, 0, 0.35);
      rig2.arms.l.lower.rotation.x = -0.85;
      rig2.arms.r.upper.rotation.set(-0.9, 0, -0.3);
      rig2.arms.r.lower.rotation.x = -0.9;
      ext.position.set(0.07, 0.3, 0.14);
      ext.rotation.set(0.1, 0, 0.06);
    } else if (lt < T_STOP_END) {
      // phase 2: stands still facing the fire
      rig2.root.position.copy(FIGHT_SPOT);
      rig2.root.rotation.y = 0.62;
      poseIdle(rig2, t);
      rig2.arms.l.upper.rotation.set(-0.9, 0, 0.35);
      rig2.arms.l.lower.rotation.x = -0.85;
      rig2.arms.r.upper.rotation.set(-0.95, 0, -0.3);
      rig2.arms.r.lower.rotation.x = -0.9;
      ext.position.set(0.07, 0.3, 0.14);
      ext.rotation.set(0.1, 0, 0.06);
    } else if (lt < T_PIN_END) {
      // phase 3: removes the safety pin (right hand yanks it)
      rig2.root.position.copy(FIGHT_SPOT);
      rig2.root.rotation.y = 0.62;
      poseIdle(rig2, t);
      const p = (lt - T_STOP_END) / (T_PIN_END - T_STOP_END);
      // left hand steadies the cylinder, right hand yanks pin outward
      rig2.arms.l.upper.rotation.set(-1.25, 0, 0.3);
      rig2.arms.l.lower.rotation.x = -0.7;
      rig2.arms.r.upper.rotation.set(-1.3 + p * 0.3, 0, -0.5 - p * 0.35);
      rig2.arms.r.lower.rotation.x = -0.5 - p * 0.4;
      rig2.torso.rotation.y = 0.05 + p * 0.05;
      ext.position.set(0.08, 0.32, 0.13);
      ext.rotation.set(0.05, 0, 0.02);
    } else if (lt < T_AIM_END) {
      // phase 4: aims the horn at the base of the fire
      rig2.root.position.copy(FIGHT_SPOT);
      rig2.root.rotation.y = 0.62;
      poseIdle(rig2, t);
      const p = (lt - T_PIN_END) / (T_AIM_END - T_PIN_END);
      rig2.arms.l.upper.rotation.set(-1.3, 0, 0.3);
      rig2.arms.l.lower.rotation.x = -0.85;
      rig2.arms.r.upper.rotation.set(-1.45 - p * 0.1, 0, -0.1);
      rig2.arms.r.lower.rotation.x = -0.95;
      rig2.torso.rotation.x = 0.06;
      ext.rotation.x = 0.45;
      ext.rotation.z = -0.25;
      ext.position.set(0.07, 0.3 + p * 0.02, 0.14);
      if (lever) lever.rotation.x = 0;
    } else if (lt < T_KNOCKDOWN_END) {
      // phase 5: squeezes the lever — smoke jet kills the fire
      rig2.root.position.copy(FIGHT_SPOT);
      rig2.root.rotation.y = 0.62;
      poseIdle(rig2, t);
      const sweep = Math.sin((lt - T_SQUEEZE_END) * 3.2) * 0.25;
      rig2.arms.l.upper.rotation.set(-1.3 + sweep * 0.4, 0, 0.3 - sweep * 0.5);
      rig2.arms.l.lower.rotation.x = -0.85;
      rig2.arms.r.upper.rotation.set(-1.45 - sweep * 0.3, 0, -0.1 + sweep * 0.4);
      rig2.arms.r.lower.rotation.x = -0.95;
      rig2.torso.rotation.y = sweep * 0.3;
      rig2.torso.rotation.x = 0.1;
      ext.rotation.x = 0.45;
      ext.rotation.z = -0.25;
      // lever squeezed down while discharging
      if (lever) lever.rotation.x = 0.5;
    } else {
      // phase 6: fire out — extinguisher in one hand, THUMBS UP with the other
      rig2.root.position.copy(FIGHT_SPOT);
      rig2.root.rotation.y = 0.62;
      poseIdle(rig2, t);
      const hold = Math.min(1, (lt - T_KNOCKDOWN_END) / 0.5);
      // left hand holds the extinguisher low at the side
      rig2.arms.l.upper.rotation.set(-0.35, 0, 0.25);
      rig2.arms.l.lower.rotation.x = -0.55;
      ext.position.set(-0.02, 0.26, 0.1);
      ext.rotation.set(-0.1, 0, 0.15);
      // right arm raised in a thumbs-up
      rig2.arms.r.upper.rotation.set(-2.4 * hold, 0, -0.25);
      rig2.arms.r.lower.rotation.x = -0.4 + Math.sin(t * 3) * 0.04; // little proud bounce
      if (lever) lever.rotation.x = 0;
      rig2.head.rotation.x = -0.06;
    }
  });

  EXM.set(group.name, state);
  return group;
}

export function updateExtinguisherAnimations(group: THREE.Group, elapsed: number, delta: number): void {
  const s = EXM.get(group.name);
  if (!s) return;
  for (const fn of s.tickers) fn(elapsed, delta);
}

export function disposeExtinguisherModel(group: THREE.Group): void {
  const s = EXM.get(group.name);
  if (s) {
    s.disposers.forEach(d => d());
    EXM.delete(group.name);
  }
  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      const mats = Array.isArray((o as THREE.Mesh).material) ? (o as THREE.Mesh).material as THREE.Material[] : [(o as THREE.Mesh).material as THREE.Material];
      mats.forEach((m: THREE.Material) => { if ((m as THREE.SpriteMaterial).map) (m as THREE.SpriteMaterial).map?.dispose(); m.dispose(); });
    }
  });
}
