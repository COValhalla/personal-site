/*
 * Act scenes. Each scene paints a still 160 x 72 background once, then draws
 * its moving parts over it on every frame while the act is on screen.
 *
 * A moment (beat) in a recipe can name a cue. A cue is a short animation in
 * the scene's cues: it tweens the scene's state with GSAP, and frame() draws
 * whatever the state says. Played to its end, a cue leaves the scene in its
 * final state, so an act unlocked without motion looks the same.
 *
 * heroX is where the hero stands; the ground is at y = 64 in every scene.
 * Colors come from the act's ramp plus the shared neutrals in pixel.js.
 */
(function () {
  'use strict';

  const W = 160;
  const H = 72;
  const GROUND = 64;
  const N = Pixel.NEUTRALS;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = s => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
    const ca = ch(pa);
    const cb = ch(pb);
    return '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  function rect(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  const text = (ctx, str, x, y, color) => Pixel.text(ctx, str, Math.round(x), Math.round(y), color, 1);
  const textWidth = str => String(str).length * 4 - 1;

  // A small prop: rows of characters, each mapped to a color by map.
  function sprite(ctx, rows, x, y, map, flip) {
    const w = rows[0].length;
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const color = map[ch];
      if (color) rect(ctx, color, x + (flip ? w - 1 - i : i), y + j, 1, 1);
    }));
  }

  // Night falls in four steps, like a palette fade in an old game.
  const steps4 = v => Math.round(Math.max(0, Math.min(1, v)) * 4) / 4;
  const blink = (t, rate) => Math.floor(t * rate) % 2 === 0;

  function peak(ctx, color, cx, top, half, snow) {
    for (let y = top; y < GROUND; y++) {
      const w = Math.round(((y - top) / (GROUND - top)) * half * 2) + 1;
      rect(ctx, snow && y < top + 5 ? snow : color, cx - Math.floor(w / 2), y, w, 1);
    }
  }

  function pine(ctx, color, shade, x, base, h) {
    rect(ctx, N.h, x, base - 2, 1, 2);
    for (let i = 0; i < h; i++) {
      const w = 1 + 2 * Math.floor(i / 2);
      rect(ctx, i % 4 === 3 ? shade : color, x - Math.floor(w / 2), base - 2 - h + i, w, 1);
    }
  }

  function cloud(ctx, x, y, color) {
    rect(ctx, color, x + 2, y, 6, 1);
    rect(ctx, color, x, y + 1, 11, 2);
    rect(ctx, color, x + 4, y - 1, 3, 1);
  }

  function puff(ctx, x, y, r, color) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) rect(ctx, color, x + i, y + j, 1, 1);
  }

  function bubble(ctx, x, y, str, ink) {
    const w = textWidth(str) + 4;
    rect(ctx, N.o, x - 1, y - 1, w + 2, 9);
    rect(ctx, N.w, x, y, w, 7);
    rect(ctx, N.o, x + 2, y + 8, 2, 1);
    rect(ctx, N.o, x + 2, y + 9, 1, 1);
    text(ctx, str, x + 2, y + 1, ink || N.o);
  }

  // A person drawn from the hero's base, in someone else's shirt and hair.
  const PERSON_LOOKS = [
    { h: '#2b1d14', s: '#c98f66', S: '#9b6a48' },
    { h: '#d8a548', s: '#f3c9a6', S: '#cf9d79' },
    { h: '#1d1b22', s: '#8d5a3b', S: '#6a412a' },
    { h: '#a3462a', s: '#f0c29a', S: '#c98f66' },
    { h: '#7d808a', s: '#e8b48c', S: '#c08a62' },
  ];
  function person(ctx, x, feetY, ramp, k, flip) {
    Pixel.paint(ctx, Pixel.PERSON_BASE, ramp, x, feetY - 22, 1, flip, PERSON_LOOKS[k % PERSON_LOOKS.length]);
  }

  // Tiny BMX rider, 9 x 8, for scenes. Rider in the given jersey color.
  const RIDER = [
    '...hh....',
    '...hjj...',
    '....jjm..',
    '...jj.m..',
    '..oookmo.',
    '.o.ok.o.o',
    '.o.o..o.o',
    '..o....o.',
  ];

  const scenes = {
    // Act I: a bright BMX track on a Saturday, the start hill on the left and the family shop on the right.
    'bmx-track': {
      heroX: 50,
      draw(ctx, c) {
        const sky = c.accent || '#3fa9f5';
        ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'].forEach((w, i) => rect(ctx, mix(sky, w, 0.25 + i * 0.14), 0, i * 8, W, 8));
        rect(ctx, mix(sky, '#ffffff', 0.85), 0, 40, W, 12);
        // Rolling hills.
        for (let x = 0; x < W; x++) {
          const h = Math.round(7 + Math.sin(x / 13) * 3 + Math.sin(x / 5.3) * 1.2);
          rect(ctx, '#86cf6e', x, 50 - h, 1, h + 4);
          const h2 = Math.round(4 + Math.sin(x / 9 + 2) * 2);
          rect(ctx, '#6bbb57', x, 53 - h2, 1, h2 + 2);
        }
        // Fence with sponsor banners.
        rect(ctx, '#f6f4ef', 0, 51, W, 1);
        for (let x = 2; x < W; x += 26) { rect(ctx, c.base, x, 52, 20, 4); rect(ctx, c.light, x + 2, 53, 9, 1); rect(ctx, N.w, x + 13, 53, 5, 2); }
        for (let x = 0; x < W; x += 13) rect(ctx, '#d3cec6', x, 51, 1, 6);
        // Dirt: the back of the track, the riding line, the front edge with pebbles.
        rect(ctx, '#b97a4a', 0, 56, W, 8);
        rect(ctx, '#c98a55', 0, GROUND, W, H - GROUND);
        rect(ctx, '#e0a46f', 0, GROUND, W, 1);
        const r = rng(13);
        for (let i = 0; i < 40; i++) rect(ctx, r() > 0.5 ? '#a96b3e' : '#dba06d', Math.floor(r() * W), GROUND + 2 + Math.floor(r() * 7), 1, 1);
        // Rollers.
        [[84, 9], [100, 9]].forEach(([x0, w]) => {
          for (let x = 0; x <= w; x++) {
            const h = Math.round(Math.sin((x / w) * Math.PI) * 5);
            rect(ctx, '#c98a55', x0 + x, GROUND - h, 1, h);
            rect(ctx, '#e0a46f', x0 + x, GROUND - h, 1, 1);
          }
        });
        // Start hill with the gate and a little tower.
        rect(ctx, '#c98a55', 0, 46, 24, 18);
        for (let x = 0; x < 18; x++) rect(ctx, '#c98a55', 24 + x, 46 + x, 1, 18 - x);
        for (let x = 0; x < 18; x++) rect(ctx, '#e0a46f', 24 + x, 46 + x, 1, 1);
        rect(ctx, '#e0a46f', 0, 46, 24, 1);
        rect(ctx, N.o, 2, 28, 1, 18);
        rect(ctx, N.o, 16, 28, 1, 18);
        rect(ctx, c.shade, 1, 26, 17, 2);
        rect(ctx, c.base, 0, 25, 19, 1);
        rect(ctx, N.w, 2, 34, 15, 1);
        // The gate, standing up.
        rect(ctx, N.o, 22, 38, 3, 8);
        for (let y = 39; y < 46; y += 2) rect(ctx, y % 4 === 1 ? c.base : N.w, 23, y, 1, 1);
        // The family shop.
        rect(ctx, '#efe4d0', 114, 36, 44, 28);
        rect(ctx, N.o, 113, 36, 1, 28);
        rect(ctx, N.o, 158, 36, 1, 28);
        for (let y = 0; y < 10; y++) rect(ctx, y < 2 ? c.shade : c.base, 112 + y, 26 + y, 48 - 2 * y, 1);
        rect(ctx, c.shade, 112, 35, 48, 1);
        rect(ctx, N.w, 120, 38, 18, 7);
        rect(ctx, N.o, 119, 38, 1, 7);
        rect(ctx, N.o, 138, 38, 1, 7);
        text(ctx, 'SHOP', 121, 39, c.shade);
        rect(ctx, N.o, 117, 46, 24, 1);
        rect(ctx, N.o, 117, 46, 1, 18);
        rect(ctx, N.o, 140, 46, 1, 18);
        rect(ctx, N.o, 143, 38, 12, 1);
        rect(ctx, N.o, 143, 38, 1, 10);
        rect(ctx, N.o, 154, 38, 1, 10);
        rect(ctx, N.o, 143, 47, 12, 1);
        rect(ctx, N.o, 148, 38, 1, 10);
      },
      init: () => ({ race: -1, door: 0, night: 0, screen: 0 }),
      frame(ctx, c, s, t) {
        const dark = steps4(s.night);
        // Clouds drift by day; stars come out at night.
        [[0, 6, 4], [70, 14, 3], [120, 9, 5]].forEach(([x0, y, speed]) => {
          if (dark < 1) cloud(ctx, ((x0 + t * speed) % (W + 30)) - 15, y, dark > 0.4 ? '#c9d2e8' : N.w);
        });
        if (dark > 0) {
          ctx.globalAlpha = dark * 0.72;
          rect(ctx, '#0d1030', 0, 0, W, H);
          ctx.globalAlpha = 1;
          const r = rng(4);
          for (let i = 0; i < 26; i++) {
            const x = Math.floor(r() * W);
            const y = Math.floor(r() * 34);
            if (dark >= 0.75 && (i + Math.floor(t * 2)) % 7) rect(ctx, i % 3 ? '#f6f4ef' : c.light, x, y, 1, 1);
          }
          if (dark >= 0.75) puff(ctx, 92, 10, 3, '#f6f0d8');
        }
        // The tower flag flaps.
        rect(ctx, N.o, 9, 19, 1, 6);
        rect(ctx, c.light, 10, 19, blink(t, 2.5) ? 5 : 4, 2);
        rect(ctx, c.base, 10, 21, blink(t, 2.5) ? 4 : 5, 1);
        // The shop door rolls up to show the tool wall.
        const open = Math.round(Math.max(0, Math.min(1, s.door)) * 17);
        rect(ctx, '#d9c7a3', 118, 47, 22, 17);
        if (open > 0) {
          rect(ctx, '#e8d9b8', 118, 47, 22, 17);
          for (let y = 49; y < 63; y += 2) for (let x = 119; x < 140; x += 2) rect(ctx, '#cdb98f', x, y, 1, 1);
          rect(ctx, N.n, 121, 50, 1, 7); rect(ctx, N.m, 120, 49, 3, 2);
          rect(ctx, N.n, 125, 50, 6, 1); rect(ctx, c.base, 129, 49, 3, 3);
          rect(ctx, N.m, 134, 50, 1, 8); rect(ctx, N.o, 133, 49, 3, 1);
          rect(ctx, c.shade, 120, 59, 18, 4); rect(ctx, c.light, 121, 59, 16, 1);
          rect(ctx, '#fff3b0', 128, 47, 2, 1);
        }
        for (let y = 47; y < 64 - open; y += 2) rect(ctx, '#b9b2a6', 118, y, 22, 1);
        // The upstairs window: by night, a computer glows with a little inventory on screen.
        const glow = steps4(s.screen);
        rect(ctx, glow > 0 ? mix('#2a3a6a', '#9fd8ff', glow) : '#cfe6f7', 144, 39, 4, 8);
        rect(ctx, glow > 0 ? mix('#2a3a6a', '#9fd8ff', glow) : '#cfe6f7', 149, 39, 5, 8);
        if (glow > 0) {
          rect(ctx, N.o, 145, 41, 8, 6);
          rect(ctx, '#2a1416', 146, 42, 6, 4);
          if (glow >= 0.5) for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) rect(ctx, (i + j + Math.floor(t * 3)) % 4 ? '#7a3324' : c.light, 146 + i * 2, 42 + j * 2, 1, 1);
        }
        // Riders race past on the cue.
        if (s.race >= 0) {
          ['#e0533d', c.accent || '#3fa9f5', c.base].forEach((jersey, k) => {
            const x = Math.round(-14 + (s.race * 1.25 - k * 0.09) * (W + 30));
            if (x < -12 || x > W + 2) return;
            let lift = 0;
            [[84, 9], [100, 9]].forEach(([x0, w]) => {
              const u = (x + 5 - x0) / w;
              if (u >= 0 && u <= 1) lift = Math.max(lift, Math.sin(u * Math.PI) * 5);
            });
            sprite(ctx, RIDER, x, GROUND - 8 - Math.round(lift), { h: c.shade, j: jersey, m: N.s, o: N.o, k: N.k });
            if ((Math.floor(t * 12) + k) % 2) rect(ctx, '#dba06d', x - 2, GROUND - 1, 2, 1);
          });
        }
      },
      cues: {
        race: s => gsap.timeline().fromTo(s, { race: 0 }, { race: 1, duration: 2.6, ease: 'none' }).set(s, { race: -1 }),
        shop: s => gsap.timeline().to(s, { door: 1, duration: 0.9, ease: 'steps(6)' }),
        // Night falls, the game glows upstairs, and Saturday morning comes back round.
        night: s => gsap.timeline().to(s, { night: 1, duration: 1, ease: 'none' }).to(s, { screen: 1, duration: 0.5, ease: 'none' }, 0.8).to(s, { night: 0, duration: 0.9, ease: 'none' }, 2.6),
      },
    },

    // Act II: a track with the hammer cage, the stands and the scoreboard.
    track: {
      heroX: 52,
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
      init: () => ({ ham: -1, mark: 0, cheer: 0, board: 0, flask: 0, texas: 0, sun: 0 }),
      frame(ctx, c, s, t) {
        // The crowd stands up and cheers.
        if (s.cheer > 0.05) {
          const r = rng(Math.floor(t * 8));
          for (let i = 0; i < 40 * s.cheer; i++) rect(ctx, [c.light, N.w, c.base][i % 3], Math.floor(r() * W), 14 + Math.floor(r() * 5) * 5, 1, 1);
        }
        // Scoreboard text.
        if (s.texas > 0.5) text(ctx, 'TEXAS', 103, 4, '#ffb347');
        else if (s.board > 0.5) text(ctx, 'CHEM E', 101, 4, '#ffb347');
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
        // A chalkboard rolls in with a flask that bubbles.
        if (s.flask > 0) {
          const x = Math.round(-30 + s.flask * 36);
          rect(ctx, N.o, x, 48, 26, 13);
          rect(ctx, '#2f4a3a', x + 1, 49, 24, 11);
          rect(ctx, N.w, x + 3, 51, 6, 1); rect(ctx, N.w, x + 11, 51, 4, 1); rect(ctx, N.w, x + 3, 54, 9, 1); rect(ctx, N.w, x + 14, 54, 7, 1); rect(ctx, N.w, x + 3, 57, 5, 1);
          rect(ctx, N.o, x + 2, 61, 1, 3); rect(ctx, N.o, x + 23, 61, 1, 3);
          sprite(ctx, ['.oo.', '.ww.', 'owwo', 'o11o', 'o22o', '.oo.'], x + 18, 54, { o: N.o, w: N.w, 1: c.light, 2: c.base });
          for (let i = 0; i < 3; i++) {
            const by = 53 - ((t * 6 + i * 3) % 8);
            rect(ctx, c.light, x + 19 + (i % 2), Math.round(by), 1, 1);
          }
        }
        // Texas: a pumpjack nods on the horizon at sunset.
        if (s.texas > 0) {
          rect(ctx, mix('#fbf6f1', '#ffb36b', steps4(s.texas)), 0, 0, 96, 13);
          if (s.texas > 0.5) {
            puff(ctx, 84, 9, 3, '#ffd56b');
            const nod = Math.sin(t * 3) * 1.5;
            rect(ctx, N.o, 14, 4, 1, 9);
            rect(ctx, N.o, 8, 12, 14, 1);
            rect(ctx, N.o, 6, Math.round(4 + nod), 16, 1);
            rect(ctx, N.o, 5, Math.round(4 + nod), 2, 3);
            rect(ctx, N.o, 6, Math.round(6 + nod), 1, Math.round(6 - nod));
            rect(ctx, N.o, 20, Math.round(4 - nod), 2, 3);
          }
        }
      },
      cues: {
        throw: s => gsap.timeline()
          .fromTo(s, { ham: 0 }, { ham: 1, duration: 1.3, ease: 'power1.inOut' })
          .to(s, { cheer: 1, duration: 0.2 }, 1.1)
          .set(s, { mark: 62.4 }, 1.3)
          .to(s, { cheer: 0, duration: 0.8 }, 2.2),
        study: s => gsap.timeline().to(s, { flask: 1, duration: 0.9, ease: 'power2.out' }).set(s, { board: 1 }, 0.4),
        texas: s => gsap.timeline().to(s, { texas: 1, duration: 1, ease: 'none' }),
      },
    },

    // Act III: a blueprint of a plant.
    plant: {
      heroX: 26,
      draw(ctx, c) {
        rect(ctx, c.shade, 0, 0, W, H);
        const grid = mix(c.shade, c.light, 0.35);
        for (let x = 0; x < W; x += 8) rect(ctx, grid, x, 0, 1, H);
        for (let y = 0; y < H; y += 8) rect(ctx, grid, 0, y, W, 1);
        const ink = N.w;
        const line = (x1, y1, x2, y2) => {
          const dx = Math.sign(x2 - x1);
          const dy = Math.sign(y2 - y1);
          let x = x1;
          let y = y1;
          rect(ctx, ink, x, y, 1, 1);
          while (x !== x2 || y !== y2) { if (x !== x2) x += dx; if (y !== y2) y += dy; rect(ctx, ink, x, y, 1, 1); }
        };
        const box = (x, y, w, h) => { line(x, y, x + w, y); line(x + w, y, x + w, y + h); line(x + w, y + h, x, y + h); line(x, y + h, x, y); };
        // Main building with a sawtooth roof.
        box(56, 36, 56, 28);
        for (let i = 0; i < 4; i++) { line(56 + i * 14, 36, 56 + i * 14 + 7, 28); line(56 + i * 14 + 7, 28, 56 + i * 14 + 7, 36); }
        for (let i = 0; i < 5; i++) box(61 + i * 10, 44, 5, 5);
        box(78, 54, 10, 10);
        // Smokestack and a tank with pipes.
        box(118, 14, 6, 50);
        for (let y = 18; y < 64; y += 9) line(118, y, 124, y);
        box(130, 40, 20, 24);
        line(130, 44, 150, 44);
        line(112, 50, 118, 50);
        line(124, 56, 130, 56);
        line(140, 34, 140, 40);
        line(140, 34, 156, 34);
        // Ground.
        for (let x = 0; x < W; x += 3) rect(ctx, ink, x, GROUND, 2, 1);
      },
      init: () => ({ dim: 0, smoke: 0, lights: 0, truck: -1 }),
      frame(ctx, c, s, t) {
        // A dimension line draws itself across the building, then the measurement appears.
        if (s.dim > 0) {
          const x2 = Math.round(56 + 56 * Math.min(1, s.dim));
          rect(ctx, N.w, 56, 22, x2 - 56, 1);
          rect(ctx, N.w, 56, 20, 1, 5);
          if (s.dim >= 1) {
            rect(ctx, N.w, 112, 20, 1, 5);
            rect(ctx, c.shade, 74, 19, 21, 7);
            text(ctx, '25.40', 75, 20, c.light);
          }
        }
        // Windows light up and the stack smokes.
        for (let i = 0; i < 5; i++) if (s.lights * 5 > i) rect(ctx, c.light, 62 + i * 10, 45, 4, 4);
        if (s.smoke > 0) {
          for (let i = 0; i < 6; i++) {
            const k = ((t * 0.5 + i / 6) % 1);
            const y = 12 - k * 14;
            if (y > -3) puff(ctx, Math.round(121 + k * 10 + Math.sin(t + i) * 1.5), Math.round(y), k > 0.5 ? 2 : 1, mix(N.w, c.shade, k * 0.6));
          }
        }
        // A truck drives the road between Kansas City and Sioux City.
        if (s.truck >= 0) {
          rect(ctx, N.w, 6, 50, 13, 7);
          rect(ctx, c.shade, 7, 51, 11, 5);
          text(ctx, 'IA', 9, 51, N.w);
          rect(ctx, N.w, 12, 57, 1, 7);
          const x = Math.round(-26 + s.truck * (W + 40));
          sprite(ctx, [
            '.wwwwwwwwwwww.......',
            '.w..........w.wwww..',
            '.w..........w.w..ww.',
            '.w..........www...w.',
            '.wwwwwwwwwwwwwwwwwww',
            '...ww....ww.....ww..',
          ], x, GROUND - 7, { w: N.w });
        }
      },
      cues: {
        measure: s => gsap.timeline().to(s, { dim: 1, duration: 0.9, ease: 'steps(14)' }),
        plant: s => gsap.timeline().to(s, { lights: 1, duration: 0.8, ease: 'steps(5)' }).set(s, { smoke: 1 }, 0.2),
        road: s => gsap.timeline().fromTo(s, { truck: 0 }, { truck: 0.55, duration: 1.5, ease: 'power1.out' }),
      },
    },

    // Act IV: the mountains, a plane to Vietnam, and a production line.
    mountains: {
      heroX: 66,
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
      },
      init: () => ({ ski: -1, plane: -1, build: 0, line: 0 }),
      frame(ctx, c, s, t) {
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
        // The plane heads for Vietnam, then a new plant rises.
        if (s.plane >= 0) {
          const k = Math.min(1, s.plane);
          const x = Math.round(-12 + k * (W + 24));
          for (let tx = Math.max(0, x - 40); tx < x - 2; tx += 3) rect(ctx, '#b9c8bf', tx, 13, 2, 1);
          sprite(ctx, ['..n.....', '.nnn....', 'nnnnnnnw', '..nn....', '..n.....'], x, 10, { n: N.n, w: N.w });
          if (k >= 1) { rect(ctx, c.shade, 128, 2, 31, 7); text(ctx, 'VIETNAM', 130, 3, N.w); }
        }
        if (s.build > 0) {
          const h = Math.round(16 * Math.min(1, s.build));
          rect(ctx, N.o, 88, GROUND - 2 - h, 26, h);
          rect(ctx, c.light, 89, GROUND - 1 - h, 24, Math.max(0, h - 1));
          for (let i = 0; i < 4; i++) if (h > 8) rect(ctx, N.w, 91 + i * 6, GROUND - h + 3, 3, 3);
          rect(ctx, N.o, 108, GROUND - 2 - h - 6, 1, 6);
          rect(ctx, N.o, 108, GROUND - 2 - h - 6, 9, 1);
          rect(ctx, c.shade, 116, GROUND - 2 - h - 5, 1, 3);
        }
        // A production line: prototypes roll along and pass the check.
        if (s.line > 0) {
          const len = Math.round(56 * Math.min(1, s.line));
          rect(ctx, N.o, 2, GROUND - 3, len, 1);
          rect(ctx, N.n, 2, GROUND - 2, len, 2);
          for (let x = 4; x < len; x += 4) rect(ctx, N.m, x + Math.floor(t * 8) % 4, GROUND - 2, 1, 1);
          if (s.line >= 1) {
            for (let i = 0; i < 4; i++) {
              const x = Math.round(((t * 9 + i * 14) % 52) + 2);
              sprite(ctx, ['oooo', 'owwo', 'o2no', 'oooo'], x, GROUND - 7, { o: N.o, w: N.w, 2: c.base, n: N.n });
            }
            sprite(ctx, ['....2', '...2.', '2.2..', '.2...'], 52, GROUND - 13, { 2: c.base });
          }
        }
      },
      cues: {
        ski: s => gsap.timeline().fromTo(s, { ski: 0 }, { ski: 1, duration: 1.8, ease: 'none' }),
        plane: s => gsap.timeline().fromTo(s, { plane: 0 }, { plane: 1, duration: 1.6, ease: 'none' }).to(s, { build: 1, duration: 0.9, ease: 'steps(8)' }, 1.2),
        line: s => gsap.timeline().to(s, { line: 1, duration: 0.8, ease: 'steps(10)' }),
      },
    },

    // Act V: the library, the year off and the bootcamp.
    library: {
      heroX: 76,
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
      init: () => ({ sun: 0, kite: -1, books: 0, lamp: 0, laptop: 0, code: 0, duck: 0, aha: 0 }),
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
            for (let i = 0; i < Math.min(lines, lid - 2); i++) rect(ctx, [c.light, N.w, c.base, '#9c97a6'][i % 4], 92 + (i % 3 === 1 ? 2 : 0), 40 + i, 3 + ((i * 5) % 7), 1);
            if (s.code >= 1 && blink(t, 2)) rect(ctx, c.light, 99, 46, 1, 1);
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
        fun: s => gsap.timeline().to(s, { sun: 1, duration: 1, ease: 'steps(6)' }).fromTo(s, { kite: 0 }, { kite: 1, duration: 1.4, ease: 'none' }, 0.4),
        study: s => gsap.timeline().to(s, { books: 1, duration: 0.9, ease: 'none' }).set(s, { lamp: 1 }, 0.9),
        code: s => gsap.timeline().to(s, { laptop: 1, duration: 0.4, ease: 'steps(4)' }).to(s, { code: 1, duration: 1.1, ease: 'none' }),
        duck: s => gsap.timeline().to(s, { duck: 1, duration: 0.4, ease: 'bounce.out' }).set(s, { aha: 0.5 }, 0.5).set(s, { aha: 1 }, 1.3),
      },
    },

    // Act VI: a studio with a roadmap board, the business and the team.
    studio: {
      heroX: 70,
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
        // Floor.
        rect(ctx, '#d9d5e3', 0, GROUND, W, H - GROUND);
        rect(ctx, '#c4bfd2', 0, GROUND, W, 1);
      },
      init: () => ({ biz: 0, talk: 0, notes: 0, loop: 0, team: 0, plan: 0, shine: 0 }),
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
        if (s.shine > 0) {
          const r = rng(Math.floor(t * 6));
          for (let i = 0; i < 10; i++) rect(ctx, [c.light, N.w, c.base][i % 3], 60 + Math.floor(r() * 40), 30 + Math.floor(r() * 30), 1, 1);
        }
      },
      cues: {
        listen: s => gsap.timeline().to(s, { biz: 1, duration: 0.9, ease: 'steps(9)' }).to(s, { talk: 0.5, duration: 0.01 }, 0.9).to(s, { talk: 1, duration: 0.01 }, 1.6).to(s, { notes: 0.5, duration: 0.6, ease: 'none' }, 1.6),
        loop: s => gsap.timeline().to(s, { loop: 1, duration: 0.8, ease: 'steps(4)' }).to(s, { notes: 1, duration: 0.6, ease: 'none' }, 0.6),
        // The team arrives, the loop gives way to a roadmap the whole team can follow.
        team: s => gsap.timeline().to(s, { team: 1, duration: 1.2, ease: 'steps(12)' }).to(s, { loop: 0, duration: 0.4, ease: 'steps(3)' }, 0.8).to(s, { plan: 1, duration: 0.8, ease: 'power2.inOut' }, 1),
        shine: s => gsap.timeline().to(s, { shine: 1, duration: 0.3 }),
      },
    },
  };

  // A plain floor, used when a recipe names a scene that is not drawn yet.
  const blank = {
    heroX: 72,
    draw(ctx, c) {
      rect(ctx, mix(c.light, '#ffffff', 0.7), 0, 0, W, H);
      rect(ctx, c.shade, 0, GROUND, W, H - GROUND);
    },
    init: () => ({}),
    frame() {},
    cues: {},
  };

  const get = name => scenes[name] || blank;

  // Mount a scene on a canvas. The returned stage draws on demand and runs its
  // loop only while start() has been called, so off-screen acts cost nothing.
  function mount(name, canvas, ramp, allActs) {
    const scene = get(name);
    const bg = document.createElement('canvas');
    bg.width = W;
    bg.height = H;
    const bgCtx = bg.getContext('2d');
    bgCtx.imageSmoothingEnabled = false;
    scene.draw(bgCtx, ramp, allActs);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const state = (scene.init && scene.init()) || {};
    const born = performance.now();
    let running = false;

    function render() {
      ctx.drawImage(bg, 0, 0);
      if (scene.frame) scene.frame(ctx, ramp, state, (performance.now() - born) / 1000, allActs);
    }
    const tick = () => render();

    return {
      scene,
      state,
      render,
      // Play a cue as a GSAP timeline. Returns null when the scene has no such cue.
      cue(cueName) {
        const make = scene.cues && scene.cues[cueName];
        if (!make || !window.gsap) return null;
        return make(state, ramp);
      },
      // Jump a cue to its end, for acts unlocked without motion.
      settle(cueName) {
        const tl = this.cue(cueName);
        if (tl) { tl.progress(1); tl.kill(); }
        render();
      },
      start() { if (running || !window.gsap) return; running = true; gsap.ticker.add(tick); },
      stop() { if (!running) return; running = false; gsap.ticker.remove(tick); },
    };
  }

  window.Scenes = {
    W, H, GROUND,
    names: Object.keys(scenes),
    cuesOf: name => Object.keys(get(name).cues || {}),
    get, mount, mix, rng,
  };
})();
