/*
 * Tutorial, moment 1: a bedroom that goes from day to night. The window darkens, the lamp pools warm light,
 * the fairy lights glow and the desk's screen switches from the teal desktop to the game, whose chat types itself.
 * The camera then dives into that screen, and the lab opens out of the hero's screen there.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { mix, rect, text, sprite, steps4, blink, lighter, darker, vdither, disc, pool, nightPass, quantize, dissolve } = Draw;

  const CHAT = 'HI!';
  const BULBS = Array.from({ length: 16 }, (_, i) => 4 + i * 10);
  const bulbY = x => 3 + Math.round(Math.sin((x / W) * Math.PI) * 2);
  // The stars are single pixels, clear of the moon and the window's bars.
  const STARS = [[60, 11], [67, 16], [70, 11], [62, 21], [76, 21], [86, 17], [69, 22], [77, 12]];
  // A round full moon, five pixels across, with two darker craters.
  const MOON = ['.mmm.', 'mmmcm', 'mmmmm', 'mcmmm', '.mmm.'];

  // The two posters over the bed are the pictures Joe chose, pixel art of Diablo II and of the ocarina from Ocarina of Time,
  // reduced to poster size: each poster pixel is the most common of the picture's own colors under it.
  const DEMON = [
    'wwwwwwwwkwwwwwwwww',
    'wwwwwwwwkkkwwwwwww',
    'wwwwkwkkkkkkkkwwww',
    'wwwkkkkkkrkkkkwwww',
    'wwwkkkkrrrkkkkkwww',
    'wwwkkrrkkkkrrkkwww',
    'wwkkrkkkkkkkkrkwww',
    'wwkrkrrrrrrkkrkwww',
    'wwkrkkyrryokkrkkww',
    'wkkkrkkryokkkrrkww',
    'wkkkyyyyyoyyyrkkww',
    'wkrkkrrrkryrrkkkww',
    'kkrkkkryryrkkkkrkk',
    'kkkkkkkrrrkkkrkkkk',
    'kkkkrkkkrrkkkkkkkk',
    'kkkkkkkkrrkkkkkkkk',
    'kkkkkkkryrkkkkkkkk',
    'wkkkkwkkkkkkkkwkww',
    'wwkwwwwkkkkkkwwwww',
    'wwwwwwwwkkwwwwwwww',
    'wwwwwwwwwwwwwwwwww',
  ];
  const DEMON_COLORS = { k: '#030706', w: '#ffffff', r: '#c13129', y: '#ffde15', o: '#f26623' };
  const OCARINA = [
    'llwwwwwwwwwwwwwwwwwwbb',
    'mlbwwwwwwwwwwwwbbbbbbB',
    'wmllwwwwwwwwwbbbbhhbBB',
    'wbmllhwwwwwbbbbbbbbbBw',
    'wwbvvwhwwbbbbbbhbbbBBw',
    'wwvvnvvbbbbhhbbbbbBBww',
    'wwhggvbbblbbbbbbbBBBww',
    'wwwhvbbblbbbbbbbbBBwww',
    'wwwhbbllbbbbbbbbBBBwww',
    'wwwbbllbbbbbbbbBBBwwww',
    'wwSbblhhbbhhbbBBBBwwww',
    'wwbbllhhbbbbbBBBBwwwww',
    'wwbblbhhbbbSSBBBwwwwww',
    'wwbbbbbbbbSSSBBwwwwwww',
    'wwbbbbbbbSSSSBwwwwwwww',
    'wSSbbhhbShhSBwwwwwwwww',
    'wwSbbSSSSSSBwwwwwwwwww',
    'wwSSSSSSSBwwwwwwwwwwww',
    'wwwwSSSwwwwwwwwwwwwwww',
  ];
  const OCARINA_COLORS = { w: '#fafafa', b: '#0065b1', m: '#3283c0', l: '#a9cedf', B: '#2b4087', S: '#303d56', h: '#2b2c2d', v: '#b2bae0', g: '#e1b428', n: '#8c5f3c' };

  // The night pass covers the room but not the window or the desk screen, which are drawn fresh on every frame.
  const inWindow = (x, y) => x >= 57 && x < 88 && y >= 9 && y < 31;
  const inScreen = (x, y) => x >= 125 && x < 141 && y >= 35 && y < 45;

  // The lamp's cone: it widens from the shade's rim down to the desk, then pools on the wall and floor around it.
  const lampShape = (x, y) => {
    const pooled = pool(150, 50, 26, 18)(x, y);
    let cone = 0;
    if (y >= 41 && y <= 64) { const half = 5 + (y - 41) * 0.55; cone = 1 - Math.abs(x - 150) / half; }
    return Math.max(pooled * 0.9, cone);
  };
  // Moonlight falls through the window as a slanted patch down to the rug.
  const moonShape = (x, y) => {
    if (y < 33 || y > 72) return 0;
    const t = (y - 33) / 31;
    const l = 57 + t * 16, r = 89 + t * 20;
    if (x < l || x > r) return 0;
    return 0.75 * Math.min(1, (x - l) / 3, (r - x) / 3);
  };
  function nightLights() {
    const lights = [
      { shape: lampShape, tint: [1.05, 0.9, 0.62], power: 1 },
      { shape: pool(131, 44, 26, 17), tint: [0.8, 0.98, 1.0], power: 0.6 },
      { shape: moonShape, tint: [0.55, 0.65, 1.0], power: 0.55 },
    ];
    BULBS.forEach(x => lights.push({ shape: pool(x + 0.5, bulbY(x) + 0.5, 4, 3.5), tint: [1.0, 0.85, 0.55], power: 0.35 }));
    return lights;
  }

  function windowFrame(ctx) {
    rect(ctx, N.o, 56, 8, 34, 1); rect(ctx, N.o, 56, 31, 34, 1); rect(ctx, N.o, 56, 8, 1, 24); rect(ctx, N.o, 89, 8, 1, 24);
    rect(ctx, N.o, 73, 8, 1, 24); rect(ctx, N.o, 56, 19, 34, 1);
  }

  // The window's sky goes from day to dusk to night, with clouds by day and a round moon and twinkling stars once it is dark.
  function skyWindow(ctx, dark, t) {
    vdither(ctx, mix('#8fcaf2', '#0b0e2a', dark), mix('#dff1fc', '#2a2f63', dark), 57, 9, 31, 22, 4);
    const hill = mix('#7d8cae', '#262e4a', dark), far = mix('#5e6c8f', '#1a2036', dark);
    rect(ctx, hill, 57, 24, 31, 7);
    rect(ctx, lighter(hill, 0.3), 57, 24, 31, 1);
    rect(ctx, far, 59, 26, 6, 5); rect(ctx, far, 68, 24, 8, 7); rect(ctx, far, 80, 26, 8, 5);
    if (dark < 0.5) {
      rect(ctx, '#ffffff', 61, 13, 6, 1); rect(ctx, '#ffffff', 60, 14, 9, 1); rect(ctx, '#ffffff', 78, 16, 5, 1);
      [[60, 27], [70, 26], [73, 28], [83, 27]].forEach(([x, y]) => rect(ctx, '#c9d6ea', x, y, 1, 1));
    } else {
      STARS.forEach(([x, y], i) => { if (blink(t + i * 0.9, 1.4)) rect(ctx, '#f6f4ef', x, y, 1, 1); });
      sprite(ctx, MOON, 81, 11, { m: '#f6f4ef', c: '#c9c3b4' });
      [[60, 27], [62, 29], [70, 26], [73, 28], [83, 27], [86, 29], [78, 29]].forEach(([x, y]) => rect(ctx, '#ffd27a', x, y, 1, 1));
    }
    windowFrame(ctx);
  }

  // The desk's monitor: the teal desktop by day, then the game with its inventory and a chat that types itself.
  function screen(ctx, c, glow, chat) {
    const sx = 125, sy = 35;
    if (glow < 1) {
      rect(ctx, c.base, sx, sy, 16, 10);
      rect(ctx, c.light, sx, sy, 16, 1);
      rect(ctx, '#f6f4ef', sx + 1, sy + 2, 2, 2);
      rect(ctx, '#f6f4ef', sx + 4, sy + 2, 2, 2);
      rect(ctx, '#c9f2ec', sx + 15, sy + 1, 1, 1);
    }
    if (glow > 0) {
      rect(ctx, '#2a1416', sx, sy, 16, 10);
      for (let i = 0; i < 4; i++) {
        const slot = i % 2 ? c.light : c.base;
        rect(ctx, slot, sx + 1 + i * 4, sy + 1, 3, 3);
        rect(ctx, lighter(slot, 0.35), sx + 1 + i * 4, sy + 1, 3, 1);
      }
      const shown = Math.floor(Math.max(0, Math.min(1, chat)) * CHAT.length);
      if (shown > 0) text(ctx, CHAT.slice(0, shown), sx + 1, sy + 5, c.light);
    }
  }

  // The room as it is by day, with the night's own lamp and bulbs left to paintNight.
  function paintDay(ctx, c) {
    const r = (color, x, y, w, h) => rect(ctx, color, x, y, w, h);
    r('#f3e3c4', 0, 0, W, GROUND);
    vdither(ctx, '#e6d2ab', '#f3e3c4', 0, 0, W, 6, 3);
    for (let x = 0; x < W; x += 16) { r('#ecd7b0', x, 0, 1, 60); r('#f8ecd4', x + 1, 0, 1, 60); }
    r('#e3c89c', 0, 60, W, 4); r('#faf0d8', 0, 60, W, 1); r('#c9a978', 0, 63, W, 1);
    // floor planks with seams and grain
    r('#b87a4b', 0, GROUND, W, H - GROUND); r('#d89a64', 0, GROUND, W, 1);
    r('#9a6236', 0, 68, W, 1);
    for (let x = 7; x < W; x += 23) r('#9a6236', x, 65, 1, 3);
    for (let x = 18; x < W; x += 23) r('#9a6236', x, 69, 1, 3);
    for (let x = 3; x < W; x += 11) r('#c78b58', x, 66 + (x % 3 === 0 ? 0 : 4), 3, 1);
    // shadows on the floor
    r('#9a6236', 4, 64, 50, 1); r('#9a6236', 121, 64, 36, 1); r('#9a6236', 66, 64, 13, 1);
    // rug: border, pattern, fringe
    r(c.shade, 58, 66, 52, 5); r(c.base, 59, 67, 50, 3); r(c.light, 58, 66, 52, 1);
    for (let x = 61; x < 108; x += 4) { r(c.light, x, 68, 1, 1); r(c.shade, x + 2, 68, 1, 1); }
    for (let x = 59; x < 110; x += 2) r('#f6f4ef', x, 71, 1, 1);
    // bed: headboard, footboard, sheet, pillow, quilt, frame
    r('#7a4a2a', 4, 34, 4, 30); r('#9c6438', 4, 34, 1, 30); r('#5a3219', 7, 34, 1, 30); r('#b07848', 4, 34, 4, 1);
    r('#6a3f22', 5, 40, 2, 12);
    r('#7a4a2a', 52, 46, 2, 18); r('#9c6438', 52, 46, 1, 18); r('#b07848', 52, 46, 2, 1);
    r('#e6dccb', 8, 47, 14, 10); r('#cfc3ad', 8, 55, 14, 2);
    r('#f6f4ef', 9, 42, 14, 7); r('#ddd5c6', 10, 46, 12, 2); r('#ffffff', 10, 43, 3, 1);
    r('#e6dccb', 10, 47, 12, 1);
    r(N.o, 9, 42, 14, 1); r(N.o, 9, 48, 14, 1); r(N.o, 9, 42, 1, 7); r(N.o, 22, 42, 1, 7);
    const patches = [c.base, '#f6f4ef', '#c94f3a', '#f2c97a', c.light, '#f6f4ef'];
    for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) {
      const pc = patches[(row * 3 + col) % patches.length];
      const x = 22 + col * 5, y = 47 + row * 5;
      r(pc, x, y, 5, 5); r(lighter(pc, 0.35), x, y, 5, 1); r(darker(pc, 0.22), x + 4, y + 1, 1, 4); r(darker(pc, 0.22), x, y + 4, 4, 1);
    }
    r('#7a4a2a', 8, 57, 44, 2); r('#9c6438', 8, 57, 44, 1);
    // window: frame, sky, sill, curtains with folds on a rod
    r('#a96b3e', 53, 33, 40, 2); r('#c4885a', 53, 33, 40, 1); r('#e3cda4', 54, 35, 38, 1);
    r('#7a4a2a', 50, 5, 46, 1); r('#5a3219', 49, 4, 2, 3); r('#5a3219', 95, 4, 2, 3);
    const folds = [c.shade, c.base, c.light, c.base, c.shade, darker(c.shade, 0.3)];
    folds.forEach((fc, i) => { r(fc, 50 + i, 6, 1, 27); r(fc, 93 - i, 6, 1, 27); });
    r('#e0c24a', 50, 22, 6, 1); r('#e0c24a', 88, 22, 6, 1);
    skyWindow(ctx, 0, 0);
    // posters with a pin and a shadow on the wall
    r(N.o, 3, 9, 20, 23); sprite(ctx, DEMON, 4, 10, DEMON_COLORS);
    r(N.o, 25, 9, 24, 23); r(OCARINA_COLORS.w, 26, 10, 22, 21); sprite(ctx, OCARINA, 26, 11, OCARINA_COLORS);
    r('#d9c29a', 23, 10, 1, 23); r('#d9c29a', 4, 32, 19, 1); r('#d9c29a', 49, 10, 1, 23); r('#d9c29a', 26, 32, 23, 1);
    r(N.m, 12, 8, 2, 1); r(N.m, 36, 8, 2, 1);
    // shelf with books and a plant
    r('#8c5a32', 96, 40, 26, 2); r('#a8754a', 96, 40, 26, 1); r('#e2cca2', 97, 42, 25, 1); r('#6b4224', 98, 42, 1, 2); r('#6b4224', 119, 42, 1, 2);
    [['#c94f3a', 98, 32, 8], ['#3a7f8c', 101, 33, 7], ['#e0a46f', 104, 34, 6], ['#6b8f3a', 107, 32, 8], ['#f6f4ef', 110, 35, 5]].forEach(([bc, x, y, h]) => {
      r(bc, x, y, 3, h); r(lighter(bc, 0.3), x, y, 1, h); r(darker(bc, 0.25), x + 2, y, 1, h); r(darker(bc, 0.35), x, y + 2, 3, 1);
    });
    r('#7a4a2a', 117, 38, 3, 2); r('#7a4a2a', 118, 37, 1, 1);
    r('#3a7f8c', 116, 33, 5, 4); r('#3a7f8c', 117, 32, 3, 1); r('#5aa6b3', 117, 33, 2, 1); r('#6b8f3a', 118, 34, 2, 2); r('#2a5f6a', 120, 34, 1, 3);
    // drum kit with shading and chrome
    disc(ctx, N.o, 72.5, 57.5, 6.5);
    disc(ctx, '#9e3626', 72.5, 57.5, 5.5); disc(ctx, '#c94f3a', 72, 57, 4.8); disc(ctx, '#e5735c', 70.5, 55.5, 2);
    disc(ctx, '#f6f4ef', 72.5, 57.5, 2.5); r('#d6cfc2', 73, 58, 2, 1);
    r(N.m, 66, 57, 1, 1); r(N.m, 78, 57, 1, 1); r(N.m, 72, 51, 1, 1);
    r(N.o, 72, 50, 1, 1);
    r(N.o, 69, 45, 7, 5); r('#f6f4ef', 70, 46, 5, 1); r('#c94f3a', 70, 47, 5, 2); r('#e5735c', 70, 47, 1, 2); r('#9e3626', 74, 47, 1, 2); r(N.m, 72, 48, 1, 1);
    r(N.n, 85, 44, 1, 20); r(N.m, 85, 44, 1, 8);
    r(N.o, 83, 63, 5, 1); r(N.n, 84, 62, 3, 1);
    r(N.o, 81, 42, 9, 1); r('#e0c24a', 81, 43, 9, 2); r('#f6e392', 82, 43, 3, 1); r('#b3962a', 81, 44, 9, 1);
    // desk, computer, tower, lamp
    r('#a96b3e', 120, 50, 36, 2); r('#c4885a', 120, 50, 36, 1); r('#7a4a2a', 120, 52, 36, 1);
    r('#7a4a2a', 122, 52, 2, 12); r('#9c6438', 122, 52, 1, 12); r('#7a4a2a', 154, 52, 2, 12); r('#9c6438', 154, 52, 1, 12);
    r(N.o, 123, 33, 20, 14); r('#ddd2b4', 124, 34, 18, 12); r('#f0e8d2', 124, 34, 18, 1); r('#f0e8d2', 124, 34, 1, 11); r('#b8ab88', 141, 35, 1, 10);
    r('#b8ab88', 124, 45, 18, 1); r('#5bd16b', 140, 45, 1, 1);
    r(N.o, 132, 47, 2, 3); r(N.o, 129, 50, 8, 1);
    r(N.o, 125, 56, 8, 8); r('#ddd2b4', 126, 57, 6, 6); r('#f0e8d2', 126, 57, 6, 1); r('#b8ab88', 131, 58, 1, 5); r(N.o, 128, 60, 2, 1); r('#8a7f62', 127, 58, 4, 1); r('#5bd16b', 127, 62, 1, 1);
    r(N.o, 144, 49, 12, 3); r(N.n, 145, 49, 10, 1);
    r(c.base, 148, 48, 4, 1);
    r(N.o, 149, 41, 2, 7); r(N.n, 149, 41, 1, 7);
    lampShade(ctx, c, false);
    BULBS.forEach((x, i) => r(i % 2 ? '#e8c06a' : '#f2dca0', x, bulbY(x), 1, 1));
    // under the hero's feet
    r('#9a6236', 107, 64, 10, 1);
  }

  function lampShade(ctx, c, lit) {
    rect(ctx, N.o, 144, 36, 12, 1);
    rect(ctx, lit ? '#4fe8d4' : c.light, 144, 37, 12, 1);
    rect(ctx, lit ? '#34cdb9' : c.base, 144, 38, 12, 2);
    rect(ctx, lit ? '#1f9c8c' : c.shade, 144, 40, 12, 1);
    rect(ctx, N.o, 146, 40, 8, 1);
  }

  // A context that paints straight into an ImageData's pixels, so the lit lamp can go over the night pass with no canvas.
  function onPixels(img) {
    const d = img.data;
    let rgb = [0, 0, 0];
    return {
      set fillStyle(hex) { const v = parseInt(hex.slice(1), 16); rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255]; },
      fillRect(x, y, w, h) {
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
          const k = (j * img.width + i) * 4;
          d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2];
        }
      },
    };
  }

  // The lit lamp and the bulbs as they shine at night, painted over the night pass.
  function paintNight(ctx, c) {
    lampShade(ctx, c, true);
    rect(ctx, '#fff3c4', 147, 41, 6, 1);
    BULBS.forEach((x, i) => rect(ctx, i % 2 ? '#ffd27a' : '#fff1c2', x, bulbY(x), 1, 1));
  }

  // The day and night rooms, and the five steps between them that a night fall passes through, prepared once in draw.
  let levels = null;

  Scenes.add('early-night', {
    heroX: 104,
    arrive: 50,
    // The camera dives into the desk computer's screen, on to the lab.
    door: { x: 133, y: 40, zoom: 11 },
    draw(ctx, c) {
      paintDay(ctx, c);
      const day = ctx.getImageData(0, 0, W, H);
      const night = nightPass(day, nightLights(), (x, y) => inWindow(x, y) || inScreen(x, y));
      paintNight(onPixels(night), c);
      quantize(day);
      quantize(night);
      ctx.putImageData(day, 0, 0);
      levels = [day, dissolve(day, night, 0.25), dissolve(day, night, 0.5), dissolve(day, night, 0.75), night];
    },
    init: () => ({ dark: 0, screen: 0, chat: 0 }),
    frame(ctx, c, s, t) {
      const dark = steps4(s.dark);
      const glow = steps4(s.screen);
      const step = Math.round(dark * 4);
      if (step > 0) ctx.putImageData(levels[step], 0, 0);

      skyWindow(ctx, dark, t);
      if (dark >= 0.5) {
        BULBS.forEach((x, i) => {
          ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3 + i);
          rect(ctx, '#ffd27a', x - 2, bulbY(x) - 2, 5, 5);
        });
        ctx.globalAlpha = 1;
      }
      screen(ctx, c, glow, s.chat);
    },
    cues: {
      night: s => gsap.timeline()
        .to(s, { dark: 1, duration: 1.2, ease: 'steps(4)' })
        .to(s, { screen: 1, duration: 0.6, ease: 'steps(2)' }, 1.2)
        .to(s, { chat: 1, duration: 1.6, ease: 'steps(4)' }, 1.8),
    },
  });
})();
