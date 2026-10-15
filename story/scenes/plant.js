/*
 * Act IV: a blueprint of a plant.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { mix, rect, text, sprite, outline } = Draw;
  const { doorway } = Props;

  Scenes.add('plant', {
    heroX: 26,
    door: { x: 140, y: 50 },
    draw(ctx, c) {
      rect(ctx, c.shade, 0, 0, W, H);
      const grid = mix(c.shade, c.light, 0.35);
      for (let x = 0; x < W; x += 8) rect(ctx, grid, x, 0, 1, H);
      for (let y = 0; y < H; y += 8) rect(ctx, grid, 0, y, W, 1);
      const ink = N.w;
      const line = (x1, y1, x2, y2) => {
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);
        let x = x1;
        let y = y1;
        rect(ctx, ink, x, y, 1, 1);
        while (x !== x2 || y !== y2) { if (x !== x2) x += dx; if (y !== y2) y += dy; rect(ctx, ink, x, y, 1, 1); }
      };
      const box = (x, y, w, h) => { line(x, y, x + w, y); line(x + w, y, x + w, y + h); line(x + w, y + h, x, y + h); line(x, y + h, x, y); };
      // Main building with a sawtooth roof.
      box(56, 36, 56, 28);
      for (let i = 0; i < 4; i++) { line(56 + i * 14, 36, 56 + i * 14 + 7, 28); line(56 + i * 14 + 7, 28, 56 + i * 14 + 7, 36); }
      for (let i = 0; i < 5; i++) box(61 + i * 10, 44, 5, 5);
      box(78, 54, 10, 10);
      // Smokestack and a tank with pipes.
      box(118, 14, 6, 50);
      for (let y = 18; y < 64; y += 9) line(118, y, 124, y);
      box(130, 40, 20, 24);
      line(130, 44, 150, 44);
      line(112, 50, 118, 50);
      line(124, 56, 130, 56);
      line(140, 34, 140, 40);
      line(140, 34, 156, 34);
      doorway(ctx, 140, GROUND);
      // Ground.
      for (let x = 0; x < W; x += 3) rect(ctx, ink, x, GROUND, 2, 1);
    },
    init: () => ({ dim: 0, read: 0, ok: 0, screen: 0, model: 0, fit: 0, truck: -1 }),
    frame(ctx, c, s, t) {
      // A dimension line draws itself across the building, the reading counts up to the measurement, and it checks out.
      if (s.dim > 0) {
        const x2 = Math.round(56 + 56 * Math.min(1, s.dim));
        rect(ctx, N.w, 56, 22, x2 - 56, 1);
        rect(ctx, N.w, 56, 20, 1, 5);
        if (s.dim >= 1) {
          rect(ctx, N.w, 112, 20, 1, 5);
          rect(ctx, c.shade, 74, 19, s.ok > 0 ? 28 : 21, 7);
          text(ctx, (25.4 * Math.min(1, s.read)).toFixed(2).padStart(5, '0'), 75, 20, c.light);
          if (s.ok > 0) sprite(ctx, ['....w', '...w.', 'w.w..', '.w...'], 96, 20, { w: c.light });
        }
      }
      // A screen on the wall: a 3D model of a part turns, then data points land and a model's line fits them.
      if (s.screen > 0) {
        const h = Math.round(22 * Math.min(1, s.screen));
        outline(ctx, 6, 4, 42, h, N.w);
        if (s.screen >= 1) {
          rect(ctx, N.w, 26, 26, 1, 3);
          rect(ctx, N.w, 21, 29, 11, 1);
        }
        if (s.model > 0) {
          // A wireframe box, drawn edge by edge, that keeps turning.
          const a = t * 1.2;
          const pts = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => {
            const rx = x * Math.cos(a) - z * Math.sin(a);
            const rz = x * Math.sin(a) + z * Math.cos(a);
            return [16 + rx * 5, 15 + y * 4 + rz * 1.5];
          });
          const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
          edges.slice(0, Math.round(edges.length * Math.min(1, s.model))).forEach(([i, j]) => {
            const [x1, y1] = pts[i];
            const [x2, y2] = pts[j];
            const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
            for (let k = 0; k <= n; k++) rect(ctx, N.w, x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n, 1, 1);
          });
        }
        if (s.fit > 0) {
          // Axes, then the points, then the fitted line.
          rect(ctx, N.w, 28, 8, 1, 15);
          rect(ctx, N.w, 28, 22, 17, 1);
          const dots = [[31, 19], [33, 18], [35, 17], [37, 14], [39, 14], [42, 11]];
          dots.slice(0, Math.round(dots.length * Math.min(1, s.fit * 2))).forEach(([x, y]) => rect(ctx, c.light, x, y, 1, 1));
          const len = Math.round(13 * Math.max(0, Math.min(1, s.fit * 2 - 1)));
          for (let k = 0; k < len; k++) rect(ctx, c.light, 30 + k, Math.round(20 - k * 0.7), 1, 1);
        }
      }
      // A truck drives the road between Kansas City and Sioux City.
      if (s.truck >= 0) {
        rect(ctx, N.w, 6, 50, 13, 7);
        rect(ctx, c.shade, 7, 51, 11, 5);
        text(ctx, 'IA', 9, 51, N.w);
        rect(ctx, N.w, 12, 57, 1, 7);
        const x = Math.round(-26 + s.truck * (W + 40));
        sprite(ctx, [
          '.wwwwwwwwwwww.......',
          '.w..........w.wwww..',
          '.w..........w.w..ww.',
          '.w..........www...w.',
          '.wwwwwwwwwwwwwwwwwww',
          '...ww....ww.....ww..',
        ], x, GROUND - 7, { w: N.w });
      }
    },
    cues: {
      measure: s => gsap.timeline()
        .to(s, { dim: 1, duration: 1, ease: 'steps(14)' })
        .to(s, { read: 1, duration: 0.7, ease: 'steps(8)' }, 1)
        .to(s, { ok: 1, duration: 0.01 }, 2),
      model: s => gsap.timeline()
        .to(s, { screen: 1, duration: 0.3, ease: 'steps(3)' })
        .to(s, { model: 1, duration: 0.5, ease: 'steps(12)' }, 0.3)
        .to(s, { fit: 1, duration: 0.8, ease: 'steps(12)' }, 0.8),
      road: s => gsap.timeline().fromTo(s, { truck: 0 }, { truck: 0.55, duration: 1.5, ease: 'power1.out' }),
    },
  });
})();
