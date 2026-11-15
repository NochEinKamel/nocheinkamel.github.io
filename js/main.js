/** Einstiegspunkt: Setup, Eingabe, Resize und Game-Loop. */
import { state } from './state.js';
import { rnd } from './pixel.js';
import { camelBox } from './sprites.js';
import { buildWorld } from './world.js';
import { spawnInitial, spawnFromEdge, relocateCamels, updateCamel, pet } from './camels.js';
import { Renderer } from './render.js';

const canvas = document.getElementById('c');
const countEl = document.getElementById('count');
const hintEl = document.getElementById('hint');
const addBtn = document.getElementById('add');

const renderer = new Renderer(canvas);
let weedT = 8;

const hideHint = () => hintEl.classList.add('hidden');

function updateCount() {
  const n = state.camels.length;
  countEl.textContent = `${n} ${n === 1 ? 'Kamel' : 'Kamele'}`;
}

/* ---------- Loop ---------- */

function tickList(list, dt, maxT) {
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].t += dt;
    if (list[i].t > maxT) list.splice(i, 1);
  }
}

function update(dt) {
  state.time += dt;
  for (const c of state.camels) updateCamel(c, dt);
  tickList(state.prints, dt, 30);
  tickList(state.hearts, dt, 1.4);

  weedT -= dt;
  if (weedT <= 0) {
    weedT = rnd(18, 40);
    state.weeds.push({ x: -8, y: rnd(20, state.H - 10), vx: rnd(22, 34), b: 0 });
  }
  for (let i = state.weeds.length - 1; i >= 0; i--) {
    const w = state.weeds[i];
    w.x += w.vx * dt;
    w.b += dt * 7;
    if (w.x > state.W + 10) state.weeds.splice(i, 1);
  }

  if (state.selected) {
    state.selT -= dt;
    if (state.selT <= 0) state.selected = null;
  }
}

let last = performance.now();
function frame(now) {
  update(Math.min(0.05, (now - last) / 1000));
  last = now;
  renderer.render();
  requestAnimationFrame(frame);
}

/* ---------- Eingabe ---------- */

function camelAt(ex, ey) {
  const px = ex / state.S, py = ey / state.S;
  const hits = state.camels.filter(c => {
    const b = camelBox(c);
    return px >= b.x - 2 && px <= b.x + b.w + 2 && py >= b.y - 2 && py <= b.y + b.h + 2;
  });
  hits.sort((a, b) => b.y - a.y);
  return hits[0] ?? null;
}

canvas.addEventListener('pointerdown', e => {
  const c = camelAt(e.clientX, e.clientY);
  state.selected = c;
  if (c) {
    state.selT = 5;
    pet(c);
    hideHint();
  }
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') state.hovered = camelAt(e.clientX, e.clientY);
});
canvas.addEventListener('pointerleave', () => { state.hovered = null; });
addBtn.addEventListener('click', () => { if (spawnFromEdge()) updateCount(); });

/* ---------- Resize ---------- */

function resize(first) {
  const iw = innerWidth, ih = innerHeight;
  state.DPR = Math.min(2, devicePixelRatio || 1);
  state.S = Math.max(2, Math.round(Math.min(iw, ih) / 170));
  state.W = Math.ceil(iw / state.S);
  state.H = Math.ceil(ih / state.S);
  renderer.resize(iw, ih);
  buildWorld();
  state.prints.length = 0;
  if (first) spawnInitial();
  else relocateCamels();
  updateCount();
}

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => resize(false), 200);
});

resize(true);
setTimeout(hideHint, 9000);
requestAnimationFrame(frame);
