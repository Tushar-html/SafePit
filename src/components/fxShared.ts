import * as THREE from "three";

/* ============================================================
   Shared FX library for SafePit AR modules.
   All particle systems are GPU-driven: position/opacity/size
   live in shader attributes, a single uniform tick animates
   them. Cost stays constant regardless of particle count.
   ============================================================ */

/* ---------------- Canvas textures ---------------- */

const TEX_CACHE = new Map<string, THREE.Texture>();

export function radialTex(stops: [number, string][], size = 128, key?: string): THREE.Texture {
  const k = key ?? JSON.stringify([stops, size]);
  const hit = TEX_CACHE.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const h = size / 2;
  const g = ctx.createRadialGradient(h, h, 1, h, h, h - 1);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  TEX_CACHE.set(k, t);
  return t;
}

export function smokeTexture(): THREE.Texture {
  if (TEX_CACHE.has("smoke")) return TEX_CACHE.get("smoke")!;
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 8, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.5, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // breakup blotches so billows look cauliflower-like
  for (let i = 0; i < 26; i++) {
    const r = 12 + Math.random() * 30;
    const x = s / 2 + (Math.random() - 0.5) * s * 0.7;
    const y = s / 2 + (Math.random() - 0.5) * s * 0.7;
    const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, "rgba(255,255,255,0.28)");
    gg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  TEX_CACHE.set("smoke", t);
  return t;
}

export function shadowTexture(): THREE.Texture {
  return radialTex(
    [[0, "rgba(4,10,18,0.65)"], [0.55, "rgba(8,18,32,0.25)"], [1, "rgba(0,0,0,0)"]],
    256,
    "shadow"
  );
}

export function disposeSharedTextures(): void {
  TEX_CACHE.forEach(t => t.dispose());
  TEX_CACHE.clear();
}

/* ---------------- Ground shadow blob ---------------- */

export function makeGroundShadow(w: number, d: number, y = 0, opacity = 0.75): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.renderOrder = -1;
  return m;
}

/* ---------------- GPU puff particle system ----------------
   Each puff: rises from its spawn point, drifts on noise-ish
   sinusoids seeded per-particle, grows, fades, loops forever.
   Fully GPU: CPU only advances one uniform per frame.
------------------------------------------------------------ */

export interface PuffSystem {
  points: THREE.Points;
  tick: (time: number) => void;
  dispose: () => void;
}

interface PuffOpts {
  count: number;
  areaX: number;      // horizontal spread (radius)
  areaZ: number;
  baseY: number;      // spawn height
  rise: number;       // total rise height
  life: number;       // seconds of one loop
  sizeMin: number;    // point size in world-ish units (x100 internal)
  sizeGrow: number;   // how much puff grows over life
  color: THREE.Color;
  tex: THREE.Texture;
  opacity?: number;
  blending?: THREE.Blending;
  sway?: number;      // lateral wobble amplitude
  fadeSharp?: number; // >1 = pops out faster at end
  fadeIn?: number;    // fraction of life spent fading in
  endShrink?: number; // shrink toward end (0 = none)
  riseEase?: number;  // 1 = linear, 2 = accelerating
}

export function makePuffs(o: PuffOpts): PuffSystem {
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uSway: { value: o.sway ?? 0.05 },
    uFadeSharp: { value: o.fadeSharp ?? 1 },
    uOpacity: { value: o.opacity ?? 1 },
    uSizeGrow: { value: o.sizeGrow },
    uRise: { value: o.rise },
    uLife: { value: o.life },
    uFadeIn: { value: o.fadeIn ?? 0.15 },
    uEndShrink: { value: o.endShrink ?? 0 },
    uRiseEase: { value: o.riseEase ?? 2 },
    uMap: { value: o.tex },
    uColor: { value: o.color },
    uViewportScale: { value: 800 }
  };

  const count = o.count;
  const pos = new Float32Array(count * 3);
  const spawn = new Float32Array(count * 4); // xyz + rand
  const sizeAttr = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()); // denser at center
    spawn[i * 4] = Math.cos(a) * r * o.areaX;
    spawn[i * 4 + 1] = o.baseY + Math.random() * 0.06;
    spawn[i * 4 + 2] = Math.sin(a) * r * o.areaZ;
    spawn[i * 4 + 3] = Math.random();
    sizeAttr[i] = o.sizeMin + Math.random() * o.sizeMin * 0.9;
    pos[i * 3 + 1] = -1000; // hidden until first tick
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSpawn", new THREE.BufferAttribute(spawn, 4));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizeAttr, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: o.blending ?? THREE.NormalBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aSpawn;
      attribute float aSize;
      uniform float uTime, uSway, uSizeGrow, uRise, uLife, uFadeIn, uEndShrink, uRiseEase, uFadeSharp, uViewportScale;
      varying float vRand;
      varying float vFade;
      void main() {
        float rnd = fract(aSpawn.w * 7.31);
        float life = uLife * (0.8 + rnd * 0.4);
        float t = mod(uTime * (0.9 + rnd * 0.25) + rnd * life * 7.13, life) / life;
        vec3 p = aSpawn.xyz;
        float tS = pow(t, uRiseEase);
        p.y += uRise * tS * (0.85 + rnd * 0.3);
        p.x += sin(t * 6.2831 * (1.0 + rnd) + rnd * 12.0) * uSway * t;
        p.z += cos(t * 5.1 * (0.7 + rnd) + rnd * 7.0) * uSway * 0.7 * t;
        float grow = 1.0 + uSizeGrow * t;
        float shrink = 1.0 - uEndShrink * smoothstep(0.55, 1.0, t);
        float fi = smoothstep(0.0, uFadeIn, t);
        float fo = 1.0 - smoothstep(1.0 - 0.35 * uFadeSharp, 1.0, t);
        vFade = fi * fo;
        vRand = rnd;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // world-space size -> pixels: size * viewportHeight / (2*tan(fov/2)) / dist
        gl_PointSize = aSize * grow * shrink * uViewportScale / max(0.0001, -mv.z);
        gl_PointSize = min(gl_PointSize, 256.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vRand;
      varying float vFade;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float c = vRand * 6.2831;
        mat2 rot = mat2(cos(c), -sin(c), sin(c), cos(c));
        vec4 tex = texture2D(uMap, rot * uv + 0.5);
        float a = tex.a * vFade * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor * tex.rgb, a);
        #include <colorspace_fragment>
      }
    `
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 5;

  return {
    points,
    tick(time) { uniforms.uTime.value = time; },
    dispose() {
      geo.dispose();
      mat.dispose();
    }
  };
}

/** Update the viewport-scale uniform of every GPU puff system under `obj`
 *  (call after model creation and on resize). Converts world-space point
 *  sizes to pixels: px = worldSize * scale / dist. */
export function applyViewportScale(obj: THREE.Object3D, camera: THREE.PerspectiveCamera, heightPx: number): void {
  const scale = heightPx / (2 * Math.tan((camera.fov * Math.PI) / 360));
  obj.traverse(o => {
    if ((o as THREE.Points).isPoints) {
      const m = (o as THREE.Points).material as THREE.ShaderMaterial;
      if (m && m.uniforms && m.uniforms.uViewportScale) m.uniforms.uViewportScale.value = scale;
    }
  });
}

/* ---------------- Shader flame (multi-layer procedural) ---------------- */

export interface FlameHandle {
  mesh: THREE.Mesh;
  tick: (time: number) => void;
  dispose: () => void;
}

/**
 * Layered procedural flame: fbm-noise silhouette on a vertical
 * blade, scrolling upward so tongues lick and flicker forever.
 */
export function makeFlame(opts: {
  height: number;
  width: number;
  colorInner: string;
  colorOuter: string;
  intensity?: number;
  sway?: number;
  speed?: number;
}): FlameHandle {
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uInner: { value: new THREE.Color(opts.colorInner) },
    uOuter: { value: new THREE.Color(opts.colorOuter) },
    uIntensity: { value: opts.intensity ?? 1 },
    uSway: { value: opts.sway ?? 0.12 },
    uSpeed: { value: opts.speed ?? 1 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uSway;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.x += sin(p.y * 2.2) * uSway * 0.18;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime, uIntensity, uSway, uSpeed;
      uniform vec3 uInner, uOuter;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.55;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
        return v;
      }
      void main() {
        float t = uTime * uSpeed;
        vec2 uv = vUv;
        float body = uv.y;
        float halfW = (1.0 - body) * (0.62 + 0.38 * (1.0 - body));
        float n = fbm(vec2(uv.x * 3.0, uv.y * 2.5 - t * 1.7));
        float n2 = fbm(vec2(uv.x * 6.5 + 10.0, uv.y * 4.0 - t * 3.0));
        float shape = halfW - abs(uv.x - 0.5) * 2.0;
        shape += (n - 0.5) * 0.6 * (0.35 + body);
        shape += (n2 - 0.5) * 0.32;
        if (shape <= 0.0) discard;
        float core = smoothstep(0.0, 0.25, body) * (1.0 - smoothstep(0.45, 1.0, body));
        float glow = (1.0 - smoothstep(0.2, 1.0, body)) * 0.8;
        float alpha = clamp(shape * 2.4, 0.0, 1.0) * mix(glow, core, 0.55) * uIntensity;
        alpha *= 0.88 + 0.28 * n2;
        vec3 col = mix(uOuter, uInner, clamp(core * 1.4 + glow * 0.4, 0.0, 1.0));
        float heart = smoothstep(0.5, 0.0, abs(uv.x - 0.5)) * smoothstep(0.45, 0.05, body);
        col = mix(col, vec3(1.0), heart * 0.6);
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const geo = new THREE.PlaneGeometry(opts.width * 2, opts.height, 1, 24);
  geo.translate(0, opts.height / 2, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 6;
  return {
    mesh,
    tick(time) { uniforms.uTime.value = time; },
    dispose() { geo.dispose(); mat.dispose(); }
  };
}

/** Cross of 3 flame blades so fire looks volumetric from any angle. */
export function makeFlameCross(opts: Parameters<typeof makeFlame>[0] & { blades?: number }): {
  group: THREE.Group;
  tick: (time: number) => void;
  dispose: () => void;
} {
  const g = new THREE.Group();
  const blades = opts.blades ?? 3;
  const handles: FlameHandle[] = [];
  for (let i = 0; i < blades; i++) {
    const f = makeFlame(opts);
    f.mesh.rotation.y = (i / blades) * Math.PI;
    if (i > 0) f.mesh.scale.setScalar(0.85 + i * 0.06);
    g.add(f.mesh);
    handles.push(f);
  }
  return {
    group: g,
    tick(time) { handles.forEach(h => h.tick(time)); },
    dispose() { handles.forEach(h => h.dispose()); }
  };
}

/* ---------------- Heat shimmer quad ---------------- */

export interface ShimmerHandle {
  mesh: THREE.Mesh;
  tick: (time: number) => void;
  dispose: () => void;
}

export function makeHeatShimmer(width: number, height: number, baseY = 0): ShimmerHandle {
  const uniforms = { uTime: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
      }
      void main(){
        float n = noise(vec2(vUv.x*8.0, vUv.y*4.0 - uTime*1.2));
        float a = smoothstep(0.35, 1.0, n) * (1.0 - vUv.y) * 0.15;
        gl_FragColor = vec4(0.75, 0.82, 1.0, a);
      }
    `
  });
  const geo = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = baseY + height / 2;
  mesh.renderOrder = 4;
  return {
    mesh,
    tick(t) { uniforms.uTime.value = t; },
    dispose() { geo.dispose(); mat.dispose(); }
  };
}

/* ---------------- Point-light flicker helper ---------------- */

export function flickerLight(light: THREE.PointLight, base: number, time: number, speed = 12): void {
  light.intensity =
    base *
    (1 + Math.sin(time * speed) * 0.16 + Math.sin(time * speed * 0.63 + 1.7) * 0.1 + Math.sin(time * speed * 1.9 + 3.1) * 0.05);
}
