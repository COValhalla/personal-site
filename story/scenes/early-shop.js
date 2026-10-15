/*
 * Tutorial, moment 3: the family business's packing room in the holiday rush.
 * Flat boxes fold up, fill and get taped at the table, then stack by the door, each a little faster, while the ORDERS count climbs.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { mix, rect, text, textWidth } = Draw;

  Scenes.add('early-shop', {
    heroX: 92,
    door: { x: 146, y: 44 },
    draw(ctx, c) {
      // Plank walls with a teal stripe, and a wooden floor.
      rect(ctx, '#f1e4c9', 0, 0, W, GROUND);
      for (let x = 9; x < W; x += 10) rect(ctx, '#e4d3b2', x, 0, 1, GROUND);
      rect(ctx, mix(c.light, '#f1e4c9', 0.35), 0, 42, W, 3);
      rect(ctx, '#e4d3b2', 0, GROUND - 3, W, 3);
      rect(ctx, '#b7834f', 0, GROUND, W, H - GROUND);
      rect(ctx, '#c9965a', 0, GROUND, W, 1);
      // Shelves of our products, wrapped and ready to pack.
      [22, 36].forEach(y => {
        rect(ctx, '#8c5a32', 4, y, 50, 2);
        rect(ctx, '#6b4226', 4, y + 2, 50, 1);
        for (let x = 6; x < 50; x += 8) {
          rect(ctx, N.o, x - 1, y - 6, 8, 6);
          rect(ctx, N.w, x, y - 5, 6, 4);
          rect(ctx, '#d6cfbf', x, y - 2, 6, 1);
          rect(ctx, c.base, x + 2, y - 5, 2, 4);
        }
      });
      rect(ctx, '#6b4226', 5, 22, 1, 20);
      rect(ctx, '#6b4226', 52, 22, 1, 20);
      // The packing table, with flat boxes stacked at one end.
      rect(ctx, N.o, 2, 49, 62, 1);
      rect(ctx, '#a96b3e', 2, 50, 62, 3);
      rect(ctx, '#8c5a32', 4, 53, 2, GROUND - 53);
      rect(ctx, '#8c5a32', 58, 53, 2, GROUND - 53);
      for (let k = 0; k < 4; k++) {
        rect(ctx, N.o, 5, 48 - k * 2, 18, 1);
        rect(ctx, k % 2 ? '#c9965a' : '#d8a96c', 5, 47 - k * 2, 18, 1);
      }
      // The order board.
      rect(ctx, N.n, 100, 9, 30, 19);
      rect(ctx, N.w, 101, 10, 28, 17);
      text(ctx, 'ORDERS', 104, 12, c.shade);
      rect(ctx, '#d9dcd6', 103, 18, 24, 1);
      // The shipping door the camera dives through.
      rect(ctx, N.o, 135, 18, 22, GROUND - 18);
      rect(ctx, c.shade, 136, 19, 20, GROUND - 19);
      rect(ctx, c.base, 138, 21, 16, 18);
      rect(ctx, c.base, 138, 42, 16, 19);
      rect(ctx, N.m, 152, 42, 2, 2);
      text(ctx, 'OUT', 141, 26, N.w);
    },
    init: () => ({ packed: 0 }),
    frame(ctx, c, s, t) {
      const card = '#c9965a';
      const cardLight = '#d8a96c';
      // A string of holiday lights along the top, blinking in turns.
      const bulbs = ['#e0533d', '#f2c94c', '#4fb06b', '#3fa9f5'];
      for (let x = 0; x < W; x++) rect(ctx, '#5f5b6b', x, 3 + Math.round(Math.abs(Math.sin(x / 13)) * 2), 1, 1);
      for (let x = 4; x < W; x += 8) {
        const y = 4 + Math.round(Math.abs(Math.sin(x / 13)) * 2);
        const k = (x / 8) | 0;
        rect(ctx, (k + Math.floor(t * 2)) % 2 ? bulbs[k % 4] : mix(bulbs[k % 4], '#ffffff', 0.5), x, y, 2, 2);
      }
      const packed = Math.max(0, Math.min(8, s.packed));
      const done = Math.floor(packed + 0.0001);
      // The boxes packed so far, stacked two wide by the door.
      for (let k = 0; k < done; k++) {
        const x = 114 + (k % 2) * 10;
        const y = GROUND - 8 - Math.floor(k / 2) * 7;
        rect(ctx, N.o, x, y, 10, 8);
        rect(ctx, card, x + 1, y + 1, 8, 6);
        rect(ctx, cardLight, x + 1, y + 1, 8, 1);
        rect(ctx, c.base, x + 4, y + 1, 2, 6);
      }
      // The box on the table: it folds up, the products go in, and the tape goes on. Then the next one.
      const phase = done >= 8 ? 1 : packed - done;
      const bx = 36;
      const tall = phase < 0.35 ? 1 + Math.round((phase / 0.35) * 7) : 8;
      rect(ctx, N.o, bx, 49 - tall, 14, tall);
      rect(ctx, card, bx + 1, 49 - tall + 1, 12, tall - 1);
      if (phase >= 0.35 && phase < 0.75) {
        // Open: the flaps stand up and the products drop in.
        rect(ctx, '#7a5530', bx + 1, 42, 12, 1);
        rect(ctx, cardLight, bx - 2, 39, 3, 1);
        rect(ctx, cardLight, bx + 13, 39, 3, 1);
        const filled = Math.round(((phase - 0.35) / 0.4) * 2);
        for (let k = 0; k < filled; k++) {
          rect(ctx, N.o, bx + 2 + k * 5, 39, 5, 4);
          rect(ctx, N.w, bx + 3 + k * 5, 40, 3, 2);
        }
      } else if (phase >= 0.75) {
        // Closed and taped.
        rect(ctx, cardLight, bx + 1, 42, 12, 1);
        rect(ctx, c.base, bx + 6, 42, 2, 6);
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
