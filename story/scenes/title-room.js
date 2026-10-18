/*
 * The title screen: Joe at his desk in a warm room at night, holding a cup of tea. The steam rises,
 * the stars twinkle through the window and the screen glows. Every seven seconds he lifts the cup,
 * closes his eyes and lowers it again.
 * Needs: Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { mix, rect, outline, vdither, shadow, lighter, darker, pool, glow, quantize } = Draw;

  const HERO_X = 56;
  const HERO_TOP = GROUND - 24;
  const STARS = [[24, 11], [30, 14], [42, 11], [48, 15], [26, 24], [41, 25], [50, 22], [32, 25]];
  const LAMP = pool(84.5, 41, 26, 24);
  const SCREEN_LIGHT = pool(136, 40, 14, 12);
  const BOOKS = [['#c94f3a', 100, 30], ['#3a7f8c', 104, 30], ['#e0a46f', 109, 30], ['#6b8f3a', 100, 42], ['#f6f4ef', 105, 42],
    ['#c94f3a', 100, 54], ['#e0a46f', 106, 54], ['#3a7f8c', 111, 54]];

  // How far the cup is lifted, 0 when it rests and 1 at his mouth: one sip in every seven seconds.
  function lift(t) {
    const u = ((t % 7) - 0.2) / 1.6;
    return u >= 0 && u <= 1 ? Math.sin(u * Math.PI) : 0;
  }

  const CLOSED_ROW = 7;
  function eyesShut(grid) {
    return grid.map((row, y) => (y === CLOSED_ROW ? row.slice(0, 6) + 'o' + row.slice(7, 9) + 'o' + row.slice(10) : row));
  }

  // The right hand sits under the cup, so it rises with the cup; its sleeve takes the hand's rest spot.
  const HAND_REST_ROW = 15;
  function holdCup(grid, lifted) {
    const rows = grid.map(row => row.split(''));
    rows[HAND_REST_ROW][12] = '3';
    const y = HAND_REST_ROW + 5 - lifted;
    rows[y][11] = 'o';
    rows[y][12] = 's';
    rows[y][13] = 'o';
    return rows.map(row => row.join(''));
  }

  Scenes.add('title-room', {
    heroX: HERO_X,
    draw(ctx, c) {
      vdither(ctx, '#e8d3aa', '#f5e7cc', 0, 0, W, GROUND, 4);
      for (let x = 0; x < W; x += 16) { rect(ctx, '#ecd7b0', x, 0, 1, GROUND); rect(ctx, '#f8ecd4', x + 1, 0, 1, GROUND); }
      rect(ctx, '#e3c89c', 0, 60, W, 4); rect(ctx, '#faf0d8', 0, 60, W, 1); rect(ctx, '#c9a978', 0, 63, W, 1);

      rect(ctx, '#b87a4b', 0, GROUND, W, H - GROUND);
      rect(ctx, '#d89a64', 0, GROUND, W, 1);
      rect(ctx, '#9a6236', 0, 68, W, 1);
      for (let x = 7; x < W; x += 23) rect(ctx, '#9a6236', x, 65, 1, 3);
      for (let x = 18; x < W; x += 23) rect(ctx, '#9a6236', x, 69, 1, 3);
      for (let x = 3; x < W; x += 11) rect(ctx, '#c78b58', x, 66 + (x % 3 === 0 ? 0 : 4), 3, 1);

      // The window: a night sky dithered from deep to dark blue, then its frame, mullion and transom.
      vdither(ctx, '#33477f', '#1b2650', 21, 9, 30, 20, 4);
      outline(ctx, 20, 8, 32, 22, N.o);
      rect(ctx, N.o, 36, 8, 1, 22);
      rect(ctx, N.o, 20, 18, 32, 1);
      rect(ctx, '#a96b3e', 17, 30, 38, 2); rect(ctx, '#c4885a', 17, 30, 38, 1); rect(ctx, '#7a4a2a', 17, 31, 38, 1);
      shadow(ctx, '#9a6236', 17, 30, 38, 2);

      // The sofa: a shaded back and arms, a cushion with its highlight, and its shadow on the floor.
      rect(ctx, '#9a6236', 2, GROUND, 32, 1);
      rect(ctx, '#8c4b2e', 2, 48, 30, 16);
      rect(ctx, '#a05a36', 3, 49, 28, 1);
      outline(ctx, 2, 48, 30, 16, N.o);
      rect(ctx, '#8c4b2e', 0, 54, 4, 10); rect(ctx, '#a05a36', 0, 54, 1, 10);
      rect(ctx, '#8c4b2e', 30, 54, 4, 10); rect(ctx, '#a05a36', 30, 54, 1, 10);
      rect(ctx, '#a96b3e', 4, 58, 26, 4); rect(ctx, '#c4885a', 4, 58, 26, 1); rect(ctx, '#7a4a2a', 4, 61, 26, 1);

      // The rug: a darker border, a lit band and a dotted pattern.
      rect(ctx, '#8f3f2a', 40, 66, 60, 4);
      rect(ctx, '#b5583a', 41, 67, 58, 2);
      rect(ctx, '#c96a4c', 41, 67, 58, 1);
      for (let x = 44; x < 97; x += 6) rect(ctx, '#e08a70', x, 68, 1, 1);

      // The bookcase: three full shelves of the same height, each with its books standing on it.
      rect(ctx, '#7a4a2a', 98, 27, 20, 37);
      rect(ctx, '#9c6438', 99, 28, 1, 36);
      rect(ctx, '#5a3219', 115, 28, 3, 36);
      rect(ctx, '#5a3219', 99, 40, 16, 1);
      rect(ctx, '#5a3219', 99, 52, 16, 1);
      rect(ctx, N.o, 98, 39, 20, 1);
      rect(ctx, N.o, 98, 51, 20, 1);
      outline(ctx, 98, 27, 20, 37, N.o);
      shadow(ctx, '#9a6236', 98, 27, 20, 37);
      BOOKS.forEach(([color, x, y]) => {
        rect(ctx, color, x, y, 3, 9);
        rect(ctx, lighter(color, 0.3), x, y, 1, 9);
        rect(ctx, darker(color, 0.25), x + 2, y, 1, 9);
      });

      // The floor lamp: a lit shade, its pole and its base.
      rect(ctx, N.o, 84, 22, 1, 42);
      rect(ctx, N.o, 80, 63, 9, 1);
      rect(ctx, '#f2c97a', 79, 20, 11, 7);
      rect(ctx, '#ffe6a8', 80, 21, 9, 1);
      rect(ctx, '#d9a85a', 80, 25, 9, 1);
      outline(ctx, 79, 20, 11, 7, N.o);

      // The desk: a lit top with its shadow, and two legs.
      rect(ctx, '#a96b3e', 122, 50, 28, 2);
      rect(ctx, '#c4885a', 122, 50, 28, 1);
      shadow(ctx, '#9a6236', 122, 50, 28, 2);
      rect(ctx, '#7a4a2a', 124, 52, 2, 12); rect(ctx, '#9c6438', 124, 52, 1, 12);
      rect(ctx, '#7a4a2a', 146, 52, 2, 12); rect(ctx, '#9c6438', 146, 52, 1, 12);

      // The computer: the screen, its stand and its foot share one middle, the desk's.
      rect(ctx, '#2a1f2b', 127, 34, 18, 13);
      rect(ctx, '#5a4c5a', 128, 35, 16, 1);
      outline(ctx, 127, 34, 18, 13, N.o);
      rect(ctx, N.o, 135, 47, 2, 3);
      rect(ctx, N.o, 132, 50, 8, 1);

      glow(ctx, '#ffe2a0', LAMP, 58, 16, 54, 50, 3, 0.24);
      glow(ctx, '#9fd8ff', SCREEN_LIGHT, 122, 28, 28, 24, 2, 0.14);
      ctx.putImageData(quantize(ctx.getImageData(0, 0, W, H)), 0, 0);
    },
    init: () => {
      const grid = Pixel.heroGrid('none');
      return { grid, shut: eyesShut(grid) };
    },
    frame(ctx, c, s, t) {
      const up = lift(t);
      const lamp = 0.5 + 0.5 * Math.sin(t * 1.3);

      glow(ctx, '#ffe2a0', LAMP, 58, 16, 54, 50, 3, 0.04 + 0.04 * lamp);

      STARS.forEach(([x, y], i) => {
        if (Math.sin(t * 2.1 + i * 1.3) > -0.3) rect(ctx, i % 3 === 0 ? '#ffffff' : '#f6f4ef', x, y, 1, 1);
      });

      const screen = mix('#2a1416', '#9fd8ff', 0.6 + 0.2 * Math.sin(t * 0.9));
      rect(ctx, screen, 129, 36, 14, 9);
      for (let i = 0; i < 3; i++) rect(ctx, '#f6f4ef', 130, 37 + i * 2, 4 + ((i + Math.floor(t)) % 3) * 2, 1);

      const mugX = HERO_X + 11;
      const lifted = Math.round(up * 8);
      const mugY = HERO_TOP + 15 - lifted;
      const face = up > 0.6 ? s.shut : s.grid;
      Pixel.paint(ctx, lifted ? holdCup(face, lifted) : face, c, HERO_X, HERO_TOP, 1, false);
      rect(ctx, '#f6f4ef', mugX, mugY, 5, 5);
      rect(ctx, '#8a4b25', mugX, mugY, 5, 1);
      outline(ctx, mugX, mugY, 5, 5, N.o);

      for (let k = 0; k < 3; k++) {
        const p = (t * 0.35 + k / 3) % 1;
        const x = mugX + 2 + Math.round(Math.sin(t * 2 + k * 2) * 1.5 * p);
        const y = mugY - 1 - Math.round(p * 14);
        ctx.globalAlpha = (1 - p) * 0.9;
        rect(ctx, '#9c8570', x, y, 1, 2);
      }
      ctx.globalAlpha = 1;
    },
  });
})();
