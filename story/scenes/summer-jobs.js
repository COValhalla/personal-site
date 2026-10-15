/*
 * Act II, moment 3 and the level-up: the summer jobs. On the left, forms go up board by board around a basement
 * and concrete pours in level. On the right, at the machine factory, a machine gets its paint and rolls onto a truck.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, rect, text } = Draw;
  const { cloud } = Props;

  Scenes.add('summer-jobs', {
    heroX: 50,
    door: { x: 145, y: 44 },
    draw(ctx, c) {
      // A summer sky, and the factory's metal wall on the right.
      rect(ctx, '#9fd3f5', 0, 0, W, GROUND);
      rect(ctx, '#bfe3f7', 0, 30, W, 14);
      cloud(ctx, 30, 8, '#f6f4ef');
      rect(ctx, '#fff1a8', 64, 5, 6, 6);
      rect(ctx, '#ffe36b', 65, 6, 4, 4);
      rect(ctx, '#a7adb5', 94, 10, W - 94, GROUND - 10);
      for (let x = 96; x < W; x += 4) rect(ctx, '#959ba4', x, 12, 1, GROUND - 12);
      rect(ctx, '#7d808a', 94, 8, W - 94, 3);
      rect(ctx, N.o, 94, 8, 1, GROUND - 8);
      text(ctx, 'FACTORY', 98, 14, c.shade);
      // The open bay door, with a truck backed up to it.
      rect(ctx, '#3a3744', 128, 24, 32, GROUND - 24);
      rect(ctx, N.w, 130, 30, 30, 22);
      rect(ctx, '#d9dcd6', 130, 30, 30, 2);
      rect(ctx, N.o, 129, 29, 31, 1);
      rect(ctx, N.o, 129, 29, 1, 23);
      rect(ctx, '#5f5b6b', 130, 52, 30, 3);
      [[134], [152]].forEach(([x]) => { rect(ctx, N.o, x, 55, 7, 7); rect(ctx, '#5f5b6b', x + 2, 57, 3, 3); });
      // The ground: a dirt lot on the left, the factory floor on the right.
      rect(ctx, '#a07a52', 0, GROUND, 94, H - GROUND);
      rect(ctx, '#b48d62', 0, GROUND, 94, 1);
      rect(ctx, '#8d9096', 94, GROUND, W - 94, H - GROUND);
      rect(ctx, '#a3a6ab', 94, GROUND, W - 94, 1);
      // The basement hole, cut into the lot, with the footing along its floor.
      rect(ctx, '#a07a52', 82, 40, 12, GROUND - 40);
      rect(ctx, '#b48d62', 82, 40, 12, 1);
      rect(ctx, '#bdbab2', 2, GROUND - 2, 80, 2);
      // The mixer truck's drum, striped, and its chute reaching over the hole.
      for (let j = -9; j <= 9; j++) for (let i = 0; i <= 9; i++) if (i * i + j * j <= 81) rect(ctx, (i + j + 20) % 6 < 2 ? c.base : '#d9dcd6', i, 24 + j, 1, 1);
      for (let k = 0; k < 5; k++) rect(ctx, N.n, 5 + k, 31 + k, 2, 1);
    },
    init: () => ({ forms: 0, pour: 0, paint: 0, ship: 0 }),
    frame(ctx, c, s, t) {
      // Forms go up board by board on both walls: an outer and an inner board with room between for the concrete.
      const boards = Math.round(Math.max(0, Math.min(1, s.forms)) * 5);
      [[2, 11, 15], [77, 68, 64]].forEach(([outer, inner, brace]) => {
        for (let b = 0; b < boards; b++) {
          const y = GROUND - 2 - (b + 1) * 4;
          [outer, inner].forEach(x => {
            rect(ctx, '#c98a55', x, y, 4, 4);
            rect(ctx, '#e0a46f', x, y, 4, 1);
            rect(ctx, '#8c5a32', x + 3, y, 1, 4);
          });
        }
        // A brace holds each wall.
        if (boards >= 5) rect(ctx, '#8c5a32', brace, GROUND - 12, 4, 1);
      });
      // The concrete pours in between, up to the top of the forms.
      const pour = Math.max(0, Math.min(1, s.pour));
      const level = Math.round(pour * 20);
      [6, 72].forEach(x => {
        if (level > 0) {
          rect(ctx, '#b9bcc2', x, GROUND - 2 - level, 5, level);
          rect(ctx, '#d0d3d8', x, GROUND - 2 - level, 5, 1);
        }
      });
      // While it pours, a stream runs from the chute into the left wall.
      if (pour > 0 && pour < 1) {
        const wobble = Math.floor(t * 10) % 2;
        rect(ctx, '#b9bcc2', 8 + wobble, 36, 2, GROUND - 2 - level - 36);
      }
      // The machine: gray primer, then the paint sweeps across it; then it rolls on its pallet onto the truck.
      const ship = Math.max(0, Math.min(1, s.ship));
      const mx = Math.round(98 + ship * 36);
      const my = Math.round(GROUND - 16 - Math.min(1, ship * 1.6) * 10);
      rect(ctx, '#8c5a32', mx, my + 13, 16, 3);
      rect(ctx, N.o, mx + 1, my, 14, 13);
      const painted = Math.round(Math.max(0, Math.min(1, s.paint)) * 12);
      rect(ctx, '#9a9da3', mx + 2, my + 1, 12, 11);
      if (painted > 0) {
        rect(ctx, c.base, mx + 2, my + 1, painted, 11);
        rect(ctx, c.light, mx + 2, my + 1, painted, 1);
      }
      rect(ctx, N.o, mx + 5, my + 4, 6, 4);
      rect(ctx, N.m, mx + 6, my + 5, 4, 2);
      rect(ctx, N.n, mx + 7, my - 2, 2, 2);
      // A spray of paint while it goes on.
      if (s.paint > 0 && s.paint < 1) {
        const r = rng(Math.floor(t * 12));
        for (let i = 0; i < 6; i++) rect(ctx, c.light, mx + 2 + painted + Math.floor(r() * 3), my + 1 + Math.floor(r() * 11), 1, 1);
      }
    },
    cues: {
      pour: s => gsap.timeline()
        .to(s, { forms: 1, duration: 0.9, ease: 'steps(5)' })
        .to(s, { pour: 1, duration: 0.9, ease: 'steps(10)' }, 0.9)
        .to(s, { paint: 1, duration: 0.7, ease: 'steps(6)' }, 1.8)
        .to(s, { ship: 1, duration: 0.8, ease: 'steps(8)' }, 2.6),
    },
  });
})();
