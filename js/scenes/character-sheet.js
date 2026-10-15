/*
 * The character screen each act levels up to: its class, the items it earned
 * dropping into rows, and the skills it grew. Registered as "sheet", a scene made
 * for each act.
 * Needs: gsap, Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { W, H } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rect, text, outline } = Draw;

  Scenes.add('sheet', act => {
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
  });
})();
