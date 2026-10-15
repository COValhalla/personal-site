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

  function outline(ctx, x, y, w, h, color) {
    rect(ctx, color, x, y, w, 1);
    rect(ctx, color, x, y + h - 1, w, 1);
    rect(ctx, color, x, y, 1, h);
    rect(ctx, color, x + w - 1, y, 1, h);
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
    // Tutorial, moment 1: a bedroom at night. The lights drop in four steps, and the computer glows with an inventory.
    'early-night': {
      heroX: 104,
      arrive: 50,
      door: { x: 135, y: 39 },
      draw(ctx, c) {
        rect(ctx, '#f3e3c4', 0, 0, W, GROUND);
        for (let x = 0; x < W; x += 16) rect(ctx, '#ecd7b0', x, 0, 1, GROUND);
        rect(ctx, '#c98a55', 0, GROUND, W, H - GROUND);
        rect(ctx, '#e0a46f', 0, GROUND, W, 1);
        rect(ctx, '#cfe6f7', 56, 8, 24, 18);
        outline(ctx, 56, 8, 24, 18, N.o);
        rect(ctx, N.o, 68, 8, 1, 18);
        rect(ctx, N.o, 56, 16, 24, 1);
        rect(ctx, c.base, 92, 10, 12, 16);
        rect(ctx, c.light, 94, 12, 8, 4);
        rect(ctx, c.shade, 6, 38, 3, 26);
        rect(ctx, '#f6f4ef', 9, 50, 32, 8);
        rect(ctx, c.base, 16, 48, 25, 10);
        rect(ctx, c.light, 16, 48, 25, 1);
        rect(ctx, N.w, 9, 47, 6, 4);
        rect(ctx, '#a96b3e', 116, 44, 36, 3);
        rect(ctx, '#a96b3e', 118, 47, 2, 17);
        rect(ctx, '#a96b3e', 148, 47, 2, 17);
        rect(ctx, N.o, 124, 30, 22, 14);
        rect(ctx, N.o, 134, 43, 4, 1);
        rect(ctx, c.base, 146, 36, 4, 4);
        rect(ctx, N.o, 148, 40, 1, 4);
      },
      init: () => ({ dark: 0, screen: 0 }),
      frame(ctx, c, s, t) {
        const dark = steps4(s.dark);
        if (dark > 0) {
          ctx.globalAlpha = dark * 0.72;
          rect(ctx, '#0d1030', 0, 0, W, GROUND);
          ctx.globalAlpha = 1;
          if (dark >= 0.5) {
            const r = rng(4);
            for (let i = 0; i < 8; i++) rect(ctx, '#f6f4ef', 58 + Math.floor(r() * 20), 10 + Math.floor(r() * 14), 1, 1);
          }
        }
        const glow = steps4(s.screen);
        rect(ctx, mix('#2a1416', '#9fd8ff', glow), 126, 32, 18, 10);
        if (glow >= 0.5) {
          for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) {
            const shade = [c.light, c.base, N.w][(i + j + Math.floor(t * 3)) % 3];
            rect(ctx, shade, 128 + i * 3, 34 + j * 3, 2, 2);
          }
        }
      },
      cues: {
        night: s => gsap.timeline().to(s, { dark: 1, duration: 1.2, ease: 'steps(4)' }).to(s, { screen: 1, duration: 0.6, ease: 'steps(2)' }, 1.2),
      },
    },

    // Tutorial, moment 2: the school computer lab. Every screen runs the typing race.
    'computer-lab': {
      heroX: 98,
      door: { x: 30, y: 20 },
      draw(ctx, c) {
        rect(ctx, '#e3e8e1', 0, 0, W, GROUND);
        rect(ctx, '#d3d9d0', 0, 36, W, 1);
        for (let y = GROUND; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) rect(ctx, '#b9bec4', x, y, 4, 4);
        rect(ctx, '#c8ccd1', 0, GROUND, W, H - GROUND);
        for (let y = GROUND; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) rect(ctx, '#b3b8be', x, y, 4, 4);
        // The board, with the word of the day.
        rect(ctx, '#8c5a32', 6, 6, 50, 28);
        rect(ctx, '#2f5a46', 8, 8, 46, 24);
        text(ctx, 'TYPING', 12, 11, '#e9efe6');
        text(ctx, 'ASDF JKL', 12, 19, '#b9cfc2');
        rect(ctx, '#e9efe6', 44, 30, 6, 1);
        // The clock.
        rect(ctx, N.o, 66, 8, 11, 11);
        rect(ctx, N.w, 67, 9, 9, 9);
        rect(ctx, N.o, 71, 10, 1, 4);
        rect(ctx, N.o, 71, 13, 3, 1);
        // A long desk with four beige computers.
        rect(ctx, '#a96b3e', 62, 46, 96, 3);
        rect(ctx, '#8c5a32', 64, 49, 2, 15);
        rect(ctx, '#8c5a32', 154, 49, 2, 15);
        for (let k = 0; k < 4; k++) {
          const x = 66 + k * 23;
          rect(ctx, N.o, x - 1, 29, 20, 16);
          rect(ctx, '#ddd2b4', x, 30, 18, 14);
          rect(ctx, '#b8ab88', x, 42, 18, 2);
          rect(ctx, '#1b2a86', x + 2, 32, 14, 9);
          rect(ctx, '#ddd2b4', x + 6, 44, 6, 2);
          rect(ctx, N.o, x + 1, 45, 16, 1);
          rect(ctx, '#ece3c8', x + 1, 44, 16, 1);
        }
      },
      init: () => ({ screens: 0, race: 0, star: 0 }),
      frame(ctx, c, s, t) {
        const lit = Math.round(Math.max(0, Math.min(1, s.screens)) * 4);
        for (let k = 0; k < lit; k++) {
          const x = 66 + k * 23;
          rect(ctx, '#2c3f9c', x + 2, 32, 14, 9);
          // Each screen races three little bars; the hero's screen (the third) wins.
          const speed = [0.62, 0.78, 1, 0.7][k];
          [0, 1, 2].forEach(lane => {
            const len = Math.round(Math.min(1, s.race * (lane === 0 ? speed : speed * (0.7 + lane * 0.1))) * 12);
            if (len > 0) rect(ctx, lane === 0 ? (k === 2 ? c.light : N.w) : '#8fa8ff', x + 3, 33 + lane * 3, len, 1);
          });
          if (s.race > 0 && s.race < 1 && blink(t, 4)) rect(ctx, N.w, x + 3 + Math.round(Math.min(1, s.race * speed) * 12), 33, 1, 1);
        }
        if (s.star > 0.5) {
          text(ctx, '1ST', 12, 25, c.light);
          rect(ctx, c.light, 26, 26, 1, 3);
        }
      },
      cues: {
        type: s => gsap.timeline()
          .to(s, { screens: 1, duration: 0.5, ease: 'steps(4)' })
          .to(s, { race: 1, duration: 1.7, ease: 'none' }, 0.4)
          .to(s, { star: 1, duration: 0.01 }, 2.1),
      },
    },

    // Tutorial, moment 3: the family business's packing room in the holiday rush.
    // Flat boxes fold up, fill and get taped at the table, then stack by the door, each a little faster, while the ORDERS count climbs.
    'early-shop': {
      heroX: 92,
      door: { x: 146, y: 44 },
      draw(ctx, c) {
        // Plank walls with a teal stripe, and a wooden floor.
        rect(ctx, '#f1e4c9', 0, 0, W, GROUND);
        for (let x = 9; x < W; x += 10) rect(ctx, '#e4d3b2', x, 0, 1, GROUND);
        rect(ctx, mix(c.light, '#f1e4c9', 0.35), 0, 42, W, 3);
        rect(ctx, '#e4d3b2', 0, GROUND - 3, W, 3);
        rect(ctx, '#b7834f', 0, GROUND, W, H - GROUND);
        rect(ctx, '#c9965a', 0, GROUND, W, 1);
        // Shelves of our products, wrapped and ready to pack.
        [22, 36].forEach(y => {
          rect(ctx, '#8c5a32', 4, y, 50, 2);
          rect(ctx, '#6b4226', 4, y + 2, 50, 1);
          for (let x = 6; x < 50; x += 8) {
            rect(ctx, N.o, x - 1, y - 6, 8, 6);
            rect(ctx, N.w, x, y - 5, 6, 4);
            rect(ctx, '#d6cfbf', x, y - 2, 6, 1);
            rect(ctx, c.base, x + 2, y - 5, 2, 4);
          }
        });
        rect(ctx, '#6b4226', 5, 22, 1, 20);
        rect(ctx, '#6b4226', 52, 22, 1, 20);
        // The packing table, with flat boxes stacked at one end.
        rect(ctx, N.o, 2, 49, 62, 1);
        rect(ctx, '#a96b3e', 2, 50, 62, 3);
        rect(ctx, '#8c5a32', 4, 53, 2, GROUND - 53);
        rect(ctx, '#8c5a32', 58, 53, 2, GROUND - 53);
        for (let k = 0; k < 4; k++) {
          rect(ctx, N.o, 5, 48 - k * 2, 18, 1);
          rect(ctx, k % 2 ? '#c9965a' : '#d8a96c', 5, 47 - k * 2, 18, 1);
        }
        // The order board.
        rect(ctx, N.n, 100, 9, 30, 19);
        rect(ctx, N.w, 101, 10, 28, 17);
        text(ctx, 'ORDERS', 104, 12, c.shade);
        rect(ctx, '#d9dcd6', 103, 18, 24, 1);
        // The shipping door the camera dives through.
        rect(ctx, N.o, 135, 18, 22, GROUND - 18);
        rect(ctx, c.shade, 136, 19, 20, GROUND - 19);
        rect(ctx, c.base, 138, 21, 16, 18);
        rect(ctx, c.base, 138, 42, 16, 19);
        rect(ctx, N.m, 152, 42, 2, 2);
        text(ctx, 'OUT', 141, 26, N.w);
      },
      init: () => ({ packed: 0 }),
      frame(ctx, c, s, t) {
        const card = '#c9965a';
        const cardLight = '#d8a96c';
        // A string of holiday lights along the top, blinking in turns.
        const bulbs = ['#e0533d', '#f2c94c', '#4fb06b', '#3fa9f5'];
        for (let x = 0; x < W; x++) rect(ctx, '#5f5b6b', x, 3 + Math.round(Math.abs(Math.sin(x / 13)) * 2), 1, 1);
        for (let x = 4; x < W; x += 8) {
          const y = 4 + Math.round(Math.abs(Math.sin(x / 13)) * 2);
          const k = (x / 8) | 0;
          rect(ctx, (k + Math.floor(t * 2)) % 2 ? bulbs[k % 4] : mix(bulbs[k % 4], '#ffffff', 0.5), x, y, 2, 2);
        }
        const packed = Math.max(0, Math.min(8, s.packed));
        const done = Math.floor(packed + 0.0001);
        // The boxes packed so far, stacked two wide by the door.
        for (let k = 0; k < done; k++) {
          const x = 114 + (k % 2) * 10;
          const y = GROUND - 8 - Math.floor(k / 2) * 7;
          rect(ctx, N.o, x, y, 10, 8);
          rect(ctx, card, x + 1, y + 1, 8, 6);
          rect(ctx, cardLight, x + 1, y + 1, 8, 1);
          rect(ctx, c.base, x + 4, y + 1, 2, 6);
        }
        // The box on the table: it folds up, the products go in, and the tape goes on. Then the next one.
        const phase = done >= 8 ? 1 : packed - done;
        const bx = 36;
        const tall = phase < 0.35 ? 1 + Math.round((phase / 0.35) * 7) : 8;
        rect(ctx, N.o, bx, 49 - tall, 14, tall);
        rect(ctx, card, bx + 1, 49 - tall + 1, 12, tall - 1);
        if (phase >= 0.35 && phase < 0.75) {
          // Open: the flaps stand up and the products drop in.
          rect(ctx, '#7a5530', bx + 1, 42, 12, 1);
          rect(ctx, cardLight, bx - 2, 39, 3, 1);
          rect(ctx, cardLight, bx + 13, 39, 3, 1);
          const filled = Math.round(((phase - 0.35) / 0.4) * 2);
          for (let k = 0; k < filled; k++) {
            rect(ctx, N.o, bx + 2 + k * 5, 39, 5, 4);
            rect(ctx, N.w, bx + 3 + k * 5, 40, 3, 2);
          }
        } else if (phase >= 0.75) {
          // Closed and taped.
          rect(ctx, cardLight, bx + 1, 42, 12, 1);
          rect(ctx, c.base, bx + 6, 42, 2, 6);
        }
        // The count of orders out the door.
        const orders = String(done * 6);
        text(ctx, orders, 115 - textWidth(orders) / 2, 20, c.base);
      },
      cues: {
        // Each box goes a little faster than the last.
        pack: s => gsap.timeline().fromTo(s, { packed: 0 }, { packed: 8, duration: 2.6, ease: 'power1.in' }),
      },
    },

    // Tutorial, completion: the high-score board, up close. Your name goes to the top.
    'lab-board': {
      heroX: 22,
      draw(ctx, c) {
        rect(ctx, '#8c5a32', 0, 0, W, H);
        rect(ctx, '#2f5a46', 4, 4, W - 8, H - 8);
        for (let y = 8; y < H - 8; y += 9) rect(ctx, '#33634d', 6, y, W - 12, 1);
        rect(ctx, '#e9efe6', 6, GROUND, W - 12, 1);
        text(ctx, 'HIGH SCORES', 56, 9, '#e9efe6');
        text(ctx, 'TYPING CLASS', 56, 17, '#b9cfc2');
      },
      init: () => ({ rows: 0, top: 0 }),
      frame(ctx, c, s, t) {
        const rows = [['1ST', 'JOE', c.light], ['2ND', 'MAX', '#e9efe6'], ['3RD', 'KIM', '#e9efe6']];
        const shown = Math.round(Math.max(0, Math.min(1, s.rows)) * 3);
        rows.slice(0, shown).forEach(([place, name, col], k) => {
          text(ctx, place, 56, 30 + k * 9, col);
          text(ctx, name, 74, 30 + k * 9, col);
        });
        if (s.top >= 0.5 && blink(t, 2)) text(ctx, 'KEYBOARD KID', 92, 30, c.light);
      },
      cues: {
        equip: s => gsap.timeline().to(s, { rows: 1, duration: 0.6, ease: 'steps(3)' }).to(s, { top: 1, duration: 0.01 }, 0.7),
      },
    },

    // Act I: a bright BMX track on a Saturday, the start hill on the left and the family shop on the right.
    'bmx-track': {
      heroX: 100,
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
      door: { x: 129, y: 55 },
      init: () => ({ race: -1 }),
      frame(ctx, c, s, t) {
        [[0, 6, 4], [70, 14, 3], [120, 9, 5]].forEach(([x0, y, speed]) => cloud(ctx, ((x0 + t * speed) % (W + 30)) - 15, y, N.w));
        // The tower flag flaps.
        rect(ctx, N.o, 9, 19, 1, 6);
        rect(ctx, c.light, 10, 19, blink(t, 2.5) ? 5 : 4, 2);
        rect(ctx, c.base, 10, 21, blink(t, 2.5) ? 4 : 5, 1);
        // The shop door, shut, is where the camera dives in.
        rect(ctx, '#d9c7a3', 118, 47, 22, 17);
        for (let y = 47; y < 64; y += 2) rect(ctx, '#b9b2a6', 118, y, 22, 1);
        rect(ctx, '#cfe6f7', 144, 39, 4, 8);
        rect(ctx, '#cfe6f7', 149, 39, 5, 8);
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
      },
    },

    // Act I, moment 2: the family business, a wild game processing shop in deer season.
    // New hires walk in behind the table, get their aprons and a quick lesson, and the orders pile up.
    'bmx-shop': {
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
    },

    // Act I, level-up: the character screen, behind the cooler door. The bike and the apron drop into their slots.
    'bmx-sheet': {
      heroX: 26,
      draw(ctx, c) {
        rect(ctx, '#1f2440', 0, 0, W, H);
        for (let y = 0; y < H; y += 8) rect(ctx, '#252b4f', 0, y, W, 1);
        rect(ctx, N.o, 6, 4, 148, 64);
        rect(ctx, '#2a3a6a', 8, 6, 144, 60);
        rect(ctx, c.base, 8, 6, 144, 9);
        text(ctx, 'CREW LEAD', 12, 8, N.o);
        rect(ctx, '#1d1b22', 14, 20, 38, 44);
        outline(ctx, 14, 20, 38, 44, N.n);
        ['HEAD', 'BIKE', 'APRON'].forEach((label, k) => {
          const x = 62 + k * 30;
          rect(ctx, '#1d1b22', x, 20, 26, 18);
          outline(ctx, x, 20, 26, 18, N.n);
          text(ctx, label, x + 2, 42, c.light);
        });
        text(ctx, 'LEVEL 1', 62, 52, N.w);
        text(ctx, 'RIDING  TEACHING', 62, 58, c.light);
      },
      init: () => ({ bike: -1, apron: -1, helmet: 0 }),
      frame(ctx, c, s) {
        if (s.bike > -0.5) Pixel.paint(ctx, Pixel.ITEMS.bike, c, 97, Math.round(21 - (1 - s.bike) * 30), 1);
        if (s.apron > -0.5) Pixel.paint(ctx, Pixel.ITEMS.apron, c, 127, Math.round(21 - (1 - s.apron) * 30), 1);
        if (s.helmet >= 0.5) sprite(ctx, ['.oooooo.', 'obbbbbbo', 'oBBBBBBo', '.oooooo.'], 71, 25, { o: N.o, b: c.light, B: c.base });
      },
      cues: {
        equip: s => gsap.timeline()
          .fromTo(s, { bike: -1 }, { bike: 1, duration: 0.6, ease: 'bounce.out' })
          .fromTo(s, { apron: -1 }, { apron: 1, duration: 0.6, ease: 'bounce.out' }, 0.5)
          .fromTo(s, { helmet: 0 }, { helmet: 1, duration: 0.2, ease: 'steps(2)' }, 0.9),
      },
    },

    // Act II, moments 1 and 2: the high school football field under the lights, with a discus cage on the left and the track in front.
    // Night falls, the lights come on and your people walk on; then the discus sets the record.
    field: {
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
    },

    // Act II, moment 3 and the level-up: the summer jobs. On the left, forms go up board by board around a basement
    // and concrete pours in level. On the right, at the machine factory, a machine gets its paint and rolls onto a truck.
    'summer-jobs': {
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
    },

    // Act III: a track with the hammer cage, the stands and the scoreboard.
    track: {
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
    },

    // Act III, moment 3: the office in Texas where each internship summer ended. The sun sets over the oil field,
    // the executives take their seats, and the cost and ROI model builds on the screen until the room applauds.
    'texas-office': {
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
    },

    // Act IV: a blueprint of a plant.
    plant: {
      heroX: 26,
      door: { x: 140, y: 50 },
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
        doorway(ctx, 140, GROUND);
        // Ground.
        for (let x = 0; x < W; x += 3) rect(ctx, ink, x, GROUND, 2, 1);
      },
      init: () => ({ dim: 0, read: 0, ok: 0, screen: 0, model: 0, fit: 0, truck: -1 }),
      frame(ctx, c, s, t) {
        // A dimension line draws itself across the building, the reading counts up to the measurement, and it checks out.
        if (s.dim > 0) {
          const x2 = Math.round(56 + 56 * Math.min(1, s.dim));
          rect(ctx, N.w, 56, 22, x2 - 56, 1);
          rect(ctx, N.w, 56, 20, 1, 5);
          if (s.dim >= 1) {
            rect(ctx, N.w, 112, 20, 1, 5);
            rect(ctx, c.shade, 74, 19, s.ok > 0 ? 28 : 21, 7);
            text(ctx, (25.4 * Math.min(1, s.read)).toFixed(2).padStart(5, '0'), 75, 20, c.light);
            if (s.ok > 0) sprite(ctx, ['....w', '...w.', 'w.w..', '.w...'], 96, 20, { w: c.light });
          }
        }
        // A screen on the wall: a 3D model of a part turns, then data points land and a model's line fits them.
        if (s.screen > 0) {
          const h = Math.round(22 * Math.min(1, s.screen));
          outline(ctx, 6, 4, 42, h, N.w);
          if (s.screen >= 1) {
            rect(ctx, N.w, 26, 26, 1, 3);
            rect(ctx, N.w, 21, 29, 11, 1);
          }
          if (s.model > 0) {
            // A wireframe box, drawn edge by edge, that keeps turning.
            const a = t * 1.2;
            const pts = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => {
              const rx = x * Math.cos(a) - z * Math.sin(a);
              const rz = x * Math.sin(a) + z * Math.cos(a);
              return [16 + rx * 5, 15 + y * 4 + rz * 1.5];
            });
            const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
            edges.slice(0, Math.round(edges.length * Math.min(1, s.model))).forEach(([i, j]) => {
              const [x1, y1] = pts[i];
              const [x2, y2] = pts[j];
              const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
              for (let k = 0; k <= n; k++) rect(ctx, N.w, x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n, 1, 1);
            });
          }
          if (s.fit > 0) {
            // Axes, then the points, then the fitted line.
            rect(ctx, N.w, 28, 8, 1, 15);
            rect(ctx, N.w, 28, 22, 17, 1);
            const dots = [[31, 19], [33, 18], [35, 17], [37, 14], [39, 14], [42, 11]];
            dots.slice(0, Math.round(dots.length * Math.min(1, s.fit * 2))).forEach(([x, y]) => rect(ctx, c.light, x, y, 1, 1));
            const len = Math.round(13 * Math.max(0, Math.min(1, s.fit * 2 - 1)));
            for (let k = 0; k < len; k++) rect(ctx, c.light, 30 + k, Math.round(20 - k * 0.7), 1, 1);
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
        measure: s => gsap.timeline()
          .to(s, { dim: 1, duration: 1, ease: 'steps(14)' })
          .to(s, { read: 1, duration: 0.7, ease: 'steps(8)' }, 1)
          .to(s, { ok: 1, duration: 0.01 }, 2),
        model: s => gsap.timeline()
          .to(s, { screen: 1, duration: 0.3, ease: 'steps(3)' })
          .to(s, { model: 1, duration: 0.5, ease: 'steps(12)' }, 0.3)
          .to(s, { fit: 1, duration: 0.8, ease: 'steps(12)' }, 0.8),
        road: s => gsap.timeline().fromTo(s, { truck: 0 }, { truck: 0.55, duration: 1.5, ease: 'power1.out' }),
      },
    },

    // Act IV, moment 3: the plant floor in Sioux City. Operators in hard hats come through in waves to be trained
    // while the count climbs to 250, and a root-cause fishbone draws itself on the whiteboard until the savings show.
    'sioux-city': {
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
    },

    // Act V, moment 1: the mountains, where a skier carves down the big peak. The cabin's door leads to the factory.
    mountains: {
      heroX: 66,
      door: { x: 72, y: 50 },
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
        // A cabin at the foot of the slope, with the door the camera dives through.
        rect(ctx, '#5b3a22', 57, 32, 30, 4);
        rect(ctx, '#8a5a36', 60, 36, 24, 28);
        doorway(ctx, 72, GROUND);
      },
      init: () => ({ ski: -1 }),
      frame(ctx, c, s) {
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
      },
      cues: {
        ski: s => gsap.timeline().fromTo(s, { ski: 0 }, { ski: 1, duration: 1.8, ease: 'none' }),
      },
    },

    // Act V, moments 2 and 3: the new factory in Vietnam. A plane lands the team there, the production lines are
    // lowered into the empty hall and the budget fills to $7M on time. Then the design office lights up, a bridge
    // reaches from it to the floor, ten engineers cross it, and products roll off the line in their new material.
    factory: {
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
    },

    // Act VI: the library, the year off and the self-taught year.
    library: {
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
    },

    // Act VII: a studio with a roadmap board, the business and the team.
    studio: {
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

  // A door 14 wide and 28 tall, standing on the bottom line it is given.
  function doorway(ctx, x, bottom) {
    const left = x - 7;
    const top = bottom - 28;
    rect(ctx, N.o, left - 1, top - 1, 16, 29);
    rect(ctx, '#5b4636', left, top, 14, 28);
    outline(ctx, left + 2, top + 3, 10, 22, '#7a5e48');
    rect(ctx, '#e8c77a', left + 10, top + 14, 1, 2);
  }

  // The character screen each act levels up to: its class, the items it earned dropping into rows, and the skills it grew.
  function characterSheet(act) {
    const label = s => s.replace(/-/g, ' ');
    return {
      heroX: 26,
      draw(ctx, c) {
        rect(ctx, '#1f2440', 0, 0, W, H);
        for (let y = 0; y < H; y += 8) rect(ctx, '#252b4f', 0, y, W, 1);
        rect(ctx, N.o, 6, 4, 148, 64);
        rect(ctx, '#2a3a6a', 8, 6, 144, 60);
        rect(ctx, c.base, 8, 6, 144, 9);
        text(ctx, label(act.hero.title).toUpperCase(), 12, 8, N.o);
        rect(ctx, '#1d1b22', 14, 18, 38, 42);
        outline(ctx, 14, 18, 38, 42, N.n);
        const names = act.skills.map(sk => label(sk.name).toUpperCase());
        let line = '';
        let shown = 0;
        for (const name of names) {
          const next = line ? `${line} ${name}` : name;
          if (next.length > 30) break;
          line = next;
          shown += 1;
        }
        if (shown < names.length) line += ` +${names.length - shown}`;
        text(ctx, line, 14, 60, c.light);
      },
      init: () => ({ i0: -1, i1: -1, i2: -1 }),
      frame(ctx, c, s) {
        act.items.slice(0, 3).forEach((item, k) => {
          const v = s['i' + k];
          if (v <= -0.5) return;
          const y = Math.round(17 + k * 13 - (1 - v) * 30);
          Pixel.paint(ctx, Pixel.ITEMS[item.sprite], c, 60, y, 1);
          text(ctx, label(item.name), 80, y + 5, c.light);
        });
      },
      cues: {
        equip: s => {
          const tl = gsap.timeline();
          for (let k = 0; k < 3; k++) tl.fromTo(s, { ['i' + k]: -1 }, { ['i' + k]: 1, duration: 0.6, ease: 'bounce.out' }, k * 0.5);
          return tl;
        },
      },
    };
  }

  const get = (name, act) => (name === 'sheet' ? characterSheet(act) : scenes[name] || blank);

  // Mount a scene on a canvas. The returned stage draws on demand and runs its
  // loop only while start() has been called, so off-screen acts cost nothing.
  function mount(scene, canvas, ramp, allActs) {
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
    names: [...Object.keys(scenes), 'sheet'],
    cuesOf: name => Object.keys(get(name).cues || {}),
    get, mount, mix, rng,
  };
})();
