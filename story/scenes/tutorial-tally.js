/*
 * Tutorial, completion: the tally of the Tutorial, one row for each moment's item, then the new class.
 * GAMES gets a star, TYPING the race's 1ST, ORDERS counts up to the packing room's 48, then KEYBOARD KID shows.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rect, text, textWidth, bevel, shadow, vdither, darker, lighter } = Draw;

  // The packing room's ORDERS count once its eight boxes are out the door.
  const ORDERS = 48;
  const ROWS = [
    { sprite: 'floppy', label: 'GAMES', y: 20 },
    { sprite: 'keyboard', label: 'TYPING', y: 33 },
    { sprite: 'box', label: 'ORDERS', y: 46 },
  ];
  const RIGHT = 148;
  const PANEL = '#2a3a6a';

  function star(ctx, x, y, color) {
    rect(ctx, color, x + 2, y, 1, 5);
    rect(ctx, color, x, y + 2, 5, 1);
    rect(ctx, color, x + 1, y + 1, 3, 3);
  }

  Scenes.add('tutorial-tally', {
    heroX: 22,
    draw(ctx, c) {
      vdither(ctx, '#2a3263', '#171b35', 0, 0, W, H, 4);
      for (let y = 0; y < H; y += 8) rect(ctx, '#323a6a', 0, y, W, 1);
      shadow(ctx, '#0d0f1f', 48, 4, 106, 60, 2);
      rect(ctx, N.o, 48, 4, 106, 60);
      vdither(ctx, '#34497e', '#222d58', 50, 6, 102, 56, 4);
      bevel(ctx, lighter(PANEL, 0.4), '#131a33', 49, 5, 104, 58);
      rect(ctx, c.base, 50, 6, 102, 9);
      rect(ctx, lighter(c.base, 0.35), 50, 6, 102, 1);
      rect(ctx, darker(c.base, 0.3), 50, 14, 102, 1);
      text(ctx, 'TUTORIAL TALLY', 54, 8, N.o);
    },
    init: () => ({ rows: 0, orders: 0, kid: 0 }),
    frame(ctx, c, s, t) {
      const shown = Math.floor(Math.max(0, Math.min(3, s.rows)) + 0.0001);
      ROWS.slice(0, shown).forEach((row, k) => {
        Pixel.paint(ctx, Pixel.ITEMS[row.sprite], c, 52, row.y - 5, 1);
        text(ctx, row.label, 70, row.y + 1, N.w);
        const value = k === 1 ? '1ST' : k === 2 ? String(Math.round(s.orders)) : '';
        const valueAt = k === 0 ? RIGHT - 5 : RIGHT - textWidth(value);
        for (let x = 70 + textWidth(row.label) + 3; x < valueAt - 2; x += 2) rect(ctx, '#4a5a8a', x, row.y + 5, 1, 1);
        if (k === 0) star(ctx, RIGHT - 5, row.y + 1, c.light);
        else text(ctx, value, valueAt, row.y + 1, c.light);
      });
      if (s.kid >= 0.5) {
        const name = 'KEYBOARD KID';
        const x = 101 - Math.round(textWidth(name) / 2);
        text(ctx, name, x, 56, c.light);
        const twinkle = Math.floor(t * 3) % 2 ? c.base : c.light;
        star(ctx, x - 8, 56, twinkle);
        star(ctx, x + textWidth(name) + 3, 56, twinkle);
      }
    },
    cues: {
      // The rows come in one by one, the orders count up, then the new class shows.
      equip: s => gsap.timeline()
        .to(s, { rows: 3, duration: 0.9, ease: 'steps(3)' })
        .to(s, { orders: ORDERS, duration: 0.6, ease: 'power1.out' }, 0.9)
        .to(s, { kid: 1, duration: 0.01 }, 1.6),
    },
  });
})();
