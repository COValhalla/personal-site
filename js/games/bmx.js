/*
 * BMX race, Act I. Side view of a Saturday track, against two other riders,
 * each in their own lane. Six straights are joined by five berms, which the
 * race shows from above while a rider is in one. Thirteen jumps: tabletops and
 * step-ups, never gaps.
 *
 * Everyone waits on the slanted start hill behind the gate. The lights come on
 * 0.3 s apart, red, yellow, yellow, green, and the gate falls forward. Pedal
 * before the green and you hit the gate.
 *
 * Two controls:
 *   Pedal (hold, or the right arrow): speed on the flats. It does nothing in the rollers.
 *   Jump  (tap, or Space; hold for more): on the lit strip at the foot of a jump,
 *         a tap wheelies over it and pumps the landing. Hold while you climb the
 *         face to fly; the longer you hold, the bigger the jump, full at 0.5 s.
 *         Press neither and you roll over at 90% of your speed.
 * The hold meter beside the rider shows, before each jump, the holds that land clean.
 */
(function () {
  'use strict';

  const W = 200;
  const H = 100;
  const BASE = 84; // screen y of the ground at height 0
  const G = 150; // gravity, pixels per second squared
  const PEDAL_A = 95;
  const PEDAL_MAX = 130;
  const DRAG = 0.0011;
  const ROLL = 6;
  const MIN_V = 10;
  const MAX_V = 175;
  const PUMP = { perfect: 11, good: 5, miss: -5 };
  const WHEELIE = { perfect: 5, good: 2 };
  const POP_MAX = 38;
  const HOLD_MIN = 0.15;
  const HOLD_FULL = 0.5;
  const LIGHT_GAP = 0.3;
  const BERM_LEN = 115;
  const WHEEL = 6; // the front wheel is this far ahead of the rider's x
  const LANE_GAP = 5; // pixels between lanes, back to front
  const START_X = 40;
  const GATE_X = 51;
  const CAM_START = -50;
  const SCREEN_X = 58;
  const BERM_X = 146; // the centre of the berm, seen from above
  const BERM_Y = 52;
  const WHEELIE_LIFT = 0.24;
  // On a press the front wheel pulls up around the rear wheel: up, held, then down.
  const LIFT = { degrees: 22, up: 0.07, hold: 0.2, down: 0.38 };
  // Where the front wheel should be when you press, relative to a roller's start or a jump's approach.
  const WINDOWS = {
    roller: { perfect: [-14, 5], good: [-26, 12] },
    jump: { perfect: [-16, 4], good: [-30, 12] },
  };
  const RIVALS = [
    { cap: 0.97, spread: 22, jumpy: 0.8, aim: 0.25 },
    { cap: 0.9, spread: 40, jumpy: 0.45, aim: 0.45 },
  ];
  const BOT = { cap: 1, spread: 6, jumpy: 0.9, aim: 0.08 };

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
    const straights = [];
    const berms = [];
    let x = 0;
    const seg = (len, f) => { segs.push({ x0: x, x1: x + len, f }); x += len; };
    const flat = (len, h = 0) => seg(len, () => h);
    const roller = (len, h) => {
      const x0 = x;
      seg(len, u => h * (1 - Math.cos(2 * Math.PI * u)) / 2);
      features.push({ kind: 'roller', x0, crest: x0 + len / 2, x1: x });
    };
    // A jump rises to its lip, then either stays level and falls away (a table)
    // or steps up onto a higher deck and falls away from there (a step-up).
    const jump = (name, size, shape, height, approach, top, landing, exponent = 1.6, rise = 0) => {
      const j = { kind: 'jump', name, size, shape, x0: x };
      seg(approach, u => height * Math.pow(u, exponent));
      j.lip = x;
      flat(top, height);
      if (shape === 'table') {
        j.land0 = x;
        seg(landing, u => height * Math.pow(1 - u, 1.6));
        j.offOk = 0.55;
      } else {
        const up = height + rise;
        seg(12, u => height + (up - height) * (1 - Math.cos(Math.PI * u)) / 2);
        j.land0 = x;
        flat(18, up);
        seg(landing, u => up * (1 + Math.cos(Math.PI * u)) / 2);
        j.offOk = 0.8;
      }
      j.land1 = x;
      features.push(j);
    };
    const straight = dir => straights.push({ s0: x, s1: 0, dir });
    const berm = n => {
      straights[straights.length - 1].s1 = x;
      const b = { n, b0: x };
      seg(BERM_LEN, () => 0);
      b.b1 = x;
      berms.push(b);
    };

    // The start hill: a flat top, then a slope of about 20 degrees, then the ramp down.
    straight(1);
    flat(30, 44);
    seg(85, u => 44 - 31 * u);
    seg(71, u => 13 * (1 - u) * (1 - u));
    flat(70);
    jump('big tabletop', 'big', 'table', 14, 34, 64, 34);
    flat(70);
    jump('big tabletop', 'big', 'table', 14, 34, 64, 34);
    flat(60);
    berm(1);

    straight(-1);
    flat(130);
    jump('medium tabletop', 'medium', 'table', 10, 26, 62, 28);
    flat(60);
    jump('medium step-up', 'medium', 'step', 10, 26, 28, 40, 1.6, 8);
    flat(190);
    jump('the big one', 'biggest', 'table', 18, 42, 66, 42);
    flat(24);
    berm(2);

    straight(1);
    flat(130);
    for (let i = 0; i < 5; i++) roller(28, 6);
    flat(36);
    jump('little step-up', 'little', 'step', 7, 20, 40, 30, 1.3, 6);
    flat(36);
    for (let i = 0; i < 5; i++) roller(28, 6);
    flat(50);
    berm(3);

    straight(-1);
    flat(130);
    for (let i = 0; i < 3; i++) {
      jump('rhythm tabletop', 'little', 'table', 8, 20, 62, 22, 1.3);
      flat(i < 2 ? 34 : 50);
    }
    berm(4);

    straight(1);
    flat(130);
    jump('big step-up', 'big', 'step', 12, 32, 16, 44, 1.6, 10);
    flat(60);
    jump('medium tabletop', 'medium', 'table', 10, 26, 68, 28);
    flat(50);
    berm(5);

    straight(-1);
    flat(130);
    jump('little tabletop', 'little', 'table', 7, 20, 60, 24, 1.3);
    flat(60);
    jump('little tabletop', 'little', 'table', 7, 20, 60, 24, 1.3);
    flat(110);
    const finish = x;
    flat(200);
    const end = x;
    straights[straights.length - 1].s1 = end;

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
    const slopeAt = px => heightAt(px + 0.5) - heightAt(px - 0.5);
    const rollers = features.filter(f => f.kind === 'roller');
    const jumps = features.filter(f => f.kind === 'jump');
    const zoneAt = px => {
      for (const r of rollers) if (px > r.x0 && px < r.x1) return 'roller';
      for (const b of berms) if (px >= b.b0 && px < b.b1) return 'berm';
      return null;
    };
    // How far before a berm the overhead view starts, and how far past it the view stays.
    for (const b of berms) {
      const prev = jumps.filter(j => j.land1 < b.b0).pop();
      const next = features.find(f => f.x0 > b.b1);
      b.ain = Math.max(40, Math.min(110, b.b0 - (prev ? prev.land1 : 0) - 6));
      b.aout = Math.max(30, Math.min(50, (next ? next.x0 : b.b1 + 200) - b.b1 - 10));
    }
    return { heightAt, slopeAt, zoneAt, features, jumps, rollers, berms, straights, finish, end };
  }

  // ---------- Riders and physics ----------

  function newRider(lane, track) {
    return {
      lane, x: START_X, h: track.heightAt(START_X), v: 0, vx: 0, vy: 0, air: false, jump: null,
      pitch: Math.atan(track.slopeAt(START_X)), lift: 9, crouch: 0, crank: 0, crashT: 0, stall: 0,
      charge: 0, manual: null, manualGrade: null, flewWith: 0, done: false, time: 0,
      press: null, used: new Set(), planned: new Set(), plan: null, holding: false, heldFor: 0,
      ai: null, react: 0, stats: { perfect: 0, good: 0, miss: 0, clean: 0, manual: 0, jumps: 0, crashes: 0 },
    };
  }

  // The most recent press of Jump, if it is still unused and its front wheel was inside [a, b].
  function takePress(r, a, b) {
    const p = r.press;
    if (!p || p.used || p.x < a || p.x > b) return false;
    p.used = true;
    return true;
  }

  function crash(r) {
    r.crashT = 1.1;
    r.v = 0;
    r.stats.crashes += 1;
    return 'crash';
  }

  function judgeRoller(r, f) {
    const w = WINDOWS.roller;
    const press = r.press && !r.press.used ? r.press : null;
    if (takePress(r, f.x0 + w.perfect[0], f.x0 + w.perfect[1])) {
      r.v += PUMP.perfect; r.stats.perfect += 1; r.crouch = 1;
      return 'perfect';
    }
    if (takePress(r, f.x0 + w.good[0], f.x0 + w.good[1])) {
      r.v += PUMP.good; r.stats.good += 1; r.crouch = 0.7;
      return press.x < f.x0 + w.perfect[0] ? 'good-early' : 'good-late';
    }
    r.v = Math.max(MIN_V, r.v + PUMP.miss);
    r.stats.miss += 1;
    if (press && press.x < f.x0 + w.good[0]) { press.used = true; return 'early'; }
    return 'bump';
  }

  function launch(r, track, j, extra) {
    const ang = Math.atan(track.slopeAt(j.lip - 1.5));
    r.vx = r.v * Math.cos(ang);
    r.vy = r.v * Math.sin(ang) + extra;
    r.air = true;
    r.jump = j;
    r.x = j.lip;
    r.h = track.heightAt(j.lip);
    r.pitch = ang;
  }

  function airStep(r, track, dt) {
    r.vy -= G * dt;
    r.x += r.vx * dt;
    r.h += r.vy * dt;
    r.pitch += (0.8 * Math.atan2(r.vy, r.vx) - r.pitch) * Math.min(1, 5 * dt);
    const ground = track.heightAt(r.x);
    if (r.h > ground) return null;
    r.h = ground;
    r.air = false;
    const slope = track.slopeAt(r.x);
    const angle = Math.atan(slope);
    const off = Math.abs(Math.atan2(r.vy, r.vx) - angle);
    const speed = Math.hypot(r.vx, r.vy);
    const j = r.jump || {};
    r.pitch = angle;
    if (r.x < j.land0 - 2) {
      if (slope > 0.25 && off > 1.25) return crash(r);
      r.v = Math.max(MIN_V, 0.6 * speed);
      return 'cased';
    }
    if (r.x > j.land1 + 2) {
      if (off > 1.3) return crash(r);
      r.v = Math.max(MIN_V, 0.68 * speed);
      return 'flat';
    }
    if (off > (j.offOk || 0.55)) {
      r.v = Math.max(MIN_V, speed * Math.cos(off) * 0.85);
      return 'rough';
    }
    r.v = Math.min(MAX_V, speed * Math.cos(0.5 * off) + 4);
    r.stats.clean += 1;
    r.crouch = 1;
    return 'clean';
  }

  // Advance one rider by dt seconds. Returns an event name for the caller to show, or null.
  function step(r, track, input, dt) {
    if (r.crashT > 0) {
      r.crashT -= dt;
      if (r.crashT <= 0) { r.air = false; r.h = track.heightAt(r.x); r.v = 18; r.pitch = 0; r.manual = null; }
      return null;
    }
    if (r.stall > 0) { r.stall -= dt; return null; }
    r.lift += dt;
    const holding = input.held && input.heldFor >= HOLD_MIN;
    r.charge = holding ? Math.min(1, (input.heldFor - HOLD_MIN) / (HOLD_FULL - HOLD_MIN)) : 0;
    r.crouch = holding ? Math.min(1, r.crouch + 6 * dt) : Math.max(0, r.crouch - 3 * dt);
    if (r.air) return airStep(r, track, dt);

    const s = track.slopeAt(r.x);
    const c = 1 / Math.sqrt(1 + s * s);
    const pedaling = input.pedal && track.zoneAt(r.x) !== 'roller' && !r.manual;
    let a = -G * s * c - DRAG * r.v * r.v - ROLL;
    if (pedaling) a += PEDAL_A * Math.max(0, 1 - r.v / PEDAL_MAX);
    r.v = Math.max(MIN_V, Math.min(MAX_V, r.v + a * dt));
    r.crank += (pedaling ? r.v / 6 : 0) * dt;
    const nx = r.x + r.v * c * dt;
    let event = null;

    // Rollers are judged as the rider passes each crest. A press after a roller's window counts toward the next.
    for (const f of track.rollers) {
      if (r.x < f.crest && nx >= f.crest && !r.used.has(f)) {
        r.used.add(f);
        event = judgeRoller(r, f);
      }
    }

    // Jumps: a tap on the approach's lit strip wheelies over; holding through the lip flies.
    for (const j of track.jumps) {
      if (r.manual === j && r.manualGrade !== 'roll' && r.x < j.land0 && nx >= j.land0) {
        r.v += r.manualGrade === 'perfect' ? WHEELIE.perfect : WHEELIE.good;
        event = 'manual-2';
      }
      if (r.manual === j && nx > j.land1) r.manual = null;
      if (!(r.x < j.lip && nx >= j.lip) || r.manual === j) continue;
      r.stats.jumps += 1;
      if (holding) {
        if (r.press && !r.press.used) r.press.used = true;
        launch(r, track, j, POP_MAX * r.charge);
        r.flewWith = r.charge;
        return 'air';
      }
      const w = WINDOWS.jump;
      if (takePress(r, j.x0 + w.perfect[0], j.x0 + w.perfect[1])) r.manualGrade = 'perfect';
      else if (takePress(r, j.x0 + w.good[0], j.x0 + w.good[1])) r.manualGrade = 'good';
      else r.manualGrade = 'roll';
      r.manual = j;
      if (r.manualGrade === 'roll') {
        r.v *= 0.9;
        event = 'roll';
      } else {
        const grade = r.manualGrade;
        r.v += grade === 'perfect' ? WHEELIE.perfect : WHEELIE.good;
        r.stats.manual += 1;
        if (grade === 'perfect') r.stats.perfect += 1; else r.stats.good += 1;
        event = grade === 'perfect' ? 'manual' : 'manual-good';
      }
    }
    r.x = nx;
    r.h = track.heightAt(nx);
    r.pitch += (Math.atan(s) - r.pitch) * Math.min(1, 18 * dt);
    return event;
  }

  // The speed at the lip, if the rider rolls on from x at speed v.
  function lipSpeed(track, j, v, x, pedal) {
    let p = x;
    let speed = v;
    for (let i = 0; i < 1000 && p < j.lip; i++) {
      const s = track.slopeAt(p);
      const c = 1 / Math.sqrt(1 + s * s);
      const push = pedal && track.zoneAt(p) !== 'roller' ? PEDAL_A * Math.max(0, 1 - speed / PEDAL_MAX) : 0;
      speed = Math.max(MIN_V, speed + 0.008 * (push - G * s * c - DRAG * speed * speed - ROLL));
      p += speed * c * 0.008;
    }
    return speed;
  }

  // Where a flight from the lip lands: short, long, rough or clean.
  function flight(track, j, speed, charge) {
    const ang = Math.atan(track.slopeAt(j.lip - 1.5));
    let x = j.lip;
    let h = track.heightAt(j.lip);
    const vx = speed * Math.cos(ang);
    let vy = speed * Math.sin(ang) + POP_MAX * charge;
    for (let i = 0; i < 2000; i++) {
      vy -= 0.6;
      x += 0.004 * vx;
      h += 0.004 * vy;
      if (h <= track.heightAt(x)) break;
    }
    if (x < j.land0 - 2) return 'short';
    if (x > j.land1 + 2) return 'long';
    if (Math.abs(Math.atan2(vy, vx) - Math.atan(track.slopeAt(x))) > j.offOk) return 'rough';
    return 'clean';
  }

  // The hold charges (0 to 1) that land clean from the current speed, as [first, last], or null.
  function cleanRange(track, j, v, x, pedal) {
    const speed = lipSpeed(track, j, v, x, pedal);
    let first = null;
    let last = null;
    for (let c = 0; c <= 1.0001; c += 0.025) {
      if (flight(track, j, speed, c) === 'clean') {
        if (first === null) first = c;
        last = c;
      }
    }
    return first === null ? null : [first, Math.min(1, last)];
  }

  // A rider who plays the race well: pedals to its cap, taps or holds for each jump, and pumps each roller.
  function brain(r, track, ai, rand, dt) {
    const reach = r.x + WHEEL;
    if (!r.plan || r.plan.done) {
      const next = track.features.find(f => (f.kind === 'jump' ? f.lip > r.x : f.x0 + 12 > reach) && !r.planned.has(f));
      if (!next) r.plan = null;
      else if (next.kind === 'roller') r.plan = { f: next, mode: 'tap', at: next.x0 - 5 + (rand() - 0.5) * ai.spread };
      else if (cleanRange(track, next, Math.max(r.v, 60), r.x, true) && rand() < ai.jumpy) r.plan = { f: next, mode: 'hold', noise: (rand() - 0.5) * ai.aim };
      else r.plan = { f: next, mode: 'tap', at: next.x0 - 6 + (rand() - 0.5) * ai.spread };
    }
    const c = r.plan;
    let held = false;
    if (c && !c.done) {
      if (c.mode === 'tap' && reach >= c.at) {
        c.done = true;
        r.planned.add(c.f);
        r.press = { x: reach, used: false };
        if (!r.air) r.lift = 0;
      } else if (c.mode === 'hold') {
        if (!r.holding && !r.air) {
          const range = cleanRange(track, c.f, r.v, r.x, r.v < PEDAL_MAX * ai.cap);
          if (!range && r.x + WHEEL < c.f.x0) Object.assign(c, { mode: 'tap', at: c.f.x0 - 6 + (rand() - 0.5) * ai.spread });
          c.charge = Math.min(1, Math.max(0.05, (range ? (range[0] + range[1]) / 2 : 1) + c.noise));
        }
        const timeLeft = (c.f.lip - r.x) / Math.max(30, 0.85 * r.v);
        if (c.mode === 'hold' && !r.air && (r.holding || timeLeft <= HOLD_MIN + c.charge * (HOLD_FULL - HOLD_MIN))) {
          r.holding = true;
          held = true;
        }
        if (r.x >= c.f.lip) {
          c.done = true;
          r.planned.add(c.f);
          r.holding = false;
          held = false;
        }
      }
    }
    r.heldFor = held ? (r.heldFor || 0) + dt : 0;
    return { pedal: r.v < PEDAL_MAX * ai.cap && !r.air, held, heldFor: r.heldFor };
  }

  // ---------- Drawing helpers ----------

  const CALLS = {
    perfect: ['PERFECT PUMP', '#9be36c'], 'good-early': ['GOOD - A BIT EARLY', '#ffd56b'], 'good-late': ['GOOD - A BIT LATE', '#ffd56b'],
    early: ['TOO EARLY', '#f08a75'], bump: ['NO PUMP', '#f08a75'], manual: ['WHEELIE PUMP', '#9be36c'], 'manual-good': ['WHEELIE', '#ffd56b'],
    'manual-2': ['LANDING PUMP', '#9be36c'], clean: ['CLEAN', '#9be36c'], roll: ['ROLLED IT', '#ffd56b'], cased: ['CASED IT', '#f08a75'],
    rough: ['SKETCHY', '#ffd56b'], flat: ['TOO FAR: FLAT', '#f08a75'], crash: ['CAME UP SHORT', '#f08a75'],
  };
  const SPOTS = [
    ['gate', 'The gate'], ['doubles', 'Big tabletops'], ['berm1', 'Berm 1'], ['bigone', 'The big one'],
    ['rollers', 'Rollers'], ['rhythm', 'Rhythm'], ['bigstep', 'Big step-up'], ['last', 'Last jumps'],
  ];

  function mount(stage, ramp) {
    const track = buildTrack();
    const last = track.straights.length - 1;
    const canvas = Sheet.el('canvas', { class: 'game-canvas px', width: W, height: H, role: 'img', 'aria-label': 'BMX race seen from the side, or from above in a berm', style: '--r:2' });
    const board = Sheet.el('div', { class: 'scoreboard', 'aria-live': 'polite' },
      Sheet.el('div', {}, Sheet.el('span', { text: 'Place' }), Sheet.el('b', { class: 'sb-place', text: '--' })),
      Sheet.el('div', {}, Sheet.el('span', { text: 'Time' }), Sheet.el('b', { class: 'sb-time', text: '0.0' })),
      Sheet.el('div', {}, Sheet.el('span', { text: 'Best' }), Sheet.el('b', { class: 'sb-best', text: '--' })));
    const msg = Sheet.el('p', { class: 'game-msg', 'aria-live': 'polite', text: 'Press Pedal or Jump to roll up to the gate.' });
    const pedalBtn = Sheet.el('button', { class: 'btn btn--accent game-pedal' }, 'Pedal ', Sheet.el('kbd', { text: '→' }));
    const jumpBtn = Sheet.el('button', { class: 'btn game-jump' }, 'Jump ', Sheet.el('kbd', { text: 'Space' }));
    const againBtn = Sheet.el('button', { class: 'btn btn--accent', hidden: '' }, 'Race again');
    const spotBtns = SPOTS.map(([key, label]) => Sheet.el('button', { class: 'btn btn--ghost game-spot', 'data-spot': key }, label));
    stage.append(canvas, board, msg,
      Sheet.el('div', { class: 'game-actions' }, pedalBtn, jumpBtn, againBtn),
      Sheet.el('div', { class: 'game-spots' }, Sheet.el('span', { class: 'game-spots-label', text: 'Start from' }), ...spotBtns));

    const ctx = canvas.getContext('2d');
    const N = Pixel.NEUTRALS;
    const sky = ramp.accent || '#3fa9f5';
    const rand = Scenes.rng(Date.now() & 0xffff);
    const r0 = Scenes.rng(7);
    const clouds = Array.from({ length: 7 }, (_, i) => [i * 70 + Math.floor(r0() * 40), 6 + Math.floor(r0() * 22)]);
    const crowd = Array.from({ length: 420 }, () => Math.floor(r0() * 6));
    const JERSEYS = [
      { jersey: ramp.base, light: ramp.light, frame: ramp.shade },
      { jersey: '#e0533d', light: '#f08a75', frame: '#a3352a' },
      { jersey: '#3b7dd8', light: '#7fb0ee', frame: '#24539c' },
    ];
    const SPOT_AT = {
      doubles: [track.jumps[0].x0 - 110, 100],
      berm1: [track.berms[0].b0 - 150, 105],
      bigone: [track.jumps[4].x0 - 190, 100],
      rollers: [track.straights[2].s0 + 6, 100],
      rhythm: [track.straights[3].s0 + 6, 105],
      bigstep: [track.jumps[9].x0 - 110, 105],
      last: [track.straights[last].s0 + 6, 100],
    };

    const s = {};
    const input = { pedal: false, held: false, heldFor: 0 };
    let bot = false;
    let raf = 0;
    let lastFrame = performance.now();
    let best = null;

    function setPhase(phase) { s.phase = phase; stage.dataset.state = phase; }

    function reset() {
      Object.assign(s, {
        t: 0, cue: 0, redAt: 0, dropAt: 0, gateT: 0, gate: 0, light: 0, phase: 'ready', call: '', callT: 0, callColor: '#ffd56b',
        cam: CAM_START, view: null, wipeT: 0, early: false, reactionStart: 0, results: null, dust: [], shake: 0,
        practice: false, range: null, rangeT: 0, rangeFor: null, playerAt: null,
      });
      s.riders = [0, 1, 2].map(lane => newRider(lane, track));
      s.player = s.riders[0];
      s.riders.slice(1).forEach((r, k) => { r.ai = RIVALS[k]; r.react = 0.1 + 0.18 * rand() * (k + 1); });
      input.pedal = false;
      input.held = false;
      input.heldFor = 0;
      setPhase('ready');
      stage.dataset.place = '';
      stage.dataset.perfect = '0';
      board.querySelector('.sb-place').textContent = '--';
      board.querySelector('.sb-time').textContent = '0.0';
      msg.textContent = 'Press Pedal or Jump to roll up to the gate.';
      againBtn.hidden = true;
      pedalBtn.hidden = false;
      jumpBtn.hidden = false;
    }

    let g = ctx;
    const rect = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const dot = (c, x, y) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
    const say = (text, x, y, color, scale) => Pixel.text(g, text, Math.round(x), Math.round(y), color, scale || 1);
    const sayCenter = (text, y, color, scale) => say(text, W / 2 - (String(text).length * 4 - 1) * (scale || 1) / 2, y, color, scale);

    const world = document.createElement('canvas');
    world.width = W;
    world.height = H;
    const wctx = world.getContext('2d');
    const previous = document.createElement('canvas');
    previous.width = W;
    previous.height = H;
    const pctx = previous.getContext('2d');
    const wipeFrom = document.createElement('canvas');
    wipeFrom.width = W;
    wipeFrom.height = H;
    const fctx = wipeFrom.getContext('2d');

    function call(text, seconds, color) { s.call = text; s.callT = seconds || 0.9; s.callColor = color || '#ffd56b'; }

    // Height of the side view at track x, on straight k: the berms on either side rise as walls.
    const wall = d => (d <= 55 ? 26 * (1 - Math.cos(Math.PI * d / 110)) : Math.min(40, 26 + 0.74 * (d - 55)));
    function sideHeight(k, tx) {
      const st = track.straights[k];
      if (k > 0 && tx < st.s0) return wall(st.s0 - tx);
      if (k < last && tx > st.s1) return wall(tx - st.s1);
      return track.heightAt(tx);
    }
    const offStraight = (k, tx) => (k > 0 && tx < track.straights[k].s0) || (k < last && tx > track.straights[k].s1);

    // ---------- The overhead berm ----------

    const overhead = document.createElement('canvas');
    overhead.width = W;
    overhead.height = H;
    (function paintOverhead() {
      const oc = overhead.getContext('2d');
      const put = (c, x, y) => { oc.fillStyle = c; oc.fillRect(x, y, 1, 1); };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(((x >> 3) + (y >> 3)) % 2 ? '#6cb85b' : '#78c466', x, y);
      for (let x = 0; x < BERM_X; x++) {
        for (const top of [22, 60]) {
          for (let y = top; y <= top + 22; y++) put(y === top || y === top + 22 ? '#8c5a33' : y - top < 3 ? '#e0a46f' : '#c98a55', x, y);
        }
        put('#f6f4ef', x, 20);
        put('#f6f4ef', x, 84);
      }
      for (let y = 0; y < H; y++) for (let x = BERM_X; x < W; x++) {
        const d = Math.hypot(x - BERM_X, y - BERM_Y);
        if (d >= 8 && d <= 37) put(d <= 10 || d >= 35 ? '#8c5a33' : '#c98a55', x, y);
      }
      for (let i = 0; i <= 50; i++) {
        const a = -Math.PI / 2 + Math.PI * i / 50;
        oc.fillStyle = '#f6f4ef';
        oc.fillRect(Math.round(BERM_X + 41 * Math.cos(a)), Math.round(BERM_Y + 41 * Math.sin(a)), 1, 1);
      }
    })();

    // Where a rider in berm b shows from above, in lane `lane`; heading 0 is to the right.
    function overheadPlace(b, x, lane) {
      const n = 13 + 6 * lane;
      if (x < b.b0) return { x: BERM_X - 1.2 * (b.b0 - x), y: BERM_Y - n, head: 0 };
      if (x > b.b1) return { x: BERM_X - 1.2 * (x - b.b1), y: BERM_Y + n, head: Math.PI };
      const a = -Math.PI / 2 + Math.PI * (x - b.b0) / (b.b1 - b.b0);
      return { x: BERM_X + n * Math.cos(a), y: BERM_Y + n * Math.sin(a), head: a + Math.PI / 2 };
    }

    // Where something at track x and height h shows in the current view, or null if it does not.
    function place(view, x, h, lane) {
      if (view.kind === 'berm') {
        const b = view.b;
        if (x < b.b0 - b.ain - 40 || x > b.b1 + b.aout + 40) return null;
        const p = overheadPlace(b, x, lane);
        return { x: p.x, y: p.y, gy: p.y, head: p.head, top: true };
      }
      const k = view.k;
      const st = track.straights[k];
      if (k > 0 && x < st.s0) return null;
      if (k < last && x > st.s1 + 110) return null;
      const off = offStraight(k, x);
      const ground = off ? sideHeight(k, x) : track.heightAt(x);
      const up = off ? ground : h;
      return {
        x: x - st.s0 - s.cam, y: BASE - up - LANE_GAP * lane, gy: BASE - ground - LANE_GAP * lane,
        pitch: off ? Math.atan(sideHeight(k, x + 0.5) - sideHeight(k, x - 0.5)) : null, off, hAbove: h - ground,
      };
    }

    // ---------- Drawing: the side view ----------

    function drawSky() {
      for (let i = 0; i < 6; i++) rect(Scenes.mix(sky, '#ffffff', 0.18 + i * 0.12), 0, i * 7, W, 7);
      rect(Scenes.mix(sky, '#ffffff', 0.85), 0, 42, W, BASE - 42);
      for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 26) dot(x * x + y * y > 16 ? '#ffe9a0' : '#ffd56b', W - 34 + x, 16 + y);
      clouds.forEach(([x, y]) => {
        const cx = ((x - s.cam * 0.08) % 490 + 490) % 490 - 30;
        rect('#ffffff', cx + 2, y, 9, 1); rect('#ffffff', cx, y + 1, 15, 2); rect('#ffffff', cx + 5, y - 1, 4, 1);
      });
    }

    function drawHills() {
      for (let x = 0; x < W; x++) {
        const w1 = x + s.cam * 0.2;
        const h1 = Math.round(12 + Math.sin(w1 / 31) * 5 + Math.sin(w1 / 13) * 2);
        rect('#9bd88a', x, BASE - 28 - h1, 1, h1 + 20);
        const w2 = x + s.cam * 0.4;
        const h2 = Math.round(7 + Math.sin(w2 / 19 + 1) * 3);
        rect('#78c466', x, BASE - 22 - h2, 1, h2 + 20);
      }
      for (let x = 0; x < W; x++) {
        const wx = Math.floor(x + s.cam * 0.7);
        const k = crowd[((wx % 420) + 420) % 420];
        if (k < 5) rect(['#4a4652', N.s, ramp.base, '#3b7dd8', N.w][k], x, BASE - 23 + (wx % 3 === 0 ? 0 : 1), 1, 2);
      }
      rect('#f6f4ef', 0, BASE - 20, W, 1);
      for (let x = 0; x < W; x++) {
        const wx = Math.floor(x + s.cam * 0.7);
        const m = ((wx % 40) + 40) % 40;
        rect(m < 30 ? (Math.floor(wx / 40) % 2 ? ramp.base : sky) : '#d3cec6', x, BASE - 19, 1, 4);
        if (m > 3 && m < 26 && (m % 4 === 1)) rect(N.w, x, BASE - 18, 2, 1);
      }
    }

    // The track in one straight's view: the riding surface, and the berm walls beside it.
    function drawGround(k) {
      const st = track.straights[k];
      for (let t = 0; t < W; t++) {
        const tx = st.s0 + t + s.cam;
        const y = Math.round(BASE - sideHeight(k, tx));
        if (offStraight(k, tx)) {
          const d = k > 0 && tx < st.s0 ? st.s0 - tx : tx - st.s1;
          rect('#a96b3e', t, y - 10, 1, 10);
          rect((Math.floor(tx) + Math.floor(sideHeight(k, tx))) % 6 < 3 ? '#c48550' : '#b97a4a', t, y - 9, 1, 8);
          rect(d > 74 ? '#e0a46f' : '#d89a63', t, y - 10, 1, 1);
          rect('#c98a55', t, y, 1, H - y);
          if (d > 74 && Math.floor(tx) % 5 === 0) { rect(N.w, t, y - 16, 1, 6); dot(Math.floor(tx / 5) % 2 ? '#ff8a1f' : '#3fa9f5', t + 1, y - 16); }
          continue;
        }
        rect('#b97a4a', t, y - 10, 1, 10);
        rect('#d89a63', t, y - 10, 1, 1);
        if (((tx | 0) % 23) === 0) dot('#c98a55', t, y - 5);
        rect('#c98a55', t, y, 1, H - y);
        rect('#e0a46f', t, y, 1, 1);
        if (((tx | 0) % 9) === 0) dot('#a96b3e', t, y + 4);
        if (((tx | 0) % 13) === 5) dot('#dba06d', t, y + 9);
      }
    }

    // The start: a starter's tower on the hill, the gate that falls, and the start lights beside it.
    function drawStart() {
      const sx = -s.cam;
      if (sx < -100) return;
      const deck = BASE - track.heightAt(0);
      rect(N.o, sx - 40, deck - 26, 1, 26); rect(N.o, sx - 10, deck - 26, 1, 26);
      rect(ramp.shade, sx - 43, deck - 29, 37, 3); rect(ramp.base, sx - 44, deck - 30, 39, 1);
      rect(N.w, sx - 39, deck - 16, 29, 1);
      rect(N.o, sx - 26, deck - 40, 1, 10);
      rect(ramp.light, sx - 25, deck - 40, s.t % 0.5 < 0.25 ? 6 : 5, 3);
      const top = BASE - track.heightAt(GATE_X);
      const k = Math.min(1, s.gateT / 0.32);
      const slope = Math.atan(track.slopeAt(GATE_X + 6));
      const ang = Math.PI / 2 + 0.1 - (Math.PI / 2 + 0.1 - slope) * k * k;
      for (let i = 0; i < 20; i++) {
        const gx = sx + GATE_X + Math.cos(ang) * i;
        const gy = top - Math.sin(ang) * i;
        const band = Math.floor(i / 3) % 2 ? N.w : ramp.base;
        dot(N.o, gx - 2, gy); dot(band, gx - 1, gy); dot(band, gx, gy); dot(N.o, gx + 1, gy);
      }
      const lx = sx + GATE_X + 9;
      const lt = BASE - track.heightAt(GATE_X + 11);
      rect(N.o, lx + 2, lt - 8, 1, 8);
      rect(N.o, lx, lt - 28, 5, 20);
      ['#e0533d', '#ffd23f', '#ffd23f', '#5ac43a'].forEach((c, n) => {
        const lit = s.light > n;
        rect(lit ? c : '#3a3744', lx + 1, lt - 27 + n * 5, 3, 3);
        if (lit) dot(Scenes.mix(c, '#ffffff', 0.6), lx + 1, lt - 27 + n * 5);
      });
    }

    function drawFinish(k) {
      if (k !== last) return;
      const fx = track.finish - track.straights[k].s0 - s.cam;
      if (fx < -24 || fx > W + 20) return;
      const y = Math.round(BASE - track.heightAt(track.finish));
      rect(N.o, fx - 1, y - 32, 1, 32); rect(N.o, fx + 22, y - 32, 1, 32);
      for (let i = 0; i < 22; i++) for (let j = 0; j < 4; j++) dot((Math.floor(i / 2) + Math.floor(j / 2)) % 2 ? N.o : N.w, fx + i, y - 34 + j);
      for (let j = 0; j < 7; j++) dot(j % 2 ? N.o : N.w, fx + 10, y - 7 + j);
    }

    // ---------- Drawing: the overhead berm ----------

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

    // Each rider is drawn upright on a small canvas, then turned by its pitch
    // around the point where the wheels meet the ground. A rider further back is a little darker.
    function paintRider(r, look, lane) {
      sctx.clearRect(0, 0, 32, 32);
      const tone = c => (lane ? Scenes.mix(c, '#000000', 0.08 * lane) : c);
      const spin = r.x / 4;
      const low = Math.round((r.air ? 2 : 0) + r.crouch * 2);
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
      const hip = [OX - 3, OY - 15 + low];
      const shoulder = [OX + 1, OY - 20 + low];
      const hands = [head[0] - 1, head[1] - 3];
      const ca = r.crank;
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
        let knee = [hip[0] + dx / 2 + (dy / d) * bend, hip[1] + dy / 2 - (dx / d) * bend];
        if (knee[0] < hip[0] + dx / 2) knee = [hip[0] + dx / 2 - (dy / d) * bend, hip[1] + dy / 2 + (dx / d) * bend];
        const leg = tone(k === 0 ? N.K : N.k);
        thick(leg, hip, knee, 2);
        sline(leg, knee[0], knee[1], pedal[0], pedal[1]);
        sdot(N.o, pedal[0], pedal[1]);
        sdot(N.o, pedal[0] + 1, pedal[1]);
      });
      thick(tone(look.jersey), hip, shoulder, 3);
      sline(tone(look.frame), hip[0], hip[1], shoulder[0], shoulder[1]);
      thick(tone(look.light), [shoulder[0] + 1, shoulder[1] + 1], hands, 2);
      sdot(N.o, hands[0], hands[1]);
      sdot(N.o, hands[0] + 1, hands[1]);
      const hx = shoulder[0];
      const hy = shoulder[1] - 7;
      const HELMET = ['.oooo..', 'o1122o.', 'o22222o', 'o22wsso', '.o22ss.', '..ooo..'];
      HELMET.forEach((row, j) => [...row].forEach((ch, i) => {
        const col = { o: N.o, 1: tone(look.light), 2: tone(look.jersey), w: N.w, s: N.s }[ch];
        if (col) sdot(col, hx + i - 1, hy + j);
      }));
    }

    const top = document.createElement('canvas');
    top.width = 32;
    top.height = 32;
    const tctx = top.getContext('2d');
    function paintTop(look, tone) {
      tctx.clearRect(0, 0, 32, 32);
      const put = (c, x, y, w, h) => { tctx.fillStyle = c; tctx.fillRect(x, y, w, h); };
      put(N.o, 9, 15, 4, 2); put(N.o, 19, 15, 4, 2);
      put(tone(look.frame), 12, 15, 8, 2);
      put(N.o, 18, 12, 1, 8);
      put(tone(look.jersey), 12, 13, 5, 6);
      put(tone(look.light), 15, 14, 3, 4);
      put(N.o, 16, 14, 1, 4);
    }

    // The player's rider gets a 1-pixel light outline, drawn from a white copy of the sprite.
    const glow = document.createElement('canvas');
    glow.width = 32;
    glow.height = 32;
    const gctx = glow.getContext('2d');
    function outline(from) {
      gctx.clearRect(0, 0, 32, 32);
      gctx.drawImage(from, 0, 0);
      gctx.globalCompositeOperation = 'source-in';
      gctx.fillStyle = '#fffbe8';
      gctx.fillRect(0, 0, 32, 32);
      gctx.globalCompositeOperation = 'source-over';
    }

    // Draw one rider in the current view, into the world canvas.
    function drawRider(r, view) {
      const look = JERSEYS[r.lane];
      const isPlayer = r === s.player;
      const p = place(view, r.x, r.h, r.lane);
      if (!p) return;
      if (view.kind === 'berm') {
        g.fillStyle = 'rgba(70,40,20,0.35)';
        g.fillRect(Math.round(p.x) - 4, Math.round(p.y) - 1, 8, 3);
        paintTop(look, c => (r.lane ? Scenes.mix(c, '#000000', 0.08 * r.lane) : c));
        g.save();
        g.translate(Math.round(p.x), Math.round(p.y - 0.5 * Math.max(0, p.hAbove || 0)));
        g.rotate(p.head);
        if (isPlayer) {
          outline(top);
          [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => g.drawImage(glow, -16 + dx, -16 + dy));
        }
        g.drawImage(top, -16, -16);
        g.restore();
        return;
      }
      const sx = Math.round(p.x);
      const sy = Math.round(p.y);
      const spread = r.air ? Math.max(3, 7 - Math.round((r.h - track.heightAt(r.x)) / 6)) : 8;
      rect('rgba(70,40,20,0.35)', sx - spread, Math.round(p.gy) - 1, spread * 2, 2);
      let pitch = p.off ? p.pitch : r.pitch;
      if (r.crashT > 0) pitch = -((1.1 - r.crashT) * 7);
      const lift = r.crashT > 0 ? 0
        : r.manual && r.manualGrade !== 'roll' && r.x < r.manual.lip + 6 ? WHEELIE_LIFT
          : r.charge > 0 ? 0 : liftAngle(r.lift);
      paintRider(r, look, r.lane);
      g.save();
      g.translate(sx, sy);
      g.rotate(-pitch);
      g.translate(-6, 0);
      g.rotate(-lift);
      g.translate(6, 0);
      if (isPlayer) {
        outline(spr);
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => g.drawImage(glow, -OX + dx, -OY + dy));
      }
      g.drawImage(spr, -OX, -OY);
      g.restore();
    }

    // The pump strips: on the player's lane, before each roller and jump still ahead, green
    // where a press is perfect and amber where it is good. The next one is lit; the one after it is faint.
    function drawStrips(view) {
      if (s.phase !== 'riding' && s.phase !== 'cadence' && s.phase !== 'ready') return;
      const r = s.player;
      const wheel = r.x + WHEEL;
      const ahead = track.features.filter(f => {
        const at = f.x0;
        return at + WINDOWS[f.kind].good[1] >= wheel - 4 && !r.used.has(f) && r.manual !== f && !(r.air && r.jump === f);
      }).slice(0, 2);
      ahead.reverse().forEach((f, k) => {
        const faint = ahead.length === 2 && k === 0;
        const at = f.x0;
        const w = WINDOWS[f.kind];
        const over = !faint && wheel >= at + w.perfect[0] && wheel <= at + w.perfect[1];
        for (let tx = Math.ceil(at + w.good[0]); tx <= at + w.good[1]; tx++) {
          const p = place(view, tx, track.heightAt(tx), 0);
          if (!p || p.x < 0 || p.x >= W) continue;
          const y = Math.round(p.gy);
          const perfect = tx >= at + w.perfect[0] && tx <= at + w.perfect[1];
          const c = perfect ? (over ? '#e8ffd0' : '#5ac43a') : '#ffcf4a';
          rect(faint ? Scenes.mix(c, '#c98a55', 0.55) : c, p.x, y - 2, 1, 2);
          if (perfect && !faint) dot(over ? '#ffffff' : '#9be36c', p.x, y - 3);
        }
      });
    }

    function drawDust(view) {
      s.dust.forEach(d => {
        const p = place(view, d.x, d.y, 0);
        if (p) dot(d.life > 0.3 ? '#dba06d' : '#c98a55', p.x, p.y);
      });
      const v = s.player.air ? Math.hypot(s.player.vx, s.player.vy) : s.player.v;
      if (s.phase === 'riding' && v > 105) {
        const r = Scenes.rng(Math.floor(s.t * 20));
        for (let i = 0; i < 5; i++) rect('rgba(255,255,255,0.8)', Math.floor(r() * W), 24 + Math.floor(r() * 50), 6 + Math.floor(r() * 10), 1);
      }
    }

    // The world for one view, drawn unmirrored; a berm view is then drawn as is, a straight is mirrored if it runs back.
    function drawWorld(view) {
      if (view.kind === 'berm') {
        g.drawImage(overhead, 0, 0);
      } else {
        drawSky();
        drawHills();
        drawGround(view.k);
        if (view.k === 0) drawStart();
        drawFinish(view.k);
      }
      drawStrips(view);
      drawDust(view);
      [...s.riders].sort((a, b) => (view.kind === 'berm' ? (place(view, a.x, a.h, a.lane) || {}).y - (place(view, b.x, b.h, b.lane) || {}).y : b.lane - a.lane))
        .forEach(r => drawRider(r, view));
    }

    // The map: a line for each straight, joined by the berms at the ends, with a dot for each rider.
    function mapPoint(tx) {
      for (const b of track.berms) {
        if (tx >= b.b0 && tx <= b.b1) {
          const f = (tx - b.b0) / (b.b1 - b.b0);
          const dir = track.straights[b.n - 1].dir;
          return [dir > 0 ? 134 + Math.round(2 * Math.sin(Math.PI * f)) : 66 - Math.round(2 * Math.sin(Math.PI * f)), 3 + 2 * (b.n - 1) + 2 * f];
        }
      }
      let k = track.straights.findIndex(st => tx < st.s1);
      if (k < 0) k = last;
      const st = track.straights[k];
      const end = k === last ? track.finish : st.s1;
      const f = Math.max(0, Math.min(1, (tx - st.s0) / (end - st.s0)));
      return [st.dir > 0 ? 66 + 68 * f : 134 - 68 * f, 3 + 2 * k];
    }

    function drawMap() {
      rect('rgba(29,27,34,0.6)', 60, 0, 80, 16);
      track.straights.forEach((st, k) => rect('#d3cec6', 66, 3 + 2 * k, 68, 1));
      track.berms.forEach(b => {
        const x = track.straights[b.n - 1].dir > 0 ? 135 : 64;
        const y = 3 + 2 * (b.n - 1);
        rect('#d3cec6', x, y, 1, 3);
      });
      dot(ramp.light, 64, 2); dot(ramp.light, 65, 2);
      const [fx, fy] = mapPoint(track.finish);
      dot(N.w, fx, fy - 1); dot(N.o, fx, fy); dot(N.w, fx, fy + 1);
      [...s.riders].reverse().forEach(r => {
        const [x, y] = mapPoint(Math.min(r.x, track.finish));
        const look = JERSEYS[r.lane];
        rect(r === s.player ? N.w : look.jersey, x - 1, y - 1, 3, 3);
        if (r === s.player) dot(look.jersey, x, y);
      });
    }

    function drawHud(view) {
      drawMap();
      const v = Math.round(s.player.air ? Math.hypot(s.player.vx, s.player.vy) : s.player.v);
      say('SPD', 4, 12, N.o);
      rect('#1d1b22', 18, 12, 32, 5);
      rect(v > 112 ? ramp.light : ramp.base, 19, 13, Math.round(30 * Math.min(1, v / 150)), 3);
      if (s.callT > 0 && s.call) {
        const w = s.call.length * 4 - 1;
        rect(N.o, W / 2 - w / 2 - 3, 18, w + 6, 9);
        sayCenter(s.call, 20, s.callColor, 1);
      }
      drawHoldMeter(view);
    }

    // The hold meter beside the rider: the green band is the charge that lands clean at this speed.
    function drawHoldMeter(view) {
      const r = s.player;
      if (s.phase !== 'riding' || r.air || r.crashT > 0 || track.zoneAt(r.x) === 'berm' || !s.playerAt) return;
      const j = track.jumps.find(f => f.lip > r.x && f.x0 - r.x < 130 && r.manual !== f);
      if (!j) return;
      if (s.rangeFor !== j || s.rangeT <= 0) {
        s.range = cleanRange(track, j, r.v, r.x, input.pedal || bot);
        s.rangeFor = j;
        s.rangeT = 0.1;
      }
      const bx = Math.round(s.playerAt.x) + (view.flip ? 12 : -15);
      const by = Math.round(s.playerAt.y) - 30;
      rect(N.o, bx - 1, by - 1, 5, 22);
      rect('#3a3744', bx, by, 3, 20);
      if (s.range) {
        const lo = Math.round(20 * s.range[0]);
        const hi = Math.round(20 * s.range[1]);
        rect('#5ac43a', bx, by + 20 - Math.max(hi, lo + 1), 3, Math.max(1, hi - lo));
      } else {
        say('TAP', bx - 4, by - 7, '#ffd56b');
      }
      const c = Math.round(20 * r.charge);
      if (c > 0) {
        rect(N.w, bx, by + 20 - c, 3, 1);
        rect('rgba(255,255,255,0.45)', bx, by + 21 - c, 3, c - 1);
      }
    }

    function drawStartPanel() {
      if (s.phase === 'cadence') {
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
      if (s.practice) sayCenter('PRACTICE RUN', 34, N.w, 2);
      else sayCenter(['1ST PLACE', '2ND PLACE', '3RD PLACE'][place - 1], 34, place === 1 ? '#ffd56b' : N.w, 2);
      sayCenter(time.toFixed(2) + ' S', 50, N.w, 1);
      const st = s.player.stats;
      sayCenter(`PUMPS ${st.perfect + st.good}   CLEAN AIR ${st.clean}/${st.jumps}`, 60, ramp.light, 1);
      if (place === 1 && !s.practice) sayCenter('HOLESHOT TO HARDWARE', 70, '#9be36c', 1);
    }

    function render() {
      const view = s.view;
      g = wctx;
      g.clearRect(0, 0, W, H);
      drawWorld(view);
      const p = s.player;
      s.playerAt = place(view, p.x, p.h, p.lane);
      g = ctx;
      ctx.save();
      if (s.shake > 0) ctx.translate(Math.round((rand() - 0.5) * 3), Math.round((rand() - 0.5) * 3));
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (view.flip) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.drawImage(world, 0, 0);
      ctx.restore();
      if (s.playerAt && view.flip) s.playerAt = Object.assign({}, s.playerAt, { x: W - s.playerAt.x });
      if (s.wipeT > 0) {
        const t = 1 - s.wipeT / 0.3;
        for (let y = 0; y < H; y += 10) for (let x = 0; x < W; x += 10) {
          if ((view.flip ? W - x : x) / W * 0.7 + y / H * 0.3 > t) ctx.drawImage(wipeFrom, x, y, 10, 10, x, y, 10, 10);
        }
      }
      if (s.playerAt && s.phase !== 'finished') {
        const mx = Math.round(s.playerAt.x);
        const my = Math.round(s.playerAt.top ? s.playerAt.y - 12 : s.playerAt.y - 30);
        rect(N.w, mx - 2, my, 5, 1); rect(N.w, mx - 1, my + 1, 3, 1); dot(N.w, mx, my + 2);
      }
      ctx.restore();
      pctx.clearRect(0, 0, W, H);
      pctx.drawImage(canvas, 0, 0);
      drawHud(view);
      drawStartPanel();
      drawResults();
    }

    function feel(r, e) {
      const sound = {
        perfect: ['pump', true], 'good-early': ['pump', false], 'good-late': ['pump', false], early: ['bump'], bump: ['bump'],
        manual: ['pump', true], 'manual-good': ['pump', false], 'manual-2': ['pump', true], air: ['pop'], clean: ['land'], rough: ['land'],
        cased: ['bump'], flat: ['land'], crash: ['crash'],
      }[e];
      if (sound) Sound.play(sound[0], sound[1]);
      const puffs = { clean: 6, rough: 8, cased: 10, flat: 10, crash: 16, bump: 4, early: 4, perfect: 3 }[e] || 0;
      for (let i = 0; i < puffs; i++) s.dust.push({ x: r.x - 4 + rand() * 10, y: r.h, vx: -20 - rand() * 30, vy: 10 + rand() * 25, life: 0.5 + rand() * 0.3 });
      if (e === 'crash' || e === 'cased' || e === 'flat') s.shake = e === 'crash' ? 0.35 : 0.2;
    }

    // ---------- The race ----------

    function begin() {
      if (s.phase !== 'ready') return;
      Sound.play('warm');
      s.cue = 0;
      s.redAt = 2.1 + 1.1 * rand();
      s.dropAt = s.redAt + 3 * LIGHT_GAP;
      setPhase('cadence');
      msg.textContent = 'Riders ready. Watch the gate: pedal on the green.';
    }

    function press() {
      if (s.phase === 'ready') { begin(); return; }
      if (s.phase !== 'riding') return;
      const r = s.player;
      input.held = true;
      input.heldFor = 0;
      r.press = { x: r.x + WHEEL, used: false };
      if (!r.air) r.lift = 0;
    }

    function release() {
      input.held = false;
      input.heldFor = 0;
    }

    function pedal(on) {
      if (on && s.phase === 'ready') { begin(); input.pedal = false; return; }
      input.pedal = on;
      if (on && s.phase === 'cadence' && s.cue >= 2 && !s.early) {
        s.early = true;
        s.player.stall = 0.7;
        call('HIT THE GATE', 1.2, '#f08a75');
        msg.textContent = 'Too early: you hit the gate. Wait for the green.';
      }
    }

    function drop() {
      setPhase('riding');
      s.gate = 1;
      s.light = 4;
      s.reactionStart = s.t;
      Sound.play('gate');
      msg.textContent = 'Go! Hold Pedal. Tap Jump on the lit strip to wheelie over, or hold it to fly.';
    }

    function finishRace() {
      const r = s.player;
      const place = 1 + s.riders.filter(o => o !== r && o.done && o.time < r.time).length;
      s.results = { place, time: r.time };
      setPhase('finished');
      Sound.play(place === 1 && !s.practice ? 'win' : 'finish');
      stage.dataset.place = String(place);
      board.querySelector('.sb-time').textContent = r.time.toFixed(2);
      if (!s.practice) {
        board.querySelector('.sb-place').textContent = ['1st', '2nd', '3rd'][place - 1];
        if (best === null || r.time < best) best = r.time;
        board.querySelector('.sb-best').textContent = best.toFixed(2);
      }
      msg.textContent = s.practice ? `Practice run: ${r.time.toFixed(2)} seconds from where you started.`
        : place === 1 ? `You won the moto in ${r.time.toFixed(2)} seconds.` : `${['', '2nd', '3rd'][place - 1]} place in ${r.time.toFixed(2)} seconds.`;
      pedalBtn.hidden = true;
      jumpBtn.hidden = true;
      againBtn.hidden = false;
      againBtn.focus();
    }

    const EVENT_CALLS = {
      'good-early': 1, 'good-late': 1, perfect: 1, early: 1, bump: 1, manual: 1, 'manual-good': 1, 'manual-2': 1,
      clean: 1, roll: 1, cased: 1, rough: 1, flat: 1, crash: 1,
    };

    function update(dt) {
      s.t += dt;
      s.callT = Math.max(0, s.callT - dt);
      if (s.phase === 'cadence') {
        s.cue += dt;
        const was = s.light;
        s.light = s.cue < s.redAt ? 0 : Math.min(4, 1 + Math.floor((s.cue - s.redAt) / LIGHT_GAP + 1e-6));
        if (s.light > was) Sound.play('light', s.light - 1);
        if (s.cue >= s.dropAt) drop();
        return;
      }
      if (s.gate) s.gateT += dt;
      s.shake = Math.max(0, s.shake - dt);
      s.dust.forEach(d => { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy -= 60 * dt; });
      s.dust = s.dust.filter(d => d.life > 0);
      if (s.phase !== 'riding' && s.phase !== 'finished') return;
      if (input.held) input.heldFor += dt;
      if (s.phase === 'riding' && s.reaction === undefined) s.reaction = null;
      if (s.phase === 'riding' && s.reaction === null && (input.pedal || bot) && s.player.stall <= 0 && !s.practice) {
        s.reaction = s.t - s.reactionStart;
        if (!s.early && s.reaction < 0.3) { s.player.v += 20; call('HOLESHOT', 1, '#9be36c'); }
      }
      s.riders.forEach(r => {
        if (r.done && r !== s.player) { r.x += r.v * dt; return; }
        if (r === s.player && s.phase === 'finished') { r.x += Math.max(0, r.v - 30 * dt) * dt; r.v = Math.max(0, r.v - 40 * dt); return; }
        if (r !== s.player && s.t - s.reactionStart < r.react && !s.practice) return;
        let inp;
        if (r === s.player) inp = bot ? brain(r, track, BOT, rand, dt) : input;
        else inp = brain(r, track, r.ai, rand, dt);
        let e = null;
        const n = Math.ceil(dt / 0.004);
        for (let i = 0; i < n; i++) e = step(r, track, inp, dt / n) || e;
        if (!r.done) r.time += dt;
        if (!r.done && r.x >= track.finish) { r.done = true; if (r === s.player) finishRace(); }
        if (r === s.player && e) {
          if (e === 'air') call(s.player.flewWith > 0.7 ? 'BIG AIR' : 'AIR', 0.6, '#9be36c');
          else if (CALLS[e] && EVENT_CALLS[e]) { call(CALLS[e][0], 0.9, CALLS[e][1]); feel(r, e); }
          if (e === 'crash') msg.textContent = 'Came up short. Hold Jump longer, or tap it on the lit strip to wheelie over.';
          stage.dataset.perfect = String(r.stats.perfect);
        }
      });
      if (s.phase === 'riding' && !s.practice) {
        board.querySelector('.sb-time').textContent = s.player.time.toFixed(1);
        const ahead = s.riders.filter(o => o !== s.player && (o.done || o.x > s.player.x)).length;
        board.querySelector('.sb-place').textContent = ['1st', '2nd', '3rd'][ahead];
      }
      stage.dataset.x = String(Math.round(s.player.x));
      stage.dataset.speed = String(Math.round(s.player.v));
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      update(dt);
      const p = s.player;
      const v = viewAt(p.x);
      if (!s.view || s.view.key !== v.key) {
        if (s.view && s.phase !== 'ready') {
          fctx.clearRect(0, 0, W, H);
          fctx.drawImage(previous, 0, 0);
          s.wipeT = 0.3;
        }
        s.view = v;
      }
      s.wipeT = Math.max(0, s.wipeT - dt);
      if (v.kind === 'side') {
        const st = track.straights[v.k];
        const want = s.phase === 'ready' || s.phase === 'cadence' ? CAM_START : p.x - st.s0 - SCREEN_X + Math.min(30, p.v * 0.18);
        const lo = v.k === 0 ? CAM_START : -80;
        s.cam += (Math.max(lo, want) - s.cam) * Math.min(1, dt * 4);
      }
      render();
      raf = requestAnimationFrame(tick);
    }

    function viewAt(x) {
      for (const b of track.berms) {
        if (x >= b.b0 - b.ain && x <= b.b1 + b.aout) return { kind: 'berm', b, key: 'b' + b.n, flip: track.straights[b.n - 1].dir < 0 };
      }
      let k = track.straights.findIndex(st => x < st.s1);
      if (k < 0) k = last;
      return { kind: 'side', k, key: 's' + k, flip: track.straights[k].dir < 0 };
    }

    // Start from a point on the track, for practice: the riders are put there at speed.
    function goTo(spot) {
      reset();
      if (spot === 'gate') return;
      const [x, v] = SPOT_AT[spot];
      s.practice = true;
      setPhase('riding');
      s.gate = 1;
      s.gateT = 1;
      s.light = 4;
      s.reactionStart = s.t;
      s.riders.forEach((r, lane) => {
        r.x = x - [0, 14, -10][lane];
        r.h = track.heightAt(r.x);
        r.v = v;
        r.pitch = Math.atan(track.slopeAt(r.x));
        track.features.forEach(f => {
          if ((f.kind === 'jump' ? f.lip : f.x0) < r.x) { r.used.add(f); r.planned.add(f); }
        });
      });
      board.querySelector('.sb-place').textContent = '--';
      msg.textContent = 'Practice: hold Pedal, tap Jump on the lit strip to wheelie, or hold it to fly.';
    }

    // ---------- Controls ----------

    const hold = (btn, down, up) => {
      btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture && btn.setPointerCapture(e.pointerId); down(); });
      btn.addEventListener('pointerup', e => { e.preventDefault(); up(); });
      btn.addEventListener('pointercancel', () => up());
      btn.addEventListener('lostpointercapture', () => up());
      btn.addEventListener('click', e => e.preventDefault());
    };
    hold(pedalBtn, () => pedal(true), () => pedal(false));
    hold(jumpBtn, press, release);
    hold(canvas, press, release);
    againBtn.addEventListener('click', () => { reset(); jumpBtn.focus(); });
    spotBtns.forEach(b => b.addEventListener('click', () => { goTo(b.dataset.spot); canvas.focus(); }));
    const PEDAL_KEYS = ['ArrowRight', 'd', 'D'];
    const JUMP_KEYS = [' ', 'ArrowUp', 'w', 'W'];
    const keydown = e => {
      if (PEDAL_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) pedal(true); }
      else if (JUMP_KEYS.includes(e.key)) { e.preventDefault(); if (!e.repeat) press(); }
      else if (e.key === 'Enter' && s.phase === 'finished') { e.preventDefault(); reset(); }
    };
    const keyup = e => {
      if (PEDAL_KEYS.includes(e.key)) pedal(false);
      if (JUMP_KEYS.includes(e.key)) release();
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    // For tests and playtesting: the live state and the track.
    stage.bmx = { s, track, input, press, release, pedal, goTo, setBot: on => { bot = on; if (on && s.phase === 'ready') begin(); } };

    reset();
    jumpBtn.focus();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }

  Games.register('bmx', {
    title: 'BMX race',
    help: 'Hold Pedal for speed. Tap Jump on the lit strip before a roller or jump to pump or wheelie over it; hold Jump to fly bigger.',
    mount,
    // The physics, without drawing, for tests.
    sim: { buildTrack, newRider, step, brain, cleanRange, liftAngle, WINDOWS, LANE_GAP, BOT, RIVALS },
  });
})();
