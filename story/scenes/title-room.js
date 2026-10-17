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
  const { mix, rect, outline } = Draw;

  const HERO_X = 56;
  const HERO_TOP = GROUND - 24;
  const STARS = [[24, 11], [30, 14], [42, 11], [48, 15], [26, 24], [41, 25], [50, 22], [32, 25]];

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
      rect(ctx, '#f3e3c4', 0, 0, W, GROUND);
      for (let x = 0; x < W; x += 16) rect(ctx, '#ecd7b0', x, 0, 1, GROUND);
      rect(ctx, '#b87a4b', 0, GROUND, W, H - GROUND);
      rect(ctx, '#d89a64', 0, GROUND, W, 1);
      rect(ctx, '#b5583a', 40, 66, 60, 4);

      rect(ctx, '#23305c', 20, 8, 32, 22);
      outline(ctx, 20, 8, 32, 22, N.o);
      rect(ctx, N.o, 36, 8, 1, 22);
      rect(ctx, N.o, 20, 18, 32, 1);
      rect(ctx, '#a96b3e', 17, 30, 38, 2);

      rect(ctx, '#7a4a2a', 98, 26, 20, 38);
      outline(ctx, 98, 26, 20, 38, N.o);
      rect(ctx, N.o, 98, 37, 20, 1);
      rect(ctx, N.o, 98, 48, 20, 1);
      rect(ctx, N.o, 98, 59, 20, 1);
      [['#c94f3a', 100, 27, 9], ['#3a7f8c', 104, 27, 9], ['#e0a46f', 109, 27, 9], ['#6b8f3a', 100, 38, 9], ['#f6f4ef', 105, 38, 9],
        ['#c94f3a', 100, 49, 9], ['#e0a46f', 106, 49, 9], ['#3a7f8c', 111, 49, 9], ['#6b8f3a', 102, 60, 4], ['#f6f4ef', 109, 60, 4]]
        .forEach(([color, x, y, h]) => rect(ctx, color, x, y, 3, h));

      rect(ctx, '#8c4b2e', 2, 48, 30, 16);
      outline(ctx, 2, 48, 30, 16, N.o);
      rect(ctx, '#a96b3e', 4, 58, 26, 4);
      rect(ctx, '#8c4b2e', 0, 54, 4, 10);
      rect(ctx, '#8c4b2e', 30, 54, 4, 10);

      rect(ctx, N.o, 84, 22, 1, 42);
      rect(ctx, N.o, 80, 63, 9, 1);
      rect(ctx, '#f2c97a', 79, 20, 11, 7);
      outline(ctx, 79, 20, 11, 7, N.o);

      rect(ctx, '#a96b3e', 122, 50, 28, 2);
      rect(ctx, '#7a4a2a', 124, 52, 2, 12);
      rect(ctx, '#7a4a2a', 146, 52, 2, 12);
      rect(ctx, '#2a1f2b', 128, 34, 18, 13);
      outline(ctx, 128, 34, 18, 13, N.o);
      rect(ctx, N.o, 135, 47, 2, 3);
      rect(ctx, N.o, 132, 50, 8, 1);
    },
    init: () => {
      const grid = Pixel.heroGrid('none');
      return { grid, shut: eyesShut(grid) };
    },
    frame(ctx, c, s, t) {
      const up = lift(t);
      const lamp = 0.5 + 0.5 * Math.sin(t * 1.3);

      ctx.globalAlpha = 0.12 + 0.04 * lamp;
      rect(ctx, '#ffd27a', 64, 18, 48, 46);
      ctx.globalAlpha = 1;

      STARS.forEach(([x, y], i) => {
        if (Math.sin(t * 2.1 + i * 1.3) > -0.3) rect(ctx, i % 3 === 0 ? '#ffffff' : '#f6f4ef', x, y, 1, 1);
      });

      const screen = mix('#2a1416', '#9fd8ff', 0.6 + 0.2 * Math.sin(t * 0.9));
      rect(ctx, screen, 130, 36, 14, 9);
      for (let i = 0; i < 3; i++) rect(ctx, '#f6f4ef', 131, 37 + i * 2, 4 + ((i + Math.floor(t)) % 3) * 2, 1);

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
