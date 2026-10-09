/*
 * Pixel sprites.
 *
 * Every sprite is a grid of strings, one character per pixel. See STYLE-GUIDE.md
 * for the rules. The characters mean:
 *
 *   .  transparent
 *   o  outline (near black)
 *   1  act color, light      2  act color, base      3  act color, shade
 *   w  white                 m  metal, light         n  metal, dark
 *   s  skin                  S  skin shade           h  hair
 *   H  hair, lighter streak  e  eyes
 *   k  trousers              K  trousers, light
 *
 * The act colors come from the act's recipe, so the same sprite drawn in Act II
 * is track red and in Act III is blueprint blue.
 */
(function () {
  'use strict';

  const NEUTRALS = {
    o: '#1d1b22',
    w: '#f6f4ef',
    m: '#c3c6cc',
    n: '#7d808a',
    s: '#f4c7a6',
    S: '#d9937a',
    h: '#8c4527',
    H: '#c0703c',
    e: '#2c5a8c',
    k: '#3a3744',
    K: '#4d4958',
  };

  // Items are 16 x 16.
  const ITEMS = {
    bike: [
      '................',
      '................',
      '................',
      '..........oooo..',
      '...........3....',
      '....ooo....3....',
      '.....3.....3....',
      '.....2222223....',
      '..ooo.2...2ooo..',
      '.onnno2..2on3no.',
      'on...no22on.3.no',
      'on.m.no2.on.m.no',
      'on..33om.on...no',
      '.onnno..m.onnno.',
      '..ooo......ooo..',
      '................',
    ],
    wrench: [
      '...........ooo..',
      '..........o1o...',
      '.........o1o...o',
      '.........o1o..oo',
      '.........o12oo1o',
      '........o12311o.',
      '.......o123ooo..',
      '......o123o.....',
      '.....o123o......',
      '..ooo123o.......',
      '.o1o123o........',
      'o1o.o1o.........',
      'oo...oo.........',
      'o1o.o1o.........',
      '.o1o1o..........',
      '..ooo...........',
    ],
    hammer: [
      '................',
      '.ooo............',
      '.o.o............',
      '.ooo............',
      '....n...........',
      '.....n..........',
      '......n.........',
      '.......n..ooo...',
      '........oo222oo.',
      '........o11222o.',
      '.......o1w12222o',
      '.......o1222223o',
      '.......o2222233o',
      '........o22233o.',
      '........oo333oo.',
      '..........ooo...',
    ],
    flask: [
      '................',
      '.....oooooo.....',
      '......owwo......',
      '......owwo......',
      '......owwo......',
      '.....owwwwo.....',
      '.....owwwwo.....',
      '....owwwwwwo....',
      '....o111111o....',
      '...o22w22222o...',
      '...o22222w22o...',
      '..o2222222222o..',
      '..o2222222233o..',
      '.o333333333333o.',
      '.oooooooooooooo.',
      '................',
    ],
    calipers: [
      '................',
      '................',
      '..o......o......',
      '.o2o....o2o.....',
      '.o2oooooo22ooooo',
      '.o21m1m1m22m1m1o',
      '.o2oooooo22ooooo',
      '.o22o...o222o...',
      '.o22o...o2m2o...',
      '.o22o...o22o....',
      '..o2o...o2o.....',
      '..o2o...o2o.....',
      '...o2o.o2o......',
      '....oo.oo.......',
      '................',
      '................',
    ],
    hardhat: [
      '................',
      '................',
      '................',
      '................',
      '......oooo......',
      '....oo1222oo....',
      '...o112222223o..',
      '..o11222222223o.',
      '..o12222222223o.',
      'ooo22222222233oo',
      'o22222222222223o',
      'o33333333333333o',
      'oooooooooooooooo',
      '................',
      '................',
      '................',
    ],
    skis: [
      '................',
      '............o2o.',
      '...........o2o..',
      '..........o2o...',
      '.........o2o.o2o',
      '........o2o.o2o.',
      '.......onno.ono.',
      '......onno.onno.',
      '.....o2o.onno...',
      '....o2o.o2o.....',
      '...o2o.o2o......',
      '..o2o.o2o.......',
      '.o2o.o2o........',
      'o2o.o2o.........',
      '...o2o..........',
      '..o2o...........',
    ],
    carabiner: [
      '................',
      '.....oooooo.....',
      '....o111222o....',
      '...o11oooo22o...',
      '...o1o....o2o...',
      '...o1o....omo...',
      '...o1o....omo...',
      '...o2o....omo...',
      '...o2o....omo...',
      '...o2o....omo...',
      '...o2o....o3o...',
      '...o2o....o3o...',
      '...o23oooo33o...',
      '....o333333o....',
      '.....oooooo.....',
      '................',
    ],
    laptop: [
      '................',
      '................',
      '..oooooooooooo..',
      '..o2222222222o..',
      '..o2www2ww222o..',
      '..o222ww2www2o..',
      '..o2ww2222222o..',
      '..o2222www222o..',
      '..o2222222222o..',
      '..oooooooooooo..',
      '.o3m3m3m3m3m33o.',
      'o11111111111111o',
      'oooooooooooooooo',
      '................',
      '................',
      '................',
    ],
    duck: [
      '................',
      '....oooo........',
      '...o1122o.......',
      '..o11o222o......',
      'o33o22222o......',
      '.oo222222o..oo..',
      '..o222222o.o2o..',
      '.o1222222ooo22o.',
      'o12222222222222o',
      'o12223333222222o',
      'o12222333222223o',
      'o22222222222233o',
      '.o222222222233o.',
      '..oooooooooooo..',
      '................',
      '................',
    ],
    compass: [
      '.......oo.......',
      '.....oooooo.....',
      '....o222222o....',
      '...o2wwwwww2o...',
      '..o2www32www2o..',
      '.o2wwww32wwww2o.',
      '.o2wwww32wwww2o.',
      '.o2wwwwoowwww2o.',
      '.o2wwwwnnwwww2o.',
      '.o2wwwwnnwwww2o.',
      '.o2wwwwnnwwww2o.',
      '..o2wwwnnwww2o..',
      '...o2wwwwww2o...',
      '....o222222o....',
      '.....oooooo.....',
      '................',
    ],
    roadmap: [
      '................',
      '................',
      '.oooooooooooooo.',
      '.owwww1111wwwwo.',
      '.owwww1111wowoo.',
      '.owwww1111wwowo.',
      '.owwww1111wowoo.',
      '.owwww11113wwwo.',
      '.owwww1113wwwwo.',
      '.owwww1311wwwwo.',
      '.owww31111wwwwo.',
      '.ow3ww1111wwwwo.',
      '.owwww1111wwwwo.',
      '.oooooooooooooo.',
      '................',
      '................',
    ],
    passport: [
      '................',
      '...oooooooooo...',
      '...o12222222o...',
      '...o12222222o...',
      '...o122ww222o...',
      '...o12w22w22o...',
      '...o1w2ww2w2o...',
      '...o12w22w22o...',
      '...o122ww222o...',
      '...o12222222o...',
      '...o12wwww22o...',
      '...o12222222o...',
      '...o13333333o...',
      '...oooooooooo...',
      '................',
      '................',
    ],
    device: [
      '................',
      '................',
      '..oooooooooooo..',
      '..o1111111112o..',
      '..o1oooooooo2o..',
      '..o1owwwwwwo2o..',
      '..o1owwwnwwo2o..',
      '..o1onnnwnno2o..',
      '..o1owwwwwwo2o..',
      '..o1oooooooo2o..',
      '..o2222222222o..',
      '..o22m2m22ww2o..',
      '..o3333333333o..',
      '..oooooooooooo..',
      '................',
      '................',
    ],
    books: [
      '................',
      '................',
      '.....ooooooooo..',
      '.....o1111111o..',
      '.....o2w22222o..',
      '.....o3333333o..',
      '...ooooooooooooo',
      '...o111111111wwo',
      '...o2www222222wo',
      '...o333333333wwo',
      '..ooooooooooooo.',
      '..o11111111111o.',
      '..o222w2w22222o.',
      '..o33333333333o.',
      '..ooooooooooooo.',
      '................',
    ],
    hats: [
      '................',
      '................',
      '.....oooooo.....',
      '....ommmmmmo....',
      '...ommmwmmmmo...',
      '...ommmmmmmmo...',
      '.oooooooooooooo.',
      '................',
      '.....oooooo.....',
      '....o122222o....',
      '...o12222222o...',
      '...o22222222o...',
      '...o33333333ooo.',
      '...ooooooooooooo',
      '................',
      '................',
    ],
    camera: [
      '................',
      '................',
      '................',
      '.....oooo.......',
      '..ooo2222oooo...',
      '.o222222222222o.',
      '.o22ooo222ww22o.',
      '.o2o333o222222o.',
      '.o2o3w3o222222o.',
      '.o2o333o222222o.',
      '.o22ooo2222222o.',
      '.o333333333333o.',
      '..oooooooooooo..',
      '................',
      '................',
      '................',
    ],
  };

  // Drawn in place of a sprite a recipe names but pixel.js does not have yet.
  const MISSING = [
    '................',
    '.oooooooooooooo.',
    '.o222222222222o.',
    '.o2222oooo2222o.',
    '.o222o2222o222o.',
    '.o22222222o222o.',
    '.o2222222o2222o.',
    '.o222222o22222o.',
    '.o222222o22222o.',
    '.o222222222222o.',
    '.o222222o22222o.',
    '.o222222222222o.',
    '.o222222222222o.',
    '.oooooooooooooo.',
    '................',
    '................',
  ];

  // The hero is 16 x 24, drawn from Joe's photos: blue eyes (e), a wide smile,
  // and hair with lighter streaks (H). Overlays replace pixels of the base; '.'
  // keeps the base, and a missing row (null) keeps the whole row.
  const HERO_BASE = [
    '................',
    '................',
    '.....oooooo.....',
    '....ohhHhhho....',
    '...ohHhhhhHho...',
    '...ohssssssho...',
    '...osssssssso...',
    '...ossessesso...',
    '...osssSSssso...',
    '....oswwwwso....',
    '...o22211222o...',
    '..o3222222223o..',
    '..o2o222222o2o..',
    '..o2o222222o2o..',
    '..o2o222222o2o..',
    '..oso333333oso..',
    '...ooKkkkkKoo...',
    '....oKkkkkKo....',
    '....okkookko....',
    '....okkookko....',
    '....okkookko....',
    '...oooo..oooo...',
    '................',
    '................',
  ];

  // Everyone else in the scenes: the same build with a plain face, in their own shirt and hair.
  const PERSON_BASE = [
    '................',
    '................',
    '.....oooooo.....',
    '....ohhhhhho....',
    '...ohhhhhhhho...',
    '...ohssssshho...',
    '...osssssssso...',
    '...ossossosso...',
    '...osssSSssso...',
    '....osssssso....',
    '...o22211222o...',
    '..o3222222223o..',
    '..o2o222222o2o..',
    '..o2o222222o2o..',
    '..o2o222222o2o..',
    '..oso333333oso..',
    '...ooKkkkkKoo...',
    '....oKkkkkKo....',
    '....okkookko....',
    '....okkookko....',
    '....okkookko....',
    '...oooo..oooo...',
    '................',
    '................',
  ];

  const HERO_GEAR = {
    none: [],
    helmet: [
      '................',
      '.....oooooo.....',
      '....o112222o....',
      '...o12222222o...',
      '...o22222223o...',
      '..oooooooooooo..',
    ],
    headband: [null, null, null, null, '...o22222222o...'],
    hardhat: [
      null,
      '......oooo......',
      '....oo1222oo....',
      '...o11222222o...',
      '..o2222222222o..',
      '..oooooooooooo..',
      null, null, null, null, null, null, null, null,
      '..o2owwwwwwo2o..',
    ],
    beanie: [
      '.......oo.......',
      '......o11o......',
      '.....oooooo.....',
      '....o222222o....',
      '...o22222222o...',
      '...o33333333o...',
    ],
    // Over-ear headphones, the band riding in front of a bun.
    headphones: [
      null,
      null,
      '....oo2222oo....',
      '...o2......2o...',
      '..o2o......o2o..',
      '..o22o....o22o..',
      '..o33o....o33o..',
      '...oo......oo...',
    ],
    cap: [
      '................',
      '......oooo......',
      '....oo2222oo....',
      '...o12222222o...',
      '...o33333333o...',
      '..oooooooooo....',
      null, null, null, null, null, null, null,
      '..o2o22ww22o2o..',
      '..o2o22ww22o2o..',
    ],
    // No hat: a lanyard and a badge on the shirt.
    badge: [null, null, null, null, null, null, null, null, null, null, null, null, null,
      '..o2o222222owo..',
      '..o2o2222221o2..',
    ],
  };
  // Hats cover the head, so long hair tucks under them.
  const HATS = ['helmet', 'hardhat', 'beanie', 'cap'];

  // Hair styles replace rows of the head. Beards are drawn over any gear.
  const HAIR = {
    short: [],
    bald: [null, null, '.....oooooo.....', '....osswssso....', '...osssssssso...', '...osssssssso...'],
    bun: [
      '......oooo......',
      '.....ohHhho.....',
      '.....oohhoo.....',
      '....ohHhhHho....',
      '...ohhHhhHhho...',
      '...ohssssssho...',
    ],
  };
  const BEARD = {
    none: [],
    goatee: [null, null, null, null, null, null, null, null, null, '....ohwwwwho....', '...o222hh222o...'],
    stubble: [null, null, null, null, null, null, null, null, '...osSsSSsSso...', '....oSwwwwSo....'],
    short: [null, null, null, null, null, null, null, null, '...ohhsSSshho...', '...ohhwwwwhho...', '...o2ohhhho2o...'],
    full: [null, null, null, null, null, null, null, null,
      '...ohhsSSshho...',
      '...ohHwwwwHho...',
      '...ohhhhhhhho...',
      '..o3ohhHhhho3o..',
      '..o2o2ohho2o2o..',
      '..o2o22oo22o2o..',
    ],
    long: [null, null, null, null, null, null, null, null,
      '...ohhsSSshho...',
      '...ohHwwwwHho...',
      '...ohhhhhhhho...',
      '..o3ohhHhhho3o..',
      '..o2oohhhHoo2o..',
      '..o2o2ohho2o2o..',
      '..o2o22oo22o2o..',
    ],
  };
  const GLASSES = [null, null, null, null, null, null, null, '...osnennenso...'];
  let look = { hairStyle: 'bun', beard: 'long', glasses: false };

  // The look: colors for skin, hair and eyes, and the hair and beard of today.
  // Acts can give the hero another hair style and beard for that part of the story.
  function setLook(next) {
    look = Object.assign({ hairStyle: 'bun', beard: 'long', glasses: false }, next || {});
    if (look.skin) NEUTRALS.s = look.skin;
    if (look.skinShade) NEUTRALS.S = look.skinShade;
    if (look.hair) NEUTRALS.h = look.hair;
    NEUTRALS.H = look.hairLight || NEUTRALS.h;
    if (look.eyes) NEUTRALS.e = look.eyes;
    cache.clear();
  }
  // Tiny 3 x 5 digits for game canvases.
  const DIGITS = {
    0: ['111', '101', '101', '101', '111'],
    1: ['010', '110', '010', '010', '111'],
    2: ['111', '001', '111', '100', '111'],
    3: ['111', '001', '111', '001', '111'],
    4: ['101', '101', '111', '001', '001'],
    5: ['111', '100', '111', '001', '111'],
    6: ['111', '100', '111', '101', '111'],
    7: ['111', '001', '001', '001', '001'],
    8: ['111', '101', '111', '101', '111'],
    9: ['111', '101', '111', '001', '111'],
    m: ['000', '000', '111', '111', '101'],
    A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'],
    D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
    G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
    J: ['001', '001', '001', '101', '010'], K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
    M: ['101', '111', '101', '101', '101'], N: ['101', '111', '111', '111', '101'], O: ['010', '101', '101', '101', '010'],
    P: ['110', '101', '110', '100', '100'], Q: ['010', '101', '101', '110', '011'], R: ['110', '101', '110', '101', '101'],
    S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
    V: ['101', '101', '101', '101', '010'], W: ['101', '101', '111', '111', '101'], X: ['101', '101', '010', '101', '101'],
    Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'],
    '-': ['000', '000', '111', '000', '000'], '!': ['010', '010', '010', '000', '010'], '?': ['110', '001', '010', '000', '010'],
    ':': ['000', '010', '000', '010', '000'], '/': ['001', '001', '010', '100', '100'], '+': ['000', '010', '111', '010', '000'],
    '$': ['011', '110', '010', '011', '110'],
  };

  const GRAY = { light: '#c9c9cf', base: '#9a9aa0', shade: '#5f5f66' };

  function colorFor(ch, ramp) {
    if (ch === '1') return ramp.light;
    if (ch === '2') return ramp.base;
    if (ch === '3') return ramp.shade;
    return NEUTRALS[ch] || null;
  }

  function overlay(base, gear) {
    return base.map((row, y) => {
      const top = gear && gear[y];
      if (!top) return row;
      let out = '';
      for (let x = 0; x < row.length; x++) out += top[x] && top[x] !== '.' ? top[x] : row[x];
      return out;
    });
  }

  // extra maps characters to colors that win over the usual ones, for one-off
  // characters such as a teammate's hair.
  function paint(ctx, grid, ramp, ox, oy, scale, flip, extra) {
    const s = scale || 1;
    const w = grid[0].length;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const ch = grid[y][x];
        const c = (extra && extra[ch]) || colorFor(ch, ramp || GRAY);
        if (!c) continue;
        ctx.fillStyle = c;
        const px = flip ? w - 1 - x : x;
        ctx.fillRect(Math.round(ox + px * s), Math.round(oy + y * s), s, s);
      }
    }
  }

  const cache = new Map();
  function toURL(grid, ramp) {
    const key = grid.join('|') + JSON.stringify(ramp || GRAY);
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas');
    c.width = grid[0].length;
    c.height = grid.length;
    paint(c.getContext('2d'), grid, ramp, 0, 0, 1);
    const url = c.toDataURL('image/png');
    cache.set(key, url);
    return url;
  }

  function img(grid, ramp, scale, alt) {
    const el = document.createElement('img');
    el.className = 'px';
    el.src = toURL(grid, ramp);
    el.width = grid[0].length * scale;
    el.height = grid.length * scale;
    el.alt = alt || '';
    el.draggable = false;
    return el;
  }

  // style picks the hair and beard ({ hair, beard }); without it, today's look.
  function heroGrid(gear, style) {
    const st = style || {};
    let hair = st.hair || look.hairStyle;
    if (HATS.includes(gear) && hair !== 'bald') hair = 'short';
    let grid = overlay(HERO_BASE, HAIR[hair] || []);
    grid = overlay(grid, HERO_GEAR[gear] || []);
    grid = overlay(grid, BEARD[st.beard || look.beard] || []);
    if (look.glasses) grid = overlay(grid, GLASSES);
    return grid;
  }

  function digits(ctx, text, x, y, color, scale) {
    const s = scale || 1;
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of String(text)) {
      if (ch === '.') { ctx.fillRect(cx, y + 4 * s, s, s); cx += 2 * s; continue; }
      if (ch === ' ') { cx += 2 * s; continue; }
      const g = DIGITS[ch] || DIGITS[ch.toUpperCase()];
      if (!g) continue;
      g.forEach((row, gy) => [...row].forEach((v, gx) => { if (v === '1') ctx.fillRect(cx + gx * s, y + gy * s, s, s); }));
      cx += 4 * s;
    }
    return cx - x;
  }

  // Pixel text in the 3 x 5 font: digits, capital letters and a little punctuation.
  const text = digits;

  window.Pixel = {
    NEUTRALS, ITEMS, HERO_BASE, PERSON_BASE, HERO_GEAR, HAIR, BEARD, GRAY,
    colorFor, overlay, paint, toURL, img, heroGrid, digits, text, setLook,
    item: (name, ramp, scale, alt) => img(ITEMS[name] || MISSING, ramp, scale, alt),
    hero: (gear, ramp, scale, alt, style) => img(heroGrid(gear, style), ramp, scale, alt),
    heroURL: (gear, ramp, style) => toURL(heroGrid(gear, style), ramp),
  };
})();
