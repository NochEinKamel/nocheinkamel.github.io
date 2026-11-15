/** Prozedural erzeugte Pixel-Sprites: Kamele, Pflanzen, Felsen, Effekte. */
import { blank, gridFrom, mirror, inEll, segDist, paint, outline, toCanvas, pxEllipse, rnd } from './pixel.js';

/* ---------- Kamele (schräg von der Seite) ---------- */

const PALS = [
  { o: '#4a2a12', b: '#d19a5a', h: '#e8bf82', H: '#f6d9a4', d: '#a86f37', n: '#2a1408' },
  { o: '#3d2210', b: '#a8723f', h: '#c79358', H: '#ddb07a', d: '#7f5228', n: '#1a0c04' },
  { o: '#4d3a26', b: '#e8d6ae', h: '#f8eed6', H: '#ffffff', d: '#c2a97e', n: '#3e2a18' },
  { o: '#26150a', b: '#74492a', h: '#946339', H: '#b07c4c', d: '#55341d', n: '#0e0602' },
];
/** Gewichtete Auswahl der Fellfarben (Index in PALS). */
export const PAL_WEIGHTS = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3];

function shade(g, body, bcy, hump, hcy) {
  paint(g, (x, y) => g[y][x] === 'b' && body(x, y) && y >= bcy + 1.4, 'd');
  paint(g, (x, y) => g[y][x] === 'b' && hump(x, y) && y <= hcy - 0.6, 'h');
  paint(g, (x, y) => g[y][x] === 'h' && y <= hcy - 2, 'H');
}

// Seitenansicht, Blick nach rechts. Füße auf Zeile 16.
function camelSide(frame, tail, pose) {
  const g = blank(25, 19), dy = pose === 'sit' ? 4 : 0, drink = pose === 'drink';
  if (pose !== 'sit') {
    const ph = pose === 'walk' ? [-1, 0, 1, 0][frame] : 0;
    for (const [x, far, sw] of [[6, 1, -ph], [13, 1, ph], [8, 0, ph], [15, 0, -ph]]) {
      const lift = sw > 0 ? 1 : 0;
      for (let y = 12; y <= 16 - lift; y++) g[y][y >= 14 ? x + sw : x] = far ? 'f' : 'L';
    }
  } else {
    g[16][4] = 'f'; g[16][5] = 'f'; g[16][14] = 'L'; g[16][15] = 'L';
  }
  const bcy = 9.5 + dy, hcy = 6.9 + dy;
  const body = (x, y) => inEll(x, y, 9.5, bcy, 6.6, 2.9);
  const hump = (x, y) => y <= bcy && inEll(x, y, 9, hcy, 3.6, 3.1);
  const neck = (x, y) => drink
    ? segDist(x, y, 14.5, 9, 19.5, 13) < 1.25
    : segDist(x, y, 14.5, 9 + dy, 17.6, 4 + dy) < 1.25;
  const head = (x, y) => drink
    ? (inEll(x, y, 20.5, 14, 2.1, 1.3) || (x === 23 && y === 14))
    : (inEll(x, y, 18.4, 3.4 + dy, 2.2, 1.4) || (x >= 20 && x <= 21 && (y === 3 + dy || y === 4 + dy)));
  const nape = (x, y) => segDist(x, y, 12.5, 7.5 + dy, 14.5, 8.5 + dy) < 1.3;
  paint(g, (x, y) => body(x, y) || hump(x, y) || nape(x, y) || neck(x, y) || head(x, y), 'b');
  shade(g, body, bcy, hump, hcy);
  const tailPx = tail ? [[3, 8], [2, 9], [2, 10], [1, 11]] : [[3, 8], [2, 9], [2, 10], [2, 11]];
  for (const [x, y] of tailPx) g[y + dy][x] = 'd';
  if (drink) { g[13][21] = 'n'; g[12][19] = 'b'; }
  else { g[3 + dy][19] = 'n'; g[1 + dy][17] = 'b'; g[4 + dy][21] = 'd'; }
  return outline(g, 'o');
}

// Front- (back=false) bzw. Rückansicht (back=true). Füße auf Zeile 16.
function camelFront(frame, tail, pose, back) {
  const g = blank(13, 19), dy = pose === 'sit' ? 4 : 0;
  if (pose !== 'sit') {
    const lift = pose === 'walk' ? [1, 0, 2, 0][frame] : 0; // 1: links hoch, 2: rechts hoch
    for (const [x, near, side] of [[5, 0, 2], [7, 0, 1], [4, 1, 1], [8, 1, 2]]) {
      const end = (near ? 16 : 15) - (lift === side ? 1 : 0);
      for (let y = 12; y <= end; y++) g[y][x] = near ? 'L' : 'f';
    }
  } else {
    g[16][2] = 'L'; g[16][10] = 'L';
  }
  const bcy = 10 + dy, hcy = 7.3 + dy;
  const body = (x, y) => inEll(x, y, 6, bcy, 3.7, 2.7);
  const hump = (x, y) => y <= bcy && inEll(x, y, 6, hcy, 2.9, 2.5);
  const neckHead = (x, y) => back
    ? (inEll(x, y, 6, 3.6 + dy, 1.7, 1.5) || (x >= 5 && x <= 7 && y >= 4 + dy && y <= 8 + dy) || ((x === 5 || x === 7) && y === 2 + dy))
    : (inEll(x, y, 6, 3.6 + dy, 2, 1.8) || (x >= 5 && x <= 7 && y >= 4 + dy && y <= 9 + dy) || ((x === 4 || x === 8) && y === 2 + dy));
  if (back) {
    paint(g, neckHead, 'b');
    paint(g, (x, y) => body(x, y) || hump(x, y), 'b');
    shade(g, body, bcy, hump, hcy);
    for (let y = 11; y <= 13; y++) g[y + dy][tail && y === 13 ? 5 : 6] = 'd';
  } else {
    paint(g, (x, y) => body(x, y) || hump(x, y), 'b');
    shade(g, body, bcy, hump, hcy);
    paint(g, neckHead, 'b');
    g[3 + dy][5] = 'n'; g[3 + dy][7] = 'n';
    for (let x = 5; x <= 7; x++) g[5 + dy][x] = 'd';
  }
  return outline(g, 'o');
}

/** Frames: 0-3 gehen, 4 stehen, 5 liegen, 6 trinken. Richtungen: 0 rechts, 1 runter, 2 links, 3 hoch. */
export const FRAME = { STAND: 4, SIT: 5, DRINK: 6 };

function camelGridFor(dir, f, tail) {
  const pose = f < 4 ? 'walk' : f === FRAME.STAND ? 'stand' : f === FRAME.SIT ? 'sit' : 'drink';
  if (dir === 0) return camelSide(f, tail, pose);
  if (dir === 2) return mirror(camelSide(f, tail, pose));
  return camelFront(f, tail, pose === 'drink' ? 'stand' : pose, dir === 3);
}

/** CAMEL_SPRITES[pal][dir][frame][tail] */
export const CAMEL_SPRITES = PALS.map(p => [0, 1, 2, 3].map(d => [0, 1, 2, 3, 4, 5, 6].map(f => [0, 1].map(t =>
  toCanvas(camelGridFor(d, f, t), { ...p, L: p.b, f: p.d })))));

function shadowCanvas(rx) {
  const c = document.createElement('canvas');
  c.width = rx * 2 + 1;
  c.height = 5;
  pxEllipse(c.getContext('2d'), rx, 2, rx, 2, 'rgba(110,60,20,0.3)');
  return c;
}
/** Schatten je Blickrichtung. */
export const CAMEL_SHADOWS = [shadowCanvas(9), shadowCanvas(5), shadowCanvas(9), shadowCanvas(5)];

/** Bounding-Box eines Kamels in Weltkoordinaten (Füße auf c.y). */
export function camelBox(c) {
  const s = CAMEL_SPRITES[0][c.dir][0][0];
  return { x: Math.round(c.x) - (s.width >> 1), y: Math.round(c.y) - 16, w: s.width, h: s.height };
}

/* ---------- Effekte ---------- */

export const HEART = toCanvas(
  gridFrom(['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...']),
  { r: '#e8433a', w: '#ffd0c8' },
);

export const WEED = [
  ['..oo..', '.o.oo.', 'oo.o.o', 'o.oo.o', '.oo.o.', '..oo..'],
  ['..oo..', '.oo.o.', 'o.oo.o', 'oo.o.o', '.o.oo.', '..oo..'],
].map(f => toCanvas(gridFrom(f), { o: '#8a6a3a' }));

/* ---------- Deko ---------- */

export function makeCactus() {
  const g = blank(11, 14);
  const top = 13 - (8 + (Math.random() * 4 | 0));
  for (let y = top; y <= 12; y++) for (let x = 4; x <= 6; x++) g[y][x] = x === 4 ? 'l' : 'g';
  g[top][4] = '.'; g[top][6] = '.'; g[top][5] = 'l';
  if (Math.random() < 0.85) {
    const a = top + 3 + (Math.random() * 3 | 0);
    for (let y = a - 3; y <= a + 1; y++) { g[y][1] = 'l'; g[y][2] = 'g'; }
    g[a][3] = 'g'; g[a + 1][3] = 'g'; g[a - 3][1] = '.';
  }
  if (Math.random() < 0.7) {
    const b = top + 2 + (Math.random() * 3 | 0);
    for (let y = b - 2; y <= b + 1; y++) { g[y][8] = 'l'; g[y][9] = 'g'; }
    g[b][7] = 'g'; g[b + 1][7] = 'g'; g[b - 2][9] = '.';
  }
  return toCanvas(outline(g), { g: '#4e9a3c', l: '#7cc455', k: '#1e4520' });
}

export function makeRock(w, h) {
  const g = blank(w + 2, h + 2), cx = (w + 1) / 2, cy = (h + 1) / 2;
  for (let y = 1; y <= h; y++) for (let x = 1; x <= w; x++) {
    const dx = (x - cx) / (w / 2), dy = (y - cy) / (h / 2);
    if (dx * dx + dy * dy < 1 - Math.random() * 0.18) g[y][x] = (dx + dy < -0.35) ? 'r' : (dx + dy > 0.45 ? 'q' : 'm');
  }
  return toCanvas(outline(g), { r: '#c2a787', m: '#9a8064', q: '#735c45', k: '#3e2f22' });
}

/* ---------- Palme ---------- */

const PALM_W = 37, PALM_H = 38;
/** Position des Stammfußes im Palmen-Sprite. */
export const PALM_FOOT = { x: 18, y: 36 };

const PALM_COLORS = {
  T: '#a8763f', U: '#7a522b',               // Stamm hell / Ringe
  B: '#2f6a2c', b: '#3d7d36',               // hintere Wedel: Rippe / Fiedern
  g: '#3f8a3a', m: '#57a83f', l: '#7fcf55', // vordere Wedel: Fiedern / Rippe / Glanz
  c: '#5a3618', C: '#8a5a2a',               // Kokosnüsse
  k: '#1f3a1a',                             // Umriss
};

/**
 * Ein gefiederter Wedel: Mittelrippe als Wurfparabel (Startwinkel `ang` in Grad,
 * 0 = rechts, 180 = links), darunter hängende Fiedern, zur Spitze hin kürzer.
 */
function drawFrond(g, ox, oy, ang, len, droop, back) {
  const rib = back ? 'B' : 'm', leaf = back ? 'b' : 'g';
  const vx = Math.cos(ang * Math.PI / 180), vy = -Math.sin(ang * Math.PI / 180), side = Math.sign(vx);
  const set = (x, y, ch, force) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 1 || x > PALM_W - 2 || y < 1 || y > PALM_H - 2) return;
    if (force || g[y][x] === '.') g[y][x] = ch;
  };
  let step = 0;
  for (let t = 0; t <= len; t += 0.4, step++) {
    const x = ox + vx * t, y = oy + vy * t + droop * t * t;
    const fl = t < 1.5 ? 0 : Math.round(0.4 + (1 - t / len) * 2.4);
    if (step % 2 === 0) for (let k = 1; k <= fl; k++) set(x + side * k * 0.5, y + k, leaf, false);
    set(x, y, rib, true);
    if (!back && t > 1 && t < len * 0.6) set(x, y - 1, 'l', false);
  }
}

/**
 * Wedel, der auf den Betrachter zukommt: verkürzt, hängt nach vorn-unten,
 * Fiedern stehen zu beiden Seiten ab (in der Mitte am breitesten).
 */
function drawFacingFrond(g, ox, oy, lean, len) {
  for (let t = 0; t <= len; t += 0.5) {
    const x = Math.round(ox + lean * t), y = Math.round(oy + t);
    const half = t < 1 ? 0 : Math.round(Math.sin(Math.PI * Math.min(1, t / len)) * 2.4);
    for (let k = 1; k <= half; k++) {
      if (Math.round(t * 2) % 2) continue; // Kammstruktur
      const dy = k;
      for (const sx of [-1, 1]) {
        const px = x + sx * k, py = y + dy;
        if (px > 0 && px < PALM_W - 1 && py < PALM_H - 1 && g[py][px] === '.') g[py][px] = 'g';
      }
    }
    g[y][x] = t < len * 0.6 ? 'l' : 'm';
  }
}

/** Zeichnet `draw` in eine eigene Ebene, umrandet sie und legt sie über `g`. */
function layer(g, draw) {
  const l = blank(PALM_W, PALM_H);
  draw(l);
  const o = outline(l);
  for (let y = 0; y < PALM_H; y++) for (let x = 0; x < PALM_W; x++) if (o[y][x] !== '.') g[y][x] = o[y][x];
}

/**
 * Palme mit Stammkrümmung, Wedeln in zwei Ebenen und Kokosnüssen.
 * Jeder Wedel bekommt einen eigenen Umriss, damit sie sich sichtbar voneinander abheben.
 */
export function makePalm() {
  const g = blank(PALM_W, PALM_H), { x: bx, y: base } = PALM_FOOT;
  const top = 16, bend = rnd(-3.5, 3.5);
  const trunkX = y => Math.round(bx + bend * ((base - y) / (base - top)) ** 2);
  const tx = trunkX(top) + 0.5, ty = top;
  const j = () => rnd(-7, 7);

  // hintere Wedel: dunkler, steil nach oben
  for (const a of [64, 116]) layer(g, l => drawFrond(l, tx, ty, a + j(), rnd(8, 10), rnd(0.05, 0.08), true));

  // Stamm (durchgehend, auch wo er seitlich versetzt)
  layer(g, l => {
    let px = trunkX(base);
    for (let y = base; y >= top; y--) {
      const x = trunkX(y);
      if (x !== px) l[y + 1][x + (x > px ? 0 : 1)] = 'U';
      l[y][x] = y % 3 === 0 ? 'U' : 'T';
      l[y][x + 1] = 'U';
      px = x;
    }
  });

  // vordere Wedel: fächern sternförmig auf, die flachen hängen stärker durch
  const front = [[90, 7, 0.07], [40, 11, 0.07], [140, 11, 0.07], [12, 12, 0.08], [168, 12, 0.08]];
  if (Math.random() < 0.5) front.push([Math.random() < 0.5 ? 62 : 118, 9, 0.08]);
  for (const [a, len, droop] of front)
    layer(g, l => drawFrond(l, tx, ty, a + j(), len + rnd(-1, 1.5), droop + rnd(-0.015, 0.02), false));

  // Kokosnüsse unter der Krone
  const cx = Math.floor(tx);
  layer(g, l => {
    for (const [x, y] of [[cx - 1, ty + 2], [cx + 1, ty + 2], [cx, ty + 3]]) l[y][x] = 'c';
    l[ty + 2][cx - 1] = 'C';
  });

  // ein Wedel nach vorn, über Stamm und Kokosnüssen
  const lean = rnd(0.3, 0.7) * (Math.random() < 0.5 ? -1 : 1);
  layer(g, l => drawFacingFrond(l, Math.floor(tx), ty + 1, lean, Math.round(rnd(8, 10))));

  return toCanvas(g, PALM_COLORS);
}
