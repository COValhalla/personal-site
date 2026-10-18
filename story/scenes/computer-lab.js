/*
 * Tutorial, moment 2: the school computer lab. Kids type on five beige computers, and the race starts: the screens light up,
 * the bars run and the hero's screen shows 1ST, while every kid keeps facing their own screen.
 * The lab opens out of the hero's screen. To leave, the bell over the door rings and the door opens onto the snow.
 * Needs: gsap, Pixel, Draw, Scenes, Props
 */
(function () {
  'use strict';

  const { W, H, GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { person } = Props;
  const { rect, text, puff, outline, bevel, shadow, vdither, darker, lighter, blink } = Draw;

  const COMPUTERS = [30, 52, 74, 96, 118];
  const HERO = 3;
  const KIDS = [0, 1, 2, 4];
  const SHIRTS = ['#3a7f8c', '#e0a46f', '#6b8f3a', '#3b5fb3'];
  const SPEEDS = [0.62, 0.78, 0.7, 1, 0.66];
  const SNOW = Array.from({ length: 12 }, (_, i) => ({ x: 102 + ((i * 37) % 20), y: (i * 13) % 16 }));
  const DOOR_SNOW = Array.from({ length: 22 }, (_, i) => ({ x: 140 + ((i * 7) % 17), y: (i * 11) % 42 }));
  const WOOD = '#a96b3e', WOOD_DARK = '#7a4a2a', WOOD_LIGHT = '#c98a58';
  const BEIGE = '#ddd2b4', BEIGE_LIGHT = '#f3ecd6', BEIGE_SHADE = '#b8ab88';
  const SCREEN_OFF = ['#34466e', '#1c2740'];
  const SCREEN_ON = ['#3b55b8', '#22338a'];

  function snow(ctx, t) {
    SNOW.forEach((f, i) => {
      const y = 5 + ((f.y + t * 5) % 17);
      rect(ctx, '#ffffff', f.x + Math.round(Math.sin(t + i)), y, 1, 1);
    });
  }

  // The bell over the door; it swings while it rings.
  function bell(ctx, ring) {
    const swing = ring > 0 && ring < 1 ? (Math.floor(ring * 10) % 2 ? 1 : -1) : 0;
    rect(ctx, N.o, 145, 11, 6, 1);
    rect(ctx, N.o, 145 + swing, 12, 6, 4);
    rect(ctx, '#e0c24a', 146 + swing, 13, 4, 2);
    rect(ctx, '#f6e392', 146 + swing, 13, 4, 1);
    rect(ctx, N.o, 147 + swing, 16, 2, 1);
    if (swing) {
      rect(ctx, N.o, 142, 12, 1, 3);
      rect(ctx, N.o, 153, 12, 1, 3);
      rect(ctx, N.o, 140, 11, 1, 5);
      rect(ctx, N.o, 155, 11, 1, 5);
    }
  }

  // The doorway once the door swings open: a snowy schoolyard with snow falling past.
  function outside(ctx, open, t) {
    if (open <= 0) return;
    vdither(ctx, '#b4cadb', '#e4edf5', 139, 21, 19, 12, 4);
    rect(ctx, '#dfe9f2', 139, 21, 19, 12);
    rect(ctx, '#9fb3c4', 139, 44, 19, 4);
    rect(ctx, '#c3d3df', 139, 44, 19, 1);
    rect(ctx, '#f6f4ef', 139, 48, 19, GROUND - 48);
    rect(ctx, '#e3e8ef', 139, 52, 19, 1);
    rect(ctx, '#5f5b6b', 150, 34, 1, 10);
    rect(ctx, '#5f5b6b', 148, 37, 2, 1);
    rect(ctx, '#5f5b6b', 151, 39, 3, 1);
    DOOR_SNOW.forEach((f, i) => {
      const y = 21 + ((f.y + t * 9) % 43);
      rect(ctx, '#ffffff', f.x + Math.round(Math.sin(t * 2 + i)), y, 1, 1);
    });
    // The door, swung in against the wall on its hinge side.
    const left = Math.round(19 - 16 * Math.min(1, open));
    vdither(ctx, '#a2683c', '#7a4a2a', 139, 21, left, GROUND - 21, 3);
    rect(ctx, '#6b4226', 139 + left - 1, 21, 1, GROUND - 21);
    rect(ctx, '#c98a58', 139, 21, 1, GROUND - 21);
  }

  Scenes.add('computer-lab', {
    heroX: COMPUTERS[HERO] - 8,
    // The lab opens out of the hero's own screen, and the camera leaves through the open door into the snow.
    enter: { x: COMPUTERS[HERO], y: 35, zoom: 12 },
    door: { x: 148, y: 42, zoom: 9 },
    draw(ctx, c) {
      vdither(ctx, '#f1f5ee', '#d3dbd0', 0, 0, W, 36, 4);
      vdither(ctx, '#d3dbd0', '#c6cec2', 0, 36, W, GROUND - 36, 3);
      rect(ctx, '#f7faf4', 0, 36, W, 1);
      rect(ctx, '#b4bcb0', 0, 37, W, 1);
      rect(ctx, '#c8ccd1', 0, GROUND, W, H - GROUND);
      for (let y = GROUND; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) rect(ctx, '#b9bec4', x, y, 4, 4);
      for (let y = GROUND; y < H; y += 4) for (let x = (y / 4) % 2 ? 4 : 0; x < W; x += 8) rect(ctx, '#d9dee3', x, y, 1, 1);
      rect(ctx, '#e8ecef', 0, GROUND, W, 1);

      // The chalkboard in a wooden frame, with TYPING and WPM on it.
      rect(ctx, WOOD, 4, 4, 48, 26);
      bevel(ctx, WOOD_LIGHT, darker(WOOD, 0.35), 4, 4, 48, 26);
      vdither(ctx, '#3a6e56', '#264a3a', 6, 6, 44, 22, 4);
      rect(ctx, '#4f8268', 40, 9, 8, 1);
      rect(ctx, '#4f8268', 42, 20, 6, 1);
      text(ctx, 'TYPING', 9, 8, '#e9efe6');
      text(ctx, 'WPM', 9, 15, '#b9cfc2');

      // The round clock; its hands sit at ten past ten.
      puff(ctx, 62, 14, 6, N.o);
      puff(ctx, 62, 14, 5, N.w);
      puff(ctx, 61, 12, 2, '#fbfcf8');
      rect(ctx, '#c9cdc4', 62, 20, 1, 1);
      rect(ctx, N.o, 62, 10, 1, 5);
      rect(ctx, N.o, 62, 14, 3, 1);

      // The HOME ROW poster.
      outline(ctx, 74, 4, 20, 22, N.o);
      vdither(ctx, '#fbf9f2', '#ebe6d6', 75, 5, 18, 20, 3);
      text(ctx, 'HOME', 77, 8, '#2f5a46');
      text(ctx, 'ROW', 80, 14, '#2f5a46');
      [77, 81, 85, 89].forEach(x => {
        rect(ctx, c.base, x, 20, 3, 3);
        rect(ctx, lighter(c.base, 0.4), x, 20, 3, 1);
        rect(ctx, darker(c.base, 0.3), x + 2, 21, 1, 2);
      });

      // The snowy window and its sill, with the sky shaded from light at the top.
      vdither(ctx, '#e6f4fc', '#aed3e8', 101, 5, 23, 17, 4);
      rect(ctx, '#ffffff', 104, 8, 4, 1);
      rect(ctx, '#f6f4ef', 101, 21, 23, 4);
      rect(ctx, '#ffffff', 101, 21, 23, 1);
      outline(ctx, 100, 4, 25, 22, '#6b4226');
      rect(ctx, '#a96b3e', 98, 26, 29, 2);
      rect(ctx, '#c98a58', 98, 26, 29, 1);
      shadow(ctx, '#8c6a4e', 98, 26, 29, 2);

      // The door on the right; its bell is drawn with the moving parts.
      rect(ctx, N.o, 138, 20, 21, GROUND - 20);
      vdither(ctx, '#a2683c', '#7a4a2a', 139, 21, 19, GROUND - 21, 3);
      rect(ctx, '#c98a58', 139, 21, 1, GROUND - 21);
      outline(ctx, 141, 24, 15, 18, '#a96b3e');
      outline(ctx, 141, 44, 15, 18, '#a96b3e');
      rect(ctx, '#c98a58', 142, 25, 13, 1);
      rect(ctx, '#c98a58', 142, 45, 13, 1);
      rect(ctx, N.m, 152, 42, 2, 2);
      rect(ctx, '#f6e392', 152, 42, 1, 1);

      // A long desk with five beige computers, and stools in front of the four kids.
      rect(ctx, WOOD, 20, 46, 108, 3);
      rect(ctx, WOOD_LIGHT, 20, 46, 108, 1);
      rect(ctx, WOOD_DARK, 20, 49, 108, 1);
      shadow(ctx, '#8c6a4e', 20, 46, 108, 3);
      rect(ctx, WOOD_DARK, 22, 49, 2, 15);
      rect(ctx, WOOD_DARK, 124, 49, 2, 15);
      COMPUTERS.forEach(cx => {
        const left = cx - 9;
        outline(ctx, left - 1, 28, 20, 18, N.o);
        vdither(ctx, BEIGE_LIGHT, BEIGE, left, 29, 18, 14, 3);
        rect(ctx, BEIGE_LIGHT, left, 29, 18, 1);
        rect(ctx, BEIGE_SHADE, left, 41, 18, 2);
        rect(ctx, darker(BEIGE, 0.2), left + 17, 29, 1, 14);
        bevel(ctx, BEIGE_LIGHT, BEIGE_SHADE, left + 1, 30, 16, 12);
        vdither(ctx, SCREEN_OFF[0], SCREEN_OFF[1], left + 2, 31, 14, 9, 3);
        bevel(ctx, '#0f1626', '#4a5a7e', left + 2, 31, 14, 9);
        rect(ctx, N.o, cx - 1, 43, 2, 2);
        rect(ctx, BEIGE_SHADE, left + 3, 44, 12, 2);
        rect(ctx, BEIGE_LIGHT, left + 3, 44, 12, 1);
      });
      KIDS.forEach(k => {
        const cx = COMPUTERS[k];
        rect(ctx, '#c94f3a', cx - 6, 54, 12, 2);
        rect(ctx, '#e27563', cx - 6, 54, 12, 1);
        outline(ctx, cx - 6, 54, 12, 2, N.o);
        rect(ctx, WOOD_DARK, cx - 5, 56, 1, 8);
        rect(ctx, WOOD_DARK, cx + 4, 56, 1, 8);
        rect(ctx, '#3a2818', cx - 5, 64, 2, 1);
        rect(ctx, '#3a2818', cx + 3, 64, 2, 1);
      });
      person(ctx, 0, GROUND, c, 2);
    },
    init: () => ({ screens: 0, race: 0, star: 0, bell: 0, door: 0 }),
    frame(ctx, c, s, t) {
      bell(ctx, s.bell);
      outside(ctx, s.door, t);

      const lit = Math.round(Math.max(0, Math.min(1, s.screens)) * 5);
      COMPUTERS.forEach((cx, k) => {
        if (k >= lit) return;
        const left = cx - 9;
        vdither(ctx, SCREEN_ON[0], SCREEN_ON[1], left + 2, 31, 14, 9, 3);
        bevel(ctx, '#0f1626', '#7d95e0', left + 2, 31, 14, 9);
        const speed = SPEEDS[k];
        const hero = k === HERO;
        [0, 1, 2].forEach(lane => {
          const len = Math.round(Math.min(1, s.race * (lane === 0 ? speed : speed * (0.7 + lane * 0.1))) * 12);
          if (len > 0) rect(ctx, lane === 0 ? (hero ? c.light : N.w) : '#8fa8ff', left + 3, 37 + lane, len, 1);
        });
        const wpm = Math.round(s.race * speed * 62);
        if (hero && s.star > 0.5) text(ctx, '1ST', left + 3, 31, c.light);
        else if (wpm > 0) text(ctx, String(wpm), left + 3, 31, '#f6f4ef');
        if (hero && s.race > 0 && s.race < 1 && blink(t, 4)) rect(ctx, N.w, left + 3 + Math.round(Math.min(1, s.race * speed) * 12), 37, 1, 1);
      });

      KIDS.forEach((k, i) => {
        const cx = COMPUTERS[k];
        const shirt = SHIRTS[i];
        const bob = Math.round(Math.sin(t * 9 + k * 1.7));
        rect(ctx, shirt, cx - 5, 48, 10, 8);
        rect(ctx, lighter(shirt, 0.25), cx - 5, 48, 10, 1);
        rect(ctx, darker(shirt, 0.25), cx - 5, 55, 10, 1);
        puff(ctx, cx, 44, 4, '#2b1d14');
        rect(ctx, '#4a3424', cx - 2, 41, 2, 1);
        rect(ctx, shirt, cx - 7, 48, 2, 4);
        rect(ctx, shirt, cx + 5, 48, 2, 4);
        rect(ctx, '#f0c29a', cx - 7, 47 + bob, 2, 2);
        rect(ctx, '#f0c29a', cx + 5, 47 - bob, 2, 2);
      });

      if (s.star > 0.5) text(ctx, 'JOE 1ST', 9, 22, c.light);

      snow(ctx, t);
    },
    cues: {
      type: s => gsap.timeline()
        .to(s, { screens: 1, duration: 0.5, ease: 'steps(4)' })
        .to(s, { race: 1, duration: 1.7, ease: 'none' }, 0.4)
        .to(s, { star: 1, duration: 0.01 }, 2.1),
      // Played as the hero leaves: the bell rings, then the door swings open onto the snow.
      leave: s => gsap.timeline()
        .to(s, { bell: 1, duration: 0.45, ease: 'none' })
        .to(s, { door: 1, duration: 0.15, ease: 'steps(3)' }),
    },
  });
})();
