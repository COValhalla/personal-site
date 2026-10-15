/*
 * Act II, moments 1 and 2: the high school football field under the lights, with a discus cage on the left and the track in front.
 * Night falls, the lights come on and your people walk on; then the discus sets the record.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, mix, rect, text, textWidth, steps4 } = Draw;
  const { person } = Props;

  Scenes.add('field', {
    heroX: 70,
    door: { x: 150, y: 30 },
    draw(ctx, c) {
      const r = rng(31);
      const navy = c.accent || '#24366b';
      // The far bleachers, with a crowd. frame() paints the sky above them.
      for (let row = 0; row < 4; row++) rect(ctx, mix(navy, '#ffffff', row % 2 ? 0.3 : 0.2), 0, 18 + row * 4, W, 4);
      const crowd = [c.base, c.light, N.w, navy, N.s, '#3a3744'];
      for (let row = 0; row < 4; row++) for (let x = 1; x < W; x += 2) if (r() > 0.45) rect(ctx, crowd[Math.floor(r() * crowd.length)], x, 19 + row * 4, 1, 2);
      rect(ctx, navy, 0, 34, W, 1);
      // The players' tunnel under the bleachers, the way out to summer.
      rect(ctx, N.o, 143, 23, 14, 12);
      rect(ctx, '#141318', 144, 24, 12, 11);
      rect(ctx, navy, 143, 22, 14, 2);
      // The field: mowed stripes, yard lines, and an end zone with a goalpost.
      for (let x = 0; x < W; x += 10) rect(ctx, (x / 10) % 2 ? '#4f9a48' : '#5aa651', x, 35, 10, 20);
      rect(ctx, c.base, 30, 35, 14, 20);
      for (let x = 44; x < W; x += 12) rect(ctx, N.w, x, 35, 1, 20);
      rect(ctx, '#f2c94c', 34, 37, 1, 10);
      rect(ctx, '#f2c94c', 30, 37, 9, 1);
      rect(ctx, '#f2c94c', 30, 23, 1, 14);
      rect(ctx, '#f2c94c', 38, 23, 1, 14);
      // The discus cage: three posts, a net and the throwing circle.
      for (let x = 4; x < 20; x += 2) for (let y = 32; y < 52; y += 2) rect(ctx, '#d8dde6', x, y, 1, 1);
      [3, 11, 19].forEach(x => rect(ctx, '#3a3744', x, 30, 1, 24));
      rect(ctx, '#3a3744', 3, 30, 17, 1);
      for (let a = 0; a < Math.PI * 2; a += 0.1) rect(ctx, N.w, Math.round(11 + Math.cos(a) * 5), Math.round(53 + Math.sin(a) * 1.5), 1, 1);
      // The track in front, where the hero stands.
      const lane = mix(c.base, '#7a4a3c', 0.35);
      rect(ctx, lane, 0, 55, W, H - 55);
      rect(ctx, N.w, 0, 55, W, 1);
      [60, 67].forEach(y => rect(ctx, mix(lane, '#ffffff', 0.6), 0, y, W, 1));
    },
    init: () => ({ night: 0, lights: 0, crew: 0, disc: -1, mark: 0, cheer: 0, team: 0, hop: 0, captain: 0 }),
    frame(ctx, c, s, t) {
      const navy = c.accent || '#24366b';
      // The sky: dusk, then night falls in four steps and the stars come out.
      const night = steps4(s.night);
      rect(ctx, mix('#f2a46b', '#1c2546', night), 0, 0, W, 12);
      rect(ctx, mix('#f7c78f', '#243058', night), 0, 12, W, 6);
      if (night >= 0.5) {
        const r = rng(7);
        for (let i = 0; i < 14; i++) rect(ctx, N.w, Math.floor(r() * 118), Math.floor(r() * 11), 1, 1);
      }
      // Two light towers behind the bleachers. Their lamps come on one by one.
      const lit = steps4(s.lights);
      [50, 100].forEach(x => {
        if (lit >= 1) {
          ctx.globalAlpha = 0.25;
          rect(ctx, '#fff4c2', x - 8, 0, 17, 10);
          ctx.globalAlpha = 1;
        }
        rect(ctx, '#3a3744', x, 7, 1, 11);
        rect(ctx, N.o, x - 5, 1, 11, 6);
        for (let k = 0; k < 6; k++) rect(ctx, k < Math.round(lit * 6) ? '#fff4c2' : '#4a4658', x - 4 + (k % 3) * 3, 2 + Math.floor(k / 3) * 2, 2, 1);
      });
      // The scoreboard: the record, then the captain.
      rect(ctx, N.o, 122, 1, 36, 17);
      rect(ctx, '#141318', 123, 2, 34, 15);
      rect(ctx, navy, 123, 2, 34, 2);
      const top = s.mark > 0 ? `${Math.round(s.mark)} FT` : 'HOME';
      text(ctx, top, 140 - textWidth(top) / 2, 5, s.mark > 0 ? '#ffb347' : '#5f5b6b');
      if (s.captain >= 0.5) text(ctx, 'CAPTAIN', 140 - textWidth('CAPTAIN') / 2, 11, '#ffb347');
      // Until the lights come on, the stadium sits in the evening shade.
      const shade = (1 - lit) * 0.4;
      if (shade > 0) {
        ctx.globalAlpha = shade;
        rect(ctx, '#0d1030', 0, 18, W, H - 18);
        ctx.globalAlpha = 1;
      }
      // The discus flies flat out of the cage and lands far up the field, where a flag marks it.
      if (s.disc >= 0) {
        const k = Math.min(1, s.disc);
        if (k < 1) {
          const x = Math.round(11 + (132 - 11) * k);
          const y = Math.round(50 - Math.sin(k * Math.PI) * 22 + (44 - 50) * k);
          rect(ctx, N.w, x - 4, y + 1, 2, 1);
          rect(ctx, N.o, x - 1, y - 1, 4, 3);
          rect(ctx, N.m, x, y, 2, 1);
        } else {
          rect(ctx, N.o, 132, 38, 1, 7);
          rect(ctx, '#ffb347', 133, 38, 3, 2);
          rect(ctx, N.m, 130, 45, 3, 1);
        }
      }
      // Your people walk on in their jerseys: three friends, then the rest of the team. They jump for the captain.
      const hop = Math.round(Math.sin(Math.max(0, Math.min(1, s.hop)) * Math.PI) * 3);
      [[86, s.crew, 0], [100, s.crew, 1], [114, s.crew, 2], [128, s.team, 0], [142, s.team, 1]].forEach(([spot, v, k], n) => {
        const go = Math.max(0, Math.min(1, v * 1.6 - k * 0.3));
        if (go <= 0) return;
        person(ctx, Math.round(spot + 70 * (1 - go)), GROUND - (go >= 1 ? hop : 0), c, [0, 1, 3, 2, 4][n], true);
      });
      // The crowd stands up and cheers.
      if (s.cheer > 0.05) {
        const r = rng(Math.floor(t * 8));
        for (let i = 0; i < 40 * s.cheer; i++) rect(ctx, [c.light, N.w, c.base][i % 3], Math.floor(r() * W), 19 + Math.floor(r() * 4) * 4, 1, 1);
      }
    },
    cues: {
      // Friends, then captain: night falls, the lights come on, three friends walk on, then the rest of the team,
      // the board says CAPTAIN and everyone jumps.
      captain: s => gsap.timeline()
        .to(s, { night: 1, duration: 0.6, ease: 'steps(4)' })
        .to(s, { lights: 1, duration: 0.6, ease: 'steps(4)' }, 0.4)
        .to(s, { crew: 1, duration: 1.0, ease: 'steps(10)' }, 0.8)
        .to(s, { team: 1, duration: 0.8, ease: 'steps(8)' }, 1.6)
        .set(s, { captain: 1 }, 2.4)
        .fromTo(s, { hop: 0 }, { hop: 1, duration: 0.5, ease: 'steps(4)' }, 2.5),
      // The record: the discus flies, the crowd cheers and the board counts up to 176 feet.
      discus: s => gsap.timeline()
        .fromTo(s, { disc: 0 }, { disc: 1, duration: 1.2, ease: 'power1.inOut' })
        .to(s, { cheer: 1, duration: 0.2 }, 1.0)
        .fromTo(s, { mark: 0 }, { mark: 176, duration: 0.5, ease: 'steps(8)' }, 1.2)
        .to(s, { cheer: 0, duration: 0.8 }, 2.1),
    },
  });
})();
