/*
 * Act VI: the library, the year off and the self-taught year.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, rect, sprite, puff, blink } = Draw;
  const { bubble, doorway } = Props;

  Scenes.add('library', {
    heroX: 76,
    door: { x: 86, y: 36 },
    draw(ctx, c) {
      const r = rng(55);
      rect(ctx, '#f6efdc', 0, 0, W, H);
      // Shelves full of books.
      rect(ctx, '#8a6640', 2, 6, 58, 58);
      const spines = [c.base, c.shade, c.light, '#3b7dd8', '#3fa66b', '#e0533d', '#8a63d2', '#4a4652', N.w];
      for (let shelf = 0; shelf < 5; shelf++) {
        const y = 8 + shelf * 11;
        rect(ctx, '#6e5032', 4, y + 9, 54, 2);
        let x = 4;
        while (x < 57) {
          const w = 2 + Math.floor(r() * 2);
          const h = 6 + Math.floor(r() * 3);
          if (r() > 0.1) rect(ctx, spines[Math.floor(r() * spines.length)], x, y + 9 - h, Math.min(w, 58 - x), h);
          x += w;
        }
      }
      // Window.
      rect(ctx, '#8a6640', 112, 6, 40, 30);
      rect(ctx, '#bfe3f5', 114, 8, 36, 26);
      rect(ctx, '#8a6640', 131, 8, 2, 26);
      rect(ctx, '#8a6640', 114, 20, 36, 2);
      doorway(ctx, 86, 50);
      // Long desk with a lamp.
      rect(ctx, '#b48a5a', 66, 50, 88, 3);
      rect(ctx, '#8a6640', 66, 53, 88, 1);
      rect(ctx, '#8a6640', 68, 54, 2, 10);
      rect(ctx, '#8a6640', 150, 54, 2, 10);
      rect(ctx, N.o, 144, 49, 6, 1);
      rect(ctx, N.o, 146, 40, 1, 9);
      rect(ctx, c.shade, 143, 38, 6, 3);
      // Floor.
      rect(ctx, '#b48a5a', 0, GROUND, W, H - GROUND);
      rect(ctx, '#8a6640', 0, GROUND, W, 1);
    },
    init: () => ({ sun: 0, kite: -1, books: 0, lamp: 0, laptop: 0, code: 0, ran: 0, duck: 0, aha: 0, bug: 0 }),
    frame(ctx, c, s, t) {
      // A fun year: the sun comes up and a kite flies past the window.
      if (s.sun > 0) {
        const y = Math.round(34 - 18 * Math.min(1, s.sun));
        ctx.save();
        ctx.beginPath();
        ctx.rect(114, 8, 36, 26);
        ctx.clip();
        puff(ctx, 141, y, 4, '#ffd56b');
        if (s.kite >= 0) {
          const kx = Math.round(116 + Math.sin(t * 1.6) * 3 + s.kite * 14);
          const ky = Math.round(12 + Math.cos(t * 2.1) * 2);
          sprite(ctx, ['.2.', '212', '.2.', '.o.'], kx, ky, { 1: c.light, 2: '#e0533d', o: N.o });
          for (let i = 1; i < 8; i++) rect(ctx, N.o, kx + 1 - i, ky + 4 + i * 2, 1, 1);
        }
        ctx.restore();
      }
      // The lamp lights a pool on the desk.
      if (s.lamp > 0.5) {
        rect(ctx, '#fff3b0', 144, 41, 4, 1);
        for (let y = 42; y < 50; y++) for (let x = 146 - (y - 41); x <= 146 + (y - 41); x++) if ((x + y) % 2 === 0) rect(ctx, '#fff3b0', x, y, 1, 1);
      }
      // Books stack up, one at a time.
      const books = Math.floor(s.books * 3 + 0.001);
      for (let i = 0; i < books; i++) {
        rect(ctx, N.o, 118 + i, 47 - i * 3, 14, 3);
        rect(ctx, [c.base, '#3b7dd8', '#3fa66b'][i], 119 + i, 48 - i * 3, 12, 1);
        rect(ctx, N.w, 129 + i, 48 - i * 3, 2, 1);
      }
      // The laptop opens and code types itself.
      if (s.laptop > 0) {
        const lid = Math.round(9 * Math.min(1, s.laptop));
        rect(ctx, N.o, 88, 48, 18, 2);
        rect(ctx, N.m, 89, 48, 16, 1);
        if (lid > 0) {
          rect(ctx, N.o, 90, 48 - lid, 14, lid);
          rect(ctx, '#1d1b22', 91, 49 - lid, 12, lid - 1);
          const lines = Math.floor(s.code * 6);
          for (let i = 0; i < Math.min(lines, lid - 2); i++) {
            // Line 3 is the bug: it blinks red until the duck helps, then it runs green.
            let ink = [c.light, N.w, c.base, '#9c97a6'][i % 4];
            if (i === 2 && s.bug >= 1) ink = '#3fa66b';
            else if (i === 2 && s.bug > 0) ink = blink(t, 4) ? '#e0533d' : '#1d1b22';
            rect(ctx, ink, 92 + (i % 3 === 1 ? 2 : 0), 40 + i, 3 + ((i * 5) % 7), 1);
          }
          // It ran: the four projects light along the bottom of the screen.
          const apps = Math.round(4 * Math.min(1, s.ran));
          for (let i = 0; i < apps; i++) rect(ctx, [c.light, '#3b7dd8', '#3fa66b', '#e0533d'][i], 92 + i * 3, 46, 2, 1);
          if (s.code >= 1 && apps === 0 && blink(t, 2)) rect(ctx, c.light, 99, 46, 1, 1);
        }
      }
      // The rubber duck, and the moment the bug makes sense.
      if (s.duck > 0) {
        const y = Math.round(44 + (1 - Math.min(1, s.duck)) * -10);
        sprite(ctx, ['.oo..', 'o12o.', 'o1222oo', '.o2222o', '..oooo.'], 108, y, { o: N.o, 1: c.light, 2: c.base });
        if (s.aha > 0) bubble(ctx, 106, y - 11, s.aha >= 1 ? '!' : '?');
      }
    },
    cues: {
      fun: s => gsap.timeline().to(s, { sun: 1, duration: 1.2, ease: 'steps(6)' }).fromTo(s, { kite: 0 }, { kite: 1, duration: 2.4, ease: 'none' }, 0.5),
      study: s => gsap.timeline().to(s, { books: 1, duration: 0.9, ease: 'none' }).set(s, { lamp: 1 }, 0.9),
      code: s => gsap.timeline()
        .to(s, { laptop: 1, duration: 0.4, ease: 'steps(4)' })
        .to(s, { code: 1, duration: 1.2, ease: 'none' })
        .to(s, { ran: 1, duration: 0.6, ease: 'steps(4)' }, 1.7),
      // The duck lands, the bug blinks while he explains it out loud, then it makes sense and the line runs green.
      duck: s => gsap.timeline()
        .to(s, { duck: 1, duration: 0.4, ease: 'bounce.out' })
        .set(s, { aha: 0.5, bug: 0.5 }, 0.5)
        .set(s, { aha: 1 }, 1.6)
        .to(s, { bug: 1, duration: 0.01 }, 2.3),
    },
  });
})();
