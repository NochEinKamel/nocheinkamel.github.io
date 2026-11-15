/**
 * Gemeinsamer, veränderlicher Zustand der Szene.
 * Alle Koordinaten in Welt-Pixeln (vor der Skalierung um S).
 */
export const state = {
  // Viewport
  W: 0,      // Weltbreite in Pixeln
  H: 0,      // Welthöhe in Pixeln
  S: 2,      // Skalierungsfaktor Welt -> CSS-Pixel
  DPR: 1,    // devicePixelRatio (gedeckelt)
  time: 0,   // laufende Zeit in Sekunden

  // Welt
  bg: null,       // vorgerenderter Hintergrund
  pond: null,     // {cx, cy, rx, ry}
  decor: [],      // Palmen, Kakteen, Felsen
  waterPx: [],    // flaches [x0,y0,x1,y1,...] aller Wasserpixel

  // Bewohner & Effekte
  camels: [],
  prints: [],
  hearts: [],
  weeds: [],

  // Interaktion
  selected: null,
  selT: 0,
  hovered: null,
};
