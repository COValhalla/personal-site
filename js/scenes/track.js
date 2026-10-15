/*
 * Act III: a track with the hammer cage, the stands and the scoreboard.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, mix, rect, text, sprite, puff, steps4 } = Draw;
  const { doorway } = Props;

  Scenes.add('track', {
    heroX: 52,
    door: { x: 40, y: 50 },
    draw(ctx, c) {
      const r = rng(22);
      const navy = c.accent || '#24366b';
      rect(ctx, '#f4ece6', 0, 0, W, H);
      rect(ctx, '#fbf6f1', 0, 0, W, 10);
      // Stands in school colors, with a crowd.
      for (let row = 0; row < 5; row++) rect(ctx, row % 2 ? mix(navy, '#ffffff', 0.55) : mix(navy, '#ffffff', 0.45), 0, 14 + row * 5, W, 5);
      const crowd = [c.base, c.light, c.shade, N.w, navy, N.s, '#3a3744'];
      for (let row = 0; row < 5; row++) for (let x = 1; x < W; x += 2) if (r() > 0.35) rect(ctx, crowd[Math.floor(r() * crowd.length)], x, 15 + row * 5, 1, 2);
      rect(ctx, navy, 0, 39, W, 2);
      rect(ctx, '#7fbf7a', 0, 41, W, 6);
      // Track lanes.
      rect(ctx, c.base, 0, 47, W, H - 47);
      for (let y = 50; y < H; y += 5) rect(ctx, mix(c.base, '#ffffff', 0.75), 0, y, W, 1);
      doorway(ctx, 40, GROUND);
      // Scoreboard on a post.
      rect(ctx, N.o, 98, 0, 30, 12);
      rect(ctx, '#141318', 99, 1, 28, 10);
      rect(ctx, navy, 99, 1, 28, 2);
      // Hammer cage on the infield: tall posts, a net and the throwing circle.
      for (let x = 117; x < 152; x += 3) for (let y = 42; y < 60; y += 3) rect(ctx, '#ece7e1', x, y, 1, 1);
      [116, 128, 140, 152].forEach(x => rect(ctx, '#3a3744', x, 32, 1, 29));
      rect(ctx, '#3a3744', 116, 32, 37, 1);
      for (let a = 0; a < Math.PI * 2; a += 0.08) rect(ctx, N.w, Math.round(134 + Math.cos(a) * 8), Math.round(59 + Math.sin(a) * 2), 1, 1);
    },
    init: () => ({ ham: -1, mark: 0, cheer: 0, board: 0, flask: 0, chalk: 0, boil: 0 }),
    frame(ctx, c, s, t) {
      // The crowd stands up and cheers.
      if (s.cheer > 0.05) {
        const r = rng(Math.floor(t * 8));
        for (let i = 0; i < 40 * s.cheer; i++) rect(ctx, [c.light, N.w, c.base][i % 3], Math.floor(r() * W), 14 + Math.floor(r() * 5) * 5, 1, 1);
      }
      // Scoreboard text.
      if (s.board > 0.5) text(ctx, 'CHEM E', 101, 4, '#ffb347');
      else if (s.mark > 0) Pixel.text(ctx, s.mark.toFixed(1) + 'm', 101, 4, '#ffb347', 1);
      // The hammer flies out of the cage and lands on the infield.
      if (s.ham >= 0) {
        const k = Math.min(1, s.ham);
        const x = 134 + (28 - 134) * k;
        const y = 52 - Math.sin(k * Math.PI) * 44 + (45 - 52) * k;
        if (k < 1) {
          rect(ctx, N.n, Math.round(x) + 2, Math.round(y) - 1, 1, 1);
          puff(ctx, Math.round(x), Math.round(y), 1, N.o);
          rect(ctx, c.base, Math.round(x), Math.round(y), 1, 1);
        } else {
          rect(ctx, N.o, 27, 43, 1, 4);
          rect(ctx, c.light, 28, 43, 3, 2);
          puff(ctx, 28, 46, 1, '#9b8f7a');
        }
      }
      // A chalkboard rolls in, the notes write themselves, then the flask fills and bubbles.
      if (s.flask > 0) {
        const x = Math.round(-30 + s.flask * 36);
        rect(ctx, N.o, x, 48, 26, 13);
        rect(ctx, '#2f4a3a', x + 1, 49, 24, 11);
        const notes = [[3, 51, 6], [11, 51, 4], [3, 54, 9], [14, 54, 7], [3, 57, 5]];
        notes.slice(0, Math.round(notes.length * Math.min(1, s.chalk))).forEach(([nx, ny, w]) => rect(ctx, N.w, x + nx, ny, w, 1));
        rect(ctx, N.o, x + 2, 61, 1, 3); rect(ctx, N.o, x + 23, 61, 1, 3);
        const fill = steps4(s.boil);
        sprite(ctx, ['.oo.', '.ww.', 'owwo', fill >= 0.5 ? 'o11o' : 'owwo', fill > 0 ? 'o22o' : 'owwo', '.oo.'], x + 18, 54, { o: N.o, w: N.w, 1: c.light, 2: c.base });
        if (fill >= 1) {
          for (let i = 0; i < 3; i++) {
            const by = 53 - ((t * 6 + i * 3) % 8);
            rect(ctx, c.light, x + 19 + (i % 2), Math.round(by), 1, 1);
          }
        }
      }
    },
    cues: {
      throw: s => gsap.timeline()
        .fromTo(s, { ham: 0 }, { ham: 1, duration: 1.3, ease: 'power1.inOut' })
        .to(s, { cheer: 1, duration: 0.2 }, 1.1)
        .set(s, { mark: 62.4 }, 1.3)
        .to(s, { cheer: 0, duration: 0.8 }, 2.2),
      // The board rolls in, the notes write themselves line by line, and the flask fills until it bubbles.
      study: s => gsap.timeline()
        .to(s, { flask: 1, duration: 0.9, ease: 'power2.out' })
        .set(s, { board: 1 }, 0.4)
        .to(s, { chalk: 1, duration: 1, ease: 'steps(5)' }, 0.8)
        .to(s, { boil: 1, duration: 0.6, ease: 'steps(4)' }, 1.6),
    },
  });
})();
