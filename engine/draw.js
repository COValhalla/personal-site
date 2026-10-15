/*
 * The drawing kit: the small pixel helpers every scene and the world map draw
 * with. Each takes the canvas context first and rounds to whole pixels.
 * Needs: Pixel
 */
(function () {
  'use strict';

  // A seeded random number generator (mulberry32), so a scene draws the same every time.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A color part way from a to b, both '#rrggbb'.
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = s => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
    const ca = ch(pa);
    const cb = ch(pb);
    return '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  function rect(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  const text = (ctx, str, x, y, color) => Pixel.text(ctx, str, Math.round(x), Math.round(y), color, 1);
  const textWidth = str => String(str).length * 4 - 1;

  // A small prop: rows of characters, each mapped to a color by map.
  function sprite(ctx, rows, x, y, map, flip) {
    const w = rows[0].length;
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const color = map[ch];
      if (color) rect(ctx, color, x + (flip ? w - 1 - i : i), y + j, 1, 1);
    }));
  }

  function outline(ctx, x, y, w, h, color) {
    rect(ctx, color, x, y, w, 1);
    rect(ctx, color, x, y + h - 1, w, 1);
    rect(ctx, color, x, y, 1, h);
    rect(ctx, color, x + w - 1, y, 1, h);
  }

  // A filled circle of radius r.
  function puff(ctx, x, y, r, color) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) rect(ctx, color, x + i, y + j, 1, 1);
  }

  // Night falls in four steps, like a palette fade in an old game.
  const steps4 = v => Math.round(Math.max(0, Math.min(1, v)) * 4) / 4;
  const blink = (t, rate) => Math.floor(t * rate) % 2 === 0;

  window.Draw = { rng, mix, rect, text, textWidth, sprite, outline, puff, steps4, blink };
})();
