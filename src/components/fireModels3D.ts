import * as THREE from "three";
import { FireHazardModel } from "../types";
import {
  makePuffs, makeFlameCross, makeHeatShimmer, makeGroundShadow,
  smokeTexture, radialTex, flickerLight, PuffSystem
} from "./fxShared";

/* ============================================================
   7 fire simulations. Each is a layered composition of:
   - multi-layer shader flame crosses (GPU fbm tongues)
   - GPU puff smoke that rises, sways, grows and loops
   - GPU ember sparks with gravity for some types
   - heat shimmer quads for clean-burning fires
   - flickering point light tied to flame brightness
   All anchored with base at y = -0.375 (on the AR reticle floor).
   ============================================================ */

const BASE_Y = 0;

interface FireState {
  tickers: Array<(time: number, delta: number) => void>;
  lights: THREE.PointLight[];
  lightBase: number[];
  disposers: Array<() => void>;
  smokeSystems: PuffSystem[];
}

const FAM = new Map<string, FireState>();

/* small helpers -------------------------------------------- */

function rock(x: number, y: number, z: number, s: number, color = 0x18191f, rough = 0.88): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(s, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
    const d = 1 + Math.sin(vx * 9 + vy * 7) * 0.15;
    p.setXYZ(i, vx * d, vy * (d * 0.7), vz * d);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.18, flatShading: true }));
  m.position.set(x, y, z);
  m.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
  return m;
}

interface EmberSystem { points: THREE.Points; dispose: () => void; tick: (t: number) => void; }

/** CPU-updated ember sparks: rise, wiggle, fade — small count so cheap. */
function makeEmbers(count: number, spread: number, height: number, color: number, baseY: number, size = 0.02): EmberSystem {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seeds: Array<{ a: number; r: number; speed: number; ph: number }> = [];
  const speed0 = 0.3;
  for (let i = 0; i < count; i++) {
    seeds.push({
      a: Math.random() * Math.PI * 2,
      r: Math.random() * spread,
      speed: speed0 + Math.random() * 0.5,
      ph: Math.random() * Math.PI * 2
    });
    pos[i * 3 + 1] = -1000;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size, transparent: true, opacity: 0.95, depthWrite: false,
    blending: THREE.AdditiveBlending, map: radialTex([[0, "rgba(255,255,230,1)"], [0.4, "rgba(255,170,60,0.7)"], [1, "rgba(255,80,20,0)"]], 32, "ember")
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const attr = geo.getAttribute("position") as THREE.BufferAttribute;
  const tick = (time: number) => {
    const period = height / speed0 + 0.8;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const cycle = (time * s.speed + s.ph) % period;
      const y = baseY + cycle * s.speed;
      const x = Math.cos(s.a) * s.r + Math.sin(time * 3 + s.ph) * 0.04 * cycle * 2.5;
      const z = Math.sin(s.a) * s.r + Math.cos(time * 2.4 + s.ph) * 0.04 * cycle * 2.5;
      attr.setXYZ(i, x, y, z);
    }
    attr.needsUpdate = true;
  };
  return { points, tick, dispose: () => { geo.dispose(); mat.dispose(); } };
}

/* ---------------- main builder ---------------- */

export function create3DFireModel(type: FireHazardModel["modelType"]): THREE.Group {
  const group = new THREE.Group();
  group.name = "fire_model_" + type;

  const state: FireState = { tickers: [], lights: [], lightBase: [], disposers: [], smokeSystems: [] };

  const addTicker = (fn: (t: number, d: number) => void) => state.tickers.push(fn);
  const addLight = (color: number, intensity: number, dist: number, y = 0.1) => {
    const pl = new THREE.PointLight(color, intensity, dist);
    pl.position.set(0, y, 0);
    group.add(pl);
    state.lights.push(pl);
    state.lightBase.push(intensity);
    return pl;
  };

  group.add(makeGroundShadow(2.2, 1.8, BASE_Y));

  switch (type) {

    /* 1 — METHANE / GAS FIRE: slender blue-violet, wispy, heat haze */
    case "methane": {
      // cracked roof slab w/ fissure the flames dance along
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.05, 0.85),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
      );
      slab.position.y = BASE_Y;
      group.add(slab);
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.014, 0.1), new THREE.MeshBasicMaterial({ color: 0x04080f }));
      crack.position.set(0, BASE_Y + 0.026, 0);
      group.add(crack);

      // central blade
      const main = makeFlameCross({
        height: 0.72, width: 0.14, colorInner: "rgba(225,235,255,1)", colorOuter: "rgba(110,130,255,0.85)",
        intensity: 1.0, sway: 0.22, speed: 1.35, blades: 3
      });
      main.group.position.y = BASE_Y + 0.02;
      group.add(main.group);

      // small dancing tongues along the crack
      for (let i = 0; i < 4; i++) {
        const tongue = makeFlameCross({
          height: 0.2 + Math.random() * 0.14, width: 0.05, colorInner: "rgba(200,215,255,1)", colorOuter: "rgba(120,110,255,0.8)",
          intensity: 0.85, sway: 0.3, speed: 1.7, blades: 2
        });
        tongue.group.position.set(-0.3 + i * 0.2 + (Math.random() - 0.5) * 0.1, BASE_Y + 0.02, (Math.random() - 0.5) * 0.12);
        group.add(tongue.group);
        addTicker((t) => tongue.group.children.forEach(c => { c.position.y = Math.sin(t * 2.3 + i) * 0.012; }));
        state.disposers.push(tongue.dispose);
      }
      state.disposers.push(main.dispose);

      // heat haze instead of smoke (clean combustion)
      const shimmer = makeHeatShimmer(0.55, 0.9, BASE_Y + 0.05);
      group.add(shimmer.mesh);
      addTicker((t) => shimmer.tick(t));
      state.disposers.push(shimmer.dispose);

      // faint bluish ambient wisps
      const haze = makePuffs({
        count: 26, areaX: 0.22, areaZ: 0.16, baseY: BASE_Y + 0.7, rise: 0.5, life: 2.4,
        sizeMin: 0.28, sizeGrow: 1.6, color: new THREE.Color(0.75, 0.8, 1.0), tex: smokeTexture(),
        opacity: 0.12, sway: 0.05, fadeIn: 0.4
      });
      group.add(haze.points); state.smokeSystems.push(haze);
      addTicker((t) => haze.tick(t));
      state.disposers.push(haze.dispose);

      addLight(0x818cf8, 3.2, 2.2, 0.1);
      break;
    }

    /* 2 — COAL FIRE: dense orange-yellow, red base, black-grey cauliflower smoke */
    case "coal": {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.06, 0.95),
        new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.95 })
      );
      base.position.y = BASE_Y;
      group.add(base);
      [[-0.45, -0.1], [0, 0.1], [0.42, -0.05], [-0.2, 0.2], [0.25, -0.18]].forEach(([x, z]) =>
        group.add(rock(x, BASE_Y + 0.03, z, 0.07 + Math.random() * 0.04))
      );

      const body = makeFlameCross({
        height: 0.95, width: 0.34, colorInner: "rgba(255,235,140,1)", colorOuter: "rgba(255,90,10,0.9)",
        intensity: 1.0, sway: 0.16, speed: 1.1, blades: 3
      });
      body.group.position.y = BASE_Y + 0.02;
      group.add(body.group);
      state.disposers.push(body.dispose);

      // deep red base streaks
      const redBase = makeFlameCross({
        height: 0.4, width: 0.42, colorInner: "rgba(255,120,30,0.9)", colorOuter: "rgba(180,20,0,0.7)",
        intensity: 0.8, sway: 0.1, speed: 0.9, blades: 2
      });
      redBase.group.position.y = BASE_Y + 0.02;
      group.add(redBase.group);
      state.disposers.push(redBase.dispose);

      // cauliflower smoke
      const smoke = makePuffs({
        count: 70, areaX: 0.3, areaZ: 0.22, baseY: BASE_Y + 0.75, rise: 1.5, life: 3.2,
        sizeMin: 0.34, sizeGrow: 2.2, color: new THREE.Color(0.16, 0.16, 0.18), tex: smokeTexture(),
        opacity: 0.55, sway: 0.1, fadeIn: 0.18, endShrink: 0
      });
      group.add(smoke.points); state.smokeSystems.push(smoke);
      addTicker((t) => smoke.tick(t));
      state.disposers.push(smoke.dispose);

      const embers = makeEmbers(26, 0.24, 1.1, 0xffa040, BASE_Y + 0.1);
      group.add(embers.points);
      addTicker((t) => embers.tick(t));
      state.disposers.push(embers.dispose);

      addLight(0xff6010, 4.2, 2.6, 0.15);
      break;
    }

    /* 3 — SMOLDERING: pulsing glow under crust, lazy wisps, salt film */
    case "smouldering": {
      const ash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.68, 0.05, 20),
        new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: 0.98 })
      );
      ash.position.y = BASE_Y;
      group.add(ash);
      // yellowish-white sulphur/ammonium film patches
      for (let i = 0; i < 5; i++) {
        const film = new THREE.Mesh(
          new THREE.CircleGeometry(0.08 + Math.random() * 0.07, 10),
          new THREE.MeshStandardMaterial({ color: 0xd8d2b0, roughness: 1 })
        );
        film.rotation.x = -Math.PI / 2;
        film.position.set((Math.random() - 0.5) * 0.8, BASE_Y + 0.028, (Math.random() - 0.5) * 0.5);
        group.add(film);
      }
      [[-0.3, 0.1], [0.25, -0.08], [0, 0.3], [-0.35, -0.25]].forEach(([x, z]) =>
        group.add(rock(x, BASE_Y + 0.03, z, 0.065 + Math.random() * 0.03, 0x3a2a20, 0.95))
      );

      // pulsing glow — no open flame: use inverted flame (glow disc) + faint blades
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.3, 24),
        new THREE.MeshBasicMaterial({ color: 0xb33c0a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = BASE_Y + 0.032;
      group.add(glow);
      addTicker((t) => {
        const pulse = 0.4 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.6) + 0.3 * Math.sin(t * 3.7 + 1.2));
        (glow.material as THREE.MeshBasicMaterial).opacity = pulse * 0.55;
        glow.scale.setScalar(0.9 + 0.18 * Math.sin(t * 1.6));
      });

      // faint ember-red flicker blades breaking through cracks
      const faint = makeFlameCross({
        height: 0.16, width: 0.07, colorInner: "rgba(255,150,40,0.75)", colorOuter: "rgba(160,40,0,0.5)",
        intensity: 0.55, sway: 0.18, speed: 0.8, blades: 2
      });
      faint.group.position.set(0.05, BASE_Y + 0.02, -0.05);
      group.add(faint.group);
      state.disposers.push(faint.dispose);

      // lazy white-grey mist
      const mist = makePuffs({
        count: 34, areaX: 0.3, areaZ: 0.24, baseY: BASE_Y + 0.06, rise: 0.85, life: 4.2,
        sizeMin: 0.26, sizeGrow: 2.6, color: new THREE.Color(0.82, 0.82, 0.8), tex: smokeTexture(),
        opacity: 0.28, sway: 0.09, fadeIn: 0.3
      });
      group.add(mist.points); state.smokeSystems.push(mist);
      addTicker((t) => mist.tick(t));
      state.disposers.push(mist.dispose);

      const embers = makeEmbers(14, 0.18, 0.5, 0xff7a20, BASE_Y + 0.05, 0.014);
      group.add(embers.points);
      addTicker((t) => embers.tick(t));
      state.disposers.push(embers.dispose);

      addLight(0xc03000, 1.6, 1.8, 0.05);
      break;
    }

    /* 4 — GOB/GOAF: buried red flicker, breathing oily black smoke from cracks */
    case "gob": {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.07, 1.05),
        new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.97 })
      );
      base.position.y = BASE_Y;
      group.add(base);
      for (let i = 0; i < 8; i++)
        group.add(rock((Math.random() - 0.5) * 0.95, BASE_Y + 0.02 + Math.random() * 0.05, (Math.random() - 0.5) * 0.6, 0.04 + Math.random() * 0.06));

      // buried deep-red flicker, mostly hidden
      const buried = makeFlameCross({
        height: 0.22, width: 0.1, colorInner: "rgba(255,70,10,0.8)", colorOuter: "rgba(120,10,0,0.55)",
        intensity: 0.6, sway: 0.25, speed: 1.3, blades: 2
      });
      buried.group.position.set(0.1, BASE_Y + 0.03, 0.05);
      group.add(buried.group);
      state.disposers.push(buried.dispose);
      addTicker((t) => {
        buried.group.visible = Math.sin(t * 2.2) > -0.35;
      });

      // "breathing" heavy smoke: two surge layers out of phase
      const surge = (phase: number) => makePuffs({
        count: 42, areaX: 0.42, areaZ: 0.3, baseY: BASE_Y + 0.06, rise: 1.35, life: 3.6,
        sizeMin: 0.4, sizeGrow: 2.4, color: new THREE.Color(0.1, 0.1, 0.12), tex: smokeTexture(),
        opacity: 0.62, sway: 0.13, fadeIn: 0.22, riseEase: 1.6, fadeSharp: 1.2
      });
      const s1 = surge(0), s2 = surge(1);
      // offset phase of second layer via per-tick time offset
      addTicker((t) => { s1.tick(t); s2.tick(t + 1.8); });
      group.add(s1.points); group.add(s2.points);
      state.smokeSystems.push(s1, s2);
      state.disposers.push(s1.dispose, s2.dispose);

      // yellowish tinge near source
      const tinge = makePuffs({
        count: 16, areaX: 0.3, areaZ: 0.24, baseY: BASE_Y + 0.05, rise: 0.5, life: 2.6,
        sizeMin: 0.22, sizeGrow: 1.8, color: new THREE.Color(0.55, 0.5, 0.28), tex: smokeTexture(),
        opacity: 0.3, sway: 0.06, fadeIn: 0.35
      });
      group.add(tinge.points); state.smokeSystems.push(tinge);
      addTicker((t) => tinge.tick(t));
      state.disposers.push(tinge.dispose);

      const embers = makeEmbers(20, 0.3, 0.9, 0xff5010, BASE_Y + 0.08, 0.016);
      group.add(embers.points);
      addTicker((t) => embers.tick(t));
      state.disposers.push(embers.dispose);

      addLight(0xff4008, 2.6, 2.4, 0.05);
      break;
    }

    /* 5 — OIL/GREASE/CONVEYOR: tall greasy flame, rope-like black columns, falling drips */
    case "oil": {
      const pool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.012, 24),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.08, metalness: 0.85 })
      );
      pool.position.y = BASE_Y + 0.006;
      group.add(pool);
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.17, 0.38, 18),
        new THREE.MeshStandardMaterial({ color: 0x16324a, roughness: 0.38, metalness: 0.72 })
      );
      drum.position.y = BASE_Y + 0.2;
      group.add(drum);
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.168, 0.168, 0.024, 18),
        new THREE.MeshStandardMaterial({ color: 0x2c455c, metalness: 0.8, roughness: 0.3 })
      );
      ring.position.y = BASE_Y + 0.3;
      group.add(ring);

      // tall wavy greasy flame
      const main = makeFlameCross({
        height: 1.15, width: 0.24, colorInner: "rgba(255,250,190,1)", colorOuter: "rgba(255,130,0,0.9)",
        intensity: 1.0, sway: 0.2, speed: 1.0, blades: 3
      });
      main.group.position.y = BASE_Y + 0.02;
      group.add(main.group);
      state.disposers.push(main.dispose);

      // glossy undulating sheen blade (slower, wide)
      const sheen = makeFlameCross({
        height: 1.0, width: 0.3, colorInner: "rgba(255,200,80,0.8)", colorOuter: "rgba(220,70,0,0.55)",
        intensity: 0.55, sway: 0.26, speed: 0.7, blades: 2
      });
      sheen.group.position.y = BASE_Y + 0.02;
      group.add(sheen.group);
      state.disposers.push(sheen.dispose);

      // very dark rope-like columns — narrow, opaque, fast rise
      const dark = makePuffs({
        count: 64, areaX: 0.14, areaZ: 0.12, baseY: BASE_Y + 0.95, rise: 1.7, life: 2.6,
        sizeMin: 0.3, sizeGrow: 1.6, color: new THREE.Color(0.06, 0.06, 0.07), tex: smokeTexture(),
        opacity: 0.72, sway: 0.05, fadeIn: 0.15
      });
      group.add(dark.points); state.smokeSystems.push(dark);
      addTicker((t) => dark.tick(t));
      state.disposers.push(dark.dispose);

      // falling melting-rubber drips (bright sparks going DOWN)
      const dripGeo = new THREE.BufferGeometry();
      const dn = 10;
      const dpos = new Float32Array(dn * 3);
      const dseeds = Array.from({ length: dn }, () => ({ x: (Math.random() - 0.5) * 0.16, z: (Math.random() - 0.5) * 0.16, ph: Math.random() * 4, spd: 0.8 + Math.random() * 0.5 }));
      dripGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
      const dripMat = new THREE.PointsMaterial({
        color: 0xff8830, size: 0.025, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        map: radialTex([[0, "rgba(255,220,120,1)"], [0.5, "rgba(255,110,20,0.6)"], [1, "rgba(255,50,0,0)"]], 32, "drip")
      });
      const drips = new THREE.Points(dripGeo, dripMat);
      drips.frustumCulled = false;
      group.add(drips);
      const dAttr = dripGeo.getAttribute("position") as THREE.BufferAttribute;
      addTicker((t) => {
        for (let i = 0; i < dn; i++) {
          const s = dseeds[i];
          const cyc = (t * s.spd + s.ph) % 1.6;
          dAttr.setXYZ(i, s.x + Math.sin(t * 2 + s.ph) * 0.01, BASE_Y + 0.85 - cyc * 0.55, s.z);
        }
        dAttr.needsUpdate = true;
      });
      state.disposers.push(() => { dripGeo.dispose(); dripMat.dispose(); });

      addLight(0xffaa20, 4.6, 3.0, 0.25);
      break;
    }

    /* 6 — SULPHIDE ORE: low creeping blue-grey flame hugging the pile */
    case "sulphide": {
      const ore = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.3, 1),
        new THREE.MeshStandardMaterial({ color: 0x4a3800, roughness: 0.72, metalness: 0.42 })
      );
      ore.position.y = BASE_Y + 0.12;
      ore.scale.y = 0.6;
      group.add(ore);
      for (let i = 0; i < 6; i++) {
        const cg = new THREE.ConeGeometry(0.02 + Math.random() * 0.015, 0.07 + Math.random() * 0.06, 6);
        const cone = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: 0xd4a800, roughness: 0.5, metalness: 0.3 }));
        cone.position.set((Math.random() - 0.5) * 0.45, BASE_Y + 0.03, (Math.random() - 0.5) * 0.3);
        cone.rotation.z = (Math.random() - 0.5) * 0.8;
        group.add(cone);
      }

      // creeping low blades hugging the surface (tilted outward)
      for (let i = 0; i < 5; i++) {
        const creep = makeFlameCross({
          height: 0.14 + Math.random() * 0.1, width: 0.12, colorInner: "rgba(200,235,255,0.9)", colorOuter: "rgba(110,150,190,0.75)",
          intensity: 0.8, sway: 0.3, speed: 1.1, blades: 2
        });
        creep.group.position.set((Math.random() - 0.5) * 0.4, BASE_Y + 0.02, (Math.random() - 0.5) * 0.26);
        creep.group.rotation.z = (Math.random() - 0.5) * 1.1;  // lean over the pile
        creep.group.rotation.x = (Math.random() - 0.5) * 0.7;
        group.add(creep.group);
        state.disposers.push(creep.dispose);
      }

      // shimmer along the creeping edge
      const shimmer = makeHeatShimmer(0.6, 0.35, BASE_Y + 0.02);
      group.add(shimmer.mesh);
      addTicker((t) => shimmer.tick(t));
      state.disposers.push(shimmer.dispose);

      // thin bluish-white straight wisps
      const wisps = makePuffs({
        count: 30, areaX: 0.26, areaZ: 0.2, baseY: BASE_Y + 0.12, rise: 0.8, life: 3.8,
        sizeMin: 0.2, sizeGrow: 2.0, color: new THREE.Color(0.78, 0.86, 0.95), tex: smokeTexture(),
        opacity: 0.3, sway: 0.03, fadeIn: 0.3
      });
      group.add(wisps.points); state.smokeSystems.push(wisps);
      addTicker((t) => wisps.tick(t));
      state.disposers.push(wisps.dispose);

      addLight(0x7fa8d0, 2.2, 2.0, 0.05);
      break;
    }

    /* 7 — METAL / ELECTRICAL ARC: blinding white core, sparks, scorched panel */
    case "metal_arc":
    default: {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.7, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.7 })
      );
      panel.position.set(0, BASE_Y + 0.32, -0.2);
      group.add(panel);
      // scorch marks
      for (let i = 0; i < 4; i++) {
        const sc = new THREE.Mesh(
          new THREE.CircleGeometry(0.04 + Math.random() * 0.05, 10),
          new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.85 })
        );
        sc.position.set((Math.random() - 0.5) * 0.4, BASE_Y + 0.15 + Math.random() * 0.3, -0.155);
        group.add(sc);
      }
      // heated-metal glow near arc point
      const heatGlow = new THREE.Mesh(
        new THREE.CircleGeometry(0.09, 16),
        new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      heatGlow.position.set(0, BASE_Y + 0.18, -0.15);
      group.add(heatGlow);
      addTicker((t) => { (heatGlow.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 9)); });

      for (let i = 0; i < 3; i++) {
        const cond = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
        );
        cond.position.set(-0.15 + i * 0.15, BASE_Y + 0.02, -0.16);
        cond.rotation.z = (Math.random() - 0.5) * 0.3;
        group.add(cond);
      }

      // sharp concentrated arc — narrow fast blade
      const arc = makeFlameCross({
        height: 0.3, width: 0.05, colorInner: "rgba(255,255,255,1)", colorOuter: "rgba(160,200,255,0.9)",
        intensity: 1.25, sway: 0.35, speed: 2.6, blades: 3
      });
      arc.group.position.set(0, BASE_Y + 0.02, -0.14);
      group.add(arc.group);
      state.disposers.push(arc.dispose);

      // firework-like spark bursts — periodic radial bursts
      const bn = 40;
      const bGeo = new THREE.BufferGeometry();
      const bpos = new Float32Array(bn * 3);
      const bseeds = Array.from({ length: bn }, (_, i) => ({
        dir: new THREE.Vector3((Math.random() - 0.5), Math.random() * 0.8 + 0.2, (Math.random() - 0.5)).normalize(),
        ph: (i / bn) * 1.4
      }));
      bGeo.setAttribute("position", new THREE.BufferAttribute(bpos, 3));
      const bMat = new THREE.PointsMaterial({
        color: 0xfff2c0, size: 0.02, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        map: radialTex([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,220,140,0.8)"], [1, "rgba(255,160,40,0)"]], 32, "arcspark")
      });
      const bursts = new THREE.Points(bGeo, bMat);
      bursts.frustumCulled = false;
      group.add(bursts);
      const bAttr = bGeo.getAttribute("position") as THREE.BufferAttribute;
      addTicker((t) => {
        const period = 1.4;
        for (let i = 0; i < bn; i++) {
          const s = bseeds[i];
          const cyc = (t + s.ph) % period;
          const d = cyc * 0.9;
          const g = 0.5 * 2.2 * cyc * cyc;
          bAttr.setXYZ(i, s.dir.x * d, BASE_Y + 0.2 + s.dir.y * d - g, -0.14 + s.dir.z * d);
        }
        bAttr.needsUpdate = true;
      });
      state.disposers.push(() => { bGeo.dispose(); bMat.dispose(); });

      // faint grey wisp above arc
      const wisp = makePuffs({
        count: 18, areaX: 0.1, areaZ: 0.1, baseY: BASE_Y + 0.5, rise: 0.6, life: 2.2,
        sizeMin: 0.2, sizeGrow: 1.8, color: new THREE.Color(0.55, 0.55, 0.58), tex: smokeTexture(),
        opacity: 0.2, sway: 0.04, fadeIn: 0.3
      });
      group.add(wisp.points); state.smokeSystems.push(wisp);
      addTicker((t) => wisp.tick(t));
      state.disposers.push(wisp.dispose);

      addLight(0xffffff, 5.5, 2.6, 0.2);
      break;
    }
  }

  FAM.set(group.name, state);
  return group;
}

export function updateFireAnimations(group: THREE.Group, delta: number, elapsed: number): void {
  const s = FAM.get(group.name);
  if (!s) return;
  for (const t of s.tickers) t(elapsed, delta);
  s.lights.forEach((pl, i) => flickerLight(pl, s.lightBase[i], elapsed, 11 + i * 3));
}

export function disposeFireModel(group: THREE.Group): void {
  const s = FAM.get(group.name);
  if (s) {
    s.disposers.forEach(d => d());
    s.smokeSystems.length = 0;
    FAM.delete(group.name);
  }
  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) {
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      const mats = Array.isArray((o as THREE.Mesh).material) ? (o as THREE.Mesh).material as THREE.Material[] : [(o as THREE.Mesh).material as THREE.Material];
      mats.forEach((m: THREE.Material) => { if ((m as THREE.MeshStandardMaterial).map) (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); });
    }
  });
}
