/*
 * Little game sounds, made on the spot with Web Audio: no sound files.
 * Sound plays only inside games, after a click or key press opened them,
 * and the Sound button in every game turns it off for the rest of the visit.
 */
(function () {
  'use strict';

  let ctx = null;
  let on = true;

  function audio() {
    if (!on) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One square or triangle note, optionally sliding to another pitch.
  function tone(freq, length, opts) {
    const a = audio();
    if (!a) return;
    const o = Object.assign({ type: 'square', volume: 0.05, at: 0, to: null }, opts);
    const t = a.currentTime + o.at;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + length);
    gain.gain.setValueAtTime(o.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  // A burst of noise: dirt, a crash, a whoosh.
  function noise(length, opts) {
    const a = audio();
    if (!a) return;
    const o = Object.assign({ volume: 0.08, at: 0, low: 600 }, opts);
    const t = a.currentTime + o.at;
    const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * length), a.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = a.createBufferSource();
    src.buffer = buffer;
    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = o.low;
    const gain = a.createGain();
    gain.gain.value = o.volume;
    src.connect(filter).connect(gain).connect(a.destination);
    src.start(t);
  }

  const sounds = {
    // The gate: three low tones and a high one as it drops.
    light: k => tone(k < 3 ? 632 : 1265, k < 3 ? 0.12 : 0.35, { type: 'square', volume: 0.04 }),
    pump: good => tone(good ? 520 : 400, 0.09, { type: 'triangle', volume: 0.08, to: good ? 880 : 520 }),
    bump: () => noise(0.12, { volume: 0.12, low: 300 }),
    land: () => noise(0.16, { volume: 0.16, low: 400 }),
    crash: () => { noise(0.4, { volume: 0.22, low: 900 }); tone(180, 0.3, { type: 'square', volume: 0.04, to: 60 }); },
    pop: () => tone(300, 0.12, { type: 'triangle', volume: 0.08, to: 700 }),
    win: () => [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.18, { type: 'square', volume: 0.04, at: k * 0.12 })),
    finish: () => [392, 523].forEach((f, k) => tone(f, 0.16, { type: 'square', volume: 0.04, at: k * 0.12 })),
    // The hammer: a swish each turn, a release, a buzzer for a foul and a bell for a fair throw.
    swish: k => noise(0.18, { volume: 0.04 + k * 0.015, low: 900 + k * 250 }),
    release: () => noise(0.3, { volume: 0.09, low: 2000 }),
    thud: () => noise(0.2, { volume: 0.18, low: 250 }),
    foul: () => tone(140, 0.45, { type: 'sawtooth', volume: 0.05 }),
    fair: () => [880, 1320].forEach((f, k) => tone(f, 0.25, { type: 'triangle', volume: 0.07, at: k * 0.1 })),
  };

  window.Sound = {
    play(name, arg) { try { if (on && sounds[name]) sounds[name](arg); } catch (e) { /* no sound is fine */ } },
    get on() { return on; },
    set(value) { on = Boolean(value); if (!on && ctx) ctx.suspend(); },
  };
})();
