/*
 * Hammer throw, Act II. Top-down view of the throwing circle and the sector.
 *
 * Hold to start: one wind over the head, then the turns. Every turn is faster
 * than the last, and the hammer glows as it passes the front of the circle.
 * Let go while it glows to throw. You get four turns at most: hold on past the
 * fourth and you spin out of the circle. Let go during the wind, or away from
 * the glow, and it is a foul. Three attempts; your best fair mark counts.
 */
(function () {
  'use strict';

  const W = 200;
  const H = 150;
  const C = { x: 100, y: 134 };
  const PX_PER_M = 1.45;
  const SECTOR = (34.92 / 2) * Math.PI / 180;
  const LINE = 0.05; // a release this far past the sector line still lands on it
  const ORBIT = 9;
  const TURNS = 4;
  const WIND_SPEED = 3.6; // radians per second
  const TURN_SPEED = [4.4, 5.2, 6.0, 6.8];
  const ATTEMPTS = 3;
  const BEST_M = 78;
  const TAU = Math.PI * 2;

  function mount(stage, ramp) {
    const canvas = Sheet.el('canvas', { class: 'game-canvas px', width: W, height: H, role: 'img', 'aria-label': 'Hammer throw field seen from above' });
    const cells = Array.from({ length: ATTEMPTS }, (_, k) => Sheet.el('div', {}, Sheet.el('span', { text: `Throw ${k + 1}` }), Sheet.el('b', { class: 'sb-throw', text: '--' })));
    const board = Sheet.el('div', { class: 'scoreboard', style: `grid-template-columns:repeat(${ATTEMPTS + 1},1fr)`, 'aria-live': 'polite' },
      cells, Sheet.el('div', {}, Sheet.el('span', { text: 'Best' }), Sheet.el('b', { class: 'sb-best', text: '--' })));
    const msg = Sheet.el('p', { class: 'game-msg', 'aria-live': 'polite', text: 'Hold to wind up. Four turns, then let go while the hammer glows.' });
    const hold = Sheet.el('button', { class: 'btn btn--accent hold' }, 'Hold to spin ', Sheet.el('kbd', { text: 'Space' }));
    const again = Sheet.el('button', { class: 'btn', hidden: '' }, 'Throw again');
    stage.append(canvas, board, msg, Sheet.el('div', { class: 'game-actions' }, hold, again));

    const ctx = canvas.getContext('2d');
    const N = Pixel.NEUTRALS;
    const s = { phase: 'ready', attempt: 1, best: null, marks: [], results: [] };
    let raf = 0;
    let last = performance.now();
    let holding = false;

    function setPhase(phase) { s.phase = phase; stage.dataset.state = phase; }

    function resetThrow() {
      Object.assign(s, { theta: Math.PI, omega: 0, spun: 0, turn: 0, trail: [], flight: null, flag: null });
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
    const glowing = () => s.phase === 'turns' && Math.abs(offAxis(s.theta)) <= SECTOR;

    // ---------- Drawing ----------

    function drawField() {
      for (let y = 0; y < H; y++) { ctx.fillStyle = Math.floor(y / 6) % 2 ? '#2b4a36' : '#2f5039'; ctx.fillRect(0, y, W, 1); }
      [-SECTOR, SECTOR].forEach(a => line(C.x, C.y, C.x + Math.sin(a) * 170, C.y - Math.cos(a) * 170, '#e8e4dc', true));
      [20, 40, 60, 80].forEach(m => {
        const r = m * PX_PER_M;
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
        for (let a = -Math.PI; a < Math.PI; a += 0.12) {
          const inZ = Math.abs(a) <= SECTOR;
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
      const R = 22;
      rect(N.o, 3, 81, 67, 67);
      rect('#1f3326', 4, 82, 65, 65);
      say('CIRCLE', 6, 84, '#a9bfae');
      for (let a = 0; a < TAU; a += 0.06) px(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, '#f6f4ef');
      // The glow zone on the hammer's path, and the sector lines leaving it.
      const lit = s.phase === 'turns';
      for (let a = -Math.PI; a < Math.PI; a += 0.03) {
        const inZ = Math.abs(a) <= SECTOR;
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
      const hx = cx + Math.cos(theta) * 4;
      const hy = cy + Math.sin(theta) * 4;
      const holdingHammer = s.phase !== 'flying' && s.phase !== 'landed' && s.phase !== 'done';
      if (holdingHammer) {
        const bx = cx + Math.cos(theta) * R;
        const by = cy + Math.sin(theta) * R;
        line(hx, hy, bx, by, '#c3c6cc');
        disc(bx, by, 2, N.o);
        const glow = glowing();
        disc(bx, by, 1, glow ? '#ffffff' : ramp.base);
        if (glow) [[-4, 0], [4, 0], [0, -4], [0, 4]].forEach(([dx, dy]) => px(bx + dx, by + dy, '#ffffff'));
      }
      // The thrower from above: shoulders, arms to the handle, head.
      const ux = Math.cos(theta + Math.PI / 2);
      const uy = Math.sin(theta + Math.PI / 2);
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
        rect(N.o, 22 + k * 7, 3, 6, 7);
        rect(now ? ramp.light : on ? ramp.base : '#3e5a47', 23 + k * 7, 4, 4, 5);
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
      ctx.clearRect(0, 0, W, H);
      drawField();
      drawThrower();
      if (s.flight) drawFlight(s.flight);
      drawOfficial();
      drawCloseUp();
      drawHud();
    }

    // ---------- The throw ----------

    const fmt = m => m.toFixed(2);
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
      if (s.phase === 'wind') { foul('Foul: you let go during the wind, and the hammer went into the cage.', 'TOO EARLY'); return; }
      if (s.phase !== 'turns') return;
      const off = offAxis(s.theta);
      if (Math.abs(off) > SECTOR + LINE) {
        const sub = Math.abs(off) > Math.PI / 2 ? 'INTO THE CAGE' : 'OUTSIDE THE SECTOR';
        foul(`Foul: let go while the hammer glows. Turn ${s.turn} of ${TURNS}.`, sub);
        return;
      }
      const clamped = Math.max(-SECTOR, Math.min(SECTOR, off));
      const speed = s.omega / TURN_SPEED[TURNS - 1];
      const meters = BEST_M * speed * speed * (1 - 0.15 * (clamped / SECTOR) ** 2);
      const bx = C.x + Math.cos(s.theta) * ORBIT;
      const by = C.y + Math.sin(s.theta) * ORBIT;
      const dist = meters * PX_PER_M;
      // It flies the way the hammer was moving: off straight up by the release angle.
      const dir = { x: Math.sin(clamped), y: -Math.cos(clamped) };
      s.flight = { x0: bx, y0: by, x1: C.x + dir.x * dist, y1: C.y + dir.y * dist, t: 0, dur: 0.5 + meters / 90, peak: 4 + meters / 6, meters, turn: s.turn };
      setPhase('flying');
      Sound.play('release');
      msg.textContent = `Released on turn ${s.turn}.`;
    }

    function record(meters) {
      const cell = cells[s.attempt - 1].querySelector('b');
      cell.textContent = meters === null ? 'X' : fmt(meters);
      cell.classList.toggle('is-foul', meters === null);
      s.results.push(meters);
      if (meters !== null && (s.best === null || meters > s.best)) s.best = meters;
      if (s.best !== null) board.querySelector('.sb-best').textContent = fmt(s.best);
    }

    function land() {
      const f = s.flight;
      s.marks.push({ x: Math.round(f.x1), y: Math.round(f.y1), foul: false });
      record(f.meters);
      Sound.play('thud');
      Sound.play('fair');
      s.flag = 'fair';
      banner(`${fmt(f.meters)} M`, '#ffd56b', f.turn < TURNS ? `TURN ${f.turn}: WAIT FOR TURN 4` : 'ALL FOUR TURNS', 1.8);
      msg.textContent = f.meters > 70 ? `${fmt(f.meters)} m. A big one.` : f.meters > 50 ? `${fmt(f.meters)} m. Nice throw.` : `${fmt(f.meters)} m. Hold on for more turns to throw further.`;
      stage.dataset.last = fmt(f.meters);
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
        banner(s.best === null ? 'NO MARK' : `BEST ${fmt(s.best)} M`, s.best === null ? '#f08a75' : '#ffd56b', fouls ? `${fouls} FOUL${fouls > 1 ? 'S' : ''}` : 'NO FOULS', 99);
        msg.textContent = s.best === null ? 'Three fouls. It happens to everyone. Throw again?' : `Final: your best mark is ${fmt(s.best)} m.`;
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
      s.bannerT = Math.max(0, s.bannerT - dt);
      if (s.phase === 'wind' || s.phase === 'turns') {
        // Speed climbs smoothly toward this stage's pace.
        const target = s.phase === 'wind' ? WIND_SPEED : TURN_SPEED[s.turn - 1];
        s.omega += (target - s.omega) * Math.min(1, dt * 4);
        const step = s.omega * dt;
        s.theta -= step;
        s.spun += step;
        s.trail.push([C.x + Math.cos(s.theta) * ORBIT, C.y + Math.sin(s.theta) * ORBIT]);
        if (s.trail.length > 10) s.trail.shift();
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
            foul('Foul: four turns is the limit. A fifth took you out of the circle.', 'FIFTH TURN');
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

    const down = e => { e.preventDefault(); holding = true; start(); };
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
      if (!e.repeat) { holding = true; start(); }
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
      msg.textContent = 'Hold to wind up. Four turns, then let go while the hammer glows.';
      again.hidden = true;
      hold.hidden = false;
      hold.focus();
    });

    // For tests and playtesting.
    stage.hammer = { s, start, release };

    resetThrow();
    hold.focus();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }

  Games.register('hammer', {
    title: 'Hammer throw',
    help: 'Hold to wind up and spin. You get four turns, each faster than the last. Let go while the hammer glows to land it in the sector. Hold past the fourth turn and it is a foul.',
    mount,
  });
})();
