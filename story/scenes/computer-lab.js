/*
 * Tutorial, moment 2: the school computer lab. Every screen runs the typing race.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rect, text, blink } = Draw;

  Scenes.add('computer-lab', {
    heroX: 98,
    door: { x: 30, y: 20 },
    draw(ctx, c) {
      rect(ctx, '#e3e8e1', 0, 0, W, GROUND);
      rect(ctx, '#d3d9d0', 0, 36, W, 1);
      for (let y = GROUND; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) rect(ctx, '#b9bec4', x, y, 4, 4);
      rect(ctx, '#c8ccd1', 0, GROUND, W, H - GROUND);
      for (let y = GROUND; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) rect(ctx, '#b3b8be', x, y, 4, 4);
      // The board, with the word of the day.
      rect(ctx, '#8c5a32', 6, 6, 50, 28);
      rect(ctx, '#2f5a46', 8, 8, 46, 24);
      text(ctx, 'TYPING', 12, 11, '#e9efe6');
      text(ctx, 'ASDF JKL', 12, 19, '#b9cfc2');
      rect(ctx, '#e9efe6', 44, 30, 6, 1);
      // The clock.
      rect(ctx, N.o, 66, 8, 11, 11);
      rect(ctx, N.w, 67, 9, 9, 9);
      rect(ctx, N.o, 71, 10, 1, 4);
      rect(ctx, N.o, 71, 13, 3, 1);
      // A long desk with four beige computers.
      rect(ctx, '#a96b3e', 62, 46, 96, 3);
      rect(ctx, '#8c5a32', 64, 49, 2, 15);
      rect(ctx, '#8c5a32', 154, 49, 2, 15);
      for (let k = 0; k < 4; k++) {
        const x = 66 + k * 23;
        rect(ctx, N.o, x - 1, 29, 20, 16);
        rect(ctx, '#ddd2b4', x, 30, 18, 14);
        rect(ctx, '#b8ab88', x, 42, 18, 2);
        rect(ctx, '#1b2a86', x + 2, 32, 14, 9);
        rect(ctx, '#ddd2b4', x + 6, 44, 6, 2);
        rect(ctx, N.o, x + 1, 45, 16, 1);
        rect(ctx, '#ece3c8', x + 1, 44, 16, 1);
      }
    },
    init: () => ({ screens: 0, race: 0, star: 0 }),
    frame(ctx, c, s, t) {
      const lit = Math.round(Math.max(0, Math.min(1, s.screens)) * 4);
      for (let k = 0; k < lit; k++) {
        const x = 66 + k * 23;
        rect(ctx, '#2c3f9c', x + 2, 32, 14, 9);
        // Each screen races three little bars; the hero's screen (the third) wins.
        const speed = [0.62, 0.78, 1, 0.7][k];
        [0, 1, 2].forEach(lane => {
          const len = Math.round(Math.min(1, s.race * (lane === 0 ? speed : speed * (0.7 + lane * 0.1))) * 12);
          if (len > 0) rect(ctx, lane === 0 ? (k === 2 ? c.light : N.w) : '#8fa8ff', x + 3, 33 + lane * 3, len, 1);
        });
        if (s.race > 0 && s.race < 1 && blink(t, 4)) rect(ctx, N.w, x + 3 + Math.round(Math.min(1, s.race * speed) * 12), 33, 1, 1);
      }
      if (s.star > 0.5) {
        text(ctx, '1ST', 12, 25, c.light);
        rect(ctx, c.light, 26, 26, 1, 3);
      }
    },
    cues: {
      type: s => gsap.timeline()
        .to(s, { screens: 1, duration: 0.5, ease: 'steps(4)' })
        .to(s, { race: 1, duration: 1.7, ease: 'none' }, 0.4)
        .to(s, { star: 1, duration: 0.01 }, 2.1),
    },
  });
})();
