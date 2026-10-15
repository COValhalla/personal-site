/*
 * The hammer throw in Act III: a top-down view of the throwing circle and the
 * sector. MODES below holds the throw's turns, scale and words.
 *
 * Hold to start: one wind, then the turns. Every turn is faster than the last,
 * and the last ones are much faster. The hammer glows as it passes the front of
 * the circle. Let go while it glows to throw. The hammer gets four turns: hold
 * on past the last and you spin out of the circle. Let go during the wind, or
 * away from the glow, and it is a foul. Three attempts; your best fair mark counts.
 *
 * A fair release on a fast turn hits: the picture freezes for a moment, shakes
 * and flashes, and a phone buzzes where it can. A throw of the mode's
 * cameraFrom or more cuts to a side-on camera in slow motion that follows the
 * throw out, then cuts back to the mark. A tap skips it. Marks are in meters.
 */
(function () {
  'use strict';

  const W = 200;
  const H = 150;
  const C = { x: 100, y: 134 };
  const SECTOR = (34.92 / 2) * Math.PI / 180;
  const LINE = 0.05; // a release this far past the sector line still lands on it
  const WIND_SPEED = 3.6; // radians per second
  // The glow is never shorter than this, however fast the throw spins.
  const MIN_WINDOW = 0.1; // seconds
  const ATTEMPTS = 3;
  // The hit on a good release: a freeze, then a shake and a flash.
  const FREEZE = { fair: 0.08, perfect: 0.11 };
  // The camera runs slow at first, then follows the throw at full speed.
  const CAM = { slow: 0.3, slowFor: 0.55, flight: 2.0, after: 0.9 };
  const GOLD = '#ffd56b';
  const TAU = Math.PI * 2;

  const MODES = {
    hammer: {
      title: 'Hammer throw',
      help: 'Hold to wind up and spin. You get four turns, and the last two are fast. Let go while the hammer glows to land it in the sector. Hold past the fourth turn and it is a foul. A big throw plays the throw camera; tap to skip it.',
      thing: 'hammer',
      turnSpeed: [4.4, 5.2, 7.2, 9.2],
      fastFrom: 3, // a fair release from this turn on hits
      words: { turns: 'four', Turns: 'Four', over: 'fifth' },
      orbit: 9, // the hammer's path around the thrower: on the field
      reach: 22, // and in the close-up
      unit: 'm',
      decimals: 2,
      pxPerUnit: 1.45,
      rings: [20, 40, 60, 80],
      best: 78, // a centered release on a clean last turn
      cap: 79,
      cameraFrom: 70,
      // The throw camera's scale, its ticks, boards and light poles, and how high the throw flies.
      cam: { pxPerUnit: 3, tick: 10, board: 20, pole: 30, peak: 46 },
      landed: (mark, d, turn, last) => ({
        sub: turn < last ? `TURN ${turn}: WAIT FOR TURN ${last}` : 'ALL FOUR TURNS',
        say: d > 70 ? `${mark} m. A big one.` : d > 50 ? `${mark} m. Nice throw.` : `${mark} m. Hold on for more turns to throw further.`,
      }),
      final: mark => ({ say: `Final: your best mark is ${mark} m.` }),
    },
  };

  // The speed a clean last turn actually reaches at the middle of the glow:
  // the spin eases toward each turn's pace, so it never quite gets there.
  // Distance scales to this, so a centered last-turn release makes the mode's best.
  function reachOf(mode) {
    const turns = mode.turnSpeed.length;
    let theta = Math.PI;
    let omega = 2;
    let spun = 0;
    let turn = 0;
    const dt = 1 / 120;
    for (let i = 0; i < 6000; i++) {
      const target = turn === 0 ? WIND_SPEED : mode.turnSpeed[turn - 1];
      omega += (target - omega) * Math.min(1, dt * 4);
      const before = Math.atan2(Math.sin(theta), Math.cos(theta));
      theta -= omega * dt;
      spun += omega * dt;
      const after = Math.atan2(Math.sin(theta), Math.cos(theta));
      if (turn === turns && before >= 0 && after < 0) return omega;
      if (spun >= TAU) { spun -= TAU; turn += 1; }
    }
    return mode.turnSpeed[turns - 1];
  }

  function mount(stage, ramp, name) {
    const mode = MODES[name];
    const TURNS = mode.turnSpeed.length;
    const TURN_SPEED = mode.turnSpeed;
    const REACH = reachOf(mode);
    const ORBIT = mode.orbit;
    const PX = mode.pxPerUnit;
    const UNIT = mode.unit.toUpperCase();
    const READY = `Hold to wind up. ${mode.words.Turns} turns, then let go while the ${mode.thing} glows.`;
    const canvas = Sheet.el('canvas', { class: 'game-canvas px', width: W, height: H, role: 'img', 'aria-label': `${mode.title} field seen from above` });
    const cells = Array.from({ length: ATTEMPTS }, (_, k) => Sheet.el('div', {}, Sheet.el('span', { text: `Throw ${k + 1}` }), Sheet.el('b', { class: 'sb-throw', text: '--' })));
    const board = Sheet.el('div', { class: 'scoreboard', style: `grid-template-columns:repeat(${ATTEMPTS + 1},1fr)`, 'aria-live': 'polite' },
      cells, Sheet.el('div', {}, Sheet.el('span', { text: 'Best' }), Sheet.el('b', { class: 'sb-best', text: '--' })));
    const msg = Sheet.el('p', { class: 'game-msg', 'aria-live': 'polite', text: READY });
    const hold = Sheet.el('button', { class: 'btn btn--accent hold' }, 'Hold to spin ', Sheet.el('kbd', { text: 'Space' }));
    const again = Sheet.el('button', { class: 'btn', hidden: '' }, 'Throw again');
    stage.append(canvas, board, msg, Sheet.el('div', { class: 'game-actions' }, hold, again));

    const ctx = canvas.getContext('2d');
    const N = Pixel.NEUTRALS;
    const s = { phase: 'ready', attempt: 1, best: null, marks: [], results: [], t: 0, freeze: 0, shake: 0, flash: 0 };
    let raf = 0;
    let last = performance.now();
    let holding = false;

    function setPhase(phase) { s.phase = phase; stage.dataset.state = phase; }

    function resetThrow() {
      Object.assign(s, { theta: Math.PI, omega: 0, spun: 0, turn: 0, trail: [], flight: null, flag: null, cam: null });
      stage.dataset.turn = '0';
      setPhase('ready');
    }

    const px = (x, y, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
    const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const say = (text, x, y, color, scale) => Pixel.text(ctx, text, Math.round(x), Math.round(y), color, scale || 1);
    const sayCenter = (text, y, color, scale) => say(text, W / 2 - ((String(text).length * 4 - 1) * (scale || 1)) / 2, y, color, scale);
    function line(x0, y0, x1, y1, color, dotted) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      let i = 0;
      for (;;) {
        if (!dotted || i % 2 === 0) px(x0, y0, color);
        i++;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    function disc(x, y, r, color) {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r) px(x + i, y + j, color);
    }

    // How far off straight up the sector the hammer would fly if let go at angle theta.
    const offAxis = theta => Math.atan2(Math.sin(theta), Math.cos(theta));
    // Half the glow, in radians: the sector, or wider on a fast turn so it lasts MIN_WINDOW.
    const zone = () => Math.max(SECTOR, (s.omega * MIN_WINDOW) / 2);
    const glowing = () => s.phase === 'turns' && Math.abs(offAxis(s.theta)) <= zone();
    const fast = () => s.phase === 'turns' && s.turn >= mode.fastFrom;

    // ---------- Drawing ----------

    function drawField() {
      for (let y = 0; y < H; y++) { ctx.fillStyle = Math.floor(y / 6) % 2 ? '#2b4a36' : '#2f5039'; ctx.fillRect(0, y, W, 1); }
      [-SECTOR, SECTOR].forEach(a => line(C.x, C.y, C.x + Math.sin(a) * 170, C.y - Math.cos(a) * 170, '#e8e4dc', true));
      mode.rings.forEach(m => {
        const r = m * PX;
        for (let a = -SECTOR; a <= SECTOR; a += 0.6 / r) px(C.x + Math.sin(a) * r, C.y - Math.cos(a) * r, ramp.light);
        Pixel.digits(ctx, m, Math.round(C.x + Math.sin(SECTOR) * r) + 3, Math.round(C.y - Math.cos(SECTOR) * r) - 2, '#a9bfae', 1);
      });
      // The cage, open toward the sector.
      for (let a = 0; a < TAU; a += 0.05) {
        const off = Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2)));
        if (off < 0.55) continue;
        px(C.x + Math.cos(a) * 15, C.y - Math.sin(a) * 15, '#8b8696');
        if (Math.floor(a * 20) % 3 === 0) px(C.x + Math.cos(a) * 16, C.y - Math.sin(a) * 16, '#5d5966');
      }
      for (let a = 0; a < TAU; a += 0.15) px(C.x + Math.cos(a) * 4, C.y + Math.sin(a) * 4, '#f6f4ef');
      // Earlier marks: a pin for a fair throw, a cross for a foul.
      s.marks.forEach(m => {
        if (m.foul) { line(m.x - 1, m.y - 1, m.x + 1, m.y + 1, '#e0533d'); line(m.x - 1, m.y + 1, m.x + 1, m.y - 1, '#e0533d'); return; }
        px(m.x, m.y, '#f6f4ef'); px(m.x, m.y - 1, '#f6f4ef'); px(m.x, m.y - 2, '#f6f4ef');
        px(m.x + 1, m.y - 2, ramp.base); px(m.x + 2, m.y - 2, ramp.base); px(m.x + 1, m.y - 1, ramp.base);
      });
    }

    function drawThrower() {
      const spinning = s.phase === 'wind' || s.phase === 'turns';
      const theta = s.theta;
      // The glow zone on the orbit, lit while turning.
      if (spinning || s.phase === 'ready') {
        const half = s.phase === 'turns' ? zone() : SECTOR;
        for (let a = -Math.PI; a < Math.PI; a += 0.12) {
          const inZ = Math.abs(a) <= half;
          px(C.x + Math.cos(a) * ORBIT, C.y + Math.sin(a) * ORBIT, inZ ? (s.phase === 'turns' ? ramp.light : '#6f8a76') : '#3e5a47');
        }
      }
      // A fading trail behind the hammer.
      s.trail.forEach((p, k) => { ctx.globalAlpha = (k + 1) / (s.trail.length + 2) * 0.7; px(p[0], p[1], ramp.light); });
      ctx.globalAlpha = 1;
      const bx = C.x + Math.cos(theta) * ORBIT;
      const by = C.y + Math.sin(theta) * ORBIT;
      if (s.phase !== 'flying' && s.phase !== 'landed' && s.phase !== 'done') {
        line(C.x, C.y, bx, by, '#c3c6cc');
        disc(bx, by, 1, N.o);
        const glow = glowing();
        px(bx, by, glow ? '#ffffff' : ramp.base);
        if (glow) { px(bx - 2, by, ramp.light); px(bx + 2, by, ramp.light); px(bx, by - 2, ramp.light); px(bx, by + 2, ramp.light); }
      }
      // The thrower from above: shoulders square to the wire, head in the middle.
      const sx = Math.cos(theta + Math.PI / 2) * 3;
      const sy = Math.sin(theta + Math.PI / 2) * 3;
      line(C.x - sx, C.y - sy, C.x + sx, C.y + sy, ramp.base);
      line(C.x - sx * 0.6 + Math.cos(theta), C.y - sy * 0.6 + Math.sin(theta), C.x + sx * 0.6 + Math.cos(theta), C.y + sy * 0.6 + Math.sin(theta), ramp.shade);
      disc(C.x, C.y, 1, N.h);
      px(C.x + Math.cos(theta), C.y + Math.sin(theta), N.s);
    }

    function drawFlight(f) {
      const t = Math.min(1, f.t / f.dur);
      const x = f.x0 + (f.x1 - f.x0) * t;
      const y = f.y0 + (f.y1 - f.y0) * t;
      const lift = Math.sin(Math.PI * t) * f.peak;
      px(x, y, '#18261c'); px(x + 1, y, '#18261c');
      disc(x, y - lift, 1, N.o);
      px(x, y - lift, ramp.base);
      if (t >= 1) {
        const k = Math.min(1, (f.t - f.dur) / 0.5);
        if (k < 1) for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; px(x + Math.cos(a) * (2 + k * 4), y + Math.sin(a) * (1 + k * 2), '#b9a98a'); }
      }
    }

    // An official beside the cage raises a white flag for a fair throw, a red one for a foul.
    function drawOfficial() {
      const x = C.x + 26;
      const y = C.y - 8;
      rect(N.o, x, y, 3, 3);
      rect('#f0c29a', x + 1, y - 2, 1, 2);
      if (s.flag) {
        rect(N.o, x + 3, y - 7, 1, 7);
        rect(s.flag === 'fair' ? N.w : '#e0533d', x + 4, y - 7, 4, 3);
      }
    }

    // A close-up of the circle in the corner, big enough to time the release.
    function drawCloseUp() {
      const cx = 36;
      const cy = 114;
      const R = mode.reach;
      rect(N.o, 3, 81, 67, 67);
      rect('#1f3326', 4, 82, 65, 65);
      say('CIRCLE', 6, 84, '#a9bfae');
      for (let a = 0; a < TAU; a += 0.06) px(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, '#f6f4ef');
      // The glow zone on the hammer's path, and the sector lines leaving it.
      const lit = s.phase === 'turns';
      const half = lit ? zone() : SECTOR;
      for (let a = -Math.PI; a < Math.PI; a += 0.03) {
        const inZ = Math.abs(a) <= half;
        if (!inZ && Math.floor(a * 30) % 3) continue;
        px(cx + Math.cos(a) * R, cy + Math.sin(a) * R, inZ ? (lit ? ramp.light : '#6f8a76') : '#3e5a47');
        if (inZ && lit) px(cx + Math.cos(a) * (R + 1), cy + Math.sin(a) * (R + 1), ramp.base);
      }
      const spinning = s.phase === 'wind' || s.phase === 'turns';
      const theta = s.theta;
      if (spinning) s.trail.forEach((p, k) => {
        const a = Math.atan2(p[1] - C.y, p[0] - C.x);
        ctx.globalAlpha = ((k + 1) / (s.trail.length + 2)) * 0.8;
        disc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 1, ramp.light);
      });
      ctx.globalAlpha = 1;
      // Speed lines around the circle on the fast turns.
      if (fast()) {
        const r = Scenes.rng(Math.floor(s.t * 24));
        for (let k = 0; k < 6; k++) {
          const a = r() * TAU;
          const r0 = R + 4 + r() * 6;
          for (let j = 0; j < 4; j++) px(cx + Math.cos(a - j * 0.06) * r0, cy + Math.sin(a - j * 0.06) * r0, '#ffffff');
        }
      }
      const hx = cx + Math.cos(theta) * 4;
      const hy = cy + Math.sin(theta) * 4;
      const holdingHammer = s.phase !== 'flying' && s.phase !== 'landed' && s.phase !== 'done';
      const ux = Math.cos(theta + Math.PI / 2);
      const uy = Math.sin(theta + Math.PI / 2);
      if (holdingHammer) {
        const bx = cx + Math.cos(theta) * R;
        const by = cy + Math.sin(theta) * R;
        // The hammer hangs from both hands on its wire.
        line(hx, hy, bx, by, '#c3c6cc');
        disc(bx, by, 2, N.o);
        const glow = glowing();
        disc(bx, by, 1, glow ? '#ffffff' : ramp.base);
        if (glow) [[-4, 0], [4, 0], [0, -4], [0, 4]].forEach(([dx, dy]) => px(bx + dx, by + dy, '#ffffff'));
      }
      // The thrower from above: shoulders, arms to the handle, head.
      for (let k = -1; k <= 0; k++) line(cx - ux * 5 + Math.cos(theta) * k, cy - uy * 5 + Math.sin(theta) * k, cx + ux * 5 + Math.cos(theta) * k, cy + uy * 5 + Math.sin(theta) * k, ramp.base);
      line(cx - ux * 4, cy - uy * 4, hx, hy, N.s);
      line(cx + ux * 4, cy + uy * 4, hx, hy, N.s);
      disc(cx - Math.cos(theta), cy - Math.sin(theta), 2, N.h);
    }

    function drawHud() {
      // Wind, then four turn lights.
      say(s.phase === 'wind' ? 'WIND' : 'TURN', 4, 4, s.phase === 'wind' ? ramp.light : N.w);
      for (let k = 0; k < TURNS; k++) {
        const on = s.turn > k;
        const now = s.phase === 'turns' && s.turn === k + 1;
        // The light for a fast turn blinks.
        const blink = now && s.turn >= mode.fastFrom && Math.floor(s.t * 10) % 2;
        rect(N.o, 22 + k * 7, 3, 6, 7);
        rect(now ? (blink ? N.w : ramp.light) : on ? ramp.base : '#3e5a47', 23 + k * 7, 4, 4, 5);
      }
      say(`ATTEMPT ${s.attempt}/${ATTEMPTS}`, W - 66, 4, '#a9bfae');
      if (s.phase === 'ready' && !s.banner) {
        rect('rgba(20,26,22,0.85)', W / 2 - 34, 40, 68, 16);
        sayCenter('HOLD TO SPIN', 46, N.w, 1);
      }
      if (s.bannerT <= 0) s.banner = null;
      if (s.banner) {
        const w = s.banner.text.length * 8 - 2;
        rect('rgba(20,26,22,0.85)', W / 2 - w / 2 - 5, 40, w + 10, 16);
        sayCenter(s.banner.text, 43, s.banner.color, 2);
        if (s.banner.sub) {
          const w2 = s.banner.sub.length * 4 - 1;
          rect('rgba(20,26,22,0.85)', W / 2 - w2 / 2 - 4, 57, w2 + 8, 9);
          sayCenter(s.banner.sub, 59, N.w, 1);
        }
      }
    }

    function render() {
      ctx.save();
      if (s.shake > 0 && s.freeze <= 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
      ctx.clearRect(-4, -4, W + 8, H + 8);
      if (s.phase === 'camera' && s.freeze <= 0) {
        drawCamera();
      } else {
        drawField();
        drawThrower();
        if (s.flight && s.phase !== 'camera') drawFlight(s.flight);
        drawOfficial();
        drawCloseUp();
        drawHud();
      }
      ctx.restore();
      // The flash: white over everything, with a ring out from the circle.
      if (s.flash > 0 && s.freeze <= 0) {
        const k = 1 - s.flash / 0.25;
        ctx.fillStyle = `rgba(255,255,255,${(0.7 * (1 - k)).toFixed(2)})`;
        ctx.fillRect(0, 0, W, H);
        if (s.phase !== 'camera') for (let a = 0; a < TAU; a += 0.04) px(C.x + Math.cos(a) * (10 + k * 40), C.y + Math.sin(a) * (10 + k * 40), '#ffffff');
      }
    }

    // ---------- The throw ----------

    const fmt = d => d.toFixed(mode.decimals);
    function banner(text, color, sub, seconds) { s.banner = { text, color, sub }; s.bannerT = seconds || 1.6; }

    function start() {
      if (s.phase !== 'ready') return;
      s.omega = 2;
      s.spun = 0;
      s.turn = 0;
      setPhase('wind');
      msg.textContent = 'Winding up. The turns come next.';
    }

    function foul(reason, sub) {
      Sound.play('foul');
      s.marks.push({ x: C.x + Math.cos(s.theta) * 16, y: C.y + Math.sin(s.theta) * 16, foul: true });
      record(null);
      s.flag = 'foul';
      banner('FOUL', '#f08a75', sub, 1.8);
      msg.textContent = reason;
      stage.dataset.last = 'foul';
      setPhase('landed');
      setTimeout(nextAttempt, 1700);
    }

    function release() {
      if (s.phase === 'wind') { foul(`Foul: you let go during the wind, and the ${mode.thing} went into the cage.`, 'TOO EARLY'); return; }
      if (s.phase !== 'turns') return;
      const off = offAxis(s.theta);
      if (Math.abs(off) > zone() + LINE) {
        const sub = Math.abs(off) > Math.PI / 2 ? 'INTO THE CAGE' : 'OUTSIDE THE SECTOR';
        foul(`Foul: let go while the ${mode.thing} glows. Turn ${s.turn} of ${TURNS}.`, sub);
        return;
      }
      const clamped = Math.max(-SECTOR, Math.min(SECTOR, off));
      const speed = s.omega / REACH;
      const centered = Math.min(1, Math.abs(off) / zone());
      const dist = Math.min(mode.cap, mode.best * speed * speed * (1 - 0.15 * centered ** 2));
      const bx = C.x + Math.cos(s.theta) * ORBIT;
      const by = C.y + Math.sin(s.theta) * ORBIT;
      const far = dist * PX;
      // It flies the way it was moving: off straight up by the release angle.
      const dir = { x: Math.sin(clamped), y: -Math.cos(clamped) };
      // A best throw stays up 1.37 s and lifts 17 pixels; shorter ones less.
      const k = dist / mode.best;
      s.flight = { x0: bx, y0: by, x1: C.x + dir.x * far, y1: C.y + dir.y * far, t: 0, dur: 0.5 + k * 0.8667, peak: 4 + k * 13, dist, turn: s.turn };
      Sound.play('release');
      msg.textContent = `Released on turn ${s.turn}.`;
      // A fair release on a fast turn hits: freeze, then shake and flash, and buzz a phone.
      const perfect = s.turn === TURNS && Math.abs(off) <= zone() / 2;
      if (s.turn >= mode.fastFrom) {
        s.freeze = perfect ? FREEZE.perfect : FREEZE.fair;
        // With motion turned off, the hit is the freeze and the buzz only.
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        s.shake = still ? 0 : 0.3;
        s.flash = still ? 0 : 0.25;
        try { if (navigator.vibrate) navigator.vibrate(perfect ? 45 : 25); } catch (e) { /* not allowed here */ }
        if (perfect) banner('PERFECT', '#9be36c', 'RELEASE', 0.9);
      }
      stage.dataset.hit = s.turn >= mode.fastFrom ? (perfect ? 'perfect' : 'fair') : 'none';
      if (dist >= mode.cameraFrom) {
        s.cam = { real: 0, u: 0, landed: -1, dirt: [] };
        stage.dataset.camera = 'on';
        setPhase('camera');
        msg.textContent = `Released on turn ${s.turn}. Tap to skip the throw camera.`;
      } else {
        setPhase('flying');
      }
    }

    // The throw camera ends: cut back to the top-down field, the throw landing on its mark.
    function endCamera() {
      if (s.phase !== 'camera') return;
      s.cam = null;
      stage.dataset.camera = 'done';
      s.flight.t = s.flight.dur;
      setPhase('flying');
    }

    // ---------- The throw camera: side-on, at a dusk stadium ----------

    const SKY = ['#2b2f5e', '#3d3f74', '#5a4a82', '#7c5487', '#a35f86', '#c86f7f', '#e2857c', '#f2a07a'];
    const crowd = (function () { const r = Scenes.rng(31); return Array.from({ length: 300 }, () => Math.floor(r() * 7)); })();

    function drawCamera() {
      const c = s.cam;
      const f = s.flight;
      const view = mode.cam;
      const P = view.pxPerUnit;
      const p = Math.min(1, c.u / CAM.flight);
      const xm = f.dist * p;
      const GROUND_Y = 118;
      // The height of the throw, from the hand at the start to the ground at the end.
      const heightAt = q => GROUND_Y - 14 + 14 * q - 4 * view.peak * q * (1 - q);
      const hy = heightAt(p);
      // The camera keeps the throw a third of the way in, and starts on the thrower.
      const camX = Math.max(-40, xm * P - 66);
      for (let k = 0; k < SKY.length; k++) rect(SKY[k], 0, k * 10, W, 10);
      rect('#f2a07a', 0, 80, W, 4);
      // Light poles, moving a little slower than the field.
      for (let m = 0; m <= view.pole * 4; m += view.pole) {
        const x = Math.round(m * P * 1.1 - camX * 0.9);
        if (x < -4 || x > W + 4) continue;
        rect('#3a3744', x, 22, 1, 62);
        rect('#fff3c4', x - 3, 20, 7, 2);
      }
      // Stands with the crowd, then the field.
      rect('#2a2733', 0, 84, W, 10);
      for (let x = 0; x < W; x++) {
        const wx = Math.floor(x + camX * 0.8);
        const k = crowd[((wx % 300) + 300) % 300];
        if (k < 5) rect(['#e0533d', '#f6f4ef', '#ffd56b', '#7fb0ee', '#f0c29a'][k], x, 86 + (wx % 4 === 0 ? 0 : 3), 1, 2);
      }
      rect('#f6f4ef', 0, 94, W, 1);
      for (let x = 0; x < W; x++) {
        const wx = Math.floor(x + camX);
        rect(Math.floor(wx / 12) % 2 ? '#3f8a4f' : '#378046', x, 95, 1, H - 95);
      }
      // Ticks and boards along the field.
      for (let m = view.tick; m <= view.tick * 9; m += view.tick) {
        const x = Math.round(m * P - camX);
        if (x < -10 || x > W + 10) continue;
        rect(N.w, x, GROUND_Y - 4, 1, 5);
        if (m % view.board === 0) {
          rect('#1d1b22', x - 7, 126, 15, 9);
          Pixel.text(ctx, String(m), x - Math.floor((String(m).length * 4 - 1) / 2), 128, GOLD, 1);
        }
      }
      // The thrower, in the act's look, at the front of the circle.
      const tx = Math.round(-camX - 8);
      if (tx > -20) {
        const act = Story.acts.find(a => a.game === name) || Story.acts[0];
        Pixel.paint(ctx, Pixel.heroGrid(act.hero.gear, Acts.styleOf(act)), ramp, tx, GROUND_Y - 22, 1, false);
      }
      // The hammer and its wire, with a dotted trail.
      const bx = Math.round(xm * P - camX);
      for (let k = 1; k < 10; k++) {
        const q = Math.max(0, p - k * 0.02);
        if (k % 2) px(f.dist * q * P - camX, heightAt(q), 'rgba(255,255,255,0.7)');
      }
      if (c.landed < 0) {
        line(bx, hy, bx - 3, hy - 2, '#c3c6cc');
        rect('#1d1b22', bx - 3, hy - 3, 2, 2);
        disc(bx, hy, 2, N.o);
        disc(bx, hy, 1, ramp.base);
        px(bx - 1, hy - 1, N.w);
      } else {
        disc(bx, GROUND_Y, 2, '#2a2420');
      }
      c.dirt.forEach(d => px(d.x - camX, d.y, d.life > 0.3 ? '#b9a98a' : '#8a7a5c'));
      // The live distance, and what the camera is doing.
      const shown = c.landed >= 0 ? `${fmt(f.dist)} ${UNIT}` : `${xm.toFixed(1)} ${UNIT}`;
      rect('rgba(20,26,22,0.85)', 3, 3, shown.length * 8 + 4, 14);
      say(shown, 5, 5, GOLD, 2);
      const tag = c.real < CAM.slowFor ? 'SLOW-MO' : 'THROW CAM';
      say(tag, W - tag.length * 4 - 3, 5, N.w);
      if (c.landed >= 0) {
        const big = `${fmt(f.dist)} ${UNIT}`;
        rect('rgba(20,26,22,0.85)', W / 2 - big.length * 6 - 4, 44, big.length * 12 + 6, 22);
        sayCenter(big, 48, GOLD, 3);
      } else {
        say('TAP TO SKIP', W - 47, 140, 'rgba(255,255,255,0.75)');
      }
    }

    function stepCamera(dt) {
      const c = s.cam;
      c.real += dt;
      c.u += dt * (c.real < CAM.slowFor ? CAM.slow : 1);
      c.dirt.forEach(d => { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 90 * dt; });
      c.dirt = c.dirt.filter(d => d.life > 0 && d.y < 118);
      if (c.landed < 0 && c.u >= CAM.flight) {
        c.landed = 0;
        Sound.play('thud');
        s.shake = 0.2;
        const x = s.flight.dist * mode.cam.pxPerUnit;
        for (let k = 0; k < 18; k++) c.dirt.push({ x, y: 117, vx: (Math.random() - 0.3) * 60, vy: -30 - Math.random() * 50, life: 0.5 + Math.random() * 0.4 });
      }
      if (c.landed >= 0) {
        c.landed += dt;
        if (c.landed >= CAM.after) endCamera();
      }
    }

    function record(mark) {
      const cell = cells[s.attempt - 1].querySelector('b');
      cell.textContent = mark === null ? 'X' : fmt(mark);
      cell.classList.toggle('is-foul', mark === null);
      s.results.push(mark);
      if (mark !== null && (s.best === null || mark > s.best)) s.best = mark;
      if (s.best !== null) board.querySelector('.sb-best').textContent = fmt(s.best);
    }

    function land() {
      const f = s.flight;
      s.marks.push({ x: Math.round(f.x1), y: Math.round(f.y1), foul: false });
      record(f.dist);
      Sound.play('thud');
      Sound.play('fair');
      s.flag = 'fair';
      const told = mode.landed(fmt(f.dist), f.dist, f.turn, TURNS);
      banner(`${fmt(f.dist)} ${UNIT}`, GOLD, told.sub, 1.8);
      msg.textContent = told.say;
      stage.dataset.last = fmt(f.dist);
      setPhase('landed');
      setTimeout(nextAttempt, 1700);
    }

    function nextAttempt() {
      if (s.phase !== 'landed') return;
      s.flight = null;
      s.flag = null;
      if (s.attempt >= ATTEMPTS) {
        setPhase('done');
        const fouls = s.results.filter(m => m === null).length;
        const told = s.best === null ? { say: 'Three fouls. It happens to everyone. Throw again?' } : mode.final(fmt(s.best), s.best);
        banner(s.best === null ? 'NO MARK' : `BEST ${fmt(s.best)} ${UNIT}`, s.best === null ? '#f08a75' : GOLD, told.sub || (fouls ? `${fouls} FOUL${fouls > 1 ? 'S' : ''}` : 'NO FOULS'), 99);
        msg.textContent = told.say;
        hold.hidden = true;
        again.hidden = false;
        again.focus();
        return;
      }
      s.attempt += 1;
      resetThrow();
      msg.textContent = 'Hold to wind up again.';
      if (holding) start();
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.t += dt;
      // The freeze holds the picture still.
      if (s.freeze > 0) {
        s.freeze -= dt;
        render();
        raf = requestAnimationFrame(tick);
        return;
      }
      s.shake = Math.max(0, s.shake - dt);
      s.flash = Math.max(0, s.flash - dt);
      if (s.phase === 'camera') {
        stepCamera(dt);
        render();
        raf = requestAnimationFrame(tick);
        return;
      }
      s.bannerT = Math.max(0, s.bannerT - dt);
      if (s.phase === 'wind' || s.phase === 'turns') {
        // Speed climbs smoothly toward this stage's pace.
        const target = s.phase === 'wind' ? WIND_SPEED : TURN_SPEED[s.turn - 1];
        s.omega += (target - s.omega) * Math.min(1, dt * 4);
        const step = s.omega * dt;
        s.theta -= step;
        s.spun += step;
        s.trail.push([C.x + Math.cos(s.theta) * ORBIT, C.y + Math.sin(s.theta) * ORBIT]);
        // A longer trail on the fast turns.
        if (s.trail.length > (s.turn >= mode.fastFrom ? s.turn * 6 : 10)) s.trail.shift();
        if (s.phase === 'wind' && s.spun >= TAU) {
          s.spun -= TAU;
          s.turn = 1;
          Sound.play('swish', 1);
          setPhase('turns');
          msg.textContent = 'Turn 1. Let go while it glows, or hold on for more speed.';
        } else if (s.phase === 'turns' && s.spun >= TAU) {
          s.spun -= TAU;
          s.turn += 1;
          if (s.turn > TURNS) {
            s.turn = TURNS;
            foul(`Foul: ${mode.words.turns} turns is the limit. A ${mode.words.over} took you out of the circle.`, `${mode.words.over.toUpperCase()} TURN`);
          } else {
            Sound.play('swish', s.turn);
            msg.textContent = s.turn === TURNS ? 'Last turn. Let go while it glows.' : `Turn ${s.turn}.`;
          }
        }
        stage.dataset.turn = String(s.turn);
        stage.dataset.zone = glowing() ? 'yes' : 'no';
      } else {
        stage.dataset.zone = 'no';
        s.trail = [];
      }
      if (s.phase === 'flying') {
        s.flight.t += dt;
        if (s.flight.t >= s.flight.dur) land();
      } else if (s.phase === 'landed' && s.flight) {
        s.flight.t += dt;
      }
      render();
      raf = requestAnimationFrame(tick);
    }

    // ---------- Controls ----------

    const down = e => {
      e.preventDefault();
      if (s.phase === 'camera') { endCamera(); return; }
      holding = true;
      start();
    };
    const up = e => { e.preventDefault(); if (!holding) return; holding = false; release(); };
    [canvas, hold].forEach(target => {
      target.addEventListener('pointerdown', down);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
      target.addEventListener('pointerleave', e => { if (holding) up(e); });
    });
    hold.addEventListener('click', e => e.preventDefault());
    const KEYS = [' ', 'Enter'];
    const keydown = e => {
      if (!KEYS.includes(e.key) || again.contains(document.activeElement) && !again.hidden) return;
      e.preventDefault();
      if (e.repeat) return;
      if (s.phase === 'camera') { endCamera(); return; }
      holding = true;
      start();
    };
    const keyup = e => {
      if (!KEYS.includes(e.key) || !holding) return;
      e.preventDefault();
      holding = false;
      release();
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    again.addEventListener('click', () => {
      Object.assign(s, { attempt: 1, best: null, marks: [], results: [] });
      cells.forEach(c => { const b = c.querySelector('b'); b.textContent = '--'; b.classList.remove('is-foul'); });
      board.querySelector('.sb-best').textContent = '--';
      resetThrow();
      msg.textContent = READY;
      again.hidden = true;
      hold.hidden = false;
      hold.focus();
    });

    // For tests and playtesting.
    stage[name] = { s, start, release, REACH, zone, mode };

    resetThrow();
    hold.focus();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }

  Object.keys(MODES).forEach(name => Games.register(name, {
    title: MODES[name].title,
    help: MODES[name].help,
    mount: (stage, ramp) => mount(stage, ramp, name),
  }));
})();
