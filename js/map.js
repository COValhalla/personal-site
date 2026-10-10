/*
 * The world map on the character sheet, in place of a skill tree.
 *
 * One road runs through a stop for every act, each with a landmark drawn from
 * its scene: the start gate, the hammer cage, the plant, a mountain, the
 * library and a laptop with a flag. The hero stands beside the furthest stop
 * reached. Select a stop and the hero walks the road to it, and the line
 * under the map shows that act's class and skills with a way to go there.
 * Stops not reached yet are gray.
 */
(function () {
  'use strict';

  const { el, colorVars } = Sheet;
  const W = 320;
  const H = 120;
  const SPEED = 70; // the hero's walking speed, map pixels a second
  const N = () => Pixel.NEUTRALS;

  let box;
  let canvas;
  let ctx;
  let info;
  let buttons = [];
  let raf = 0;
  let last = 0;
  const walk = { at: 0, to: 0, selected: 0, t: 0 };

  const reached = i => Story.state.unlocked.has(i);
  const furthest = () => Math.max(0, ...Story.state.unlocked);

  // Stops zigzag along the map, low then high.
  function stops() {
    const n = Story.acts.length;
    return Story.acts.map((act, k) => ({ x: Math.round(30 + (k * (W - 60)) / Math.max(1, n - 1)), y: k % 2 ? 54 : 88 }));
  }

  // A position along the road: stop index plus a fraction toward the next stop.
  function along(u) {
    const s = stops();
    const k = Math.max(0, Math.min(s.length - 1, Math.floor(u)));
    const f = Math.min(1, u - k);
    const a = s[k];
    const b = s[Math.min(s.length - 1, k + 1)];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  // ---------- Drawing ----------

  const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const ramp = i => (reached(i) ? Story.acts[i].color : Pixel.GRAY);

  function ground() {
    rect('#79c06a', 0, 0, W, H);
    const r = Scenes.rng(5);
    for (let k = 0; k < 160; k++) rect(r() < 0.5 ? '#8bcf7a' : '#6aae5c', r() * W, r() * (H - 14), 1, 1);
    rect('#6fb3e8', 0, H - 12, W, 12);
    for (let x = 2; x < W; x += 8) rect('#d6ecff', x, H - 8, 4, 1);
    // The road: a dirt path two pixels wide, with a lighter edge.
    const s = stops();
    for (let k = 0; k + 1 < s.length; k++) {
      const steps = Math.ceil(Math.hypot(s[k + 1].x - s[k].x, s[k + 1].y - s[k].y));
      for (let j = 0; j <= steps; j++) {
        const x = s[k].x + ((s[k + 1].x - s[k].x) * j) / steps;
        const y = s[k].y + ((s[k + 1].y - s[k].y) * j) / steps;
        rect('#d9b27c', x - 1, y - 1, 3, 3);
        if (j % 4 === 0) rect('#f0d3a3', x, y - 1, 1, 1);
      }
    }
  }

  // Each act's landmark, sitting on its stop at (x, y).
  const LANDMARKS = {
    'bmx-track': (x, y, c) => {
      for (let i = 0; i < 18; i++) rect('#c98a55', x - 10 + i, y - 6 + Math.floor(i / 3), 1, 6 - Math.floor(i / 3));
      rect(N().o, x - 6, y - 22, 1, 16);
      rect(c.base, x - 9, y - 23, 10, 3);
    },
    track: (x, y, c) => {
      rect(c.base, x - 10, y - 6, 20, 3);
      rect(N().w, x - 10, y - 5, 20, 1);
      for (let a = 0.5; a < Math.PI - 0.5; a += 0.12) rect('#8b8696', x + Math.cos(a) * 7, y - 9 - Math.sin(a) * 7, 1, 1);
      rect('#8b8696', x - 6, y - 12, 1, 6);
      rect('#8b8696', x + 6, y - 12, 1, 6);
    },
    plant: (x, y, c) => {
      rect(c.base, x - 9, y - 16, 16, 12);
      rect(c.shade, x - 9, y - 5, 16, 1);
      rect(N().w, x - 7, y - 13, 3, 3);
      rect(N().w, x - 2, y - 13, 3, 3);
      rect(N().o, x + 3, y - 24, 3, 8);
      rect('#d3cec6', x + 4, y - 28, 2, 2);
    },
    mountains: (x, y, c) => {
      for (let j = 0; j < 18; j++) rect(j < 4 ? N().w : j % 5 === 4 ? c.shade : c.base, x - Math.floor(j / 2), y - 22 + j, Math.floor(j / 2) * 2 + 1, 1);
    },
    library: (x, y, c) => {
      rect(c.base, x - 10, y - 18, 20, 3);
      rect('#f3ead6', x - 9, y - 15, 18, 10);
      for (let i = 0; i < 4; i++) rect(c.shade, x - 7 + i * 4, y - 14, 1, 8);
    },
    studio: (x, y, c) => {
      rect(N().o, x - 9, y - 6, 18, 2);
      rect(N().o, x - 7, y - 16, 14, 10);
      rect(c.light, x - 6, y - 15, 12, 8);
      rect(N().o, x + 6, y - 28, 1, 22);
      rect(c.base, x + 7, y - 28, 6, 4);
    },
  };

  function drawStop(i, p) {
    const c = ramp(i);
    const selected = walk.selected === i;
    // A pad in the act's color.
    for (let j = -3; j <= 3; j++) {
      const w = Math.round(Math.sqrt(1 - (j / 4) ** 2) * 10);
      rect(j < 0 ? c.light : j > 1 ? c.shade : c.base, p.x - w, p.y + j, w * 2, 1);
    }
    if (selected) for (let a = 0; a < Math.PI * 2; a += 0.22) rect('#ffffff', p.x + Math.cos(a) * 13, p.y + Math.sin(a) * 6, 1, 1);
    (LANDMARKS[Story.acts[i].scene] || LANDMARKS.studio)(p.x, p.y - 2, c);
    const label = Story.acts[i].numeral;
    Pixel.text(ctx, label, Math.round(p.x - (label.length * 4 - 1) / 2), p.y + 6, reached(i) ? N().o : '#4a6b45', 1);
  }

  function drawHero(t) {
    const p = along(walk.at);
    const act = Story.acts[furthest()];
    const on = Story.state.unlocked.size > 0;
    const grid = Pixel.heroGrid(on ? act.hero.gear : 'none', on ? Acts.styleOf(act) : undefined);
    const moving = walk.at !== walk.to;
    const bob = Math.floor(t * (moving ? 8 : 1.4)) % 2;
    const left = walk.to < walk.at;
    // Beside the stop, a little to its left, feet on the road.
    Pixel.paint(ctx, grid, on ? act.color : Pixel.GRAY, Math.round(p.x - 22), Math.round(p.y - 22 - bob), 1, left);
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    ground();
    stops().forEach((p, i) => drawStop(i, p));
    drawHero(t);
  }

  // ---------- The line under the map ----------

  function describe(i) {
    const act = Story.acts[i];
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    if (!reached(i)) {
      info.replaceChildren(el('b', { text: `${Story.name(act)} · ${act.title}` }), '. Not reached yet: keep scrolling to get here.');
      return;
    }
    const skills = act.skills.map(s => s.name).join(', ');
    info.replaceChildren(
      el('b', { text: `${Story.name(act)} · ${act.title} · ${act.hero.title}` }),
      `. Skills: ${skills}. `,
      el('a', { class: 'map-go', href: `#act-${act.id}`, onclick: e => { e.preventDefault(); go(act); } }, `Go to ${Story.name(act)} ▸`));
  }

  function go(act) {
    document.getElementById('sheet').close();
    document.getElementById(`act-${act.id}`).scrollIntoView({ behavior: 'instant' });
  }

  function select(i) {
    walk.selected = i;
    walk.to = i;
    describe(i);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) walk.at = i;
  }

  // ---------- Building and running ----------

  function build() {
    canvas = el('canvas', { class: 'px map-canvas', width: W, height: H, role: 'img', 'aria-label': 'World map: one road through every act, your character at the furthest stop reached' });
    ctx = canvas.getContext('2d');
    buttons = Story.acts.map((act, i) => el('button', { class: 'map-stop', style: colorVars(act), 'data-stop': String(i), 'aria-pressed': 'false', 'aria-label': `${Story.name(act)}: ${act.title}`, onclick: () => select(i) }, act.numeral));
    info = el('p', { class: 'map-info', 'aria-live': 'polite' });
    canvas.addEventListener('click', e => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const s = stops();
      let best = 0;
      s.forEach((p, k) => { if (Math.abs(p.x - x) < Math.abs(s[best].x - x)) best = k; });
      select(best);
    });
    box = el('div', { class: 'map' }, canvas, el('div', { class: 'map-stops', role: 'group', 'aria-label': 'Stops on the map' }, buttons), info);
    return box;
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (walk.at !== walk.to) {
      // Walk the road at a steady pace, stop by stop.
      const s = stops();
      const k = Math.floor(walk.at + (walk.to > walk.at ? 0 : -1e-9));
      const seg = s[Math.max(0, Math.min(s.length - 2, k))];
      const nxt = s[Math.max(0, Math.min(s.length - 1, k + 1))];
      const len = Math.max(1, Math.hypot(nxt.x - seg.x, nxt.y - seg.y));
      const step = (SPEED * dt) / len;
      walk.at = walk.to > walk.at ? Math.min(walk.to, walk.at + step) : Math.max(walk.to, walk.at - step);
    }
    walk.t += dt;
    box.dataset.at = walk.at.toFixed(2);
    render(walk.t);
    raf = requestAnimationFrame(tick);
  }

  // Each time the map opens, the hero starts at the furthest stop reached.
  function show() {
    stop();
    walk.at = furthest();
    select(walk.at);
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  window.WorldMap = { build, show, stop, select };
})();
