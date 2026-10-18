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
  const { mix, rect, text, sprite, outline, puff, steps4, blink } = Draw;

  const CHAT = 'HI!';
  const BULBS = Array.from({ length: 16 }, (_, i) => 4 + i * 10);
  // The stars are single pixels, clear of the moon and the window's bars.
  const STARS = [[60, 11], [67, 16], [70, 11], [62, 21], [76, 21], [86, 17], [69, 22], [77, 12]];
  // A round full moon, five pixels across, with two darker craters.
  const MOON = ['.mmm.', 'mmmcm', 'mmmmm', 'mcmmm', '.mmm.'];

  // The two nod posters over the bed, 14 x 18 inside their frames, drawn for this site from the pixel art Joe chose:
  // a hooded demon with glowing eyes for Diablo II, and the blue ocarina for Ocarina of Time. No game art is embedded.
  const DEMON = [
    'kkkkkkkkkkkkkk',
    'kkkkkkrrkkkkkk',
    'kkkkkrrrrkkkkk',
    'kkkkrrkkrrkkkk',
    'kkkrrkkkkrrkkk',
    'kkrrkddddkrrkk',
    'krkddddddddkrk',
    'krkykkddkkykrk',
    'rkkdykyykydkkr',
    'rkkyodyydoykkr',
    'rkkdydoodydkkr',
    'rkkddykkyddkkr',
    'rkkkddyyddkkkr',
    'rrkkkkddkkkkrr',
    'kkrrkkyykkrrkk',
    'kkkkkoyyokkkkk',
    'kkkkkkookkkkkk',
    'kkkkkkkkkkkkkk',
  ];
  const DEMON_COLORS = { k: '#140a0c', r: '#b3262a', d: '#6e1418', y: '#f5c518', o: '#e8701a' };
  const OCARINA = [
    'gggggggggggggg',
    'gggggggggggggg',
    'gggggggggggggg',
    'gllggggggggggg',
    'glbbgggggggggg',
    'ggbbbbgggggggg',
    'gggbbbbbbggggg',
    'gggblbbhbbbggg',
    'gggbblbbbbhbgg',
    'ggggbblbhbbbBg',
    'ggggbbblbbbbBg',
    'gggggbbbbhbbBg',
    'ggggghbbbbbBBg',
    'ggggggbbbbBBgg',
    'gggggggBBBBggg',
    'gggggggggggggg',
    'gggggggggggggg',
    'gggggggggggggg',
  ];
  const OCARINA_COLORS = { g: '#2f7a4a', b: '#3b7fd0', B: '#2a4f9a', l: '#9cc8f0', h: '#1d1b22' };

  // The window's sky goes from day to dusk to night, with a round moon and twinkling stars once it is dark.
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
      sprite(ctx, MOON, 81, 11, { m: '#f6f4ef', c: '#d6d0c0' });
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

      // The bed: a wooden headboard and footboard standing on the floor, a frame and a sheet that run between them,
      // a plain pillow and a patchwork quilt.
      rect(ctx, '#7a4a2a', 4, 34, 4, 30);
      rect(ctx, '#7a4a2a', 52, 46, 2, 18);
      rect(ctx, '#e6dccb', 8, 47, 14, 10);
      rect(ctx, '#f6f4ef', 9, 42, 14, 7);
      rect(ctx, '#e6dccb', 10, 47, 12, 1);
      outline(ctx, 9, 42, 14, 7, N.o);
      const patches = [c.base, '#f6f4ef', '#c94f3a', '#f2c97a', c.light, '#f6f4ef'];
      for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) {
        rect(ctx, patches[(row * 3 + col) % patches.length], 22 + col * 5, 47 + row * 5, 5, 5);
      }
      rect(ctx, '#7a4a2a', 8, 57, 44, 2);

      // The window, with teal curtains on a rod and a sill.
      rect(ctx, '#a96b3e', 53, 33, 40, 2);
      rect(ctx, '#7a4a2a', 50, 5, 46, 1);
      rect(ctx, c.shade, 50, 6, 6, 27);
      rect(ctx, c.shade, 88, 6, 6, 27);
      rect(ctx, c.base, 51, 6, 4, 27);
      rect(ctx, c.base, 89, 6, 4, 27);
      rect(ctx, c.light, 52, 6, 1, 26);

      // Two nod posters over the bed: the hooded demon, and the ocarina on green.
      rect(ctx, N.o, 4, 12, 16, 20);
      sprite(ctx, DEMON, 5, 13, DEMON_COLORS);
      rect(ctx, N.o, 24, 12, 16, 20);
      sprite(ctx, OCARINA, 25, 13, OCARINA_COLORS);

      // The shelf with books in the title room's colors and a globe.
      rect(ctx, '#8c5a32', 96, 40, 26, 2);
      rect(ctx, '#c94f3a', 98, 32, 3, 8);
      rect(ctx, '#3a7f8c', 101, 33, 3, 7);
      rect(ctx, '#e0a46f', 104, 34, 3, 6);
      rect(ctx, '#6b8f3a', 107, 32, 3, 8);
      rect(ctx, '#f6f4ef', 110, 35, 3, 5);
      rect(ctx, '#3a7f8c', 116, 37, 4, 3);

      // The drum kit that was in the room: a bass drum with a tom on top, both centred on x = 72,
      // and a hi-hat whose cymbal and foot are centred on its post at x = 85.
      puff(ctx, 72, 57, 6, N.o);
      puff(ctx, 72, 57, 5, '#c94f3a');
      puff(ctx, 72, 57, 2, '#f6f4ef');
      rect(ctx, N.o, 72, 50, 1, 1);
      rect(ctx, N.o, 69, 45, 7, 5);
      rect(ctx, '#f6f4ef', 70, 46, 5, 1);
      rect(ctx, '#c94f3a', 70, 47, 5, 2);
      rect(ctx, '#7a4a2a', 85, 44, 1, 20);
      rect(ctx, N.o, 83, 63, 5, 1);
      rect(ctx, '#e0c24a', 81, 43, 9, 2);
      rect(ctx, N.o, 81, 42, 9, 1);

      // The desk at the title room's height, with a beige computer, a tower and a teal lamp.
      // The computer's screen, stand and foot share one middle, and so do the lamp's shade, stem and base.
      rect(ctx, '#a96b3e', 120, 50, 36, 2);
      rect(ctx, '#7a4a2a', 122, 52, 2, 12);
      rect(ctx, '#7a4a2a', 154, 52, 2, 12);
      rect(ctx, N.o, 123, 33, 20, 14);
      rect(ctx, '#ddd2b4', 124, 34, 18, 12);
      rect(ctx, '#b8ab88', 124, 45, 18, 1);
      rect(ctx, N.o, 132, 47, 2, 3);
      rect(ctx, N.o, 129, 50, 8, 1);
      rect(ctx, N.o, 125, 56, 8, 8);
      rect(ctx, '#ddd2b4', 126, 57, 6, 6);
      rect(ctx, N.o, 128, 60, 2, 1);
      rect(ctx, N.o, 144, 49, 12, 3);
      rect(ctx, c.base, 148, 48, 4, 1);
      rect(ctx, N.o, 146, 40, 8, 1);
      rect(ctx, c.base, 144, 36, 12, 5);
      rect(ctx, N.o, 144, 36, 12, 1);
      rect(ctx, N.o, 149, 41, 2, 7);
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
      rect(ctx, '#ffe9b0', 34, 16 + Math.round(Math.sin(t * 2.4)), 2, 2);

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

      // The lamp's warm light, which stays lit after the room dims: a cone centred on the lamp's middle (x = 149.5)
      // that widens from the shade's rim to the desk.
      if (dark > 0) {
        ctx.globalAlpha = 0.22 * dark;
        for (let y = 41; y < 50; y++) {
          const half = 4 + Math.floor((y - 41) / 2);
          rect(ctx, '#ffd27a', 150 - half, y, half * 2, 1);
        }
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
