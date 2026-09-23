import * as THREE from "three";
import { ExplosionHazardModel } from "../data/explosionData";
import {
  makePuffs, makeGroundShadow, makeHeatShimmer,
  smokeTexture, radialTex, flickerLight, PuffSystem
} from "./fxShared";

/* ============================================================
   6 looping explosion simulations (3.5–5 s seamless loops).
   Each loop: ignition flash -> expanding fireball w/ rolling
   GPU flame puffs -> expanding shockwave rings -> physics
   debris (gravity, bounce, spin) -> lingering smoke plume.
   Timeline helper drives every sub-system from loop time t.
   ============================================================ */

const BASE_Y = 0;

interface DebrisSpec {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  homeY: number;
  size: number;
  launchAt: number; // loop time when it fires
}

interface SmokeCol {
  sys: PuffSystem;
  x: number; z: number;
  from: number; // loop time when this column starts
}

interface ExpState {
  loop: number;
  tickers: Array<(t: number, delta: number) => void>;
  flash?: THREE.Sprite;
  flashLight?: THREE.PointLight;
  fireballPuffs?: PuffSystem;
  fireballCore?: THREE.Sprite;
  /** wrapper group holding core + puffs; scaled from 0 during ignition */
  fireballGroup?: THREE.Group;
  /** loop-time (s) when the eruption begins — before it: empty air */
  ignitionAt?: number;
  rings: Array<{ mesh: THREE.Mesh; from: number; to: number; maxScale: number; y: number }>;
  debris: DebrisSpec[];
  smokeCols: SmokeCol[];
  groundFire?: PuffSystem;
  dustCloud?: PuffSystem;
  disposers: Array<() => void>;
}

const EAM = new Map<string, ExpState>();

/* ---------- small builders ---------- */

function ringMesh(color: number, y: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(0.82, 1.0, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.scale.setScalar(0.01);
  return m;
}

function fireballSpriteTex(): THREE.Texture {
  return radialTex(
    [[0, "rgba(255,255,225,1)"], [0.22, "rgba(255,220,120,0.95)"], [0.45, "rgba(255,120,20,0.8)"], [0.7, "rgba(220,50,0,0.4)"], [1, "rgba(0,0,0,0)"]],
    256, "fireball"
  );
}

function makeDebris(mesh: THREE.Mesh, vel: THREE.Vector3, launchAt: number, homeY = BASE_Y): DebrisSpec {
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  const s = mesh.geometry.boundingSphere ? mesh.geometry.boundingSphere.radius : 0.04;
  return {
    mesh, vel, homeY,
    size: s,
    spin: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
    launchAt
  };
}

function rockDebris(x: number, y: number, z: number, s: number, color: number): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(s, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }));
  m.position.set(x, y, z);
  m.visible = false;
  return m;
}

/* fireball = core sprite + 3 rings of GPU puffs, driven by loop t.
   Everything is wrapped in a group that starts at zero scale — the
   blast grows from nothing (ignition flash) into the full fireball. */
function setupFireball(group: THREE.Group, state: ExpState, opts: {
  color: number; puffColor: THREE.Color; count: number; speed: number; radius: number; tex?: THREE.Texture;
  ignitionAt?: number;
}): void {
  const fb = new THREE.Group();
  fb.name = "fireball";
  fb.scale.setScalar(0.001);
  fb.visible = false;
  group.add(fb);
  state.fireballGroup = fb;
  state.ignitionAt = opts.ignitionAt ?? 0.55;

  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: opts.tex ?? fireballSpriteTex(), color: opts.color,
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  core.position.y = BASE_Y + opts.radius * 0.5;
  core.scale.setScalar(0.01);
  fb.add(core);
  state.fireballCore = core;

  const puffs = makePuffs({
    count: opts.count,
    areaX: opts.radius * 0.45, areaZ: opts.radius * 0.45,
    baseY: BASE_Y + opts.radius * 0.25,
    rise: opts.radius * 1.1, life: 0.9 / opts.speed,
    sizeMin: opts.radius * 0.9, sizeGrow: 1.4,
    color: opts.puffColor, tex: radialTex([[0, "rgba(255,235,170,1)"], [0.35, "rgba(255,140,30,0.85)"], [0.7, "rgba(255,60,0,0.35)"], [1, "rgba(0,0,0,0)"]], 128, `fb_${opts.count}_${opts.radius}`),
    opacity: 0.85, blending: THREE.AdditiveBlending, sway: opts.radius * 0.35,
    fadeIn: 0.12, fadeSharp: 1.4, riseEase: 1.5
  });
  fb.add(puffs.points);
  state.fireballPuffs = puffs;
  state.disposers.push(puffs.dispose);
}

/* explosion smoke columns that start at a given loop time */
function setupSmoke(group: THREE.Group, state: ExpState, cols: Array<{ x: number; z: number; from: number; count?: number; dark?: number; rise?: number; size?: number }>): void {
  cols.forEach(c => {
    const sys = makePuffs({
      count: c.count ?? 30,
      areaX: 0.16, areaZ: 0.16,
      baseY: BASE_Y + 0.15,
      rise: c.rise ?? 1.4, life: 2.8,
      sizeMin: c.size ?? 0.3, sizeGrow: 2.6,
      color: new THREE.Color(c.dark ?? 0.12, (c.dark ?? 0.12) * 0.95, (c.dark ?? 0.12) * 1.05),
      tex: smokeTexture(),
      opacity: 0.6, sway: 0.12, fadeIn: 0.2
    });
    sys.points.position.set(c.x, 0, c.z);
    sys.points.visible = false;
    group.add(sys.points);
    state.smokeCols.push({ sys, x: c.x, z: c.z, from: c.from });
    state.disposers.push(sys.dispose);
  });
}

/* ---------- main builder ---------- */

export function create3DExplosionModel(type: ExplosionHazardModel["modelType"]): THREE.Group {
  const group = new THREE.Group();
  group.name = "explosion_model_" + type;

  const state: ExpState = {
    loop: 4.5, tickers: [], rings: [], debris: [], smokeCols: [], disposers: []
  };

  group.add(makeGroundShadow(2.6, 2.1, BASE_Y, 0.8));

  /* -------- shared scene dressing per type -------- */

  switch (type) {

    /* 1 — METHANE (FIREDAMP): blue core fireball, roof-level flame sheet, blue shockwave */
    case "methane_explosion": {
      state.loop = 4.0;
      // pit prop + roof section it lifts
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.6), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
      roof.position.set(0, 0.62, -0.2); group.add(roof);
      for (let i = 0; i < 3; i++) {
        const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.95, 10), new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.85 }));
        prop.position.set(-0.6 + i * 0.6, BASE_Y + 0.5, -0.2);
        group.add(prop);
      }
      // blue-white fireball — erupts from nothing at 0.55s
      setupFireball(group, state, {
        color: 0xbcd4ff, puffColor: new THREE.Color(0.65, 0.75, 1.0), count: 90, speed: 1.15, radius: 0.55,
        ignitionAt: 0.55,
        tex: radialTex([[0, "rgba(240,248,255,1)"], [0.3, "rgba(170,200,255,0.9)"], [0.6, "rgba(80,120,255,0.5)"], [1, "rgba(0,0,0,0)"]], 256, "fb_methane")
      });
      // roof flame sheet — thin wide blade
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.16), new THREE.MeshBasicMaterial({ color: 0x86b8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      sheet.position.set(0, 0.52, -0.1); group.add(sheet);
      state.tickers.push((t) => {
        const p = Math.max(0, Math.min(1, (t - 0.15) / 0.6));
        (sheet.material as THREE.MeshBasicMaterial).opacity = p < 1 ? Math.sin(p * Math.PI) * 0.85 : 0;
      });
      // blue shockwave + debris of splinters
      const r1 = ringMesh(0xa8c8ff, BASE_Y + 0.02); group.add(r1);
      state.rings.push({ mesh: r1, from: 0.55, to: 1.45, maxScale: 2.6, y: BASE_Y + 0.02 });
      for (let i = 0; i < 10; i++) {
        const d = rockDebris(0, BASE_Y + 0.5, 0, 0.03 + Math.random() * 0.03, 0x4a3520);
        group.add(d);
        state.debris.push(makeDebris(d, new THREE.Vector3((Math.random() - 0.5) * 2.4, 1.2 + Math.random() * 1.4, (Math.random() - 0.5) * 2.4), 0.6));
      }
      setupSmoke(group, state, [
        { x: -0.25, z: 0, from: 1.0 }, { x: 0.25, z: 0.1, from: 1.25 }, { x: 0, z: -0.15, from: 1.5 }
      ]);
      break;
    }

    /* 2 — COAL DUST: rolling advancing orange wall, wave after wave, heavy black smoke */
    case "coal_dust_explosion": {
      state.loop = 4.8;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.98 }));
      floor.position.y = BASE_Y; group.add(floor);
      // dust haze lying on floor
      const dust = makePuffs({
        count: 40, areaX: 0.8, areaZ: 0.45, baseY: BASE_Y + 0.03, rise: 0.25, life: 2.4,
        sizeMin: 0.4, sizeGrow: 1.2, color: new THREE.Color(0.2, 0.18, 0.16), tex: smokeTexture(),
        opacity: 0.35, sway: 0.05, fadeIn: 0.3
      });
      group.add(dust.points);
      state.tickers.push((t) => dust.tick(t));
      state.disposers.push(dust.dispose);
      // main fireball: chunky orange, ignition delayed so it grows from nothing
      setupFireball(group, state, {
        color: 0xff6020, puffColor: new THREE.Color(1.0, 0.45, 0.1), count: 130, speed: 1.0, radius: 0.7,
        ignitionAt: 0.6
      });
      // rolling wall — 3 sequential puff rows that surge forward (z)
      for (let w = 0; w < 3; w++) {
        const row = makePuffs({
          count: 46, areaX: 0.75, areaZ: 0.1, baseY: BASE_Y + 0.15 + w * 0.12, rise: 0.5, life: 1.5,
          sizeMin: 0.35, sizeGrow: 1.8, color: new THREE.Color(1.0, 0.38, 0.06), tex: radialTex([[0, "rgba(255,225,120,1)"], [0.4, "rgba(255,110,10,0.85)"], [1, "rgba(200,30,0,0)"]], 128, "wall"),
          opacity: 0.75, blending: THREE.AdditiveBlending, sway: 0.08, fadeIn: 0.15, fadeSharp: 1.2, riseEase: 1.3
        });
        row.points.position.z = -0.3 + w * 0.25;
        row.points.visible = false;
        group.add(row.points);
        const from = 0.2 + w * 0.55;
        state.tickers.push((t) => {
          const lt = (t - from + state.loop) % state.loop;
          row.points.visible = lt < 1.7;
          if (row.points.visible) {
            row.tick(lt);
            // advance the wall toward camera then fade
            row.points.position.z = -0.35 + w * 0.25 + lt * 0.28;
          }
        });
        state.disposers.push(row.dispose);
      }
      const r1 = ringMesh(0xffb060, BASE_Y + 0.02); group.add(r1);
      state.rings.push({ mesh: r1, from: 0.6, to: 1.7, maxScale: 3.0, y: BASE_Y + 0.02 });
      for (let i = 0; i < 16; i++) {
        const d = rockDebris(0, BASE_Y + 0.4, 0, 0.025 + Math.random() * 0.035, 0x1a1a1a);
        group.add(d);
        state.debris.push(makeDebris(d, new THREE.Vector3((Math.random() - 0.5) * 2.8, 0.9 + Math.random() * 1.7, (Math.random() - 0.5) * 2.8), 0.65));
      }
      setupSmoke(group, state, [
        { x: -0.3, z: 0.1, from: 1.3, count: 34 }, { x: 0.3, z: -0.05, from: 1.6, count: 34 }, { x: 0, z: 0.2, from: 1.9, count: 30, dark: 0.08 }
      ]);
      break;
    }

    /* 3 — COMBINED METHANE + DUST: two-stage — blue flash then massive orange wall */
    case "combined_explosion": {
      state.loop = 5.0;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.97 }));
      floor.position.y = BASE_Y; group.add(floor);
      // stage 1: sharp blue-white flash fireball (small, fast, delayed ignition)
      setupFireball(group, state, {
        color: 0xcfe0ff, puffColor: new THREE.Color(0.72, 0.8, 1.0), count: 55, speed: 1.6, radius: 0.4,
        ignitionAt: 0.7,
        tex: radialTex([[0, "rgba(245,250,255,1)"], [0.3, "rgba(190,215,255,0.95)"], [0.65, "rgba(90,130,255,0.45)"], [1, "rgba(0,0,0,0)"]], 256, "fb_comb")
      });
      // stage 2: massive orange dust wall (delayed)
      const wall = makePuffs({
        count: 110, areaX: 0.85, areaZ: 0.2, baseY: BASE_Y + 0.2, rise: 0.8, life: 2.2,
        sizeMin: 0.4, sizeGrow: 2.0, color: new THREE.Color(1.0, 0.42, 0.08), tex: radialTex([[0, "rgba(255,230,130,1)"], [0.38, "rgba(255,110,10,0.9)"], [1, "rgba(180,30,0,0)"]], 128, "combwall"),
        opacity: 0.8, blending: THREE.AdditiveBlending, sway: 0.1, fadeIn: 0.12, fadeSharp: 1.1, riseEase: 1.4
      });
      wall.points.visible = false;
      group.add(wall.points);
      state.tickers.push((t) => {
        const lt = t - 0.85;
        wall.points.visible = lt > 0 && lt < 2.6;
        if (wall.points.visible) {
          wall.tick(lt * 1.25);
          wall.points.position.z = -0.5 + lt * 0.3;
        }
      });
      state.disposers.push(wall.dispose);
      // double shockwave: blue then orange
      const rBlue = ringMesh(0xbcd4ff, BASE_Y + 0.02); group.add(rBlue);
      state.rings.push({ mesh: rBlue, from: 0.7, to: 1.5, maxScale: 2.4, y: BASE_Y + 0.02 });
      const rOrange = ringMesh(0xffa050, BASE_Y + 0.03); group.add(rOrange);
      state.rings.push({ mesh: rOrange, from: 1.5, to: 2.5, maxScale: 3.4, y: BASE_Y + 0.03 });
      for (let i = 0; i < 22; i++) {
        const metal = i < 10;
        const d = metal
          ? new THREE.Mesh(new THREE.BoxGeometry(0.05 + Math.random() * 0.08, 0.012, 0.03 + Math.random() * 0.06), new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.85, roughness: 0.25 }))
          : rockDebris(0, BASE_Y + 0.45, 0, 0.03 + Math.random() * 0.045, 0x27272a);
        d.position.set(0, BASE_Y + 0.45, 0); d.visible = false;
        group.add(d);
        state.debris.push(makeDebris(d, new THREE.Vector3((Math.random() - 0.5) * 3.2, 1.1 + Math.random() * 2.0, (Math.random() - 0.5) * 3.2), metal ? 1.6 : 1.7));
      }
      setupSmoke(group, state, [
        { x: -0.35, z: 0, from: 2.2, count: 38, dark: 0.09 }, { x: 0.35, z: 0.1, from: 2.5, count: 38, dark: 0.09 }, { x: 0, z: -0.1, from: 2.8, count: 34, dark: 0.07 }
      ]);
      break;
    }

    /* 4 — BLASTING MISFIRE: point-source starburst, radial rock cone, dust ring */
    case "blasting_misfire": {
      state.loop = 4.0;
      // blast face wall with drill holes
      const face = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.18), new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.97 }));
      face.position.set(0, 0.17, -0.5); group.add(face);
      for (let i = 0; i < 4; i++) {
        const bh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        bh.rotation.x = Math.PI / 2;
        bh.position.set(-0.55 + i * 0.37, 0.2, -0.4);
        group.add(bh);
      }
      // intense white-orange point flash — sudden detonation from nothing
      setupFireball(group, state, {
        color: 0xfff0c0, puffColor: new THREE.Color(1.0, 0.85, 0.45), count: 80, speed: 1.5, radius: 0.45,
        ignitionAt: 0.4,
        tex: radialTex([[0, "rgba(255,255,240,1)"], [0.25, "rgba(255,220,140,0.95)"], [0.55, "rgba(255,130,20,0.6)"], [1, "rgba(0,0,0,0)"]], 256, "fb_blast")
      });
      state.fireballCore!.position.set(0, 0.2, -0.35);
      // starburst spikes — quick scale-out lines
      for (let i = 0; i < 7; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.3, 6), new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        spike.position.set(0, 0.2, -0.35);
        spike.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        group.add(spike);
        state.tickers.push((t) => {
          const p = (t - 0.15 - i * 0.04 + state.loop) % state.loop;
          const q = Math.min(1, p / 0.35);
          (spike.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - q) * 0.95;
          spike.scale.setScalar(0.3 + q * 1.3);
          spike.lookAt(0, 0.2, -0.35);
          spike.rotateX(Math.PI / 2);
          spike.translateY(0.15 + q * 0.1);
        });
      }
      // radial rock cone toward camera
      for (let i = 0; i < 18; i++) {
        const d = rockDebris(0, 0.2, -0.35, 0.025 + Math.random() * 0.04, [0x4a3520, 0x1a1a1a, 0x3a3020][i % 3]);
        group.add(d);
        const az = (i / 18) * Math.PI * 2;
        state.debris.push(makeDebris(d, new THREE.Vector3(Math.cos(az) * 1.9, 0.9 + Math.random() * 1.5, Math.sin(az) * 1.9 + 0.5), 0.45));
      }
      const r1 = ringMesh(0xffd090, BASE_Y + 0.02); group.add(r1);
      state.rings.push({ mesh: r1, from: 0.4, to: 1.35, maxScale: 3.0, y: BASE_Y + 0.02 });
      // rock dust lingering
      const rdust = makePuffs({
        count: 44, areaX: 0.6, areaZ: 0.5, baseY: BASE_Y + 0.1, rise: 0.6, life: 3.0,
        sizeMin: 0.35, sizeGrow: 2.4, color: new THREE.Color(0.32, 0.28, 0.22), tex: smokeTexture(),
        opacity: 0.42, sway: 0.1, fadeIn: 0.25
      });
      rdust.points.visible = false;
      group.add(rdust.points);
      state.tickers.push((t) => {
        const lt = t - 0.7;
        rdust.points.visible = lt > 0;
        if (rdust.points.visible) rdust.tick(lt);
      });
      state.disposers.push(rdust.dispose);
      break;
    }

    /* 5 — SULPHIDE DUST: duller red-orange rolling wave, yellow-brown SO2 haze */
    case "sulphide_dust_explosion": {
      state.loop = 4.6;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0x1c1508, roughness: 0.96 }));
      floor.position.y = BASE_Y; group.add(floor);
      setupFireball(group, state, {
        color: 0xff7030, puffColor: new THREE.Color(0.9, 0.35, 0.1), count: 100, speed: 0.85, radius: 0.6,
        ignitionAt: 0.65
      });
      // grainy speckled wall — slower
      const wall = makePuffs({
        count: 80, areaX: 0.8, areaZ: 0.16, baseY: BASE_Y + 0.14, rise: 0.55, life: 1.9,
        sizeMin: 0.3, sizeGrow: 1.7, color: new THREE.Color(0.95, 0.4, 0.1), tex: radialTex([[0, "rgba(255,200,110,1)"], [0.4, "rgba(230,80,10,0.85)"], [1, "rgba(140,20,0,0)"]], 128, "sulphwall"),
        opacity: 0.65, blending: THREE.AdditiveBlending, sway: 0.07, fadeIn: 0.18, riseEase: 1.35
      });
      wall.points.visible = false;
      group.add(wall.points);
      state.tickers.push((t) => {
        const lt = t - 0.3;
        wall.points.visible = lt > 0 && lt < 2.4;
        if (wall.points.visible) {
          wall.tick(lt);
          wall.points.position.z = -0.4 + lt * 0.22;
        }
      });
      state.disposers.push(wall.dispose);
      const r1 = ringMesh(0xffa060, BASE_Y + 0.02); group.add(r1);
      state.rings.push({ mesh: r1, from: 0.65, to: 1.75, maxScale: 2.6, y: BASE_Y + 0.02 });
      // yellow-brown SO2 haze spreading wide
      const so2 = makePuffs({
        count: 60, areaX: 0.85, areaZ: 0.55, baseY: BASE_Y + 0.1, rise: 0.9, life: 3.4,
        sizeMin: 0.4, sizeGrow: 2.8, color: new THREE.Color(0.5, 0.42, 0.16), tex: smokeTexture(),
        opacity: 0.45, sway: 0.14, fadeIn: 0.25
      });
      so2.points.visible = false;
      group.add(so2.points);
      state.tickers.push((t) => {
        const lt = t - 1.1;
        so2.points.visible = lt > 0;
        if (so2.points.visible) so2.tick(lt);
      });
      state.disposers.push(so2.dispose);
      for (let i = 0; i < 10; i++) {
        const d = rockDebris(0, BASE_Y + 0.35, 0, 0.02 + Math.random() * 0.03, 0x3a3020);
        group.add(d);
        state.debris.push(makeDebris(d, new THREE.Vector3((Math.random() - 0.5) * 2.0, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 2.0), 0.7));
      }
      break;
    }

    /* 6 — GAS OUTBURST: ejecting coal chunks first, dust cloud, delayed blue-orange ignition */
    case "gas_outburst_explosion":
    default: {
      state.loop = 5.0;
      const face = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 0.2), new THREE.MeshStandardMaterial({ color: 0x241d16, roughness: 0.95 }));
      face.position.set(0, 0.12, -0.55); group.add(face);
      // stage 1: violent coal ejection from face
      for (let i = 0; i < 20; i++) {
        const d = rockDebris((Math.random() - 0.5) * 0.3, 0.15, -0.5, 0.03 + Math.random() * 0.05, 0x1a1612);
        group.add(d);
        state.debris.push(makeDebris(d, new THREE.Vector3((Math.random() - 0.5) * 2.6, 1.0 + Math.random() * 1.6, (Math.random() - 0.5) * 1.2 + 1.4), 0.15));
      }
      // dust cloud bursting first
      const dust = makePuffs({
        count: 70, areaX: 0.55, areaZ: 0.3, baseY: BASE_Y + 0.12, rise: 0.9, life: 2.6,
        sizeMin: 0.38, sizeGrow: 2.6, color: new THREE.Color(0.38, 0.33, 0.27), tex: smokeTexture(),
        opacity: 0.55, sway: 0.12, fadeIn: 0.2
      });
      dust.points.visible = false;
      group.add(dust.points);
      state.tickers.push((t) => {
        const lt = t - 0.1;
        dust.points.visible = lt > 0;
        if (dust.points.visible) dust.tick(lt);
      });
      state.disposers.push(dust.dispose);
      // stage 2: delayed blue-orange ignition tearing through the dust cloud
      setupFireball(group, state, {
        color: 0x9fd0ff, puffColor: new THREE.Color(1.0, 0.5, 0.12), count: 110, speed: 1.25, radius: 0.62,
        ignitionAt: 1.8,
        tex: radialTex([[0, "rgba(220,240,255,1)"], [0.28, "rgba(255,180,90,0.9)"], [0.6, "rgba(255,70,10,0.5)"], [1, "rgba(0,0,0,0)"]], 256, "fb_outb")
      });
      state.fireballPuffs!.points.visible = false;
      const origTick = state.fireballPuffs!.tick;
      state.tickers.push((t) => {
        const lt = t - 1.8;
        state.fireballPuffs!.points.visible = lt > 0 && lt < 1.8;
        if (state.fireballPuffs!.points.visible) origTick(lt * 1.35);
      });
      const r1 = ringMesh(0xa0c8ff, BASE_Y + 0.02); group.add(r1);
      state.rings.push({ mesh: r1, from: 1.7, to: 2.6, maxScale: 2.8, y: BASE_Y + 0.02 });
      setupSmoke(group, state, [
        { x: -0.3, z: 0.1, from: 2.8, count: 34, dark: 0.1 }, { x: 0.3, z: 0, from: 3.1, count: 34, dark: 0.1 }
      ]);
      break;
    }
  }

  EAM.set(group.name, state);
  return group;
}

/* ---------------- per-frame update ---------------- */

export function updateExplosionAnimations(group: THREE.Group, _type: string, elapsed: number, delta: number): void {
  const s = EAM.get(group.name);
  if (!s) return;
  const t = elapsed % s.loop;

  // custom tickers (walls, dust, haze, spikes)
  for (const fn of s.tickers) fn(t, delta);

  /* eruption-from-nothing driver:
     - before `ignitionAt` the fireball group is invisible (empty air)
     - a tiny white-hot ignition flash pops first
     - the fireball then surges from zero to full size with a fast ease-out */
  const ig = s.ignitionAt ?? 0.55;
  if (s.fireballGroup) {
    if (t < ig) {
      s.fireballGroup.visible = false;
      s.fireballGroup.scale.setScalar(0.001);
    } else {
      const grow = Math.min(1, (t - ig) / 0.7);
      // ease-out-back for a violent, snappy eruption
      const e = 1 + 2.2 * Math.pow(grow - 1, 3) + 1.2 * Math.pow(grow - 1, 2);
      s.fireballGroup.visible = true;
      s.fireballGroup.scale.setScalar(Math.max(0.02, e));
    }
  }

  // ignition flash sprite (small bright pop right at the ignition moment)
  if (s.fireballCore) {
    const flashStart = ig - 0.12;
    const p = Math.max(0, Math.min(1, (t - flashStart) / 0.35));
    const sc = 0.12 + p * 0.5;
    (s.fireballCore.material as THREE.SpriteMaterial).opacity = t < flashStart ? 0 : Math.max(0, 1 - p) * 0.95;
    s.fireballCore.scale.setScalar(sc);
    s.fireballCore.visible = t >= flashStart && p < 1;
  }
  if (s.flashLight) flickerLight(s.flashLight, t < ig ? 0 : 6, elapsed, 30);

  // fireball puffs default driver (unless type overrode via ticker w/ visibility control)
  if (s.fireballPuffs && s.fireballPuffs.points.visible) {
    // only advance puff time after ignition so the smoke is born with the blast
    s.fireballPuffs.tick(Math.max(0, t - ig));
  }

  // shockwave rings
  for (const r of s.rings) {
    const lt = (t - r.from + s.loop) % s.loop;
    const dur = r.to - r.from;
    if (lt <= dur) {
      const p = lt / dur;
      const sc = 0.05 + p * r.maxScale;
      r.mesh.scale.set(sc, sc, 1);
      r.mesh.position.y = r.y;
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 * (1 - p));
      r.mesh.visible = true;
    } else {
      r.mesh.visible = false;
    }
  }

  // debris physics: gravity, ground bounce, spin
  for (const d of s.debris) {
    const lt = t - d.launchAt;
    if (lt > 0 && lt < s.loop - d.launchAt) {
      d.mesh.visible = true;
      const x = d.vel.x * lt;
      const z = d.vel.z * lt;
      let y = d.homeY + d.vel.y * lt - 0.5 * 4.5 * lt * lt;
      // single bounce
      if (y < d.homeY + d.size) {
        y = d.homeY + d.size;
      }
      d.mesh.position.set(x, y, z);
      d.mesh.rotation.x += d.spin.x * delta;
      d.mesh.rotation.y += d.spin.y * delta;
      d.mesh.rotation.z += d.spin.z * delta;
    } else if (lt >= s.loop - d.launchAt) {
      d.mesh.visible = false;
      d.mesh.position.set(0, -1000, 0);
    }
  }

  // smoke columns fade in at their start time
  for (const c of s.smokeCols) {
    const lt = t - c.from;
    c.sys.points.visible = lt > 0;
    if (lt > 0) {
      c.sys.points.position.x = c.x;
      c.sys.points.position.z = c.z;
      c.sys.tick(lt);
    }
  }
}

export function disposeExplosionModel(group: THREE.Group): void {
  const s = EAM.get(group.name);
  if (s) {
    s.disposers.forEach(d => d());
    EAM.delete(group.name);
  }
  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      const mats = Array.isArray((o as THREE.Mesh).material) ? (o as THREE.Mesh).material as THREE.Material[] : [(o as THREE.Mesh).material as THREE.Material];
      mats.forEach((m: THREE.Material) => { if ((m as THREE.SpriteMaterial).map) (m as THREE.SpriteMaterial).map?.dispose(); m.dispose(); });
    }
  });
}

// keep shimmer import referenced for future use
void makeHeatShimmer;
