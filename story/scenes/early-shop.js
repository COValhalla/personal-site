/*
 * Tutorial, moment 3: the family business's packing room in the holiday rush.
 * Flat boxes fold up, fill and get taped at the table, then stack by the door, each a little faster, while the ORDERS count climbs.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { mix, rect, text, textWidth, bevel, shadow, vdither, darker, lighter } = Draw;

  const CARD = '#c9965a', CARD_LIGHT = '#d8a96c', CARD_SHADE = '#a8703c';
  const WOOD = '#a96b3e', WOOD_DARK = '#7a4a2a', WOOD_LIGHT = '#c98a58';

  Scenes.add('early-shop', {
    heroX: 92,
    // Out of the snow, the room opens from its left side and the hero walks in there.
    enter: { x: 0, y: 44 },
    arrive: -16,
    door: { x: 146, y: 44 },
    draw(ctx, c) {
      // Plank walls with a teal stripe and a wooden floor, the walls lit from above.
      vdither(ctx, '#f8efdc', '#eadbbb', 0, 0, W, GROUND, 4);
      for (let x = 9; x < W; x += 10) {
        rect(ctx, '#e4d3b2', x, 0, 1, GROUND);
        rect(ctx, '#fbf5e8', x + 1, 0, 1, GROUND);
      }
      rect(ctx, mix(c.light, '#f1e4c9', 0.35), 0, 42, W, 3);
      rect(ctx, lighter(c.light, 0.3), 0, 42, W, 1);
      rect(ctx, darker(c.light, 0.15), 0, 44, W, 1);
      rect(ctx, '#e4d3b2', 0, GROUND - 3, W, 3);
      rect(ctx, '#d6bf99', 0, GROUND - 3, W, 1);
      vdither(ctx, '#c9965a', '#a8703c', 0, GROUND, W, H - GROUND, 3);
      rect(ctx, '#dba96c', 0, GROUND, W, 1);
      for (let x = 3; x < W; x += 13) rect(ctx, '#b87a44', x, GROUND + 3, 4, 1);
      // Shelves of our products, wrapped and ready to pack.
      [22, 36].forEach(y => {
        rect(ctx, WOOD, 4, y, 50, 2);
        rect(ctx, WOOD_LIGHT, 4, y, 50, 1);
        rect(ctx, WOOD_DARK, 4, y + 2, 50, 1);
        shadow(ctx, '#8c6a4e', 4, y, 50, 2);
        for (let x = 6; x < 50; x += 8) {
          rect(ctx, N.o, x - 1, y - 6, 8, 6);
          vdither(ctx, '#ffffff', '#e6e0d2', x, y - 5, 6, 4, 2);
          rect(ctx, '#d6cfbf', x, y - 2, 6, 1);
          rect(ctx, c.base, x + 2, y - 5, 2, 4);
          rect(ctx, lighter(c.base, 0.35), x + 2, y - 5, 1, 4);
        }
      });
      rect(ctx, WOOD_DARK, 5, 22, 1, 20);
      rect(ctx, WOOD_DARK, 52, 22, 1, 20);
      // The packing table, with flat boxes stacked at one end.
      rect(ctx, N.o, 2, 49, 62, 1);
      rect(ctx, WOOD, 2, 50, 62, 3);
      rect(ctx, WOOD_LIGHT, 2, 50, 62, 1);
      shadow(ctx, '#8c6a4e', 2, 50, 62, 3);
      rect(ctx, WOOD_DARK, 4, 53, 2, GROUND - 53);
      rect(ctx, WOOD_DARK, 58, 53, 2, GROUND - 53);
      rect(ctx, '#5a3219', 6, 53, 1, GROUND - 53);
      for (let k = 0; k < 4; k++) {
        rect(ctx, N.o, 5, 48 - k * 2, 18, 1);
        rect(ctx, k % 2 ? CARD : CARD_LIGHT, 5, 47 - k * 2, 18, 1);
        rect(ctx, CARD_SHADE, 5, 47 - k * 2, 1, 1);
      }
      // The order board.
      rect(ctx, N.n, 100, 9, 30, 19);
      bevel(ctx, '#7d8072', N.n, 100, 9, 30, 19);
      vdither(ctx, '#ffffff', '#eceae2', 101, 10, 28, 17, 3);
      text(ctx, 'ORDERS', 104, 12, c.shade);
      rect(ctx, '#d9dcd6', 103, 18, 24, 1);
      shadow(ctx, '#8c6a4e', 100, 9, 30, 19);
      // The shipping door the camera dives through.
      rect(ctx, N.o, 135, 18, 22, GROUND - 18);
      vdither(ctx, c.light, c.shade, 136, 19, 20, GROUND - 19, 3);
      rect(ctx, c.light, 136, 19, 20, 1);
      rect(ctx, c.base, 138, 21, 16, 18);
      rect(ctx, c.base, 138, 42, 16, 19);
      rect(ctx, lighter(c.base, 0.3), 138, 21, 16, 1);
      rect(ctx, lighter(c.base, 0.3), 138, 42, 16, 1);
      rect(ctx, darker(c.base, 0.25), 138, 60, 16, 1);
      rect(ctx, N.m, 152, 42, 2, 2);
      text(ctx, 'OUT', 141, 26, N.w);
    },
    init: () => ({ packed: 0 }),
    frame(ctx, c, s, t) {
      // A string of holiday lights along the top, blinking in turns.
      const bulbs = ['#e0533d', '#f2c94c', '#4fb06b', '#3fa9f5'];
      for (let x = 0; x < W; x++) rect(ctx, '#5f5b6b', x, 3 + Math.round(Math.abs(Math.sin(x / 13)) * 2), 1, 1);
      for (let x = 4; x < W; x += 8) {
        const y = 4 + Math.round(Math.abs(Math.sin(x / 13)) * 2);
        const k = (x / 8) | 0;
        const lit = (k + Math.floor(t * 2)) % 2;
        if (lit) {
          rect(ctx, lighter(bulbs[k % 4], 0.25), x - 1, y - 1, 4, 4);
          rect(ctx, mix(bulbs[k % 4], '#ffffff', 0.5), x, y, 2, 2);
        } else {
          rect(ctx, bulbs[k % 4], x, y, 2, 2);
        }
      }
      const packed = Math.max(0, Math.min(8, s.packed));
      const done = Math.floor(packed + 0.0001);
      // The boxes packed so far, stacked two wide by the door.
      for (let k = 0; k < done; k++) {
        const x = 114 + (k % 2) * 10;
        const y = GROUND - 8 - Math.floor(k / 2) * 7;
        rect(ctx, N.o, x, y, 10, 8);
        vdither(ctx, CARD_LIGHT, CARD_SHADE, x + 1, y + 1, 8, 6, 3);
        rect(ctx, CARD_LIGHT, x + 1, y + 1, 8, 1);
        rect(ctx, c.base, x + 4, y + 1, 2, 6);
        rect(ctx, lighter(c.base, 0.3), x + 4, y + 1, 1, 6);
      }
      // The box on the table: it folds up, the products go in, and the tape goes on. Then the next one.
      const phase = done >= 8 ? 1 : packed - done;
      const bx = 36;
      const tall = phase < 0.35 ? 1 + Math.round((phase / 0.35) * 7) : 8;
      rect(ctx, N.o, bx, 49 - tall, 14, tall);
      vdither(ctx, CARD_LIGHT, CARD, bx + 1, 49 - tall + 1, 12, tall - 1, 3);
      if (phase >= 0.35 && phase < 0.75) {
        // Open: the flaps stand up and the products drop in.
        rect(ctx, '#7a5530', bx + 1, 42, 12, 1);
        rect(ctx, CARD_LIGHT, bx - 2, 39, 3, 1);
        rect(ctx, CARD_LIGHT, bx + 13, 39, 3, 1);
        const filled = Math.round(((phase - 0.35) / 0.4) * 2);
        for (let k = 0; k < filled; k++) {
          rect(ctx, N.o, bx + 2 + k * 5, 39, 5, 4);
          rect(ctx, N.w, bx + 3 + k * 5, 40, 3, 2);
          rect(ctx, '#d9dcd6', bx + 3 + k * 5, 41, 3, 1);
        }
      } else if (phase >= 0.75) {
        // Closed and taped.
        rect(ctx, CARD_LIGHT, bx + 1, 42, 12, 1);
        rect(ctx, c.base, bx + 6, 42, 2, 6);
        rect(ctx, lighter(c.base, 0.3), bx + 6, 42, 1, 6);
      }
      // The count of orders out the door.
      const orders = String(done * 6);
      text(ctx, orders, 115 - textWidth(orders) / 2, 20, c.base);
    },
    cues: {
      // Each box goes a little faster than the last.
      pack: s => gsap.timeline().fromTo(s, { packed: 0 }, { packed: 8, duration: 2.6, ease: 'power1.in' }),
    },
  });
})();
