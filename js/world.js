/** Wüstenhintergrund, Oase, Deko sowie Kollisionsabfragen. */
import { state } from './state.js';
import { BAYER, rnd, hex, makeNoise, pxEllipse } from './pixel.js';
import { makeCactus, makeRock, makePalm, PALM_FOOT } from './sprites.js';

const DECOR_SHADOW = 'rgba(120,70,30,0.22)';

export function buildWorld() {
  const { W, H } = state;
  const bg = document.createElement('canvas');
  bg.width = W;
  bg.height = H;
  const b = bg.getContext('2d'), img = b.createImageData(W, H), D = img.data;
  const n1 = makeNoise(W, H, 30), n2 = makeNoise(W, H, 9);
  const [S0, S1, S2, S3, SL, PB] = ['#ecc98f', '#e0b77b', '#d3a86c', '#c2955a', '#f6dcaa', '#a8794a'].map(hex);
  const [DEEP, MID, SHAL, FOAM, WET] = ['#2f6fb0', '#3f8fd0', '#5fb0e0', '#8fd3ef', '#b98a52'].map(hex);
  const GR = ['#6aa84f', '#4d8a3c', '#8cc960'].map(hex);
  const SH = ['#8f8a3e', '#6e6a2c', '#a9a052'].map(hex);
  const levels = [S2, S1, S0];

  const pr = Math.max(14, Math.min(W, H) * 0.13);
  const pond = { rx: pr, ry: Math.round(pr * 0.68) };
  pond.cx = Math.round(rnd(pond.rx + 30, W - pond.rx - 30));
  pond.cy = Math.round(rnd(pond.ry + 44, H - pond.ry - 30));
  const waterPx = [];

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = n1(x, y), m = n2(x, y);
    const dune = Math.sin((x * 0.8 + y * 0.5) * 0.06 + n * 6);
    const lv = (dune * 0.5 + 0.5) * 2 + (BAYER[y & 3][x & 3] / 16 - 0.47) * 0.9 + (m - 0.5) * 0.5;
    let col = levels[Math.max(0, Math.min(2, Math.round(lv)))];
    const rip = Math.sin(x * 0.32 + y * 0.14 + n * 11 + Math.sin(y * 0.1) * 1.5);
    if (rip > 0.97 && dune > -0.2) col = S3;
    else if (rip < -0.992) col = SL;
    const r = Math.random();
    if (r < 0.006) col = PB; else if (r < 0.01) col = SL;

    const ex = (x - pond.cx) / pond.rx, ey = (y - pond.cy) / pond.ry, ne = Math.sqrt(ex * ex + ey * ey);
    if (ne < 1) {
      const w = ne + (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.14;
      col = w < 0.5 ? DEEP : w < 0.8 ? MID : w < 0.93 ? SHAL : FOAM;
      waterPx.push(x, y);
    } else if (ne < 1.1) col = WET;
    else if (ne < 1.55) {
      const p = 1 - (ne - 1.1) / 0.45;
      if (Math.random() < p * p * 0.85) col = GR[Math.random() * 3 | 0];
    }
    const i = (y * W + x) * 4;
    D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
  }

  // trockene Büsche
  const shrubs = Math.round(W * H / 2200);
  for (let s = 0; s < shrubs; s++) {
    const sx = rnd(4, W - 4) | 0, sy = rnd(4, H - 4) | 0;
    const ex = (sx - pond.cx) / pond.rx, ey = (sy - pond.cy) / pond.ry;
    if (ex * ex + ey * ey < 2.6) continue;
    const k = 3 + (Math.random() * 5 | 0);
    for (let j = 0; j < k; j++) {
      const x = sx + (rnd(-2, 2.5) | 0), y = sy + (rnd(-1.5, 2) | 0);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const c = SH[Math.random() * 3 | 0], i = (y * W + x) * 4;
      D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2];
    }
  }
  b.putImageData(img, 0, 0);

  const decor = [];

  // Palmen rund um die Oase
  const np = 2 + (Math.random() * 2 | 0), pa = rnd(6.28);
  for (let i = 0; i < np; i++) {
    const a = pa + i * (6.28 / np) + rnd(-0.4, 0.4);
    const x = Math.round(pond.cx + Math.cos(a) * (pond.rx + 4)), y = Math.round(pond.cy + Math.sin(a) * (pond.ry + 3));
    decor.push({ x, y, r: 1, base: y, img: makePalm(), dx: x - PALM_FOOT.x, dy: y - PALM_FOOT.y });
    pxEllipse(b, x + 3, y + 1, 10, 3, DECOR_SHADOW);
  }

  const free = (x, y, r) => {
    const ex = (x - pond.cx) / (pond.rx + r + 8), ey = (y - pond.cy) / (pond.ry + r + 8);
    if (ex * ex + ey * ey < 1) return false;
    if (x < 70 && y < 40) return false; // HUD freihalten
    return decor.every(o => Math.hypot(o.x - x, o.y - y) >= o.r + r + 12);
  };

  // Kakteen
  const nc = Math.max(3, Math.round(W * H / 13000));
  for (let i = 0; i < nc; i++) for (let t = 0; t < 40; t++) {
    const x = Math.round(rnd(10, W - 10)), y = Math.round(rnd(20, H - 6));
    if (!free(x, y, 5)) continue;
    decor.push({ x, y, r: 5, base: y, img: makeCactus(), dx: x - 5, dy: y - 13 });
    pxEllipse(b, x + 3, y, 5, 2, DECOR_SHADOW);
    break;
  }

  // Felsen
  const nr = Math.max(2, Math.round(W * H / 15000));
  for (let i = 0; i < nr; i++) for (let t = 0; t < 40; t++) {
    const w = 7 + (Math.random() * 5 | 0), h = 5 + (Math.random() * 3 | 0);
    const x = Math.round(rnd(10, W - 10)), y = Math.round(rnd(14, H - 8));
    if (!free(x, y, w / 2)) continue;
    decor.push({ x, y, r: w / 2, base: y + h / 2, img: makeRock(w, h), dx: Math.round(x - w / 2 - 1), dy: Math.round(y - h / 2 - 1) });
    pxEllipse(b, x + 2, y + 2, Math.round(w / 2), Math.round(h / 2), DECOR_SHADOW);
    break;
  }

  Object.assign(state, { bg, pond, waterPx, decor });
}

/* ---------- Kollision ---------- */

export function blocked(x, y) {
  const { pond, decor } = state;
  const ex = (x - pond.cx) / (pond.rx + 8), ey = (y - pond.cy) / (pond.ry + 3);
  if (ex * ex + ey * ey < 1) return true;
  return decor.some(o => Math.abs(o.x - x) < o.r + 9 && Math.abs(o.base - y) < 5);
}

export function pathClear(pts) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
    for (let k = 1; k <= n; k++) if (blocked(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)) return false;
  }
  return true;
}

/** L-förmiger Pfad (nur achsparallele Bewegung). */
export const lpath = (x0, y0, x1, y1, hFirst) =>
  hFirst ? [[x0, y0], [x1, y0], [x1, y1]] : [[x0, y0], [x0, y1], [x1, y1]];
