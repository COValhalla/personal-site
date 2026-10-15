/*
 * Act I, moment 2: the family business, a wild game processing shop in deer season.
 * New hires walk in behind the table, get their aprons and a quick lesson, and the orders pile up.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, rect, text, sprite } = Draw;
  const { bubble, person } = Props;

  Scenes.add('bmx-shop', {
    heroX: 104,
    door: { x: 139, y: 44 },
    draw(ctx, c) {
      // White tile walls with an orange stripe, and a concrete floor with a drain.
      rect(ctx, '#eef0ec', 0, 0, W, GROUND);
      for (let y = 7; y < GROUND; y += 8) rect(ctx, '#dde2dc', 0, y, W, 1);
      for (let x = 7; x < W; x += 8) rect(ctx, '#dde2dc', x, 0, 1, GROUND);
      rect(ctx, c.base, 0, 37, W, 2);
      rect(ctx, c.shade, 0, 39, W, 1);
      rect(ctx, '#c9cdc7', 0, GROUND - 3, W, 3);
      rect(ctx, '#bdb7ad', 0, GROUND, W, H - GROUND);
      rect(ctx, '#cfc9bf', 0, GROUND, W, 1);
      const r = rng(21);
      for (let i = 0; i < 30; i++) rect(ctx, r() > 0.5 ? '#aca69c' : '#c8c2b8', Math.floor(r() * W), GROUND + 2 + Math.floor(r() * 6), 1, 1);
      rect(ctx, N.n, 84, GROUND + 3, 5, 2);
      rect(ctx, N.o, 85, GROUND + 3, 1, 2);
      rect(ctx, N.o, 87, GROUND + 3, 1, 2);
      // The hand-painted sign.
      rect(ctx, N.o, 3, 3, 48, 17);
      rect(ctx, '#6b4226', 4, 4, 46, 15);
      rect(ctx, '#8c5a32', 5, 5, 44, 13);
      text(ctx, 'WILD GAME', 11, 6, c.light);
      text(ctx, 'PROCESSING', 8, 12, c.light);
      // The order board; tallies fill it as the season gets busy.
      rect(ctx, N.n, 56, 4, 38, 24);
      rect(ctx, N.w, 57, 5, 36, 22);
      text(ctx, 'ORDERS', 64, 7, c.shade);
      rect(ctx, '#d9dcd6', 59, 13, 32, 1);
      // An antler mount over the walk-in cooler.
      sprite(ctx, [
        'b..b...b..b',
        '.b.b...b.b.',
        '..bb...bb..',
        '...bb.bb...',
        '...owwwo...',
        '...owwwo...',
        '...ooooo...',
      ], 134, 8, { b: '#b89a6a', w: '#8c5a32', o: N.o });
      // The walk-in cooler: the door the camera dives through.
      rect(ctx, N.n, 122, 22, 34, GROUND - 22);
      rect(ctx, N.m, 124, 24, 30, GROUND - 24);
      rect(ctx, '#d5d8dd', 125, 25, 28, 1);
      rect(ctx, N.n, 124, 28, 4, 3);
      rect(ctx, N.n, 124, 54, 4, 3);
      rect(ctx, N.o, 147, 40, 5, 5);
      rect(ctx, N.n, 148, 41, 3, 3);
      text(ctx, 'COOLER', 128, 31, N.n);
    },
    init: () => ({ crew: 0, aprons: 0, talk: 0, work: 0 }),
    frame(ctx, c, s) {
      // The crew: three new hires walk in from the left, one after another, and stand behind the table.
      const shirts = [
        { light: '#e8786a', base: '#c0392b', shade: '#8a2a20' },
        { light: '#8fc79a', base: '#4f8f5e', shade: '#33603e' },
        { light: '#8fb3e0', base: '#4a73b0', shade: '#2f4d7a' },
      ];
      const spots = [1, 17, 33];
      spots.forEach((spot, k) => {
        const go = Math.max(0, Math.min(1, s.crew * 1.6 - k * 0.3));
        if (go <= 0) return;
        const x = Math.round(spot - 60 * (1 - go));
        person(ctx, x, GROUND - 4, shirts[k], [0, 1, 3][k], false);
        // A white butcher's apron over the shirt, handed out one at a time.
        if (s.aprons * 3 > k + 0.01) {
          rect(ctx, N.w, x + 6, GROUND - 16, 4, 1);
          rect(ctx, N.w, x + 5, GROUND - 15, 6, 5);
          rect(ctx, '#d9d4c8', x + 10, GROUND - 15, 1, 5);
        }
      });
      // A question from the new hires, then the answer lands.
      if (s.talk >= 1 && s.talk < 3) [0, 2].forEach(k => bubble(ctx, spots[k] + 6, 29, s.talk >= 2 ? '!' : '?'));
      // The stainless table in front of them, with a cutting board at each spot.
      rect(ctx, N.o, 0, 53, 67, 1);
      rect(ctx, N.m, 0, 54, 66, 2);
      rect(ctx, N.w, 0, 54, 66, 1);
      rect(ctx, N.n, 0, 56, 66, 2);
      rect(ctx, N.n, 4, 58, 2, GROUND - 58);
      rect(ctx, N.n, 60, 58, 2, GROUND - 58);
      rect(ctx, '#c4c7cc', 6, 61, 54, 1);
      spots.forEach(spot => rect(ctx, '#d9b07a', spot + 3, 53, 10, 1));
      // Wrapped orders stack up at the end of the table.
      const parcels = Math.round(Math.max(0, Math.min(1, s.work)) * 6);
      [[49, 50], [55, 50], [61, 50], [52, 47], [58, 47], [55, 44]].slice(0, parcels).forEach(([x, y]) => {
        rect(ctx, N.o, x - 1, y - 1, 7, 5);
        rect(ctx, N.w, x, y, 5, 3);
        rect(ctx, '#d6cfbf', x, y + 2, 5, 1);
        rect(ctx, c.base, x + 2, y, 1, 3);
      });
      // Tallies on the order board: four strokes and a strike through them, six gates in all.
      const gates = Math.round(Math.max(0, Math.min(1, s.work)) * 6);
      for (let g = 0; g < gates; g++) {
        const x0 = 61 + (g % 3) * 11;
        const y0 = g < 3 ? 15 : 21;
        for (let j = 0; j < 4; j++) rect(ctx, c.shade, x0 + j * 2, y0, 1, 5);
        for (let d = 0; d < 9; d++) rect(ctx, c.base, x0 - 1 + d, y0 + 3 - Math.floor(d / 3), 1, 1);
      }
    },
    cues: {
      crew: s => gsap.timeline()
        .to(s, { crew: 1, duration: 1.2, ease: 'steps(12)' })
        .to(s, { aprons: 1, duration: 0.6, ease: 'steps(3)' }, 1.0)
        .set(s, { talk: 1 }, 1.4)
        .set(s, { talk: 2 }, 2.0)
        .to(s, { work: 1, duration: 1.2, ease: 'steps(6)' }, 2.0)
        .set(s, { talk: 3 }, 2.9),
    },
  });
})();
