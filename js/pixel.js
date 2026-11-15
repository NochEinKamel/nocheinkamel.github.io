/** Kleine Helfer für Zufall, Farben und Pixel-Raster. */

export const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

/** rnd(a) -> [0,a), rnd(a,b) -> [a,b) */
export const rnd = (a, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);

export const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
export const gridFrom = rows => rows.map(r => r.split(''));
export const mirror = g => g.map(r => r.slice().reverse());

export const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

export function segDist(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - x0 - t * dx, py - y0 - t * dy);
}

export function paint(g, test, ch) {
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++)
      if (test(x, y)) g[y][x] = ch;
}

/** Umrandet alle nicht-leeren Pixel mit `ch`. */
export function outline(g, ch = 'k') {
  const h = g.length, w = g[0].length, n = g.map(r => r.slice());
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (g[y][x] !== '.') continue;
    if ((y > 0 && g[y - 1][x] !== '.') || (y < h - 1 && g[y + 1][x] !== '.') ||
        (x > 0 && g[y][x - 1] !== '.') || (x < w - 1 && g[y][x + 1] !== '.')) n[y][x] = ch;
  }
  return n;
}

/** Rendert ein Zeichen-Raster mit Farbtabelle (oder Einzelfarbe) auf ein Canvas. */
export function toCanvas(g, colors) {
  const c = document.createElement('canvas');
  c.width = g[0].length;
  c.height = g.length;
  const x = c.getContext('2d');
  for (let r = 0; r < g.length; r++) for (let k = 0; k < g[0].length; k++) {
    const ch = g[r][k];
    if (ch === '.') continue;
    x.fillStyle = typeof colors === 'string' ? colors : colors[ch];
    x.fillRect(k, r, 1, 1);
  }
  return c;
}

export function pxEllipse(ctx, cx, cy, rx, ry, style) {
  ctx.fillStyle = style;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
    if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
}

/** Glatter Value-Noise, liefert f(x, y) -> [0,1]. */
export function makeNoise(w, h, cell) {
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2;
  const g = new Float32Array(gw * gh).map(() => Math.random());
  return (x, y) => {
    const fx = x / cell, fy = y / cell, ix = fx | 0, iy = fy | 0;
    let tx = fx - ix, ty = fy - iy;
    tx = tx * tx * (3 - 2 * tx);
    ty = ty * ty * (3 - 2 * ty);
    const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}
