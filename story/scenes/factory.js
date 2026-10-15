/*
 * Act V, moments 2 and 3: the new factory in Vietnam. A plane lands the team there, the production lines are
 * lowered into the empty hall and the budget fills to $7M on time. Then the design office lights up, a bridge
 * reaches from it to the floor, ten engineers cross it, and products roll off the line in their new material.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rect, text, sprite, outline } = Draw;
  const { doorway } = Props;

  Scenes.add('factory', {
    heroX: 40,
    door: { x: 150, y: 50 },
    draw(ctx, c) {
      // A clean concrete hall: high windows with palms outside, and an epoxy floor with a safety line.
      rect(ctx, '#e6e9e4', 0, 0, W, GROUND);
      rect(ctx, '#d4d9d3', 0, 11, W, 1);
      for (let i = 0; i < 9; i++) {
        const x = 4 + i * 17;
        rect(ctx, N.n, x - 1, 1, 13, 10);
        rect(ctx, '#9fd3f5', x, 2, 11, 8);
        if (i % 3 === 1) {
          rect(ctx, '#8c5a32', x + 6, 6, 1, 4);
          sprite(ctx, ['.ppp.p.', 'p..pp.p', '...p...'], x + 3, 4, { p: c.shade });
        }
      }
      rect(ctx, '#b9c2bd', 0, GROUND, W, H - GROUND);
      rect(ctx, '#f2c94c', 0, GROUND + 1, W, 1);
      rect(ctx, '#a7b0ab', 0, GROUND + 4, W, 1);
      // The gantry the lines are lowered from.
      rect(ctx, N.n, 44, 13, 86, 2);
      rect(ctx, N.o, 44, 15, 86, 1);
      // The design office, up a level, on posts.
      rect(ctx, N.o, 6, 11, 29, 9);
      rect(ctx, N.w, 7, 12, 27, 7);
      text(ctx, 'DESIGN', 9, 13, c.shade);
      rect(ctx, N.o, 2, 19, 37, 21);
      rect(ctx, '#cfe6f7', 3, 20, 35, 19);
      rect(ctx, '#e3f1f9', 3, 20, 35, 2);
      rect(ctx, N.n, 2, 39, 37, 2);
      rect(ctx, N.n, 4, 41, 2, GROUND - 41);
      rect(ctx, N.n, 30, 41, 2, GROUND - 41);
      rect(ctx, N.o, 7, 24, 16, 10);
      rect(ctx, '#8c5a32', 5, 34, 26, 2);
      // The conveyor the new lines feed, from the hall to the shipping door.
      rect(ctx, N.o, 48, 54, 92, 1);
      rect(ctx, N.n, 48, 55, 92, 2);
      for (let x = 52; x < 140; x += 22) rect(ctx, N.o, x, 57, 2, GROUND - 57);
      // The sign and the budget board on the far wall.
      rect(ctx, N.o, 129, 12, 31, 9);
      rect(ctx, c.shade, 130, 13, 29, 7);
      text(ctx, 'VIETNAM', 131, 14, N.w);
      rect(ctx, N.o, 130, 22, 29, 12);
      rect(ctx, '#2a3a4a', 131, 23, 27, 10);
      rect(ctx, N.o, 132, 30, 25, 2);
      doorway(ctx, 150, GROUND);
    },
    init: () => ({ plane: -1, build: 0, budget: 0, ontime: 0, cad: 0, bridge: 0, eng: 0, line: 0 }),
    frame(ctx, c, s, t) {
      // The plane crosses the high windows.
      if (s.plane >= 0 && s.plane < 1) {
        const x = Math.round(-10 + s.plane * (W + 20));
        for (let tx = Math.max(0, x - 30); tx < x - 2; tx += 3) rect(ctx, N.w, tx, 5, 2, 1);
        sprite(ctx, ['..n.....', '.nnn....', 'nnnnnnnw', '..nn....', '..n.....'], x, 3, { n: N.n, w: N.w });
      }
      // Three lines are lowered from the gantry one by one and set down on the floor.
      const build = Math.max(0, Math.min(1, s.build));
      [54, 80, 106].forEach((x, k) => {
        const p = Math.max(0, Math.min(1, build * 3 - k));
        if (p <= 0) return;
        const y = Math.round(33 - (1 - p) * 30);
        if (p < 1) rect(ctx, N.o, x + 9, 16, 1, y - 16);
        rect(ctx, N.o, x, y, 20, 16);
        rect(ctx, '#d9dcd6', x + 1, y + 1, 18, 14);
        rect(ctx, c.base, x + 1, y + 11, 18, 2);
        rect(ctx, N.o, x + 3, y + 3, 7, 5);
        rect(ctx, k === 2 ? c.light : '#9fd8ff', x + 4, y + 4, 5, 3);
        rect(ctx, k === 2 ? c.base : '#e0533d', x + 13, y + 4, 2, 2);
        rect(ctx, N.o, x + 1, y + 16, 2, 5);
        rect(ctx, N.o, x + 17, y + 16, 2, 5);
      });
      // The budget fills to $7M, and gets its check: on time and on budget.
      const budget = Math.max(0, Math.min(1, s.budget));
      rect(ctx, c.light, 132, 30, Math.round(25 * budget), 2);
      text(ctx, '$' + Math.round(budget * 7) + 'M', 133, 24, N.w);
      if (s.ontime >= 1) sprite(ctx, ['....2', '...2.', '2.2..', '.2...'], 150, 24, { 2: c.light });
      // The design screen lights with the new product's drawing.
      if (s.cad >= 1) {
        rect(ctx, '#2a3a6a', 8, 25, 14, 8);
        outline(ctx, 11, 26, 8, 6, N.w);
        rect(ctx, c.light, 13, 28, 4, 2);
      }
      // Products roll down the line: the old material goes in gray and comes out of the last station new.
      if (s.line >= 1) {
        for (let x = 50; x < 138; x += 4) rect(ctx, N.m, x + (Math.floor(t * 8) % 4), 55, 1, 1);
        for (let i = 0; i < 6; i++) {
          const x = Math.round(48 + ((t * 9 + i * 15) % 88));
          const fresh = x > 114;
          sprite(ctx, ['oooo', 'owwo', 'o2no', 'oooo'], x, 50, { o: N.o, w: N.w, 2: fresh ? c.base : N.n, n: fresh ? c.light : N.m });
        }
      }
      // A bridge reaches from the design office to the floor, and ten engineers cross it.
      const bridge = Math.round(Math.max(0, Math.min(1, s.bridge)) * 90);
      if (bridge > 0) {
        rect(ctx, N.n, 39, 30, bridge, 2);
        for (let x = 39; x < 39 + bridge; x += 6) rect(ctx, N.n, x, 26, 1, 4);
      }
      const eng = Math.max(0, Math.min(1, s.eng));
      for (let i = 0; i < 10; i++) {
        const p = Math.max(0, Math.min(1, eng * 1.9 - i * 0.1));
        if (p <= 0) continue;
        const x = Math.round(36 + (44 + i * 9 - 36) * p);
        sprite(ctx, ['.y.', 'yyy', '.s.', 'jjj', 'jjj', 'k.k', 'k.k'], x, 23, { y: '#f2c94c', s: N.s, j: i % 2 ? c.base : '#4a73b0', k: N.k });
      }
      if (bridge > 0) rect(ctx, N.n, 39, 26, bridge, 1);
    },
    cues: {
      plane: s => gsap.timeline()
        .fromTo(s, { plane: 0 }, { plane: 1, duration: 1, ease: 'none' })
        .to(s, { build: 1, duration: 1.5, ease: 'steps(15)' }, 0.6)
        .to(s, { budget: 1, duration: 1.2, ease: 'steps(7)' }, 1.2)
        .set(s, { ontime: 1 }, 2.5),
      line: s => gsap.timeline()
        .set(s, { cad: 1 }, 0.1)
        .to(s, { bridge: 1, duration: 0.7, ease: 'steps(9)' }, 0.2)
        .to(s, { eng: 1, duration: 1.2, ease: 'steps(20)' }, 0.8)
        .set(s, { line: 1 }, 2.1),
    },
  });
})();
