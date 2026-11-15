/** Kamel-Verhalten: Spawnen, Umherlaufen, Trinken, Dösen. */
import { state } from './state.js';
import { rnd } from './pixel.js';
import { PAL_WEIGHTS, FRAME } from './sprites.js';
import { blocked, pathClear, lpath } from './world.js';

export const MAX_CAMELS = 30;

const NAMES = ['Kurt', 'Hildegard', 'Brösel', 'Frieda', 'Höcker-Horst', 'Sandra', 'Karl', 'Lotti', 'Mustafa',
  'Wüsten-Willi', 'Dünen-Dieter', 'Gisela', 'Bruno', 'Oase-Olga', 'Fatima', 'Paul', 'Zimtstern', 'Helmut',
  'Saharah', 'Knut', 'Dattel', 'Trudi', 'Erwin', 'Krümel', 'Ilse', 'Yusuf', 'Rudi', 'Mila', 'Ottokar', 'Sternchen'];
let nameIdx = Math.random() * NAMES.length | 0;

export const STATUS = { walk: 'schlendert', idle: 'guckt rum', sit: 'döst', drink: 'trinkt' };

/* ---------- Entscheidungen ---------- */

function setPath(c, pts, after = null) {
  c.path = pts.slice(1).map(([x, y]) => ({ x, y }));
  c.after = after;
  c.state = 'walk';
}

function wander(c) {
  const { W, H } = state;
  for (let t = 0; t < 30; t++) {
    const R = 90;
    const tx = Math.max(12, Math.min(W - 12, c.x + rnd(-R, R)));
    const ty = Math.max(20, Math.min(H - 6, c.y + rnd(-R, R)));
    if (Math.abs(tx - c.x) + Math.abs(ty - c.y) < 15 || blocked(tx, ty)) continue;
    const pts = lpath(c.x, c.y, tx, ty, Math.random() < 0.5);
    if (pathClear(pts)) { setPath(c, pts); return true; }
  }
  return false;
}

function tryDrink(c) {
  const { W, H } = state, { cx, cy, rx, ry } = state.pond;
  const spots = [0, 1].map(side => {
    const oy = rnd(-0.3, 0.3) * ry, ext = rx * Math.sqrt(1 - (oy / ry) ** 2) + 9;
    return { x: side === 0 ? cx - ext : cx + ext, y: cy + oy, face: side === 0 ? 0 : 2 };
  });
  spots.sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y));
  for (const s of spots) {
    if (s.x < 12 || s.x > W - 12 || s.y < 20 || s.y > H - 6) continue;
    const pts = lpath(c.x, c.y, Math.round(s.x), Math.round(s.y), false);
    if (pathClear(pts)) { setPath(c, pts, { state: 'drink', dir: s.face }); return true; }
  }
  return false;
}

function decide(c) {
  if (c.thirst > 1 && tryDrink(c)) return;
  if (c.state === 'sit') { c.state = 'idle'; c.t = rnd(1.5, 3); return; }
  const r = Math.random();
  if (r < 0.5 && wander(c)) return;
  if (r < 0.82) { c.state = 'idle'; c.t = rnd(2, 6); return; }
  c.state = 'sit';
  c.t = rnd(8, 20);
}

/* ---------- Spawnen ---------- */

function newCamel(x, y) {
  const c = {
    x, y,
    dir: Math.random() * 4 | 0,
    state: 'idle', t: rnd(0.5, 3),
    path: [], after: null,
    anim: 0, lastF: -1, tail: 0,
    thirst: rnd(0, 0.9), thirstRate: 1 / rnd(45, 100),
    name: NAMES[(nameIdx++) % NAMES.length],
    pal: PAL_WEIGHTS[Math.random() * PAL_WEIGHTS.length | 0],
    speed: rnd(7, 10),
  };
  state.camels.push(c);
  return c;
}

export function spawnInitial() {
  const { W, H, camels } = state;
  const n = Math.max(4, Math.min(12, Math.round(W * H / 9000)));
  for (let i = 0; i < n; i++) for (let t = 0; t < 60; t++) {
    const x = rnd(14, W - 14), y = rnd(22, H - 8);
    if (blocked(x, y) || camels.some(c => Math.hypot(c.x - x, c.y - y) < 20)) continue;
    const c = newCamel(Math.round(x), Math.round(y));
    if (Math.random() < 0.3) { c.state = 'sit'; c.t = rnd(3, 15); }
    break;
  }
}

/** Lässt ein Kamel vom Bildschirmrand hereinlaufen. Gibt das Kamel oder null zurück. */
export function spawnFromEdge() {
  const { W, H } = state;
  if (state.camels.length >= MAX_CAMELS) return null;
  for (let t = 0; t < 30; t++) {
    const side = Math.random() * 4 | 0;
    let x, y, tx, ty;
    if (side === 0) { x = -12; y = rnd(20, H - 14); tx = rnd(20, W * 0.4); ty = y; }
    else if (side === 1) { x = W + 12; y = rnd(20, H - 14); tx = rnd(W * 0.6, W - 20); ty = y; }
    else if (side === 2) { x = rnd(20, W - 20); y = -4; tx = x; ty = rnd(26, H * 0.4); }
    else { x = rnd(20, W - 20); y = H + 20; tx = x; ty = rnd(H * 0.6, H - 8); }
    [x, y, tx, ty] = [x, y, tx, ty].map(Math.round);
    if (blocked(tx, ty)) continue;
    const pts = [[x, y], [tx, ty]];
    if (!pathClear(pts)) continue;
    const c = newCamel(x, y);
    setPath(c, pts);
    return c;
  }
  return null;
}

/** Nach einem Resize: Kamele in die neue Welt einpassen. */
export function relocateCamels() {
  const { W, H } = state;
  for (const c of state.camels) {
    c.x = Math.max(12, Math.min(W - 12, c.x));
    c.y = Math.max(20, Math.min(H - 6, c.y));
    for (let t = 0; t < 60 && blocked(c.x, c.y); t++) { c.x = rnd(14, W - 14); c.y = rnd(22, H - 8); }
    c.path = []; c.after = null; c.state = 'idle'; c.t = rnd(0.5, 2);
  }
}

/** Reaktion aufs Antippen: Herz und manchmal stehenbleiben. */
export function pet(c) {
  state.hearts.push({ x: c.x, y: c.y - 6, t: 0 });
  if (c.state === 'walk' && Math.random() < 0.4) {
    c.state = 'idle'; c.t = rnd(2, 4); c.path = []; c.after = null;
  }
}

/* ---------- Update ---------- */

export function camelFrame(c) {
  if (c.state === 'walk') return Math.floor(c.anim) % 4;
  if (c.state === 'sit') return FRAME.SIT;
  if (c.state === 'drink') return FRAME.DRINK;
  return FRAME.STAND;
}

function leavePrint(c, f) {
  const horiz = c.dir % 2 === 0, sg = c.dir === 2 ? -1 : 1;
  state.prints.push(horiz
    ? { x: Math.round(c.x + (f === 0 ? -4 : 3) * sg), y: Math.round(c.y) + (f === 0 ? 0 : 1), t: 0 }
    : { x: Math.round(c.x) + (f === 0 ? -2 : 2), y: Math.round(c.y), t: 0 });
  if (state.prints.length > 700) state.prints.shift();
}

export function updateCamel(c, dt) {
  c.thirst += dt * c.thirstRate;
  c.t -= dt;
  if (Math.random() < dt * (c.state === 'walk' ? 0.8 : 0.5)) c.tail ^= 1;

  if (c.state === 'walk') {
    let step = c.speed * dt;
    while (step > 0 && c.path.length) {
      const wp = c.path[0], dx = wp.x - c.x, dy = wp.y - c.y, dist = Math.abs(dx) + Math.abs(dy);
      if (dist <= step) { c.x = wp.x; c.y = wp.y; step -= dist; c.path.shift(); c.anim += dist / 4; continue; }
      if (Math.abs(dx) > 0.001) { c.x += Math.sign(dx) * Math.min(step, Math.abs(dx)); c.dir = dx > 0 ? 0 : 2; }
      else { c.y += Math.sign(dy) * step; c.dir = dy > 0 ? 1 : 3; }
      c.anim += step / 4;
      step = 0;
    }
    const f = Math.floor(c.anim) % 4;
    if (f !== c.lastF && (f === 0 || f === 2)) leavePrint(c, f);
    c.lastF = f;
    if (!c.path.length) {
      if (c.after) { c.state = c.after.state; c.dir = c.after.dir; c.t = rnd(4, 7); c.after = null; }
      else { c.state = 'idle'; c.t = rnd(1, 4); }
    }
  } else if (c.t <= 0) {
    if (c.state === 'drink') c.thirst = 0;
    decide(c);
  }
}
