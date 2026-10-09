/*
 * BMX race, Act I. Side view of a Saturday track, against two other riders,
 * each in their own lane.
 *
 * Everyone starts on the raised start hill behind the gate. The cadence plays
 * ("Riders ready, watch the gate"), the lights run red, yellow, yellow, green
 * and the gate drops. Pedal hard off the gate for the holeshot; pedal before
 * the green and you hit the gate.
 *
 * Two controls:
 *   Pedal (hold, or the right arrow): speed on the flats. It does nothing in the rollers.
 *   Pump  (tap, or Space): lift the front wheel just before a roller to pump it
 *         for speed, or pop off the lip of a jump to fly further. A lit strip on
 *         the dirt before each roller and lip shows when: press while your front
 *         wheel is over the green part for a perfect pump, the amber part for a
 *         good one. A press after a roller's strip counts toward the next roller.
 * Land a jump on its downslope to keep your speed. Come up short and you crash.
 */
(function () {
  'use strict';

  const W = 200;
  const H = 100;
  const BASE = 84; // screen y of ground at height 0
  const G = 150; // gravity, pixels per second squared
  const PEDAL_A = 95;
  const PEDAL_MAX = 112;
  const DRAG = 0.0011;
  const ROLL = 6;
  const MIN_V = 10;
  const MAX_V = 170;
  const PUMP = { perfect: 11, good: 5, miss: -5 };
  const POP = { perfect: 12, good: 7 };
  const SCREEN_X = 58;
  const START_CAM = -52; // where the camera waits at the start, to show the tower
  const START_X = 50;
  const GATE_X = 60;
  const WHEEL = 6; // front wheel is this far ahead of the rider's x
  const LANE_GAP = 5; // pixels between lanes, back to front
  // On a press the front wheel pulls up around the rear wheel: up, held, then down.
  const LIFT = { degrees: 22, up: 0.07, hold: 0.2, down: 0.38 };
  // Where the front wheel should be when you press, relative to a roller's start or a lip.
  const WINDOWS = {
    roller: { perfect: [-14, 5], good: [-26, 12] },
    lip: { perfect: [-16, 2], good: [-30, 6] },
  };

  // How far the front wheel is lifted, in radians, t seconds after a press.
  function liftAngle(t) {
    const a = (LIFT.degrees * Math.PI) / 180;
    if (t < 0 || t >= LIFT.down) return 0;
    if (t < LIFT.up) return (a * t) / LIFT.up;
    if (t < LIFT.hold) return a;
    return a * (1 - (t - LIFT.hold) / (LIFT.down - LIFT.hold));
  }

  // ---------- The track ----------

  function buildTrack() {
    const segs = [];
    const features = [];
    let x = 0;
    const seg = (len, f) => { segs.push({ x0: x, x1: x + len, f }); x += len; };
    const level = (len, at) => seg(len, () => at);
    const ease = (len, from, to) => seg(len, u => from + (to - from) * (1 - Math.cos(Math.PI * u)) / 2);
    // A takeoff gets steeper toward its lip.
    const kicker = (len, from, to) => seg(len, u => from + (to - from) * Math.pow(u, 1.8));
    const roller = (len, h) => { const x0 = x; seg(len, u => h * (1 - Math.cos(2 * Math.PI * u)) / 2); features.push({ kind: 'roller', x0, crest: x0 + len / 2, x1: x }); };
    const lip = name => { const f = { kind: 'lip', x, name }; features.push(f); return f; };
    // The downslope a jump should be landed on: steep at the top, easing out at the bottom.
    const landing = (jump, len, from) => { jump.land0 = x; seg(len, u => from * Math.pow(1 - u, 1.6)); jump.land1 = x; };

    level(70, 36); // the start hill
    ease(90, 36, 0); // the start ramp
    level(70, 0);
    // First straight: a double.
    kicker(30, 0, 11);
    const first = lip('the double');
    ease(8, 11, 0); level(26, 0); ease(6, 0, 12); level(4, 12);
    landing(first, 30, 12);
    level(50, 0);
    // The roller section.
    const rollers0 = x;
    for (let i = 0; i < 6; i++) roller(28, 6);
    const rollers1 = x;
    level(56, 0);
    // A tabletop: land on its far side, not on the table.
    kicker(30, 0, 13);
    const table = lip('the tabletop');
    level(46, 13);
    landing(table, 40, 13);
    level(56, 0);
    // A rhythm section of three rollers.
    for (let i = 0; i < 3; i++) roller(30, 7);
    level(70, 0);
    // The last double before the finish.
    kicker(32, 0, 13);
    const last = lip('the last double');
    ease(8, 13, 0); level(16, 0); ease(6, 0, 14); level(4, 14);
    landing(last, 34, 14);
    level(110, 0);
    const finish = x;
    level(160, 0);
    const end = x;

    function heightAt(px) {
      if (px <= 0) return segs[0].f(0);
      if (px >= end) return 0;
      let lo = 0;
      let hi = segs.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (segs[mid].x1 <= px) lo = mid + 1; else hi = mid;
      }
      const s = segs[lo];
      return s.f((px - s.x0) / (s.x1 - s.x0));
    }
    const slopeAt = px => (heightAt(px + 0.5) - heightAt(px - 0.5));
    return { heightAt, slopeAt, features, finish, end, rollers: [rollers0, rollers1] };
  }

  // ---------- Riders and physics ----------

  function newRider(lane, track) {
    return {
      lane, x: START_X, h: track.heightAt(START_X), v: 0, vx: 0, vy: 0, air: false,
      pitch: 0, lift: 9, crouch: 0, crank: 0, crashT: 0, stall: 0, done: false, time: 0,
      press: null, used: new Set(), stats: { perfect: 0, good: 0, miss: 0, clean: 0, crashes: 0 },
    };
  }

  const inRoller = (track, x) => track.features.some(f => f.kind === 'roller' && x > f.x0 && x < f.x1);

  // The most recent press of Pump, if it is still unused and its front wheel was inside [a, b].
  function takePress(r, a, b) {
    if (!r.press || r.press.used) return false;
    if (r.press.x < a || r.press.x > b) return false;
    r.press.used = true;
    return true;
  }

  // Advance one rider by dt seconds. Returns an event name for the caller to show, or null.
  function step(r, track, input, dt) {
    let event = null;
    if (r.crashT > 0) {
      r.crashT -= dt;
      if (r.crashT <= 0) { r.air = false; r.h = track.heightAt(r.x); r.v = 18; r.pitch = 0; }
      return null;
    }
    if (r.stall > 0) { r.stall -= dt; return null; }
    r.lift += dt;
    r.crouch = Math.max(0, r.crouch - dt * 3);
    if (!r.air) {
      const s = track.slopeAt(r.x);
      const c = 1 / Math.sqrt(1 + s * s);
      let a = -G * s * c - DRAG * r.v * r.v - ROLL;
      const rolling = inRoller(track, r.x);
      const pedaling = input.pedal && !rolling;
      if (pedaling) a += PEDAL_A * Math.max(0, 1 - r.v / PEDAL_MAX);
      r.v = Math.max(MIN_V, Math.min(MAX_V, r.v + a * dt));
      r.crank += (pedaling ? r.v / 6 : 0) * dt;
      const nx = r.x + r.v * c * dt;
      // Rollers: judged as the rider passes each crest.
      // A press after a roller's window is left for the next roller.
      for (const f of track.features) {
        if (f.kind === 'roller' && r.x < f.crest && nx >= f.crest && !r.used.has(f)) {
          r.used.add(f);
          const w = WINDOWS.roller;
          const pr = r.press && !r.press.used ? r.press : null;
          if (takePress(r, f.x0 + w.perfect[0], f.x0 + w.perfect[1])) { r.v += PUMP.perfect; r.stats.perfect += 1; r.crouch = 1; event = 'perfect'; }
          else if (takePress(r, f.x0 + w.good[0], f.x0 + w.good[1])) {
            r.v += PUMP.good; r.stats.good += 1; r.crouch = 0.7;
            event = pr.x < f.x0 + w.perfect[0] ? 'good-early' : 'good-late';
          } else {
            r.v = Math.max(MIN_V, r.v + PUMP.miss);
            r.stats.miss += 1;
            if (pr && pr.x < f.x0 + w.good[0]) { pr.used = true; event = 'early'; } else event = 'bump';
          }
        }
      }
      // Lips: the rider takes off, with a pop if Pump came just before.
      for (const f of track.features) {
        if (f.kind === 'lip' && r.x < f.x && nx >= f.x) {
          const ang = Math.atan(track.slopeAt(f.x - 1.5));
          r.vx = r.v * Math.cos(ang);
          r.vy = r.v * Math.sin(ang);
          const w = WINDOWS.lip;
          if (takePress(r, f.x + w.perfect[0], f.x + w.perfect[1])) { r.vy += POP.perfect; event = 'pop'; }
          else if (takePress(r, f.x + w.good[0], f.x + w.good[1])) { r.vy += POP.good; event = 'pop-good'; }
          r.air = true;
          r.jump = f;
          r.x = f.x;
          r.h = track.heightAt(f.x);
          r.pitch = ang;
          return event;
        }
      }
      r.x = nx;
      r.h = track.heightAt(nx);
      r.pitch += (Math.atan(s) - r.pitch) * Math.min(1, dt * 18);
    } else {
      r.vy -= G * dt;
      r.x += r.vx * dt;
      r.h += r.vy * dt;
      r.pitch += (Math.atan2(r.vy, r.vx) * 0.8 - r.pitch) * Math.min(1, dt * 5);
      const gh = track.heightAt(r.x);
      if (r.h <= gh) {
        r.h = gh;
        r.air = false;
        const ground = Math.atan(track.slopeAt(r.x));
        const motion = Math.atan2(r.vy, r.vx);
        const off = Math.abs(motion - ground);
        const speed = Math.hypot(r.vx, r.vy);
        const jump = r.jump || {};
        const slope = track.slopeAt(r.x);
        if (r.x < jump.land0 - 2) {
          // Short: into the face of the landing is a crash, onto the gap or the table is a case.
          if (slope > 0.25 && off > 0.6) { r.crashT = 1.1; r.v = 0; r.stats.crashes += 1; event = 'crash'; }
          else { r.v = Math.max(MIN_V, speed * 0.5); event = 'cased'; }
        } else if (r.x > jump.land1 + 2) {
          // Long: flat ground after the landing.
          if (off > 1.3) { r.crashT = 1.1; r.v = 0; r.stats.crashes += 1; event = 'crash'; }
          else { r.v = Math.max(MIN_V, speed * 0.68); event = 'flat'; }
        } else if (off > 0.55) {
          r.v = Math.max(MIN_V, speed * Math.cos(off) * 0.85);
          event = 'rough';
        } else {
          r.v = Math.min(MAX_V, speed * Math.cos(off * 0.5));
          r.stats.clean += 1;
          event = 'clean';
          r.crouch = 1;
        }
        r.pitch = ground;
      }
    }
    return event;
  }

  // ---------- Drawing helpers ----------

  function mount(stage, ramp) {
    const track = buildTrack();
    const canvas = Sheet.el('canvas', { class: 'game-canvas px', width: W, height: H, role: 'img', 'aria-label': 'BMX race seen from the side', style: '--r:2' });
    const board = Sheet.el('div', { class: 'scoreboard', 'aria-live': 'polite' },
      Sheet.el('div', {}, Sheet.el('span', { text: 'Place' }), Sheet.el('b', { class: 'sb-place', text: '--' })),
      Sheet.el('div', {}, Sheet.el('span', { text: 'Time' }), Sheet.el('b', { class: 'sb-time', text: '0.0' })),
      Sheet.el('div', {}, Sheet.el('span', { text: 'Best' }), Sheet.el('b', { class: 'sb-best', text: '--' })));
    const msg = Sheet.el('p', { class: 'game-msg', 'aria-live': 'polite', text: 'Press Pedal or Pump to roll up to the gate.' });
    const pedalBtn = Sheet.el('button', { class: 'btn btn--accent game-pedal' }, 'Pedal ', Sheet.el('kbd', { text: '→' }));
    const pumpBtn = Sheet.el('button', { class: 'btn game-pump' }, 'Pump / pop ', Sheet.el('kbd', { text: 'Space' }));
    const againBtn = Sheet.el('button', { class: 'btn btn--accent', hidden: '' }, 'Race again');
    stage.append(canvas, board, msg, Sheet.el('div', { class: 'game-actions' }, pedalBtn, pumpBtn, againBtn));

    const ctx = canvas.getContext('2d');
    const N = Pixel.NEUTRALS;
    const sky = ramp.accent || '#3fa9f5';
    const rand = Scenes.rng(Date.now() & 0xffff);
    const r0 = Scenes.rng(7);
    const clouds = Array.from({ length: 7 }, (_, i) => [i * 70 + Math.floor(r0() * 40), 6 + Math.floor(r0() * 22)]);
    const crowd = Array.from({ length: 420 }, () => Math.floor(r0() * 6));
    const JERSEYS = [
      { jersey: ramp.base, light: ramp.light, frame: ramp.shade, plate: '1' },
      { jersey: '#e0533d', light: '#f08a75', frame: '#a3352a', plate: '7' },
      { jersey: '#3b7dd8', light: '#7fb0ee', frame: '#24539c', plate: '3' },
    ];
    // Two rivals: a fast one and a steady one. cap is how hard they pedal,
    // spread how far their pumps miss by, pop how often they pop a lip.
    const RIVALS = [{ cap: 0.92, spread: 25, pop: 0.75 }, { cap: 0.86, spread: 44, pop: 0.45 }];

    const s = {};
    const input = { pedal: false };
    let raf = 0;
    let last = performance.now();
    let best = null;

    function setPhase(phase) { s.phase = phase; stage.dataset.state = phase; }

    function reset() {
      Object.assign(s, {
        t: 0, clock: 0, riders: [0, 1, 2].map(l => newRider(l, track)),
        gate: 0, gateFall: 0, cue: 0, dropAt: 0, call: '', callT: 0, light: 0, cam: START_CAM, place: 0, early: false,
        reaction: null, results: null, dust: [], shake: 0,
      });
      s.player = s.riders[0];
      s.riders.slice(1).forEach((r, k) => { r.ai = RIVALS[k]; r.react = 0.12 + rand() * 0.2 * (k + 1); r.plan = null; });
      setPhase('ready');
      stage.dataset.place = '';
      stage.dataset.perfect = '0';
      board.querySelector('.sb-place').textContent = '--';
      board.querySelector('.sb-time').textContent = '0.0';
      msg.textContent = 'Press Pedal or Pump to roll up to the gate.';
      againBtn.hidden = true;
      pedalBtn.hidden = false;
      pumpBtn.hidden = false;
    }

    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const dot = (c, x, y) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
    const say = (text, x, y, color, scale) => Pixel.text(ctx, text, Math.round(x), Math.round(y), color, scale || 1);
    const sayCenter = (text, y, color, scale) => say(text, W / 2 - (String(text).length * 4 - 1) * (scale || 1) / 2, y, color, scale);
    const groundY = wx => BASE - track.heightAt(wx);

    function call(text, seconds) { s.call = text; s.callT = seconds || 0.9; }

    // ---------- Drawing ----------

    function drawWorld() {
      const cam = s.cam;
      // Sky in bands, sun, clouds.
      for (let i = 0; i < 6; i++) rect(Scenes.mix(sky, '#ffffff', 0.18 + i * 0.12), 0, i * 7, W, 7);
      rect(Scenes.mix(sky, '#ffffff', 0.85), 0, 42, W, BASE - 42);
      for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 26) dot(x * x + y * y > 16 ? '#ffe9a0' : '#ffd56b', W - 34 + x, 16 + y);
      clouds.forEach(([x, y]) => {
        const cx = ((x - cam * 0.08) % 490 + 490) % 490 - 30;
        rect('#ffffff', cx + 2, y, 9, 1); rect('#ffffff', cx, y + 1, 15, 2); rect('#ffffff', cx + 5, y - 1, 4, 1);
      });
      // Hills, far then near.
      for (let x = 0; x < W; x++) {
        const w1 = x + cam * 0.2;
        const h1 = Math.round(12 + Math.sin(w1 / 31) * 5 + Math.sin(w1 / 13) * 2);
        rect('#9bd88a', x, BASE - 28 - h1, 1, h1 + 20);
        const w2 = x + cam * 0.4;
        const h2 = Math.round(7 + Math.sin(w2 / 19 + 1) * 3);
        rect('#78c466', x, BASE - 22 - h2, 1, h2 + 20);
      }
      // Crowd behind the fence, and sponsor banners.
      for (let x = 0; x < W; x++) {
        const wx = Math.floor(x + cam * 0.7);
        const k = crowd[((wx % 420) + 420) % 420];
        if (k < 5) rect(['#4a4652', N.s, ramp.base, '#3b7dd8', N.w][k], x, BASE - 23 + (wx % 3 === 0 ? 0 : 1), 1, 2);
      }
      rect('#f6f4ef', 0, BASE - 20, W, 1);
      for (let x = 0; x < W; x++) {
        const wx = Math.floor(x + cam * 0.7);
        const m = ((wx % 40) + 40) % 40;
        rect(m < 30 ? (Math.floor(wx / 40) % 2 ? ramp.base : sky) : '#d3cec6', x, BASE - 19, 1, 4);
        if (m > 3 && m < 26 && (m % 4 === 1)) rect(N.w, x, BASE - 18, 2, 1);
      }
      // The track: a riding surface with depth for the lanes, and the dirt below it.
      for (let x = 0; x < W; x++) {
        const wx = x + cam;
        const y = Math.round(groundY(wx));
        rect('#b97a4a', x, y - 10, 1, 10);
        rect('#d89a63', x, y - 10, 1, 1);
        if (((wx | 0) % 23) === 0) dot('#c98a55', x, y - 5);
        rect('#c98a55', x, y, 1, H - y);
        rect('#e0a46f', x, y, 1, 1);
        if (((wx | 0) % 9) === 0) dot('#a96b3e', x, y + 4);
        if (((wx | 0) % 13) === 5) dot('#dba06d', x, y + 9);
      }
      // The start hill: a starter's tower behind the riders, the gate, and the lights beside it.
      const sx = -cam;
      if (sx > -100) {
        const top = BASE - 36;
        rect(N.o, sx - 40, top - 26, 1, 26); rect(N.o, sx - 10, top - 26, 1, 26);
        rect(ramp.shade, sx - 43, top - 29, 37, 3); rect(ramp.base, sx - 44, top - 30, 39, 1);
        rect(N.w, sx - 39, top - 16, 29, 1);
        rect(N.o, sx - 26, top - 40, 1, 10);
        rect(ramp.light, sx - 25, top - 40, s.t % 0.5 < 0.25 ? 6 : 5, 3);
        // The gate stands up, then falls forward onto the ramp.
        const k = Math.min(1, s.gateFall);
        const ang = (Math.PI / 2) * (1 - k) - 0.2 * k;
        for (let i = 0; i < 11; i++) {
          const gx = sx + GATE_X + Math.cos(ang) * i;
          const gy = top - 1 - Math.sin(ang) * i;
          const band = Math.floor(i / 2) % 2 ? N.w : ramp.base;
          dot(N.o, gx - 1, gy); dot(band, gx, gy); dot(band, gx + 1, gy); dot(N.o, gx + 2, gy);
        }
        // Start lights on a post beside the gate: red, yellow, yellow, green.
        const lx = sx + GATE_X + 9;
        rect(N.o, lx + 2, top - 6, 1, 6);
        rect(N.o, lx, top - 26, 5, 20);
        ['#e0533d', '#ffd23f', '#ffd23f', '#5ac43a'].forEach((c, n) => {
          const lit = s.light > n;
          rect(lit ? c : '#3a3744', lx + 1, top - 25 + n * 5, 3, 3);
          if (lit) dot(Scenes.mix(c, '#ffffff', 0.6), lx + 1, top - 25 + n * 5);
        });
      }
      // Finish line: an arch with a checkered banner.
      const fx = track.finish - cam;
      if (fx > -20 && fx < W + 20) {
        const y = Math.round(groundY(track.finish));
        rect(N.o, fx - 1, y - 32, 1, 32); rect(N.o, fx + 22, y - 32, 1, 32);
        for (let i = 0; i < 22; i++) for (let j = 0; j < 4; j++) dot((Math.floor(i / 2) + Math.floor(j / 2)) % 2 ? N.o : N.w, fx + i, y - 34 + j);
        for (let j = 0; j < 7; j++) dot(j % 2 ? N.o : N.w, fx + 10, y - 7 + j);
      }
    }

    // Each rider is drawn upright on a small canvas, then turned by its pitch
    // around the point where the wheels meet the ground.
    const spr = document.createElement('canvas');
    spr.width = 32;
    spr.height = 32;
    const sctx = spr.getContext('2d');
    const OX = 16;
    const OY = 27; // the ground under the bike, in sprite pixels
    const sdot = (c, x, y) => { sctx.fillStyle = c; sctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
    function sline(c, x0, y0, x1, y1) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        sdot(c, x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    const RING = [];
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = x * x + y * y; if (d <= 20 && d >= 11) RING.push([x, y, d >= 15 ? 'o' : 'm']); }
    function swheel(cx, cy, spin) {
      RING.forEach(([x, y, k]) => sdot(k === 'o' ? N.o : N.m, cx + x, cy + y));
      sdot(N.n, cx, cy);
      sdot(N.n, cx + Math.round(Math.cos(spin) * 2), cy + Math.round(Math.sin(spin) * 2));
      sdot(N.n, cx - Math.round(Math.cos(spin) * 2), cy - Math.round(Math.sin(spin) * 2));
    }

    // A rider further back is a little darker: about 8% for each lane.
    function paintRider(r, look, lane) {
      sctx.clearRect(0, 0, 32, 32);
      const tone = c => (lane ? Scenes.mix(c, '#000000', 0.08 * lane) : c);
      const spin = r.x / 4;
      const low = Math.round((r.air ? 2 : 0) + r.crouch * 2);
      // Bike: wheels, frame, fork, bars and the number plate.
      const rear = [OX - 6, OY - 4];
      const front = [OX + 6, OY - 4];
      const bb = [OX - 1, OY - 4];
      const head = [OX + 4, OY - 10];
      const seat = [OX - 4, OY - 9];
      swheel(rear[0], rear[1], spin);
      swheel(front[0], front[1], spin);
      const frame = tone(look.frame);
      sline(frame, bb[0], bb[1], rear[0], rear[1]);
      sline(frame, seat[0], seat[1], rear[0], rear[1]);
      sline(frame, bb[0], bb[1], head[0], head[1]);
      sline(frame, seat[0], seat[1], head[0], head[1]);
      sline(N.n, head[0], head[1], front[0], front[1]);
      sline(N.n, head[0], head[1], head[0] - 1, head[1] - 3);
      sline(N.o, head[0] - 3, head[1] - 3, head[0] + 1, head[1] - 3);
      sctx.fillStyle = N.w; sctx.fillRect(head[0] + 1, head[1] - 2, 2, 2);
      // Rider: legs to the pedals, a body leaning to the bars, arms and a helmet.
      const hip = [OX - 3, OY - 15 + low];
      const shoulder = [OX + 1, OY - 20 + low];
      const hands = [head[0] - 1, head[1] - 3];
      const ca = r.crank;
      // Thick lines: the same line again, one pixel across, for each extra pixel of width.
      const thick = (c, a, b, w) => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const d = Math.hypot(dx, dy) || 1;
        const nx = -dy / d;
        const ny = dx / d;
        for (let k = 0; k < w; k++) sline(c, a[0] + nx * k, a[1] + ny * k, b[0] + nx * k, b[1] + ny * k);
      };
      [[Math.cos(ca), Math.sin(ca)], [-Math.cos(ca), -Math.sin(ca)]].forEach(([cx, cy], k) => {
        const pedal = [bb[0] + cx * 2.5, bb[1] + cy * 2.5];
        const dx = pedal[0] - hip[0];
        const dy = pedal[1] - hip[1];
        const d = Math.hypot(dx, dy) || 1;
        const half = Math.min(d / 2, 5.5);
        const bend = Math.sqrt(Math.max(0, 5.5 * 5.5 - half * half));
        // The knee sits forward of the line from hip to pedal.
        let knee = [hip[0] + dx / 2 + (dy / d) * bend, hip[1] + dy / 2 - (dx / d) * bend];
        if (knee[0] < hip[0] + dx / 2) knee = [hip[0] + dx / 2 - (dy / d) * bend, hip[1] + dy / 2 + (dx / d) * bend];
        const leg = tone(k === 0 ? N.K : N.k);
        thick(leg, hip, knee, 2);
        sline(leg, knee[0], knee[1], pedal[0], pedal[1]);
        sdot(N.o, pedal[0], pedal[1]);
        sdot(N.o, pedal[0] + 1, pedal[1]);
      });
      // Body: a jersey three pixels wide, its back a shade darker.
      thick(tone(look.jersey), hip, shoulder, 3);
      sline(tone(look.frame), hip[0], hip[1], shoulder[0], shoulder[1]);
      thick(tone(look.light), [shoulder[0] + 1, shoulder[1] + 1], hands, 2);
      sdot(N.o, hands[0], hands[1]);
      sdot(N.o, hands[0] + 1, hands[1]);
      // Helmet with a visor, a face and a chin bar.
      const hx = shoulder[0];
      const hy = shoulder[1] - 7;
      const HELMET = ['.oooo..', 'o1122o.', 'o22222o', 'o22wsso', '.o22ss.', '..ooo..'];
      HELMET.forEach((row, j) => [...row].forEach((ch, i) => {
        const col = { o: N.o, 1: tone(look.light), 2: tone(look.jersey), w: N.w, s: N.s }[ch];
        if (col) sdot(col, hx + i - 1, hy + j);
      }));
    }

    // The player's rider gets a 1-pixel light outline, drawn from a white copy of the sprite.
    const glow = document.createElement('canvas');
    glow.width = 32;
    glow.height = 32;
    const gctx = glow.getContext('2d');
    function outline() {
      gctx.clearRect(0, 0, 32, 32);
      gctx.globalCompositeOperation = 'source-over';
      gctx.drawImage(spr, 0, 0);
      gctx.globalCompositeOperation = 'source-in';
      gctx.fillStyle = '#fffbe8';
      gctx.fillRect(0, 0, 32, 32);
    }

    function drawRider(r, look, isPlayer) {
      const sx = Math.round(r.x - s.cam);
      if (sx < -24 || sx > W + 24) return;
      const laneY = r.lane * LANE_GAP;
      const sy = Math.round(BASE - r.h - laneY);
      // A shadow on the rider's own lane, which stays on the dirt during a jump.
      const gy = Math.round(groundY(r.x) - laneY);
      const spread = r.air ? Math.max(3, 7 - Math.round((r.h - track.heightAt(r.x)) / 6)) : 8;
      rect('rgba(70,40,20,0.35)', sx - spread, gy - 1, spread * 2, 2);
      let pitch = r.pitch;
      if (r.crashT > 0) pitch = -((1.1 - r.crashT) * 7);
      // A press pulls the front wheel up around the rear wheel.
      const lift = r.crashT > 0 ? 0 : liftAngle(r.lift);
      paintRider(r, look, r.lane);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-pitch);
      ctx.translate(-6, 0);
      ctx.rotate(-lift);
      ctx.translate(6, 0);
      if (isPlayer) {
        outline();
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => ctx.drawImage(glow, -OX + dx, -OY + dy));
      }
      ctx.drawImage(spr, -OX, -OY);
      ctx.restore();
      // A marker over the player.
      if (isPlayer && s.phase !== 'finished') {
        const my = sy - 30;
        rect(N.w, sx - 2, my, 5, 1); rect(N.w, sx - 1, my + 1, 3, 1); dot(N.w, sx, my + 2);
      }
    }

    // The pump strip: on the player's lane, before each roller and lip still ahead,
    // green where a press is perfect and amber where it is good. It brightens
    // while the front wheel is over it.
    function drawStrips() {
      if (s.phase !== 'riding' && s.phase !== 'cadence' && s.phase !== 'ready') return;
      const r = s.player;
      const wheel = r.x + WHEEL;
      // The next roller or lip is lit; the one after it shows faintly, so you can see it coming.
      const ahead = track.features.filter(f => {
        const at = f.kind === 'roller' ? f.x0 : f.x;
        return at + WINDOWS[f.kind].good[1] >= wheel - 4 && !(f.kind === 'roller' && r.used.has(f));
      }).slice(0, 2);
      ahead.reverse().forEach((f, k) => {
        const faint = ahead.length === 2 && k === 0;
        const at = f.kind === 'roller' ? f.x0 : f.x;
        const w = WINDOWS[f.kind];
        const over = !faint && wheel >= at + w.perfect[0] && wheel <= at + w.perfect[1];
        for (let wx = Math.ceil(at + w.good[0]); wx <= at + w.good[1]; wx++) {
          const x = wx - s.cam;
          if (x < 0 || x >= W) continue;
          const y = Math.round(groundY(wx));
          const perfect = wx >= at + w.perfect[0] && wx <= at + w.perfect[1];
          const c = perfect ? (over ? '#e8ffd0' : '#5ac43a') : '#ffcf4a';
          rect(faint ? Scenes.mix(c, '#c98a55', 0.55) : c, x, y - 2, 1, 2);
          if (perfect && !faint) dot(over ? '#ffffff' : '#9be36c', x, y - 3);
        }
      });
    }

    function drawHud() {
      // Race progress along the top: a line with a dot per rider.
      const x0 = 34;
      const x1 = W - 34;
      rect('rgba(29,27,34,0.55)', x0 - 3, 2, x1 - x0 + 6, 7);
      rect('#d3cec6', x0, 5, x1 - x0, 1);
      dot(N.w, x1, 4); dot(N.o, x1, 5); dot(N.w, x1, 6);
      [...s.riders].reverse().forEach((r, k) => {
        const u = Math.max(0, Math.min(1, (r.x - START_X) / (track.finish - START_X)));
        const look = JERSEYS[r.lane];
        rect(r === s.player ? N.w : look.jersey, x0 + u * (x1 - x0) - 1, 4, 3, 3);
        if (r === s.player) dot(look.jersey, x0 + u * (x1 - x0), 5);
      });
      // Speed.
      const v = Math.round(s.player.air ? Math.hypot(s.player.vx, s.player.vy) : s.player.v);
      say('SPD', 4, 12, N.o);
      rect('#1d1b22', 18, 12, 32, 5);
      rect(v > 100 ? ramp.light : ramp.base, 19, 13, Math.round(30 * Math.min(1, v / 140)), 3);
      // Callouts.
      if (s.callT > 0 && s.call) {
        const scale = 1;
        const w = s.call.length * 4 - 1;
        rect(N.o, W / 2 - w / 2 - 3, 18, w + 6, 9);
        sayCenter(s.call, 20, s.callColor || '#ffd56b', scale);
      }
    }

    function drawStart() {
      if (s.phase === 'cadence') {
        // The starter's call, in two lines over the open sky to the right of the gate.
        const lines = s.cue < 1 ? ['RIDERS', 'READY'] : s.cue < 2 ? ['WATCH', 'THE GATE'] : null;
        if (lines) {
          rect('rgba(29,27,34,0.85)', 131, 22, 66, 31);
          lines.forEach((t, k) => say(t, 164 - (t.length * 8 - 2) / 2, 25 + k * 13, N.w, 2));
        }
      }
      if (s.phase === 'ready') {
        rect('rgba(29,27,34,0.85)', 131, 22, 66, 40);
        say('BMX', 164 - 11, 25, ramp.light, 2);
        say('RACE', 164 - 15, 38, ramp.light, 2);
        say('PRESS PEDAL', 164 - 21, 53, N.w, 1);
      }
    }

    function drawResults() {
      if (s.phase !== 'finished' || !s.results) return;
      const { place, time } = s.results;
      rect('rgba(29,27,34,0.86)', W / 2 - 62, 30, 124, 48);
      const words = ['1ST PLACE', '2ND PLACE', '3RD PLACE', '4TH PLACE'][place - 1];
      sayCenter(words, 34, place === 1 ? '#ffd56b' : N.w, 2);
      sayCenter(time.toFixed(2) + ' S', 50, N.w, 1);
      sayCenter(`PUMPS ${s.player.stats.perfect + s.player.stats.good}/9   CLEAN ${s.player.stats.clean}/3`, 60, ramp.light, 1);
      if (place === 1) sayCenter('HOLESHOT TO HARDWARE', 70, '#9be36c', 1);
    }

    function drawDust() {
      s.dust.forEach(d => dot(d.life > 0.3 ? '#dba06d' : '#c98a55', d.x - s.cam, BASE - d.y));
      // Speed lines when the player is flying along.
      const v = s.player.air ? Math.hypot(s.player.vx, s.player.vy) : s.player.v;
      if (s.phase === 'riding' && v > 105) {
        const r = Scenes.rng(Math.floor(s.t * 20));
        for (let i = 0; i < 5; i++) rect('rgba(255,255,255,0.8)', Math.floor(r() * W), 24 + Math.floor(r() * 50), 6 + Math.floor(r() * 10), 1);
      }
    }

    function render() {
      ctx.save();
      if (s.shake > 0) ctx.translate(Math.round((rand() - 0.5) * 3), Math.round((rand() - 0.5) * 3));
      drawWorld();
      drawStrips();
      drawDust();
      // Back lanes first so the player rides in front.
      [...s.riders].sort((a, b) => b.lane - a.lane).forEach(r => drawRider(r, JERSEYS[r.lane], r === s.player));
      ctx.restore();
      drawHud();
      drawStart();
      drawResults();
    }

    // ---------- The race ----------

    function begin() {
      if (s.phase !== 'ready') return;
      s.cue = 0;
      s.dropAt = 2 + 0.3 + rand() * 1.1;
      setPhase('cadence');
      msg.textContent = 'Riders ready. Watch the gate: pedal on the green.';
    }

    function press() {
      if (s.phase === 'ready') { begin(); return; }
      if (s.phase === 'finished') return;
      if (s.phase === 'riding') {
        const r = s.player;
        r.press = { x: r.x + WHEEL, used: false };
        if (!r.air) r.lift = 0;
      }
    }

    function pedal(on) {
      if (on && s.phase === 'ready') { begin(); input.pedal = false; return; }
      input.pedal = on;
      if (on && s.phase === 'cadence' && s.cue >= 2 && !s.early) {
        s.early = true;
        s.player.stall = 0.7;
        call('HIT THE GATE', 1.2);
        s.callColor = '#f08a75';
        msg.textContent = 'Too early: you hit the gate. Wait for the green.';
      }
    }

    function drop() {
      setPhase('riding');
      s.gate = 1;
      s.light = 4;
      msg.textContent = 'Go! Hold Pedal. Tap Pump before each roller and at each lip.';
    }

    function rivalInput(r) {
      // Plan the next press for the next feature ahead, with timing that depends on skill.
      const next = track.features.find(f => (f.kind === 'roller' ? f.x0 : f.x) > r.x + WHEEL - 2 && !(r.plan && r.plan.f === f));
      if (next && (!r.plan || r.plan.done)) {
        const target = next.kind === 'roller' ? next.x0 - 5 : next.x - 7;
        const skip = next.kind === 'lip' && rand() > r.ai.pop;
        r.plan = { f: next, at: target + (rand() - 0.5) * r.ai.spread, done: skip };
      }
      if (r.plan && !r.plan.done && r.x + WHEEL >= r.plan.at) {
        r.plan.done = true;
        r.press = { x: r.x + WHEEL, used: false };
        if (!r.air) r.lift = 0;
      }
      return { pedal: r.v < PEDAL_MAX * r.ai.cap };
    }

    function finishRace() {
      const r = s.player;
      const place = 1 + s.riders.filter(o => o !== r && o.done && o.time < r.time).length;
      s.results = { place, time: r.time };
      setPhase('finished');
      Sound.play(place === 1 ? 'win' : 'finish');
      stage.dataset.place = String(place);
      board.querySelector('.sb-place').textContent = ['1st', '2nd', '3rd', '4th'][place - 1];
      if (best === null || r.time < best) best = r.time;
      board.querySelector('.sb-best').textContent = best.toFixed(2);
      board.querySelector('.sb-time').textContent = r.time.toFixed(2);
      msg.textContent = place === 1 ? `You won the moto in ${r.time.toFixed(2)} seconds.` : `${['', '2nd', '3rd', '4th'][place - 1]} place in ${r.time.toFixed(2)} seconds. Pump the rollers and pop the lips to go faster.`;
      pedalBtn.hidden = true;
      pumpBtn.hidden = true;
      againBtn.hidden = false;
      againBtn.focus();
    }

    // What an event feels like: a sound, dust and a little shake.
    function feel(r, e) {
      const sound = { perfect: ['pump', true], 'good-early': ['pump', false], 'good-late': ['pump', false], early: ['bump'], bump: ['bump'], pop: ['pop'], 'pop-good': ['pop'], clean: ['land'], rough: ['land'], cased: ['bump'], flat: ['land'], crash: ['crash'] }[e];
      if (sound) Sound.play(sound[0], sound[1]);
      const puffs = { clean: 6, rough: 8, cased: 10, flat: 10, crash: 16, bump: 4, early: 4, perfect: 3, 'good-early': 2, 'good-late': 2 }[e] || 0;
      for (let i = 0; i < puffs; i++) s.dust.push({ x: r.x - 4 + rand() * 10, y: r.h, vx: -20 - rand() * 30, vy: 10 + rand() * 25, life: 0.5 + rand() * 0.3 });
      if (e === 'crash' || e === 'cased' || e === 'flat') s.shake = e === 'crash' ? 0.35 : 0.2;
    }

    const CALLS = {
      perfect: ['PERFECT PUMP', '#9be36c'], 'good-early': ['GOOD - A BIT EARLY', '#ffd56b'], 'good-late': ['GOOD - A BIT LATE', '#ffd56b'],
      early: ['TOO EARLY', '#f08a75'], bump: ['NO PUMP', '#f08a75'],
      pop: ['BIG POP', '#9be36c'], 'pop-good': ['POP', '#ffd56b'], clean: ['CLEAN', '#9be36c'],
      cased: ['CASED IT', '#f08a75'], rough: ['SKETCHY', '#ffd56b'], flat: ['TOO FAR: FLAT', '#f08a75'], crash: ['CAME UP SHORT', '#f08a75'],
    };

    function update(dt) {
      s.t += dt;
      s.callT = Math.max(0, s.callT - dt);
      if (s.phase === 'cadence') {
        s.cue += dt;
        // Lights run red, yellow, yellow, green, then the gate drops.
        const lights = s.cue - s.dropAt + 0.72;
        const was = s.light;
        s.light = lights < 0 ? 0 : Math.min(4, 1 + Math.floor(lights / 0.24));
        if (s.light > was) Sound.play('light', s.light - 1);
        if (s.cue >= s.dropAt) { drop(); s.reactionStart = s.t; }
        return;
      }
      if (s.gate) s.gateFall = Math.min(1, s.gateFall + dt * 4);
      s.shake = Math.max(0, s.shake - dt);
      s.dust.forEach(d => { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy -= 60 * dt; });
      s.dust = s.dust.filter(d => d.life > 0);
      if (s.phase !== 'riding' && s.phase !== 'finished') return;
      // Holeshot: how quickly the player starts pedaling after the drop.
      if (s.phase === 'riding' && s.reaction === null && input.pedal && s.player.stall <= 0) {
        s.reaction = s.t - s.reactionStart;
        if (!s.early && s.reaction < 0.3) { s.player.v += 20; call('HOLESHOT', 1); s.callColor = '#9be36c'; }
      }
      s.riders.forEach(r => {
        if (r.done && r !== s.player) { r.x += r.v * dt; return; }
        if (r === s.player && s.phase === 'finished') { r.x += Math.max(0, r.v - 30 * dt) * dt; r.v = Math.max(0, r.v - 40 * dt); return; }
        if (r !== s.player && s.t - s.reactionStart < r.react) return;
        const inp = r === s.player ? input : rivalInput(r);
        let e = null;
        // Small fixed steps keep the physics steady at any frame rate.
        const n = Math.ceil(dt / 0.004);
        for (let i = 0; i < n; i++) e = step(r, track, inp, dt / n) || e;
        if (!r.done) r.time += dt;
        if (!r.done && r.x >= track.finish) { r.done = true; if (r === s.player) finishRace(); }
        if (r === s.player && e && CALLS[e]) {
          call(CALLS[e][0], 0.9);
          s.callColor = CALLS[e][1];
          feel(r, e);
          if (e === 'crash') msg.textContent = 'Came up short and went over the bars. Pedal harder or pop the lip.';
          stage.dataset.perfect = String(r.stats.perfect);
        }
      });
      if (s.phase === 'riding') board.querySelector('.sb-time').textContent = s.player.time.toFixed(1);
      // Live place while racing.
      if (s.phase === 'riding') {
        const ahead = s.riders.filter(o => o !== s.player && (o.done || o.x > s.player.x)).length;
        board.querySelector('.sb-place').textContent = ['1st', '2nd', '3rd', '4th'][ahead];
      }
      stage.dataset.x = String(Math.round(s.player.x));
      stage.dataset.speed = String(Math.round(s.player.v));
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      // The camera leads the player a little when fast.
      const want = s.phase === 'ready' || s.phase === 'cadence' ? START_CAM : s.player.x - SCREEN_X + Math.min(30, s.player.v * 0.18);
      s.cam += (Math.max(START_CAM, want) - s.cam) * Math.min(1, dt * 4);
      render();
      raf = requestAnimationFrame(tick);
    }

    // ---------- Controls ----------

    const hold = (btn, on, off) => {
      btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture && btn.setPointerCapture(e.pointerId); on(); });
      btn.addEventListener('pointerup', e => { e.preventDefault(); off(); });
      btn.addEventListener('pointercancel', () => off());
      btn.addEventListener('lostpointercapture', () => off());
      btn.addEventListener('click', e => e.preventDefault());
    };
    hold(pedalBtn, () => pedal(true), () => pedal(false));
    pumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
    pumpBtn.addEventListener('click', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
    againBtn.addEventListener('click', () => { reset(); pumpBtn.focus(); });
    const PEDAL_KEYS = ['ArrowRight', 'd', 'D'];
    const PUMP_KEYS = [' ', 'ArrowUp', 'w', 'W'];
    const keydown = e => {
      if (PEDAL_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) pedal(true); }
      else if (PUMP_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) press(); }
      else if (e.key === 'Enter' && s.phase === 'finished') { e.preventDefault(); reset(); }
    };
    const keyup = e => { if (PEDAL_KEYS.includes(e.key)) pedal(false); };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    // For tests and playtesting: the live state and the track.
    stage.bmx = { s, track, input, press, pedal };

    reset();
    pumpBtn.focus();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }

  Games.register('bmx', {
    title: 'BMX race',
    help: 'Hold Pedal for speed. Tap Pump just before each roller to pump it, and at the lip of a jump to pop. Land on the downslope.',
    mount,
    // The physics, without drawing, for tests.
    sim: { buildTrack, newRider, step, liftAngle, WINDOWS, LANE_GAP },
  });
})();
