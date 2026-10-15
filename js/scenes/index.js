/*
 * The scene registry. Each file in js/scenes/ calls Scenes.add(name, scene) once,
 * the way each recipe calls Story.addAct, and the pages load those files after this one.
 * Needs: gsap, Draw
 *
 * A scene paints a still 160 x 72 background once, then draws its moving parts
 * over it on every frame while the act is on screen. It has:
 *   heroX     where the hero stands; the ground is at y = 64 in every scene
 *   arrive    optional: where the hero walks in from
 *   door      optional: the point the hero walks through to the next scene
 *   draw      paints the still background
 *   init      returns the scene's state
 *   frame     draws the moving parts from the state
 *   cues      short animations, by name
 * A scene that depends on the act, such as the character sheet, is registered as
 * a function that takes the act and returns the scene.
 *
 * A moment (beat) in a recipe can name a cue. A cue tweens the scene's state with
 * GSAP, and frame() draws whatever the state says. Played to its end, a cue
 * leaves the scene in its final state, so an act unlocked without motion looks the same.
 *
 * Colors come from the act's ramp plus the shared neutrals in pixel.js. Scenes
 * draw with the kit in js/draw.js and the props in js/scenes/props.js.
 */
(function () {
  'use strict';

  const W = 160;
  const H = 72;
  const GROUND = 64;
  const { rng, mix, rect } = Draw;

  const scenes = {};

  // A plain floor, used when a recipe names a scene that is not drawn yet.
  const blank = {
    heroX: 72,
    draw(ctx, c) {
      rect(ctx, mix(c.light, '#ffffff', 0.7), 0, 0, W, H);
      rect(ctx, c.shade, 0, GROUND, W, H - GROUND);
    },
    init: () => ({}),
    frame() {},
    cues: {},
  };

  function add(name, scene) {
    if (scenes[name]) throw new Error(`Two scenes are called "${name}".`);
    scenes[name] = scene;
  }

  function get(name, act) {
    const scene = scenes[name];
    if (typeof scene === 'function') return scene(act);
    return scene || blank;
  }

  // Mount a scene on a canvas. The returned stage draws on demand and runs its
  // loop only while start() has been called, so off-screen acts cost nothing.
  function mount(scene, canvas, ramp, allActs) {
    const bg = document.createElement('canvas');
    bg.width = W;
    bg.height = H;
    const bgCtx = bg.getContext('2d');
    bgCtx.imageSmoothingEnabled = false;
    scene.draw(bgCtx, ramp, allActs);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const state = (scene.init && scene.init()) || {};
    const born = performance.now();
    let running = false;

    function render() {
      ctx.drawImage(bg, 0, 0);
      if (scene.frame) scene.frame(ctx, ramp, state, (performance.now() - born) / 1000, allActs);
    }
    const tick = () => render();

    return {
      scene,
      state,
      render,
      // Play a cue as a GSAP timeline. Returns null when the scene has no such cue.
      cue(cueName) {
        const make = scene.cues && scene.cues[cueName];
        if (!make || !window.gsap) return null;
        return make(state, ramp);
      },
      // Jump a cue to its end, for acts unlocked without motion.
      settle(cueName) {
        const tl = this.cue(cueName);
        if (tl) { tl.progress(1); tl.kill(); }
        render();
      },
      start() { if (running || !window.gsap) return; running = true; gsap.ticker.add(tick); },
      stop() { if (!running) return; running = false; gsap.ticker.remove(tick); },
    };
  }

  window.Scenes = {
    W, H, GROUND,
    add, get, mount,
    // Every scene registered so far, in the order the pages load them.
    get names() { return Object.keys(scenes); },
    cuesOf: name => Object.keys(get(name).cues || {}),
    // The games still color and scatter through Scenes; new code uses Draw.
    mix, rng,
  };
})();
