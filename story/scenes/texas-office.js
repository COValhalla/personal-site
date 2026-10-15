/*
 * Act III, moment 3: the office in Texas where each internship summer ended. The sun sets over the oil field,
 * the executives take their seats, and the cost and ROI model builds on the screen until the room applauds.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, mix, rect, text, sprite, puff, steps4, blink } = Draw;
  const { doorway, PERSON_LOOKS } = Props;

  Scenes.add('texas-office', {
    heroX: 64,
    door: { x: 150, y: 50 },
    draw(ctx, c) {
      // A cream office wall over a wood wainscot, and carpet in the school color.
      rect(ctx, '#f1e6d4', 0, 0, W, GROUND);
      rect(ctx, '#d8c3a2', 0, 42, W, GROUND - 42);
      rect(ctx, '#c4ab86', 0, 42, W, 1);
      for (let x = 6; x < W; x += 12) rect(ctx, '#ccb592', x, 44, 1, GROUND - 46);
      rect(ctx, '#8c5a32', 0, GROUND - 2, W, 2);
      const carpet = mix(c.shade, '#3a3744', 0.55);
      rect(ctx, carpet, 0, GROUND, W, H - GROUND);
      const r = rng(33);
      for (let i = 0; i < 24; i++) rect(ctx, mix(carpet, c.base, 0.4), Math.floor(r() * W), GROUND + 1 + Math.floor(r() * 7), 1, 1);
      // The window frame and its sill; frame() paints the view.
      rect(ctx, N.o, 3, 5, 52, 34);
      rect(ctx, '#c4ab86', 2, 39, 54, 2);
      // The projector screen, with the chart's axes.
      rect(ctx, N.n, 71, 3, 66, 3);
      rect(ctx, N.o, 73, 6, 62, 31);
      rect(ctx, N.w, 74, 6, 60, 30);
      text(ctx, 'COST + ROI', 85, 8, c.shade);
      rect(ctx, N.n, 80, 15, 1, 18);
      rect(ctx, N.n, 80, 32, 50, 1);
      doorway(ctx, 150, GROUND);
    },
    init: () => ({ sun: 0, seats: 0, bars: 0, roi: 0, clap: 0 }),
    frame(ctx, c, s, t) {
      // The view: the sky turns to sunset in four steps and the sun sinks behind a flat horizon.
      const sun = steps4(s.sun);
      rect(ctx, mix('#9fd3f5', '#ff9f5a', sun), 4, 6, 50, 14);
      rect(ctx, mix('#c4e6f7', '#ffd08a', sun), 4, 20, 50, 10);
      puff(ctx, 47, Math.round(12 + sun * 17), 3, mix('#fff1a8', '#ffd56b', sun));
      rect(ctx, mix('#d9b77a', '#a8743f', sun), 4, 30, 50, 8);
      rect(ctx, mix('#c9a464', '#8c5a32', sun), 4, 30, 50, 1);
      // An oil derrick and a pumpjack that nods all day.
      for (let y = 0; y < 15; y++) {
        const w = 1 + Math.floor(y / 2) * 2;
        rect(ctx, N.o, 37 - Math.floor(w / 2), 15 + y, 1, 1);
        rect(ctx, N.o, 37 + Math.floor(w / 2), 15 + y, 1, 1);
        if (y % 4 === 3) rect(ctx, N.o, 37 - Math.floor(w / 2), 15 + y, w, 1);
      }
      // The walking beam rocks on its A-frame: the horse head dips on the left, the counterweight swings on the right.
      const tilt = Math.round(Math.sin(t * 3) * 2);
      const beam = i => Math.round(22 + ((i - 9) / 8) * tilt);
      for (let i = 0; i <= 16; i++) rect(ctx, N.o, 7 + i, beam(i), 1, 1);
      rect(ctx, N.o, 6, beam(0) - 1, 2, 4);
      rect(ctx, N.o, 7, beam(0) + 3, 1, 29 - beam(0) - 3);
      rect(ctx, N.o, 21, beam(16) + 1, 3, 3);
      for (let y = 23; y < 29; y++) {
        rect(ctx, N.o, 16 - Math.floor((y - 22) / 2), y, 1, 1);
        rect(ctx, N.o, 16 + Math.floor((y - 22) / 2), y, 1, 1);
      }
      rect(ctx, N.o, 6, 29, 19, 1);
      rect(ctx, N.o, 29, 6, 1, 32);
      // The executives fill two rows of chairs, the front row first, seen from behind.
      const suits = ['#3a3744', '#24366b', '#5f5b6b', '#6b4226'];
      const seated = Math.round(Math.max(0, Math.min(1, s.seats)) * 16);
      const clap = s.clap >= 1;
      [[78, 44, 8], [82, 51, 0]].forEach(([x0, y, first]) => {
        for (let i = 0; i < 8; i++) {
          if (first + i >= seated) continue;
          const x = x0 + i * 7;
          const k = first + i;
          sprite(ctx, ['.oooo.', 'ohhhho', 'ohhhho', '.oSSo.', 'oJJJJo', 'JJJJJJ'], x, y,
            { o: N.o, h: PERSON_LOOKS[k % PERSON_LOOKS.length].h, S: N.S, J: suits[k % suits.length] });
          rect(ctx, '#4d4958', x, y + 6, 6, GROUND - y - 6);
          rect(ctx, '#5f5b6b', x, y + 6, 6, 1);
          // Applause: hands up over the heads, in turn.
          if (clap) {
            const up = blink(t + k * 0.37, 4) ? 0 : 1;
            rect(ctx, N.s, x - 1, y - 2 + up, 1, 2);
            rect(ctx, N.s, x + 6, y - 2 + up, 1, 2);
          }
        }
      });
      // The cost model: bars that shrink year by year, then the return climbing over them.
      const bars = Math.round(Math.max(0, Math.min(1, s.bars)) * 4);
      [16, 12, 9, 6].slice(0, bars).forEach((h, i) => {
        rect(ctx, c.light, 84 + i * 10, 32 - h, 6, h);
        rect(ctx, c.shade, 84 + i * 10, 32 - h, 6, 1);
      });
      const roi = Math.max(0, Math.min(1, s.roi));
      if (roi > 0) {
        const pts = [[85, 29], [95, 25], [105, 20], [115, 16], [127, 11]];
        const path = [];
        for (let j = 1; j < pts.length; j++) {
          const [x1, y1] = pts[j - 1];
          const [x2, y2] = pts[j];
          const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
          for (let q = 0; q < n; q++) path.push([Math.round(x1 + ((x2 - x1) * q) / n), Math.round(y1 + ((y2 - y1) * q) / n)]);
        }
        path.slice(0, Math.round(path.length * roi)).forEach(([x, y]) => rect(ctx, c.base, x, y, 2, 2));
        if (roi >= 1) text(ctx, '$', 130, 9, c.shade);
      }
    },
    cues: {
      texas: s => gsap.timeline()
        .to(s, { sun: 1, duration: 1.2, ease: 'steps(4)' })
        .to(s, { seats: 1, duration: 1.2, ease: 'steps(16)' }, 0.2)
        .to(s, { bars: 1, duration: 0.8, ease: 'steps(4)' }, 1.1)
        .to(s, { roi: 1, duration: 0.8, ease: 'steps(8)' }, 1.9)
        .set(s, { clap: 1 }, 2.8),
    },
  });
})();
