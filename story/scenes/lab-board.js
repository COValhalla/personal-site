/*
 * Tutorial, completion: the high-score board, up close. Your name goes to the top.
 * Needs: gsap, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const { rect, text, blink } = Draw;

  Scenes.add('lab-board', {
    heroX: 22,
    draw(ctx, c) {
      rect(ctx, '#8c5a32', 0, 0, W, H);
      rect(ctx, '#2f5a46', 4, 4, W - 8, H - 8);
      for (let y = 8; y < H - 8; y += 9) rect(ctx, '#33634d', 6, y, W - 12, 1);
      rect(ctx, '#e9efe6', 6, GROUND, W - 12, 1);
      text(ctx, 'HIGH SCORES', 56, 9, '#e9efe6');
      text(ctx, 'TYPING CLASS', 56, 17, '#b9cfc2');
    },
    init: () => ({ rows: 0, top: 0 }),
    frame(ctx, c, s, t) {
      const rows = [['1ST', 'JOE', c.light], ['2ND', 'MAX', '#e9efe6'], ['3RD', 'KIM', '#e9efe6']];
      const shown = Math.round(Math.max(0, Math.min(1, s.rows)) * 3);
      rows.slice(0, shown).forEach(([place, name, col], k) => {
        text(ctx, place, 56, 30 + k * 9, col);
        text(ctx, name, 74, 30 + k * 9, col);
      });
      if (s.top >= 0.5 && blink(t, 2)) text(ctx, 'KEYBOARD KID', 92, 30, c.light);
    },
    cues: {
      equip: s => gsap.timeline().to(s, { rows: 1, duration: 0.6, ease: 'steps(3)' }).to(s, { top: 1, duration: 0.01 }, 0.7),
    },
  });
})();
