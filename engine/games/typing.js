/*
 * Typing race, the Tutorial. The computer lab at school: everyone types the
 * same line, and a little car in your lane moves with every right letter.
 * Beat the two kids beside you to the finish.
 *
 * One control: the keyboard. A wrong letter flashes red and does not move you
 * on. Your words per minute count from Go: letters typed / 5 / minutes. On a
 * phone, tap the screen to open the keyboard.
 */
(function () {
  'use strict';

  const W = 200;
  const H = 100;
  const START = 22;
  const FINISH = 182;
  const LANES = [36, 56, 76];
  // The two kids beside you, in words per minute. The fast one always won.
  const RIVALS = [{ name: 'KIM', wpm: 20 }, { name: 'MAX', wpm: 35 }];
  const LINES = [
    'the quick brown fox jumps over the lazy dog',
    'my bike is fast but my fingers are faster',
    'home row hands and eyes up on the screen',
  ];
  const CAR = [
    '...ooooo....',
    '..o1ww11o...',
    '.oo22222oooo',
    'o22222222221',
    'o22222222222',
    'oonnoooonnoo',
    '..oo....oo..',
  ];
  const BLUE = { light: '#8fa8ff', base: '#4d6be0', shade: '#2c3f9c' };
  const RED = { light: '#f5a08f', base: '#e0533d', shade: '#a3352a' };

  function mount(stage, ramp, opts) {
    const o = Object.assign({ rivals: RIVALS, lines: LINES }, opts);
    const el = Sheet.el;
    const canvas = el('canvas', { class: 'game-canvas px', width: W, height: H, role: 'img', 'aria-label': 'Three lanes on a classroom computer screen, one car each', style: `--r:${W / H}` });
    const line = el('p', { class: 'type-line', 'aria-live': 'off' });
    const input = el('input', { class: 'type-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Type the line here' });
    const cells = ['WPM', 'Accuracy', 'Place'].map(label => el('div', {}, el('span', { text: label }), el('b', { text: '--' })));
    const board = el('div', { class: 'scoreboard', 'aria-live': 'polite' }, cells);
    const msg = el('p', { class: 'game-msg', 'aria-live': 'polite', text: 'Type the line when the light says Go. Press Enter or Start.' });
    const go = el('button', { class: 'btn btn--accent' }, 'Start ', el('kbd', { text: 'Enter' }));
    const again = el('button', { class: 'btn', hidden: '' }, 'Race again');
    stage.append(canvas, line, input, board, msg, el('div', { class: 'game-actions' }, go, again));

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const say = (text, x, y, color, scale) => Pixel.text(ctx, text, Math.round(x), Math.round(y), color, scale || 1);
    const width = (text, scale) => (String(text).length * 4 - 1) * (scale || 1);
    const sayCenter = (text, y, color, scale) => say(text, W / 2 - width(text, scale) / 2, y, color, scale);
    const sprite = (rows, x, y, r) => rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const c = ch === '1' ? r.light : ch === '2' ? r.base : ch === '3' ? r.shade : ch === 'o' ? '#1d1b22' : ch === 'w' ? '#f6f4ef' : ch === 'n' ? '#7d808a' : null;
      if (c) rect(c, x + i, y + j, 1, 1);
    }));

    const s = { phase: 'ready', race: 0, text: '', typed: 0, errors: 0, t: 0, count: 0, you: 0, kids: [], puffs: [], flash: 0, wpm: 0, place: 0, finishAt: null };
    stage.typing = s;
    let raf = 0;
    let last = performance.now();

    function setPhase(phase) { s.phase = phase; stage.dataset.state = phase; }

    function reset() {
      s.text = o.lines[s.race % o.lines.length];
      Object.assign(s, { typed: 0, errors: 0, t: 0, count: 3, you: 0, puffs: [], flash: 0, wpm: 0, place: 0, finishAt: null });
      s.kids = o.rivals.map((kid, k) => ({ ...kid, at: 0, done: null, seed: k * 1.7 + 0.4 }));
      cells.forEach(c => { c.querySelector('b').textContent = '--'; });
      again.hidden = true;
      go.hidden = false;
      setPhase('ready');
      drawLine();
    }

    function drawLine() {
      const done = s.text.slice(0, s.typed);
      const next = s.text[s.typed] || '';
      line.replaceChildren(
        el('span', { class: 'type-done', text: done }),
        el('span', { class: 'type-next' + (s.flash > 0 ? ' is-wrong' : ''), text: next === ' ' ? ' ' : next }),
        el('span', { class: 'type-rest', text: s.text.slice(s.typed + 1) }));
    }

    function start() {
      if (s.phase === 'countdown' || s.phase === 'racing') return;
      if (s.phase === 'done') { s.race += 1; reset(); }
      setPhase('countdown');
      s.count = 3;
      s.t = 0;
      go.hidden = true;
      msg.textContent = 'Fingers on the home row...';
      input.value = '';
      input.focus({ preventScroll: true });
      Sound.play('light', 0);
    }

    function finish() {
      s.finishAt = s.t;
      s.wpm = Math.round((s.text.length / 5) / (s.t / 60));
      s.place = 1 + s.kids.filter(k => k.done !== null && k.done < s.t).length;
      const accuracy = Math.round((100 * s.text.length) / (s.text.length + s.errors));
      cells[0].querySelector('b').textContent = String(s.wpm);
      cells[1].querySelector('b').textContent = accuracy + '%';
      cells[2].querySelector('b').textContent = ['1st', '2nd', '3rd'][s.place - 1];
      stage.dataset.wpm = String(s.wpm);
      stage.dataset.place = String(s.place);
      msg.textContent = s.place === 1 ? `You won the class race at ${s.wpm} words a minute.` : `${['', '2nd', '3rd'][s.place - 1]} place at ${s.wpm} words a minute. ${s.kids[s.kids.length - 1].name} always won this one.`;
      setPhase('done');
      again.hidden = false;
      Sound.play(s.place === 1 ? 'win' : 'finish');
    }

    function key(ch) {
      if (s.phase !== 'racing' || !ch) return;
      if (ch === s.text[s.typed]) {
        s.typed += 1;
        s.you = s.typed / s.text.length;
        s.puffs.push({ x: START + s.you * (FINISH - START) - 13, y: LANES[0] + 2, age: 0 });
        Sound.play('pump', true);
        if (s.typed >= s.text.length) finish();
      } else {
        s.errors += 1;
        s.flash = 0.25;
        Sound.play('bump');
      }
      drawLine();
    }

    input.addEventListener('input', e => {
      const typed = e.data || input.value;
      input.value = '';
      [...(typed || '')].forEach(key);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); if (s.phase === 'ready' || s.phase === 'done') start(); }
      if (e.key === 'Escape') return;
    });
    const onKey = e => {
      if (e.target === input) return;
      if (e.key === 'Enter' && (s.phase === 'ready' || s.phase === 'done')) { e.preventDefault(); start(); return; }
      if (e.key.length === 1 && s.phase === 'racing') { e.preventDefault(); input.focus({ preventScroll: true }); key(e.key); }
    };
    document.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', () => { input.focus({ preventScroll: true }); if (s.phase === 'ready') start(); });
    go.addEventListener('click', start);
    again.addEventListener('click', start);

    function step(dt) {
      s.flash = Math.max(0, s.flash - dt);
      s.puffs.forEach(p => { p.age += dt; p.x -= dt * 14; });
      s.puffs = s.puffs.filter(p => p.age < 0.5);
      if (s.phase === 'countdown') {
        s.t += dt;
        const n = 3 - Math.floor(s.t / 0.8);
        if (n !== s.count) { s.count = n; Sound.play('light', n > 0 ? 0 : 3); }
        if (n <= 0) { setPhase('racing'); s.t = 0; msg.textContent = 'Go. Type the line.'; }
        return;
      }
      if (s.phase !== 'racing' && s.phase !== 'done') return;
      s.t += dt;
      // Each kid types at a steady pace with a little wobble, and pauses now and then on a hard letter.
      s.kids.forEach(k => {
        if (k.done !== null) return;
        const wobble = 1 + 0.18 * Math.sin(s.t * 2.3 + k.seed * 5) - (Math.sin(s.t * 0.9 + k.seed) > 0.93 ? 0.8 : 0);
        k.at += (dt * (k.wpm * 5) / 60 / s.text.length) * Math.max(0.1, wobble);
        if (k.at >= 1) { k.at = 1; k.done = s.t; }
      });
      if (s.phase === 'racing') cells[0].querySelector('b').textContent = s.t > 1 ? String(Math.round((s.typed / 5) / (s.t / 60))) : '--';
    }

    function draw(time) {
      rect('#1b2a86', 0, 0, W, H);
      for (let y = 1; y < H; y += 2) rect('#18257a', 0, y, W, 1);
      rect('#0f185a', 0, 0, W, 13);
      say('TYPING RACE', 5, 4, '#f6f4ef');
      say('WPM', 150, 4, ramp.light);
      say(s.phase === 'racing' || s.phase === 'done' ? String(s.phase === 'done' ? s.wpm : Math.round((s.typed / 5) / (Math.max(1, s.t) / 60))).padStart(3, ' ') : '--', 166, 4, '#f6f4ef');
      // Lanes, the start line and a checkered finish.
      LANES.forEach((y, k) => {
        rect('#24369c', 4, y - 7, W - 8, 15);
        rect('#3a4fb8', 4, y - 7, W - 8, 1);
        for (let x = 8; x < W - 8; x += 8) rect('#4a5fc8', x, y + 7, 4, 1);
        say(k === 0 ? 'YOU' : s.kids[k - 1] ? s.kids[k - 1].name : '', 6, y - 2, k === 0 ? ramp.light : '#c3c6cc');
      });
      rect('#f6f4ef', START, LANES[0] - 8, 1, LANES[2] - LANES[0] + 16);
      for (let y = LANES[0] - 8; y < LANES[2] + 8; y += 2) for (let x = 0; x < 4; x += 2) rect('#f6f4ef', FINISH + x + ((y / 2) % 2 ? 1 : 0), y, 1, 1);
      // The cars: yours in the act's color.
      const carAt = p => START + p * (FINISH - START) - CAR[0].length;
      s.puffs.forEach(p => rect(p.age < 0.25 ? '#c3c6cc' : '#7d808a', p.x, p.y + Math.round(p.age * 4), 2, 2));
      sprite(CAR, carAt(s.you), LANES[0] - 3, ramp);
      s.kids.forEach((k, i) => sprite(CAR, carAt(k.at), LANES[i + 1] - 3, i === 0 ? BLUE : RED));
      if (s.phase === 'countdown') {
        const label = s.count > 0 ? String(s.count) : 'GO';
        rect('#0f185a', W / 2 - 18, 40, 36, 28);
        sayCenter(label, 44, s.count > 0 ? '#ffd166' : '#7fd09c', 4);
      }
      if (s.phase === 'done') {
        const place = ['1ST', '2ND', '3RD'][s.place - 1];
        rect('#0f185a', 40, 38, 120, 32);
        sayCenter(place + ' PLACE', 43, s.place === 1 ? '#ffd166' : '#f6f4ef', 2);
        sayCenter(`${s.wpm} WPM`, 58, ramp.light, 1);
      }
      if (s.phase === 'ready' && Math.floor(time * 2) % 2 === 0) sayCenter('PRESS START', 88, '#f6f4ef');
    }

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const wasFlash = s.flash > 0;
      step(dt);
      if (wasFlash && s.flash === 0) drawLine();
      draw(now / 1000);
      raf = requestAnimationFrame(loop);
    }

    reset();
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
  }

  Games.register('typing', {
    title: 'Typing race',
    help: 'Type the line as fast as you can. A wrong letter does not count. Beat the two kids beside you.',
    mount,
  });
  window.TypingRace = { mount, RIVALS, LINES };
})();
