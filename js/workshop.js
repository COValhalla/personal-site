// Draws every scene, cue, item sprite and gear piece on its own. Loaded by workshop.html only.
// Needs: Dom, Pixel, Story, Scenes
(function () {
  'use strict';

  const acts = Story.acts;
  const sample = acts[acts.length - 1];
  const SPRITE_SCALE = 4;
  const GEAR_SCALE = 3;

  const { el } = Dom;

  function card(label, art, ...more) {
    return el('figure', { class: 'ws-card' },
      el('div', { class: 'ws-art' }, art),
      ...more,
      el('figcaption', { text: label }));
  }

  // The act whose color the scene is drawn in, or the neutral gray when no act uses it.
  function rampFor(name) {
    const act = acts.find(a => a.scene === name || (a.stages || []).includes(name));
    return act ? act.color : Pixel.GRAY;
  }

  const onScreen = new Set();
  const stages = new Map();
  const watch = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) onScreen.add(target);
    else onScreen.delete(target);
    const stage = stages.get(target);
    if (isIntersecting) stage.start();
    else stage.stop();
  }));

  function sceneCard(name) {
    const canvas = el('canvas', { class: 'px ws-canvas', width: Scenes.W, height: Scenes.H, role: 'img', 'aria-label': `The ${name} scene` });
    const ramp = rampFor(name);
    let stage = null;

    function mountScene() {
      if (stage) stage.stop();
      stage = Scenes.mount(Scenes.get(name, sample), canvas, ramp, acts);
      stage.render();
      stages.set(canvas, stage);
      if (onScreen.has(canvas)) stage.start();
      return stage;
    }

    mountScene();
    watch.observe(canvas);

    const cues = Scenes.cuesOf(name);
    const controls = el('div', { class: 'ws-controls' });
    cues.forEach(cue => {
      const button = el('button', { type: 'button', text: `Play ${cue}` });
      button.addEventListener('click', () => mountScene().cue(cue));
      controls.append(button);
    });
    if (cues.length) {
      const reset = el('button', { type: 'button', text: 'Reset' });
      reset.addEventListener('click', () => mountScene());
      controls.append(reset);
    }

    return el('figure', { class: 'ws-card' }, canvas, controls, el('figcaption', { text: name }));
  }

  Scenes.names.forEach(name => document.getElementById('scenes-grid').append(sceneCard(name)));

  Object.keys(Pixel.ITEMS).forEach(name => {
    document.getElementById('sprites-grid').append(card(name, Pixel.item(name, Pixel.GRAY, SPRITE_SCALE, name)));
  });

  Object.keys(Pixel.HERO_GEAR).forEach(gear => {
    document.getElementById('gear-grid').append(card(gear, Pixel.hero(gear, Pixel.GRAY, GEAR_SCALE, gear)));
  });
})();
