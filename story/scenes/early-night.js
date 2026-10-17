/*
 * Tutorial, moment 1: a bedroom that goes from day to night. The window darkens, the lamp pools warm light,
 * the fairy lights glow and the desk's screen switches from the teal desktop to the game, whose chat types itself.
 * The camera then dives into that screen, and the lab opens out of the hero's screen there.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { mix, rect, text, outline, puff, steps4, blink } = Draw;

  const CHAT = 'HI!';
  const BULBS = Array.from({ length: 16 }, (_, i) => 4 + i * 10);
  const STARS = Array.from({ length: 8 }, (_, i) => [60 + ((i * 7) % 26), 11 + ((i * 5) % 10)]);

  // The window's sky goes from day to dusk to night, with a moon and twinkling stars once it is dark.
  function skyWindow(ctx, dark, t) {
    const dusk = Math.min(1, dark * 2);
    const night = Math.max(0, dark * 2 - 1);
    rect(ctx, mix(mix('#cfe9fb', '#f6a46b', dusk), '#0d1030', night), 57, 9, 32, 22);
    rect(ctx, '#3d4a6b', 57, 24, 32, 7);
    rect(ctx, '#2a344f', 59, 26, 6, 5);
    rect(ctx, '#2a344f', 68, 24, 8, 7);
    rect(ctx, '#2a344f', 80, 26, 8, 5);
    if (dark >= 0.5) {
      STARS.forEach(([x, y], i) => { if (blink(t + i * 0.9, 1.4)) rect(ctx, '#f6f4ef', x, y, 1, 1); });
      rect(ctx, '#f6f4ef', 79, 11, 4, 4);
      rect(ctx, '#0d1030', 80, 11, 3, 3);
    }
    outline(ctx, 56, 8, 34, 24, N.o);
    rect(ctx, N.o, 73, 8, 1, 24);
    rect(ctx, N.o, 56, 19, 34, 1);
  }

  Scenes.add('early-night', {
    heroX: 104,
    arrive: 50,
    // The camera dives into the desk computer's screen, on to the lab.
    door: { x: 133, y: 40, zoom: 11 },
    draw(ctx, c) {
      rect(ctx, '#f3e3c4', 0, 0, W, GROUND);
      for (let x = 0; x < W; x += 16) rect(ctx, '#ecd7b0', x, 0, 1, GROUND);
      rect(ctx, '#b87a4b', 0, GROUND, W, H - GROUND);
      rect(ctx, '#d89a64', 0, GROUND, W, 1);
      rect(ctx, c.base, 58, 66, 52, 5);
      rect(ctx, c.light, 58, 66, 52, 1);

      // The bed: a wooden headboard, a teddy on the pillow and a patchwork quilt.
      rect(ctx, '#7a4a2a', 4, 34, 4, 30);
      rect(ctx, '#f6f4ef', 9, 42, 14, 7);
      outline(ctx, 9, 42, 14, 7, N.o);
      puff(ctx, 14, 39, 3, '#a96b3e');
      rect(ctx, N.o, 11, 36, 1, 2);
      rect(ctx, N.o, 17, 36, 1, 2);
      rect(ctx, N.o, 13, 40, 1, 1);
      rect(ctx, N.o, 16, 40, 1, 1);
      const patches = [c.base, '#f6f4ef', '#c94f3a', '#f2c97a', c.light, '#f6f4ef'];
      for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) {
        rect(ctx, patches[(row * 3 + col) % patches.length], 22 + col * 5, 47 + row * 5, 5, 5);
      }
      rect(ctx, '#7a4a2a', 22, 57, 30, 2);
      rect(ctx, '#7a4a2a', 52, 46, 2, 13);
      rect(ctx, '#7a4a2a', 4, 62, 4, 2);

      // The window, with teal curtains on a rod and a sill.
      rect(ctx, '#a96b3e', 53, 33, 40, 2);
      rect(ctx, '#7a4a2a', 50, 5, 46, 1);
      rect(ctx, c.shade, 50, 6, 6, 27);
      rect(ctx, c.shade, 88, 6, 6, 27);
      rect(ctx, c.base, 51, 6, 4, 27);
      rect(ctx, c.base, 89, 6, 4, 27);
      rect(ctx, c.light, 52, 6, 1, 26);

      // Two nod posters over the bed: a dark red one with horns, and a green one with an ocarina.
      rect(ctx, N.o, 4, 12, 16, 20);
      rect(ctx, '#5a1a1a', 5, 13, 14, 18);
      rect(ctx, '#a8242a', 8, 16, 8, 8);
      rect(ctx, '#e9c46a', 6, 14, 1, 3);
      rect(ctx, '#e9c46a', 17, 14, 1, 3);
      rect(ctx, N.o, 8, 13, 1, 3);
      rect(ctx, N.o, 15, 13, 1, 3);
      rect(ctx, N.o, 9, 24, 6, 1);
      rect(ctx, '#e9c46a', 9, 19, 2, 1);
      rect(ctx, '#e9c46a', 13, 19, 2, 1);
      rect(ctx, N.o, 24, 12, 16, 20);
      rect(ctx, '#2f7a4a', 25, 13, 14, 18);
      rect(ctx, '#3b5fb3', 29, 21, 6, 4);
      rect(ctx, '#3b5fb3', 31, 19, 2, 2);
      rect(ctx, '#2a4a8a', 29, 25, 6, 1);

      // The shelf with books in the title room's colors and a globe.
      rect(ctx, '#8c5a32', 96, 40, 26, 2);
      rect(ctx, '#c94f3a', 98, 32, 3, 8);
      rect(ctx, '#3a7f8c', 101, 33, 3, 7);
      rect(ctx, '#e0a46f', 104, 34, 3, 6);
      rect(ctx, '#6b8f3a', 107, 32, 3, 8);
      rect(ctx, '#f6f4ef', 110, 35, 3, 5);
      rect(ctx, '#3a7f8c', 116, 37, 4, 3);

      // The drum kit that was in the room, and its cymbal.
      puff(ctx, 72, 57, 6, N.o);
      puff(ctx, 72, 57, 5, '#c94f3a');
      puff(ctx, 72, 57, 2, '#f6f4ef');
      rect(ctx, '#7a4a2a', 85, 44, 1, 20);
      rect(ctx, '#e0c24a', 80, 43, 9, 2);
      rect(ctx, N.o, 80, 42, 9, 1);

      // The desk at the title room's height, with a beige computer, a tower, a keyboard and a teal lamp.
      rect(ctx, '#a96b3e', 120, 50, 36, 2);
      rect(ctx, '#7a4a2a', 122, 52, 2, 12);
      rect(ctx, '#7a4a2a', 154, 52, 2, 12);
      rect(ctx, N.o, 123, 33, 20, 14);
      rect(ctx, '#ddd2b4', 124, 34, 18, 12);
      rect(ctx, '#b8ab88', 124, 45, 18, 1);
      rect(ctx, N.o, 133, 47, 2, 3);
      rect(ctx, N.o, 130, 50, 8, 1);
      rect(ctx, N.o, 125, 56, 8, 8);
      rect(ctx, '#ddd2b4', 126, 57, 6, 6);
      rect(ctx, N.o, 128, 60, 2, 1);
      rect(ctx, N.o, 143, 49, 14, 3);
      rect(ctx, c.base, 147, 48, 4, 1);
      rect(ctx, N.o, 146, 40, 8, 1);
      rect(ctx, c.base, 144, 36, 12, 5);
      rect(ctx, N.o, 144, 36, 12, 1);
      rect(ctx, N.o, 148, 41, 2, 7);
    },
    init: () => ({ dark: 0, screen: 0, chat: 0 }),
    frame(ctx, c, s, t) {
      const dark = steps4(s.dark);
      const glow = steps4(s.screen);

      skyWindow(ctx, dark, t);

      if (dark > 0) {
        ctx.globalAlpha = dark * 0.6;
        rect(ctx, '#0d1030', 0, 0, W, GROUND);
        ctx.globalAlpha = 1;
      }

      BULBS.forEach((x, i) => {
        const y = 3 + Math.round(Math.sin((x / W) * Math.PI) * 2);
        if (dark >= 0.5) {
          ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3 + i);
          rect(ctx, '#ffd27a', x - 2, y - 2, 5, 5);
          ctx.globalAlpha = 1;
        }
        rect(ctx, i % 2 ? '#ffd27a' : '#ffe9b0', x, y, 1, 1);
      });

      // The ocarina nod's fairy bobs above the ocarina.
      rect(ctx, '#ffe9b0', 31, 16 + Math.round(Math.sin(t * 2.4)), 2, 2);

      // The desk's screen: the teal desktop by day, then the game with an inventory and a chat that types itself.
      const sx = 125;
      const sy = 35;
      if (glow < 1) {
        rect(ctx, c.base, sx, sy, 16, 10);
        rect(ctx, c.light, sx, sy, 16, 1);
        rect(ctx, '#f6f4ef', sx + 1, sy + 2, 2, 2);
        rect(ctx, '#f6f4ef', sx + 4, sy + 2, 2, 2);
      }
      if (glow > 0) {
        rect(ctx, '#2a1416', sx, sy, 16, 10);
        for (let i = 0; i < 4; i++) rect(ctx, i % 2 ? c.light : c.base, sx + 1 + i * 4, sy + 1, 3, 3);
        const shown = Math.floor(Math.max(0, Math.min(1, s.chat)) * CHAT.length);
        if (shown > 0) text(ctx, CHAT.slice(0, shown), sx + 1, sy + 5, c.light);
      }

      // The lamp's warm pool, which stays lit after the room dims.
      if (dark > 0) {
        ctx.globalAlpha = 0.22 * dark;
        puff(ctx, 150, 48, 8, '#ffd27a');
        ctx.globalAlpha = 1;
      }
      rect(ctx, c.base, 144, 36, 12, 5);
      rect(ctx, N.o, 144, 36, 12, 1);
    },
    cues: {
      night: s => gsap.timeline()
        .to(s, { dark: 1, duration: 1.2, ease: 'steps(4)' })
        .to(s, { screen: 1, duration: 0.6, ease: 'steps(2)' }, 1.2)
        .to(s, { chat: 1, duration: 1.6, ease: 'steps(4)' }, 1.8),
    },
  });
})();
