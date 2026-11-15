/** Zeichnet die Welt in niedriger Auflösung und skaliert pixelgenau auf das sichtbare Canvas. */
import { state } from './state.js';
import { CAMEL_SPRITES, CAMEL_SHADOWS, HEART, WEED, camelBox } from './sprites.js';
import { camelFrame, STATUS } from './camels.js';

const FONT = "'Press Start 2P', monospace";

export class Renderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.work = document.createElement('canvas');
    this.wctx = this.work.getContext('2d');
  }

  resize(cssW, cssH) {
    const { W, H, DPR } = state;
    this.work.width = W;
    this.work.height = H;
    this.canvas.width = Math.round(cssW * DPR);
    this.canvas.height = Math.round(cssH * DPR);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  render() {
    const { W, H, S, DPR } = state;
    this.#drawWorld();

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.work, 0, 0, W * S * DPR, H * S * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const labeled = new Set([state.selected, state.hovered].filter(Boolean));
    for (const c of labeled) this.#drawLabel(c, c === state.selected);
  }

  #drawWorld() {
    const wx = this.wctx, { time, camels, prints, hearts, weeds, decor, waterPx } = state;
    wx.drawImage(state.bg, 0, 0);

    // Glitzern auf dem Wasser
    const nW = waterPx.length / 2, tick = Math.floor(time * 2.5);
    wx.fillStyle = '#e2f6ff';
    for (let i = 0; i < Math.max(3, nW / 90); i++) {
      const k = ((i * 7919 + tick * 104729 + i * i * 31) % nW) * 2;
      wx.fillRect(waterPx[k], waterPx[k + 1], 1, 1);
    }

    // Fußspuren
    for (const p of prints) {
      wx.fillStyle = `rgba(140,90,45,${0.38 * (1 - p.t / 30)})`;
      wx.fillRect(p.x, p.y, 1, 1);
    }

    // Kamel-Schatten
    for (const c of camels) {
      const sh = CAMEL_SHADOWS[c.dir];
      const off = c.dir % 2 ? 0 : (c.dir === 0 ? -1 : 1);
      wx.drawImage(sh, Math.round(c.x) - (sh.width >> 1) + off, Math.round(c.y) - 1);
    }

    // Alles mit Tiefe, sortiert nach Fußpunkt
    const ents = [
      ...decor.map(d => ({ base: d.base, draw: () => wx.drawImage(d.img, d.dx, d.dy) })),
      ...camels.map(c => ({ base: c.y, draw: () => this.#drawCamel(c) })),
      ...weeds.map(w => ({ base: w.y, draw: () => this.#drawWeed(w) })),
    ];
    ents.sort((a, b) => a.base - b.base).forEach(e => e.draw());

    for (const h of hearts) {
      wx.globalAlpha = Math.min(1, (1.4 - h.t) * 2);
      wx.drawImage(HEART, Math.round(h.x - 3), Math.round(h.y - 14 - h.t * 10));
    }
    wx.globalAlpha = 1;
  }

  #drawCamel(c) {
    const wx = this.wctx, b = camelBox(c);
    wx.drawImage(CAMEL_SPRITES[c.pal][c.dir][camelFrame(c)][c.tail], b.x, b.y);
    if (c.state === 'drink' && Math.floor(state.time * 1.6) % 2 === 0) {
      const hx = Math.round(c.x + (c.dir === 0 ? 12 : -12)), hy = Math.round(c.y - 1);
      wx.fillStyle = '#e2f6ff';
      wx.fillRect(hx - 2, hy, 1, 1);
      wx.fillRect(hx + 2, hy, 1, 1);
    }
  }

  #drawWeed(w) {
    const wx = this.wctx;
    wx.fillStyle = 'rgba(120,70,30,0.22)';
    wx.fillRect(Math.round(w.x - 2), Math.round(w.y), 5, 1);
    wx.drawImage(WEED[Math.floor(w.x / 3) & 1], Math.round(w.x - 3), Math.round(w.y - 6 - Math.abs(Math.sin(w.b)) * 4));
  }

  #drawLabel(c, full) {
    const ctx = this.ctx, { S } = state;
    const b = camelBox(c), cx = c.x * S, top = b.y * S - 10;
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const l1 = c.name, l2 = full ? STATUS[c.state] : '';
    const w = Math.max(ctx.measureText(l1).width, l2 ? ctx.measureText(l2).width * 0.8 : 0) + 16;
    const h = full ? 36 : 22;
    const x = Math.round(cx - w / 2), y = Math.round(top - h);
    ctx.fillStyle = '#5a3418'; ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = '#fff3d6'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#5a3418'; ctx.fillText(l1, Math.round(cx), y + 6);
    if (l2) {
      ctx.font = `8px ${FONT}`;
      ctx.fillStyle = '#a86f37';
      ctx.fillText(l2, Math.round(cx), y + 21);
    }
  }
}
