/*
 * Act IV, moment 3: the plant floor in Sioux City. Operators in hard hats come through in waves to be trained
 * while the count climbs to 250, and a root-cause fishbone draws itself on the whiteboard until the savings show.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, rect, text } = Draw;
  const { doorway, person } = Props;

  Scenes.add('sioux-city', {
    heroX: 42,
    door: { x: 151, y: 50 },
    draw(ctx, c) {
      // A corrugated metal wall, and a concrete floor with a yellow safety line.
      rect(ctx, '#c9ced3', 0, 0, W, GROUND);
      for (let x = 1; x < W; x += 3) rect(ctx, '#b7bdc3', x, 4, 1, GROUND - 4);
      rect(ctx, '#7d808a', 0, 0, W, 4);
      rect(ctx, N.o, 0, 4, W, 1);
      rect(ctx, '#9a9da3', 0, GROUND, W, H - GROUND);
      rect(ctx, '#f2c94c', 0, GROUND + 1, W, 1);
      const r = rng(44);
      for (let i = 0; i < 20; i++) rect(ctx, '#8d9096', Math.floor(r() * W), GROUND + 3 + Math.floor(r() * 5), 1, 1);
      // Two stainless tanks on legs, piped together along the ceiling.
      [3, 19].forEach(x => {
        rect(ctx, N.o, x - 1, 12, 15, 46);
        rect(ctx, '#d5d8dd', x, 14, 13, 43);
        rect(ctx, '#d5d8dd', x + 2, 12, 9, 2);
        rect(ctx, '#eef0f2', x + 3, 15, 2, 40);
        rect(ctx, '#a9adb5', x + 10, 15, 2, 42);
        rect(ctx, N.n, x, 30, 13, 1);
        rect(ctx, N.o, x + 1, 58, 2, GROUND - 58);
        rect(ctx, N.o, x + 10, 58, 2, GROUND - 58);
      });
      rect(ctx, N.n, 9, 7, 1, 5);
      rect(ctx, N.n, 25, 7, 1, 5);
      rect(ctx, N.n, 9, 7, 30, 1);
      // The town's name over the floor.
      rect(ctx, N.o, 52, 6, 48, 9);
      rect(ctx, c.shade, 53, 7, 46, 7);
      text(ctx, 'SIOUX CITY', 57, 8, N.w);
      // The whiteboard where the root-cause study takes shape.
      rect(ctx, N.n, 51, 18, 50, 28);
      rect(ctx, N.w, 52, 19, 48, 26);
      rect(ctx, N.n, 54, 45, 44, 1);
      // The training count, over the spot where each crew stands.
      rect(ctx, N.o, 104, 10, 38, 24);
      rect(ctx, '#2a3a6a', 105, 11, 36, 22);
      text(ctx, 'TRAINED', 110, 13, c.light);
      doorway(ctx, 151, GROUND);
    },
    init: () => ({ train: 0, fish: 0, cause: 0, saved: 0 }),
    frame(ctx, c, s) {
      // Crews of three walk in, get trained and step aside for the next: five crews, 50 operators each.
      const train = Math.max(0, Math.min(1, s.train));
      const wave = Math.min(4, Math.floor(train * 5));
      const walk = Math.min(1, (train * 5 - wave) * 2.5);
      const shirts = [
        { light: '#8fb3e0', base: '#4a73b0', shade: '#2f4d7a' },
        { light: '#8fc79a', base: '#4f8f5e', shade: '#33603e' },
        { light: '#e8786a', base: '#c0392b', shade: '#8a2a20' },
      ];
      if (train > 0) {
        [103, 115, 127].forEach((spot, k) => {
          const x = Math.round(spot + 50 * (1 - walk) + k * 6 * (1 - walk));
          const top = GROUND - 22;
          person(ctx, x, GROUND, shirts[(wave + k) % 3], wave * 3 + k, true);
          // A hard hat on every operator.
          rect(ctx, N.o, x + 4, top, 8, 1);
          rect(ctx, N.o, x + 3, top + 1, 10, 3);
          rect(ctx, '#f2c94c', x + 4, top + 1, 8, 3);
          rect(ctx, '#fff1a8', x + 5, top + 1, 3, 1);
          rect(ctx, N.o, x + 1, top + 4, 14, 1);
          rect(ctx, '#f2c94c', x + 2, top + 4, 12, 1);
        });
      }
      const count = Math.round(train * 10) * 25;
      Pixel.text(ctx, String(count), Math.round(123 - (String(count).length * 8 - 2) / 2), 21, N.w, 2);
      // The fishbone: the spine, then the causes branching off it, and the problem at its head.
      const fish = Math.round(Math.max(0, Math.min(1, s.fish)) * 6);
      const ink = '#24539c';
      if (fish >= 1) rect(ctx, ink, 56, 28, 30, 1);
      if (fish >= 2) { rect(ctx, N.o, 86, 24, 10, 9); rect(ctx, c.light, 87, 25, 8, 7); text(ctx, '?', 89, 26, N.o); }
      [[60, 21, 1], [72, 21, 1], [60, 35, -1], [72, 35, -1]].slice(0, Math.max(0, fish - 2)).forEach(([x, y, d]) => {
        for (let q = 0; q < 8; q++) rect(ctx, ink, x + Math.floor(q / 2), y + q * d, 1, 1);
        rect(ctx, ink, x - 3, y, 4, 1);
      });
      // The root cause, circled; then what fixing it saved.
      if (s.cause >= 1) {
        for (let a = 0; a < Math.PI * 2; a += 0.15) rect(ctx, '#c0392b', Math.round(71 + Math.cos(a) * 6), Math.round(35 + Math.sin(a) * 3), 1, 1);
        rect(ctx, c.light, 87, 25, 8, 7);
        rect(ctx, '#3fa66b', 88, 26, 6, 5);
      }
      const saved = Math.round(Math.max(0, Math.min(1, s.saved)) * 11);
      if (saved > 0) text(ctx, '$200K SAVED'.slice(0, saved), 55, 39, '#2f8a4f');
    },
    cues: {
      plant: s => gsap.timeline()
        .to(s, { train: 1, duration: 1.8, ease: 'steps(20)' }, 0)
        .to(s, { fish: 1, duration: 0.9, ease: 'steps(6)' }, 1.1)
        .set(s, { cause: 1 }, 2.1)
        .to(s, { saved: 1, duration: 0.6, ease: 'steps(11)' }, 2.3),
    },
  });
})();
