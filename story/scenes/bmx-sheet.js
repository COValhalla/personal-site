/*
 * Act I, level-up: the character screen, behind the cooler door. The bike and the apron drop into their slots.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rect, text, sprite, outline } = Draw;

  Scenes.add('bmx-sheet', {
    heroX: 26,
    draw(ctx, c) {
      rect(ctx, '#1f2440', 0, 0, W, H);
      for (let y = 0; y < H; y += 8) rect(ctx, '#252b4f', 0, y, W, 1);
      rect(ctx, N.o, 6, 4, 148, 64);
      rect(ctx, '#2a3a6a', 8, 6, 144, 60);
      rect(ctx, c.base, 8, 6, 144, 9);
      text(ctx, 'CREW LEAD', 12, 8, N.o);
      rect(ctx, '#1d1b22', 14, 20, 38, 44);
      outline(ctx, 14, 20, 38, 44, N.n);
      ['HEAD', 'BIKE', 'APRON'].forEach((label, k) => {
        const x = 62 + k * 30;
        rect(ctx, '#1d1b22', x, 20, 26, 18);
        outline(ctx, x, 20, 26, 18, N.n);
        text(ctx, label, x + 2, 42, c.light);
      });
      text(ctx, 'LEVEL 1', 62, 52, N.w);
      text(ctx, 'RIDING  TEACHING', 62, 58, c.light);
    },
    init: () => ({ bike: -1, apron: -1, helmet: 0 }),
    frame(ctx, c, s) {
      if (s.bike > -0.5) Pixel.paint(ctx, Pixel.ITEMS.bike, c, 97, Math.round(21 - (1 - s.bike) * 30), 1);
      if (s.apron > -0.5) Pixel.paint(ctx, Pixel.ITEMS.apron, c, 127, Math.round(21 - (1 - s.apron) * 30), 1);
      if (s.helmet >= 0.5) sprite(ctx, ['.oooooo.', 'obbbbbbo', 'oBBBBBBo', '.oooooo.'], 71, 25, { o: N.o, b: c.light, B: c.base });
    },
    cues: {
      equip: s => gsap.timeline()
        .fromTo(s, { bike: -1 }, { bike: 1, duration: 0.6, ease: 'bounce.out' })
        .fromTo(s, { apron: -1 }, { apron: 1, duration: 0.6, ease: 'bounce.out' }, 0.5)
        .fromTo(s, { helmet: 0 }, { helmet: 1, duration: 0.2, ease: 'steps(2)' }, 0.9),
    },
  });
})();
