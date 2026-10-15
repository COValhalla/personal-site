/*
 * Act VII: a studio with a roadmap board, the business and the team.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rng, mix, rect, text, sprite, puff } = Draw;
  const { bubble, doorway, person } = Props;

  Scenes.add('studio', {
    heroX: 70,
    door: { x: 151, y: 50 },
    draw(ctx, c) {
      rect(ctx, '#f1eef7', 0, 0, W, H);
      // Board.
      rect(ctx, '#7d808a', 4, 4, 112, 42);
      rect(ctx, N.w, 5, 5, 110, 40);
      [42, 79].forEach(x => rect(ctx, '#d8d4e0', x, 8, 1, 34));
      text(ctx, 'NOW', 9, 7, '#3a3744');
      text(ctx, 'NEXT', 46, 7, '#3a3744');
      text(ctx, 'LATER', 83, 7, '#3a3744');
      // Window on the city.
      rect(ctx, '#7d808a', 122, 4, 34, 28);
      rect(ctx, '#d6e6f7', 123, 5, 32, 26);
      const r = rng(66);
      for (let x = 123; x < 155; x += 4) { const h = 6 + Math.floor(r() * 14); rect(ctx, '#aebfd6', x, 31 - h, 3, h); }
      doorway(ctx, 151, GROUND);
      // Floor.
      rect(ctx, '#d9d5e3', 0, GROUND, W, H - GROUND);
      rect(ctx, '#c4bfd2', 0, GROUND, W, 1);
    },
    init: () => ({ biz: 0, talk: 0, notes: 0, loop: 0, award: 0, team: 0, plan: 0, card: 0, shine: 0, first: 0 }),
    frame(ctx, c, s, t, all) {
      const colors = (all || []).map(a => a.color.base);
      // Sticky notes: first all in Now, then spread into a roadmap.
      const notes = Math.floor(s.notes * 6 + 0.001);
      for (let i = 0; i < notes; i++) {
        const home = [9 + (i % 3) * 10, 14 + Math.floor(i / 3) * 10];
        const plan = [[9, 14], [19, 14], [46, 14], [56, 14], [83, 14], [46, 25]][i];
        const k = Math.min(1, s.plan);
        const x = Math.round(home[0] + (plan[0] - home[0]) * k);
        const y = Math.round(home[1] + (plan[1] - home[1]) * k);
        const col = colors[i % colors.length] || c.base;
        const lit = s.shine > 0 && (Math.floor(t * 4) + i) % 3 === 0;
        rect(ctx, lit ? mix(col, '#ffffff', 0.4) : col, x, y, 8, 7);
        rect(ctx, mix(col, '#ffffff', 0.5), x + 1, y + 2, 5, 1);
      }
      // The loop he ran on his own: ask the business, build it, ship it, and round again.
      if (s.loop > 0) {
        const k = Math.max(0, Math.min(1, s.loop));
        ctx.globalAlpha = k;
        rect(ctx, N.w, 50, 16, 57, 7);
        text(ctx, 'ASK-BUILD-SHIP', 51, 17, c.shade);
        // The way back round: down from Ship, along the bottom, up to Ask.
        const path = [];
        for (let y = 24; y <= 32; y++) path.push([104, y]);
        for (let x = 103; x >= 56; x--) path.push([x, 32]);
        for (let y = 31; y >= 24; y--) path.push([56, y]);
        path.forEach(([x, y], i) => { if (i % 2 === 0) rect(ctx, c.base, x, y, 1, 1); });
        rect(ctx, c.base, 55, 24, 3, 1);
        // A dot runs the whole loop: along the words, then back round.
        const lap = (t * 0.6) % 1;
        const [dx, dy] = lap < 0.4 ? [56 + (lap / 0.4) * 48, 24] : path[Math.floor(((lap - 0.4) / 0.6) * (path.length - 1))];
        puff(ctx, Math.round(dx), Math.round(dy), 1, c.shade);
        ctx.globalAlpha = 1;
      }
      // The award drops onto the Later column of the board.
      if (s.award > 0) {
        const y = Math.round(31 - (1 - Math.min(1, s.award)) * 8);
        sprite(ctx, ['.oooooo.', 'oo1111oo', 'o.1221.o', '.o1221o.', '..o22o..', '...oo...', '...22...', '..o22o..', '.oooooo.'], 107, y, { o: N.o, 1: '#f5cf66', 2: '#e5ac1f' });
      }
      // The business: two people with questions.
      if (s.biz > 0) {
        const x = Math.round(-20 + 30 * Math.min(1, s.biz));
        person(ctx, x, GROUND, { light: '#9c97a6', base: '#4a4652', shade: '#2a2733' }, 0, false);
        person(ctx, x + 18, GROUND, { light: '#7fd09c', base: '#3fa66b', shade: '#286f46' }, 1, false);
        if (s.talk > 0) bubble(ctx, x + 6, 30, s.talk >= 1 ? '$' : '?');
        if (s.talk > 0.4) bubble(ctx, x + 24, 26, s.talk >= 1 ? '!' : '?');
      }
      // The team walks in from the right.
      if (s.team > 0) {
        const ramps = [{ light: '#7fb0ee', base: '#3b7dd8', shade: '#24539c' }, { light: '#f08a75', base: '#e0533d', shade: '#a3352a' }, { light: '#f5cf66', base: '#e5ac1f', shade: '#a57712' }];
        ramps.forEach((ramp, k) => {
          const x = Math.round(W + 6 + k * 14 - (W - 88) * Math.min(1, s.team));
          person(ctx, x + k * 4, GROUND, ramp, k + 2, true);
        });
      }
      // The prototype card that reached a customer a week later, held up over the team.
      if (s.card > 0) {
        const y = Math.round(28 - 4 * Math.min(1, s.card));
        sprite(ctx, ['ooooooooo', 'owwwwwwwo', 'ow22wwwwo', 'ow22w111o', 'owwwwwwwo', 'ooooooooo'], 111, y, { o: N.o, w: N.w, 1: c.light, 2: '#e5ac1f' });
      }
      if (s.shine > 0) {
        const r = rng(Math.floor(t * 6));
        for (let i = 0; i < Math.round(16 * Math.min(1, s.shine)); i++) rect(ctx, [c.light, N.w, c.base][i % 3], 60 + Math.floor(r() * 40), 30 + Math.floor(r() * 30), 1, 1);
      }
      // The typing race's 1ST comes back, on the Later column.
      if (s.first > 0.5) {
        text(ctx, '1ST', 84, 32, c.base);
        rect(ctx, c.base, 98, 33, 1, 3);
      }
    },
    cues: {
      listen: s => gsap.timeline().to(s, { biz: 1, duration: 0.9, ease: 'steps(9)' }).to(s, { talk: 0.5, duration: 0.01 }, 0.9).to(s, { talk: 1, duration: 0.01 }, 1.6).to(s, { notes: 0.5, duration: 0.6, ease: 'none' }, 1.6),
      // The loop he ran on his own fills the board, then the award drops in.
      loop: s => gsap.timeline()
        .to(s, { loop: 1, duration: 0.8, ease: 'steps(4)' })
        .to(s, { notes: 1, duration: 0.6, ease: 'none' }, 0.6)
        .to(s, { award: 1, duration: 0.7, ease: 'bounce.out' }, 1.3),
      // The team arrives, the loop gives way to a roadmap the whole team can follow, and the prototype card goes up.
      team: s => gsap.timeline()
        .to(s, { team: 1, duration: 1.6, ease: 'steps(16)' })
        .to(s, { loop: 0, duration: 0.4, ease: 'steps(3)' }, 1)
        .to(s, { plan: 1, duration: 1.2, ease: 'power2.inOut' }, 1.3)
        .to(s, { card: 1, duration: 0.3, ease: 'steps(3)' }, 2.5),
      shine: s => gsap.timeline().to(s, { shine: 1, duration: 0.8, ease: 'steps(4)' }).to(s, { first: 1, duration: 0.01 }, 1.4),
    },
  });
})();
