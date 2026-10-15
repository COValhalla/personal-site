/*
 * Act I: a bright BMX track on a Saturday, the start hill on the left and the family shop on the right.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, mix, rect, text, sprite, blink } = Draw;
  const { cloud, RIDER } = Props;

  Scenes.add('bmx-track', {
    heroX: 100,
    draw(ctx, c) {
      const sky = c.accent || '#3fa9f5';
      ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'].forEach((w, i) => rect(ctx, mix(sky, w, 0.25 + i * 0.14), 0, i * 8, W, 8));
      rect(ctx, mix(sky, '#ffffff', 0.85), 0, 40, W, 12);
      // Rolling hills.
      for (let x = 0; x < W; x++) {
        const h = Math.round(7 + Math.sin(x / 13) * 3 + Math.sin(x / 5.3) * 1.2);
        rect(ctx, '#86cf6e', x, 50 - h, 1, h + 4);
        const h2 = Math.round(4 + Math.sin(x / 9 + 2) * 2);
        rect(ctx, '#6bbb57', x, 53 - h2, 1, h2 + 2);
      }
      // Fence with sponsor banners.
      rect(ctx, '#f6f4ef', 0, 51, W, 1);
      for (let x = 2; x < W; x += 26) { rect(ctx, c.base, x, 52, 20, 4); rect(ctx, c.light, x + 2, 53, 9, 1); rect(ctx, N.w, x + 13, 53, 5, 2); }
      for (let x = 0; x < W; x += 13) rect(ctx, '#d3cec6', x, 51, 1, 6);
      // Dirt: the back of the track, the riding line, the front edge with pebbles.
      rect(ctx, '#b97a4a', 0, 56, W, 8);
      rect(ctx, '#c98a55', 0, GROUND, W, H - GROUND);
      rect(ctx, '#e0a46f', 0, GROUND, W, 1);
      const r = rng(13);
      for (let i = 0; i < 40; i++) rect(ctx, r() > 0.5 ? '#a96b3e' : '#dba06d', Math.floor(r() * W), GROUND + 2 + Math.floor(r() * 7), 1, 1);
      // Rollers.
      [[84, 9], [100, 9]].forEach(([x0, w]) => {
        for (let x = 0; x <= w; x++) {
          const h = Math.round(Math.sin((x / w) * Math.PI) * 5);
          rect(ctx, '#c98a55', x0 + x, GROUND - h, 1, h);
          rect(ctx, '#e0a46f', x0 + x, GROUND - h, 1, 1);
        }
      });
      // Start hill with the gate and a little tower.
      rect(ctx, '#c98a55', 0, 46, 24, 18);
      for (let x = 0; x < 18; x++) rect(ctx, '#c98a55', 24 + x, 46 + x, 1, 18 - x);
      for (let x = 0; x < 18; x++) rect(ctx, '#e0a46f', 24 + x, 46 + x, 1, 1);
      rect(ctx, '#e0a46f', 0, 46, 24, 1);
      rect(ctx, N.o, 2, 28, 1, 18);
      rect(ctx, N.o, 16, 28, 1, 18);
      rect(ctx, c.shade, 1, 26, 17, 2);
      rect(ctx, c.base, 0, 25, 19, 1);
      rect(ctx, N.w, 2, 34, 15, 1);
      // The gate, standing up.
      rect(ctx, N.o, 22, 38, 3, 8);
      for (let y = 39; y < 46; y += 2) rect(ctx, y % 4 === 1 ? c.base : N.w, 23, y, 1, 1);
      // The family shop.
      rect(ctx, '#efe4d0', 114, 36, 44, 28);
      rect(ctx, N.o, 113, 36, 1, 28);
      rect(ctx, N.o, 158, 36, 1, 28);
      for (let y = 0; y < 10; y++) rect(ctx, y < 2 ? c.shade : c.base, 112 + y, 26 + y, 48 - 2 * y, 1);
      rect(ctx, c.shade, 112, 35, 48, 1);
      rect(ctx, N.w, 120, 38, 18, 7);
      rect(ctx, N.o, 119, 38, 1, 7);
      rect(ctx, N.o, 138, 38, 1, 7);
      text(ctx, 'SHOP', 121, 39, c.shade);
      rect(ctx, N.o, 117, 46, 24, 1);
      rect(ctx, N.o, 117, 46, 1, 18);
      rect(ctx, N.o, 140, 46, 1, 18);
      rect(ctx, N.o, 143, 38, 12, 1);
      rect(ctx, N.o, 143, 38, 1, 10);
      rect(ctx, N.o, 154, 38, 1, 10);
      rect(ctx, N.o, 143, 47, 12, 1);
      rect(ctx, N.o, 148, 38, 1, 10);
    },
    door: { x: 129, y: 55 },
    init: () => ({ race: -1 }),
    frame(ctx, c, s, t) {
      [[0, 6, 4], [70, 14, 3], [120, 9, 5]].forEach(([x0, y, speed]) => cloud(ctx, ((x0 + t * speed) % (W + 30)) - 15, y, N.w));
      // The tower flag flaps.
      rect(ctx, N.o, 9, 19, 1, 6);
      rect(ctx, c.light, 10, 19, blink(t, 2.5) ? 5 : 4, 2);
      rect(ctx, c.base, 10, 21, blink(t, 2.5) ? 4 : 5, 1);
      // The shop door, shut, is where the camera dives in.
      rect(ctx, '#d9c7a3', 118, 47, 22, 17);
      for (let y = 47; y < 64; y += 2) rect(ctx, '#b9b2a6', 118, y, 22, 1);
      rect(ctx, '#cfe6f7', 144, 39, 4, 8);
      rect(ctx, '#cfe6f7', 149, 39, 5, 8);
      // Riders race past on the cue.
      if (s.race >= 0) {
        ['#e0533d', c.accent || '#3fa9f5', c.base].forEach((jersey, k) => {
          const x = Math.round(-14 + (s.race * 1.25 - k * 0.09) * (W + 30));
          if (x < -12 || x > W + 2) return;
          let lift = 0;
          [[84, 9], [100, 9]].forEach(([x0, w]) => {
            const u = (x + 5 - x0) / w;
            if (u >= 0 && u <= 1) lift = Math.max(lift, Math.sin(u * Math.PI) * 5);
          });
          sprite(ctx, RIDER, x, GROUND - 8 - Math.round(lift), { h: c.shade, j: jersey, m: N.s, o: N.o, k: N.k });
          if ((Math.floor(t * 12) + k) % 2) rect(ctx, '#dba06d', x - 2, GROUND - 1, 2, 1);
        });
      }
    },
    cues: {
      race: s => gsap.timeline().fromTo(s, { race: 0 }, { race: 1, duration: 2.6, ease: 'none' }).set(s, { race: -1 }),
    },
  });
})();
