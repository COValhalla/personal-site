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

  // Ordered dither: a 4 x 4 Bayer matrix, thresholds 0 to 15, for blends that read as a pattern.
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const lighter = (c, t) => mix(c, '#ffffff', t);
  const darker = (c, t) => mix(c, '#1d1b22', t);

  // A vertical blend from a to b over h rows from y, in steps bands with dither where two bands meet.
  function vdither(ctx, a, b, x, y, w, h, steps = 4) {
    for (let Y = y; Y < y + h; Y++) for (let X = x; X < x + w; X++) {
      const t = (Y - y) / Math.max(1, h - 1);
      const v = Math.min(steps, Math.floor(t * steps + BAYER[Y % 4][X % 4] / 16));
      rect(ctx, mix(a, b, v / steps), X, Y, 1, 1);
    }
  }

  // A raised 1px edge: light on the top and left, shade on the bottom and right.
  function bevel(ctx, hi, lo, x, y, w, h) {
    rect(ctx, hi, x, y, w, 1); rect(ctx, hi, x, y, 1, h);
    rect(ctx, lo, x, y + h - 1, w, 1); rect(ctx, lo, x + w - 1, y, 1, h);
  }

  // A drop shadow: a band of shade just below and to the right of a box.
  function shadow(ctx, color, x, y, w, h, off = 1) {
    rect(ctx, color, x + off, y + h, w, off); rect(ctx, color, x + w, y + off, off, h);
  }

  // A filled circle centred on a point that may sit between pixels.
  function disc(ctx, color, cx, cy, r) {
    ctx.fillStyle = color;
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
      const dx = i + 0.5 - cx, dy = j + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) ctx.fillRect(i, j, 1, 1);
    }
  }

  // A soft pool of light: 1 at its centre, falling to 0 at its rim.
  const pool = (cx, cy, rx, ry) => (x, y) => 1 - Math.hypot((x - cx) / rx, (y - cy) / ry);

  // Light laid over what is drawn: the shape's falloff is cut into bands, each dithered and a step stronger, up to strength.
  function glow(ctx, color, shape, x, y, w, h, bands, strength) {
    for (let Y = y; Y < y + h; Y++) for (let X = x; X < x + w; X++) {
      const f = shape(X + 0.5, Y + 0.5);
      if (f <= 0) continue;
      const level = Math.min(bands, Math.floor(f * bands + BAYER[Y % 4][X % 4] / 16));
      if (level <= 0) continue;
      ctx.globalAlpha = strength * level / bands;
      rect(ctx, color, X, Y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // Night as a palette shift, not a dark sheet: colors move toward moonlit blue, and each light pulls the colors
  // under it back toward its own tint. The light is banded by ordered dither, as 16-bit games did.
  function nightPass(img, lights, skip) {
    const { width: w, height: h, data: d } = img;
    const out = new ImageData(new Uint8ClampedArray(d), w, h);
    const o = out.data;
    for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
      if (skip && skip(X, Y)) continue;
      const i = (Y * w + X) * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = 0.3 * r + 0.59 * g + 0.11 * b;
      let nr = r * 0.22 + lum * 0.1 + 10, ng = g * 0.26 + lum * 0.12 + 12, nb = b * 0.42 + lum * 0.18 + 34;
      let lr = 0, lg = 0, lb = 0, total = 0;
      for (const L of lights) {
        const f0 = L.shape(X + 0.5, Y + 0.5);
        if (f0 <= 0) continue;
        const f = Math.min(1, Math.floor(f0 * 3 + BAYER[Y % 4][X % 4] / 16) / 3) * L.power;
        lr += f * L.tint[0]; lg += f * L.tint[1]; lb += f * L.tint[2]; total += f;
      }
      if (total > 0) {
        const a = Math.min(1, total);
        nr += (r * lr / total - nr) * a; ng += (g * lg / total - ng) * a; nb += (b * lb / total - nb) * a;
      }
      o[i] = nr; o[i + 1] = ng; o[i + 2] = nb;
    }
    return out;
  }

  // The SNES's 15-bit color: each channel keeps its top five bits, with its low bits copied from them.
  function quantize(img) {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) for (let j = 0; j < 3; j++) d[i + j] = (d[i + j] & 0xf8) | (d[i + j] >> 5);
    return img;
  }

  // Image a with the pixels that fall under a fraction t of the Bayer matrix taken from b.
  function dissolve(a, b, t) {
    const out = new ImageData(new Uint8ClampedArray(a.data), a.width, a.height);
    const o = out.data, s = b.data;
    for (let Y = 0; Y < a.height; Y++) for (let X = 0; X < a.width; X++) {
      if (BAYER[Y % 4][X % 4] / 16 >= t) continue;
      const i = (Y * a.width + X) * 4;
      o[i] = s[i]; o[i + 1] = s[i + 1]; o[i + 2] = s[i + 2];
    }
    return out;
  }

  window.Draw = {
    rng, mix, rect, text, textWidth, sprite, outline, puff, steps4, blink,
    lighter, darker, vdither, bevel, shadow, disc, pool, glow, nightPass, quantize, dissolve };
})();
