/* ============================================================
   useVisualOdometry — camera-based position tracking (the "6-DoF"
   half of the AR session that gyro alone cannot provide).

   Every camera frame is downscaled to 160×120 luminance and a
   grid of 16×16 macroblocks is template-matched against the
   previous frame. The gyro-predicted rotational flow field is
   subtracted from the measured flow; what remains is TRANSLATION.

     • lateral flow at center  → sideways camera motion
     • radial (expansion) flow → walking toward / away
     • scene depth at center is derived from the floor-pitch ray
       (camera height × pitch), so output translation is meters.

   If the measured flow disagrees with the gyro prediction
   (camera covered, motion blur, shaken), the frame is marked
   INVALID — that is exactly how "tracking lost when the camera
   is blocked or moved rapidly" is detected.
   ============================================================ */

export interface VOFrameInput {
  video: HTMLVideoElement;
  /** image-convention camera-frame angular delta this frame (radians): x right, y down, z forward */
  rotOmega: { x: number; y: number; z: number };
  /** view pitch, radians (down = negative) */
  pitch: number;
  /** camera height above the floor, meters */
  camHeight: number;
}

export interface VOFrameResult {
  valid: boolean;
  texturedBlocks: number;
  /** measured median flow at center (px) */
  measX: number;
  measY: number;
  /** gyro-predicted rotational flow at center (px) */
  predX: number;
  predY: number;
  /** residual TRANSLATIONAL flow at center (px) */
  transX: number;
  transY: number;
  /** mean residual radial expansion per px of image radius (px/px) */
  radial: number;
  /** assumed scene depth at the view center (m) */
  depthZ: number;
}

const W = 160;
const H = 120;
const BLOCK = 16;
const SAMPLE = 2; // sample every 2nd px inside the block → 8×8 = 64 samples
const SEARCH = 6; // ± px search radius around the predicted position
const FOCAL_PX = W / 2 / Math.tan((60 * Math.PI) / 360); // ≈138.6 px @ 60° hFOV
const MAX_VALID_FLOW_ERR = 7; // px disagreement allowed between vision & gyro
const CX = W / 2;
const CY = H / 2;

/** 9×7 block lattice, 20 px clear of the borders so the search window never leaves frame */
const COLS = 9;
const ROWS = 7;
const BLOCK_CENTERS: Array<{ x: number; y: number }> = [];
for (let j = 0; j < ROWS; j++) {
  for (let i = 0; i < COLS; i++) {
    BLOCK_CENTERS.push({ x: 20 + i * 15, y: 16 + j * 14 });
  }
}

export class VisualOdometry {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private lum = new Uint8Array(W * H);
  private prevLum: Uint8Array | null = null;
  private lastVideoTime = -1;
  /** frames processed so far */
  count = 0;

  private ensureCanvas(): boolean {
    if (this.ctx) return true;
    if (typeof document === "undefined") return false;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    this.canvas = c;
    this.ctx = ctx;
    return true;
  }

  /** Process the newest video frame. Returns null when no new frame is available. */
  process(input: VOFrameInput): VOFrameResult | null {
    const { video } = input;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
    if (video.currentTime === this.lastVideoTime) return null; // same frame
    this.lastVideoTime = video.currentTime;
    if (!this.ensureCanvas() || !this.ctx) return null;

    // ---- grab luminance ----
    this.ctx.drawImage(video, 0, 0, W, H);
    const img = this.ctx.getImageData(0, 0, W, H).data;
    const lum = this.lum;
    for (let p = 0, q = 0; p < lum.length; p++, q += 4) {
      lum[p] = (img[q] + (img[q + 1] << 1) + img[q + 2]) >> 2;
    }

    const prev = this.prevLum;
    this.prevLum = new Uint8Array(lum); // copy for next frame
    this.count++;
    if (!prev) {
      return null; // first frame: nothing to match against
    }

    const f = FOCAL_PX;
    const { rotOmega } = input;

    // ---- per-block: texture gate + template match around the predicted spot ----
    const dxs: number[] = [];
    const dys: number[] = [];
    const radials: number[] = [];
    let textured = 0;

    for (let b = 0; b < BLOCK_CENTERS.length; b++) {
      const bx = BLOCK_CENTERS[b].x;
      const by = BLOCK_CENTERS[b].y;
      const u = bx - CX;
      const v = by - CY;

      // texture: mean absolute deviation of the previous-frame block
      let sum = 0;
      let n = 0;
      for (let yy = -BLOCK / 2; yy < BLOCK / 2; yy += SAMPLE) {
        for (let xx = -BLOCK / 2; xx < BLOCK / 2; xx += SAMPLE) {
          sum += prev[(by + yy) * W + (bx + xx)];
          n++;
        }
      }
      const mean = sum / n;
      let mad = 0;
      for (let yy = -BLOCK / 2; yy < BLOCK / 2; yy += SAMPLE) {
        for (let xx = -BLOCK / 2; xx < BLOCK / 2; xx += SAMPLE) {
          mad += Math.abs(prev[(by + yy) * W + (bx + xx)] - mean);
        }
      }
      mad /= n;
      if (mad < 7) continue; // textureless (blank wall / covered lens) — unusable
      textured++;

      // gyro-predicted rotational flow for THIS block (small-rotation flow eqs)
      const predU = -f * rotOmega.y + rotOmega.z * v;
      const predV = f * rotOmega.x - rotOmega.z * u;

      // SAD template match, windowed around the prediction
      let best = Infinity;
      let bestX = 0;
      let bestY = 0;
      for (let oy = -SEARCH; oy <= SEARCH; oy++) {
        const cy2 = by + Math.round(predV) + oy;
        if (cy2 - BLOCK / 2 < 0 || cy2 + BLOCK / 2 > H) continue;
        for (let ox = -SEARCH; ox <= SEARCH; ox++) {
          const cx2 = bx + Math.round(predU) + ox;
          if (cx2 - BLOCK / 2 < 0 || cx2 + BLOCK / 2 > W) continue;
          let sad = 0;
          for (let yy = -BLOCK / 2; yy < BLOCK / 2; yy += SAMPLE) {
            const rowPrev = (by + yy) * W;
            const rowCur = (cy2 + yy) * W;
            for (let xx = -BLOCK / 2; xx < BLOCK / 2; xx += SAMPLE) {
              sad += Math.abs(prev[rowPrev + bx + xx] - lum[rowCur + cx2 + xx]);
            }
          }
          if (sad < best) {
            best = sad;
            bestX = ox;
            bestY = oy;
          }
        }
      }
      if (best === Infinity) continue;
      const dx = bestX - 0; // offset from the PREDICTED center — pure residual later
      const dy = bestY - 0;
      dxs.push(predU + dx - 0); // absolute flow = predicted + residual
      dys.push(predV + dy - 0);
      // store residual for radial estimate
      radials.push(0);
      this.blockResid[b] = { rx: dx, ry: dy, u, v, ok: true };
    }
    for (let b = 0; b < BLOCK_CENTERS.length; b++) {
      if (!this.blockResid[b]) this.blockResid[b] = { rx: 0, ry: 0, u: 0, v: 0, ok: false };
    }

    if (textured < 8) {
      return {
        valid: false, texturedBlocks: textured,
        measX: 0, measY: 0, predX: -f * rotOmega.y, predY: f * rotOmega.x,
        transX: 0, transY: 0, radial: 0,
        depthZ: this.depthAt(input.pitch, input.camHeight),
      };
    }

    // ---- median measured flow + center prediction ----
    const medX = median(dxs);
    const medY = median(dys);
    const predCX = -f * rotOmega.y;
    const predCY = f * rotOmega.x;
    const transX = medX - predCX;
    const transY = medY - predCY;

    // ---- radial (forward-motion) estimate from per-block residuals ----
    let rSum = 0;
    let rN = 0;
    for (let b = 0; b < BLOCK_CENTERS.length; b++) {
      const r = this.blockResid[b];
      if (!r || !r.ok) continue;
      const rr = Math.hypot(r.u, r.v);
      if (rr < 8) continue;
      // residual flow at block = measured absolute − predicted; we stored offset only,
      // so reconstruct: measured = pred + offset → residual = offset
      rSum += (r.rx * r.u + r.ry * r.v) / rr;
      rN++;
    }
    const radial = rN > 0 ? rSum / rN : 0;

    // ---- validity: vision must agree with the gyro prediction ----
    const errX = Math.abs(transX);
    const errY = Math.abs(transY);
    const valid = errX < MAX_VALID_FLOW_ERR && errY < MAX_VALID_FLOW_ERR;

    return {
      valid,
      texturedBlocks: textured,
      measX: medX,
      measY: medY,
      predX: predCX,
      predY: predCY,
      transX,
      transY,
      radial,
      depthZ: this.depthAt(input.pitch, input.camHeight),
    };
  }

  private blockResid: Array<{ rx: number; ry: number; u: number; v: number; ok: boolean }> =
    new Array(BLOCK_CENTERS.length);

  /** scene depth at the view center from the floor-pitch geometry */
  private depthAt(pitch: number, camHeight: number): number {
    if (pitch < -0.12) {
      const z = camHeight / Math.sin(-pitch);
      return Math.min(18, Math.max(0.7, z));
    }
    return 18; // looking at the horizon: effectively far away
  }
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const a = arr.slice().sort((p, q) => p - q);
  const mid = a.length >> 1;
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
