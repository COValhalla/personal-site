/*
 * Act V, moment 1: the mountains, where a skier carves down the big peak. The cabin's door leads to the factory.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { mix, rect, sprite } = Draw;
  const { peak, pine, doorway } = Props;

  Scenes.add('mountains', {
    heroX: 66,
    door: { x: 72, y: 50 },
    draw(ctx, c) {
      const bands = ['#e3f1e8', '#e9f4ec', '#eff7f1', '#f4faf5', '#f8fcf9'];
      bands.forEach((b, i) => rect(ctx, b, 0, i * 9, W, 9));
      rect(ctx, '#f8fcf9', 0, 45, W, 27);
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) rect(ctx, '#ffd56b', 22 + x, 9 + y, 1, 1);
      const far = mix(c.light, '#ffffff', 0.35);
      peak(ctx, far, 20, 26, 30);
      peak(ctx, far, 70, 22, 34);
      peak(ctx, far, 122, 24, 32);
      peak(ctx, c.shade, 42, 30, 26, N.w);
      peak(ctx, c.shade, 104, 26, 30, N.w);
      peak(ctx, mix(c.shade, c.base, 0.5), 150, 34, 22, N.w);
      rect(ctx, N.w, 0, GROUND - 4, W, H - GROUND + 4);
      rect(ctx, '#dfe7e2', 0, GROUND + 2, W, 1);
      [[128, 10], [140, 15], [151, 11]].forEach(([x, h]) => pine(ctx, c.base, c.shade, x, GROUND - 2, h));
      // A cabin at the foot of the slope, with the door the camera dives through.
      rect(ctx, '#5b3a22', 57, 32, 30, 4);
      rect(ctx, '#8a5a36', 60, 36, 24, 28);
      doorway(ctx, 72, GROUND);
    },
    init: () => ({ ski: -1 }),
    frame(ctx, c, s) {
      // A skier carves down the big peak.
      if (s.ski >= 0) {
        const k = Math.min(1, s.ski);
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const u = (i / 40) * k;
          pts.push([Math.round(104 + Math.sin(u * Math.PI * 5) * (3 + u * 14)), Math.round(28 + u * 32)]);
        }
        pts.forEach(([x, y], i) => { if (i % 2 === 0) rect(ctx, '#cfe0d6', x, y, 1, 1); });
        const [x, y] = pts[pts.length - 1];
        if (k < 1) sprite(ctx, ['.h.', 'jjj', '.j.', 'o.o'], x - 1, y - 4, { h: c.light, j: '#e0533d', o: N.o });
      }
    },
    cues: {
      ski: s => gsap.timeline().fromTo(s, { ski: 0 }, { ski: 1, duration: 1.8, ease: 'none' }),
    },
  });
})();
