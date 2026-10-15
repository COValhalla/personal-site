/*
 * Tutorial, moment 1: a bedroom at night. The lights drop in four steps, and the computer glows with an inventory.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, mix, rect, outline, steps4 } = Draw;

  Scenes.add('early-night', {
    heroX: 104,
    arrive: 50,
    door: { x: 135, y: 39 },
    draw(ctx, c) {
      rect(ctx, '#f3e3c4', 0, 0, W, GROUND);
      for (let x = 0; x < W; x += 16) rect(ctx, '#ecd7b0', x, 0, 1, GROUND);
      rect(ctx, '#c98a55', 0, GROUND, W, H - GROUND);
      rect(ctx, '#e0a46f', 0, GROUND, W, 1);
      rect(ctx, '#cfe6f7', 56, 8, 24, 18);
      outline(ctx, 56, 8, 24, 18, N.o);
      rect(ctx, N.o, 68, 8, 1, 18);
      rect(ctx, N.o, 56, 16, 24, 1);
      rect(ctx, c.base, 92, 10, 12, 16);
      rect(ctx, c.light, 94, 12, 8, 4);
      rect(ctx, c.shade, 6, 38, 3, 26);
      rect(ctx, '#f6f4ef', 9, 50, 32, 8);
      rect(ctx, c.base, 16, 48, 25, 10);
      rect(ctx, c.light, 16, 48, 25, 1);
      rect(ctx, N.w, 9, 47, 6, 4);
      rect(ctx, '#a96b3e', 116, 44, 36, 3);
      rect(ctx, '#a96b3e', 118, 47, 2, 17);
      rect(ctx, '#a96b3e', 148, 47, 2, 17);
      rect(ctx, N.o, 124, 30, 22, 14);
      rect(ctx, N.o, 134, 43, 4, 1);
      rect(ctx, c.base, 146, 36, 4, 4);
      rect(ctx, N.o, 148, 40, 1, 4);
    },
    init: () => ({ dark: 0, screen: 0 }),
    frame(ctx, c, s, t) {
      const dark = steps4(s.dark);
      if (dark > 0) {
        ctx.globalAlpha = dark * 0.72;
        rect(ctx, '#0d1030', 0, 0, W, GROUND);
        ctx.globalAlpha = 1;
        if (dark >= 0.5) {
          const r = rng(4);
          for (let i = 0; i < 8; i++) rect(ctx, '#f6f4ef', 58 + Math.floor(r() * 20), 10 + Math.floor(r() * 14), 1, 1);
        }
      }
      const glow = steps4(s.screen);
      rect(ctx, mix('#2a1416', '#9fd8ff', glow), 126, 32, 18, 10);
      if (glow >= 0.5) {
        for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) {
          const shade = [c.light, c.base, N.w][(i + j + Math.floor(t * 3)) % 3];
          rect(ctx, shade, 128 + i * 3, 34 + j * 3, 2, 2);
        }
      }
    },
    cues: {
      night: s => gsap.timeline().to(s, { dark: 1, duration: 1.2, ease: 'steps(4)' }).to(s, { screen: 1, duration: 0.6, ease: 'steps(2)' }, 1.2),
    },
  });
})();
