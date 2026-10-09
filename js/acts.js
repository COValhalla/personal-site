/*
 * Builds each act from its recipe and tells its story as you scroll.
 *
 * Every act fills one screen. When it scrolls into view its chapter card
 * plays, the color comes in and the hero walks on. Then the act holds still
 * (it is pinned) while further scrolling steps through the story: each moment
 * types itself out, plays its scene animation and drops its item into the
 * inventory belt. The last step levels the hero up and lights the new skills.
 * Each step plays once; scrolling back never replays it.
 *
 * Step timing lives in BEATS so every act keeps the same rhythm; see STYLE-GUIDE.md.
 */
(function () {
  'use strict';

  const { el, colorVars } = Sheet;

  // Seconds within each kind of step.
  const BEATS = {
    chapterIn: 0, color: 0.2, walk: 0.3, chapterOut: 1.0,
    typeRate: 70, itemPop: 0.35, itemFly: 1.0,
    jump: 0, gearSwap: 0.25, skills: 0.75, skillGap: 0.28, button: 0.25,
  };
  // How far to scroll for each step, as a share of the screen height, and how
  // much more the act holds still after its level-up so the new skills are seen.
  const STEP_SCROLL = 0.42;
  const LEVEL_HOLD = 0.7;

  const sections = [];
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function previous(i) {
    return i > 0 ? Story.acts[i - 1] : null;
  }

  function build(act, i) {
    const prev = previous(i);
    const scene = Scenes.get(act.scene);
    const canvas = el('canvas', { class: 'px scene-canvas', width: Scenes.W, height: Scenes.H });
    const stage = Scenes.mount(act.scene, canvas, act.color, Story.acts);
    stage.render();
    const hero = Pixel.hero(prev ? prev.hero.gear : 'none', prev ? prev.color : Pixel.GRAY, 1, '');
    hero.className = 'px scene-hero';
    const heroLeft = (scene.heroX / Scenes.W) * 100;
    hero.style.left = heroLeft + '%';
    hero.style.top = ((Scenes.GROUND - 22) / Scenes.H) * 100 + '%';
    const label = el('p', { class: 'scene-levelup', 'aria-hidden': 'true', text: act.unlock.pop || 'Level up!' });
    label.style.left = ((scene.heroX + 8) / Scenes.W) * 100 + '%';
    label.style.top = ((Scenes.GROUND - 24) / Scenes.H) * 100 + '%';
    const pop = el('div', { class: 'scene-pop', 'aria-hidden': 'true' }, el('img', { class: 'px', alt: '' }), el('span', { class: 'scene-pop-name' }));
    pop.style.left = ((scene.heroX + 8) / Scenes.W) * 100 + '%';
    pop.style.top = ((Scenes.GROUND - 30) / Scenes.H) * 100 + '%';
    const flash = el('div', { class: 'scene-flash', 'aria-hidden': 'true' });
    const chapter = el('div', { class: 'chapter-card', 'aria-hidden': 'true' },
      el('span', { class: 'chapter-num', text: `Act ${act.numeral}` }),
      el('b', { class: 'chapter-title', text: act.title }));
    const sceneEl = el('div', { class: 'scene', role: 'img', 'aria-label': `Act ${act.numeral} scene: your character in ${act.title.toLowerCase()}.` },
      canvas, flash, hero, el('div', { class: 'scene-burst', 'aria-hidden': 'true' }), label, pop, chapter);

    const beats = Story.beatsOf(act).map((beat, k) => el('li', { class: 'beat is-locked', 'data-beat': String(k) },
      el('span', { class: 'tag tag--' + beat.tag, text: beat.tag }),
      el('span', { class: 'beat-body' },
        el('span', { class: 'beat-text', 'data-text': beat.text, text: beat.text }),
        beat.give ? el('button', { class: 'beat-item', 'data-item': beat.give.id, tabindex: '-1', onclick: () => Sheet.openItem(beat.give.id) },
          Pixel.item(beat.give.sprite, act.color, 2, ''), el('span', { text: '+ ' + beat.give.name })) : null)));

    const skillCards = act.skills.map(skill => el('div', { class: 'skill-card is-locked', 'data-skill': skill.id },
      el('span', { class: 'skill-new', text: 'New skill' }),
      el('b', { class: 'skill-name', text: '???' }),
      el('span', { class: 'skill-from' },
        (skill.parents || []).length ? 'from ' : 'a root skill',
        (skill.parents || []).map(pid => {
          const parent = Story.skill(pid);
          if (!parent) return null;
          return el('i', { class: 'skill-chip', style: `--pc:${Story.acts[parent.act].color.base}`, text: parent.name });
        }))));

    const game = act.game && Games.get(act.game);
    const story = el('aside', { class: 'story', 'aria-label': `What happened in Act ${act.numeral}` },
      el('p', { class: 'story-state' },
        el('span', { class: 'unlock-pill', text: 'Locked' }),
        el('span', { class: 'unlock-say', text: act.unlock.say })),
      el('ol', { class: 'beats', 'aria-label': 'Moments' }, beats));
    const actions = el('div', { class: 'unlock-actions' },
      el('button', { class: 'btn btn--accent', onclick: () => Sheet.open({ tab: 'items', highlightAct: i }) }, 'Open sheet ▸'),
      game ? el('button', { class: 'btn btn--ghost', onclick: () => Games.open(act.game) }, '▶ Play ' + game.title.toLowerCase()) : null);
    const foot = el('div', { class: 'act-foot' },
      el('div', { class: 'skills-new' },
        el('p', { class: 'unlock-label', text: 'New skills' }),
        el('div', { class: 'skill-cards' }, skillCards)),
      actions);

    const head = el('header', { class: 'act-head' },
      el('p', { class: 'act-num', text: `Act ${act.numeral}` }),
      el('h2', { class: 'act-title', id: `title-${act.id}`, text: act.title }),
      el('p', { class: 'act-years', text: act.years }));

    const hint = el('p', { class: 'act-hint', 'aria-hidden': 'true' }, 'Scroll to continue the story ', el('span', { class: 'act-hint-arrow', text: '▼' }));
    const screen = el('div', { class: `act-screen act--${act.theme || 'light'}`, style: colorVars(act) + (act.color.accent ? `;--ca:${act.color.accent}` : '') },
      head,
      el('div', { class: 'act-stage' },
        el('div', { class: 'act-left' }, el('div', { class: 'scene-box' }, sceneEl), foot),
        story),
      hint);
    const section = el('section', { class: 'act is-locked', id: `act-${act.id}`, 'data-act': String(i), 'aria-labelledby': `title-${act.id}` }, screen);

    // On a laptop the hero turns to face the pointer.
    if (window.matchMedia('(pointer: fine)').matches) {
      sceneEl.addEventListener('pointermove', e => {
        const box = hero.getBoundingClientRect();
        hero.classList.toggle('is-flipped', e.clientX < box.left + box.width / 2);
      });
    }

    const steps = [{ kind: 'intro' }, ...Story.beatsOf(act).map((beat, k) => ({ kind: 'beat', beat, k })), { kind: 'level' }];
    const parts = { act, i, section, screen, head, hero, heroLeft, label, pop, flash, chapter, sceneEl, stage, beats, skillCards, story, actions, hint, steps, played: 0, target: 0, running: null };
    sections.push(parts);
    return section;
  }

  // ---------- Steps, played with motion ----------

  function intro(p) {
    const { act, section, screen, head, hero, chapter, stage } = p;
    const tl = gsap.timeline();
    tl.call(() => { section.classList.remove('is-locked'); stage.start(); }, null, 0);
    tl.fromTo(chapter, { xPercent: -100, opacity: 1 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' }, BEATS.chapterIn);
    tl.fromTo(chapter.children, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, BEATS.chapterIn + 0.15);
    tl.fromTo(head.children, { x: -56, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, BEATS.chapterIn);
    tl.fromTo(screen, { '--gray': 1 }, { '--gray': 0, duration: 0.9, ease: 'power1.inOut' }, BEATS.color);
    tl.fromTo(hero, { left: '-12%' }, { left: p.heroLeft + '%', duration: 0.8, ease: 'steps(10)' }, BEATS.walk);
    tl.call(() => hero.classList.add('is-walking'), null, BEATS.walk);
    tl.call(() => hero.classList.remove('is-walking'), null, BEATS.walk + 0.8);
    tl.to(chapter, { xPercent: 100, duration: 0.35, ease: 'power2.in' }, BEATS.chapterOut);
    tl.set(chapter, { opacity: 0, xPercent: 0 });
    tl.call(() => {
      gsap.set(screen, { clearProps: '--gray' });
      gsap.set(head.children, { clearProps: 'transform,opacity' });
      screen.classList.add('is-colored');
    });
    return tl;
  }

  function typeOut(node) {
    const full = node.dataset.text;
    const count = { n: 0 };
    return gsap.to(count, {
      n: full.length,
      duration: Math.max(0.3, full.length / BEATS.typeRate),
      ease: 'none',
      onStart: () => { node.textContent = ''; },
      onUpdate: () => { node.textContent = full.slice(0, Math.round(count.n)); },
      onComplete: () => { node.textContent = full; },
    });
  }

  function popItem(p, item) {
    const act = p.act;
    const img = p.pop.querySelector('img');
    const tl = gsap.timeline();
    tl.call(() => {
      img.src = Pixel.item(item.sprite, act.color, 1, '').src;
      p.pop.querySelector('.scene-pop-name').textContent = '+ ' + item.name;
    });
    tl.fromTo(p.pop, { scale: 0, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(3)' });
    tl.fromTo(p.flash, { opacity: 0.35 }, { opacity: 0, duration: 0.4 }, '<');
    tl.to(p.pop, { y: -4, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
    // The flight runs on its own, so it can start from wherever the sprite is now.
    tl.call(() => {
      const from = img.getBoundingClientRect();
      gsap.set(p.pop, { opacity: 0 });
      if (window.Belt) Belt.fly(item.id, from);
      own(item.id);
    });
    tl.to({}, { duration: 0.8 });
    return tl;
  }

  function own(id) {
    if (Story.state.owned.has(id)) return;
    Story.state.owned.add(id);
    Story.emit('item', id);
  }

  function beat(p, step) {
    const li = p.beats[step.k];
    const text = li.querySelector('.beat-text');
    const chip = li.querySelector('.beat-item');
    const tl = gsap.timeline();
    tl.call(() => {
      li.classList.remove('is-locked');
      li.classList.add('is-new');
      const panel = p.story;
      if (panel.scrollHeight > panel.clientHeight) panel.scrollTo({ top: Math.max(0, li.offsetTop - panel.offsetTop - 40), behavior: reduced() ? 'auto' : 'smooth' });
    });
    tl.fromTo(li, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0);
    tl.add(typeOut(text), 0.1);
    const cue = step.beat.cue && p.stage.cue(step.beat.cue);
    if (cue) tl.add(cue, 0);
    if (step.beat.give) {
      tl.add(popItem(p, step.beat.give), BEATS.itemPop);
      if (chip) tl.fromTo(chip, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.5)', onStart: () => chip.classList.add('is-on') }, BEATS.itemFly + 0.6);
    }
    tl.call(() => { li.classList.remove('is-new'); gsap.set([li, chip].filter(Boolean), { clearProps: 'transform,opacity' }); });
    return tl;
  }

  function burst(p) {
    const box = p.sceneEl.querySelector('.scene-burst');
    const unit = p.sceneEl.clientWidth / Scenes.W;
    const scene = Scenes.get(p.act.scene);
    const left = ((scene.heroX + 7) / Scenes.W) * 100 + '%';
    const top = ((Scenes.GROUND - 12) / Scenes.H) * 100 + '%';
    const bits = Array.from({ length: 26 }, () => {
      const b = el('i');
      b.style.left = left;
      b.style.top = top;
      box.append(b);
      return b;
    });
    const tl = gsap.timeline({ onComplete: () => bits.forEach(b => b.remove()) });
    bits.forEach((b, k) => {
      const angle = (k / bits.length) * Math.PI * 2 + Math.random() * 0.3;
      const dist = (14 + Math.random() * 22) * unit;
      tl.fromTo(b, { x: 0, y: 0, scale: 1.6, opacity: 1 }, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.8, scale: 0.6, opacity: 0, duration: 0.75 + Math.random() * 0.25, ease: 'power2.out' }, 0);
    });
    tl.fromTo(p.flash, { opacity: 0.55 }, { opacity: 0, duration: 0.5, ease: 'power1.out' }, 0);
    return tl;
  }

  function lightSkill(p, card) {
    const skill = Story.skill(card.dataset.skill);
    card.classList.remove('is-locked');
    card.classList.add('is-on');
    card.querySelector('.skill-name').textContent = skill.name;
    if (!Story.state.skills.has(skill.id)) {
      Story.state.skills.add(skill.id);
      Story.emit('skill', skill.id);
    }
  }

  function level(p) {
    const { act, i, hero, label, story, skillCards, actions, screen } = p;
    const pill = story.querySelector('.unlock-pill');
    const tl = gsap.timeline();
    tl.to(hero, { yPercent: -40, duration: 0.25, ease: 'power2.out' }, BEATS.jump);
    tl.call(() => {
      hero.src = Pixel.heroURL(act.hero.gear, act.color);
      p.section.classList.add('is-unlocked');
      pill.textContent = act.unlock.banner;
      Story.state.unlocked.add(i);
      Story.emit('unlock', i);
      if (window.Belt) Belt.levelUp(Story.state.unlocked.size);
    }, null, BEATS.gearSwap);
    tl.add(burst(p), BEATS.gearSwap);
    tl.to(hero, { yPercent: 0, duration: 0.45, ease: 'bounce.out' }, BEATS.gearSwap);
    tl.fromTo(label, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' }, BEATS.gearSwap);
    tl.fromTo(pill, { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, BEATS.gearSwap);
    // Items no moment gave arrive with the level-up.
    Story.leftoverItems(act).forEach((item, k) => tl.add(popItem(p, item), BEATS.gearSwap + 0.3 + k * 0.5));
    // The new skills light, each with the skills it grew from.
    skillCards.forEach((card, k) => {
      const t = BEATS.skills + k * BEATS.skillGap;
      const chips = card.querySelectorAll('.skill-chip');
      if (chips.length) tl.fromTo(chips, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, t);
      tl.call(() => lightSkill(p, card), null, t + 0.15);
      tl.fromTo(card, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, t + 0.15);
    });
    const tEnd = BEATS.skills + skillCards.length * BEATS.skillGap;
    tl.to(label, { opacity: 0, y: -12, duration: 0.4, ease: 'power1.in' }, Math.max(tEnd - 0.2, 1.6));
    tl.call(() => screen.classList.add('is-ready'), null, tEnd + BEATS.button);
    tl.fromTo(actions, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, tEnd + BEATS.button);
    tl.call(() => {
      gsap.set([hero, label, pill, actions, ...skillCards], { clearProps: 'transform,opacity' });
      const chips = skillCards.flatMap(c => [...c.querySelectorAll('.skill-chip')]);
      if (chips.length) gsap.set(chips, { clearProps: 'transform,opacity' });
    });
    return tl;
  }

  function play(p, k) {
    const step = p.steps[k];
    if (step.kind === 'intro') return intro(p);
    if (step.kind === 'beat') return beat(p, step);
    return level(p);
  }

  // ---------- The same steps, settled at once without motion ----------

  function settleStep(p, k) {
    const { act, i, section, screen, hero, story } = p;
    const step = p.steps[k];
    if (step.kind === 'intro') {
      section.classList.remove('is-locked');
      screen.classList.add('is-colored');
      gsap && gsap.set(screen, { clearProps: '--gray' });
      return;
    }
    if (step.kind === 'beat') {
      const li = p.beats[step.k];
      li.classList.remove('is-locked');
      const chip = li.querySelector('.beat-item');
      if (chip) chip.classList.add('is-on');
      if (step.beat.cue) p.stage.settle(step.beat.cue);
      if (step.beat.give) { own(step.beat.give.id); if (window.Belt) Belt.fill(step.beat.give.id); }
      return;
    }
    hero.src = Pixel.heroURL(act.hero.gear, act.color);
    section.classList.add('is-unlocked');
    story.querySelector('.unlock-pill').textContent = act.unlock.banner;
    Story.leftoverItems(act).forEach(item => { own(item.id); if (window.Belt) Belt.fill(item.id); });
    p.skillCards.forEach(card => lightSkill(p, card));
    screen.classList.add('is-ready');
    if (!Story.state.unlocked.has(i)) {
      Story.state.unlocked.add(i);
      Story.emit('unlock', i);
    }
  }

  // ---------- The queue: steps play in order, faster when several are waiting ----------

  function progressNote(p) {
    const left = p.steps.length - p.played;
    p.hint.classList.toggle('is-done', left <= 0);
    if (window.Belt) {
      const done = Story.state.unlocked.size;
      Belt.xp(done, p.played >= p.steps.length ? 0 : p.played / p.steps.length);
    }
  }

  function advance(p, target, instant) {
    p.target = Math.max(p.target, Math.min(target, p.steps.length));
    if (instant || reduced() || !window.gsap) {
      // Finish the step that is playing, without letting it start the next one.
      const running = p.running;
      p.running = null;
      if (running) { running.eventCallback('onComplete', null); running.progress(1); running.kill(); p.played += 1; }
      while (p.played < p.target) { settleStep(p, p.played); p.played += 1; }
      p.stage.render();
      progressNote(p);
      return;
    }
    if (p.running) {
      p.running.timeScale(p.target - p.played > 1 ? 3 : 1);
      return;
    }
    if (p.played >= p.target) return;
    const k = p.played;
    const tl = play(p, k);
    p.running = tl;
    tl.timeScale(p.target - p.played > 1 ? 3 : 1);
    tl.eventCallback('onComplete', () => {
      p.running = null;
      p.played = k + 1;
      progressNote(p);
      advance(p, p.target);
    });
  }

  // Unlock a whole act at once, for jumps from the chapter menu and reloads mid-page.
  function unlock(i, opts) {
    const p = sections[i];
    advance(p, p.steps.length, !(opts && opts.animate));
  }

  function catchUp() {
    sections.forEach(p => {
      if (p.played < p.steps.length && p.section.getBoundingClientRect().bottom < 0) advance(p, p.steps.length, true);
    });
  }

  function watch() {
    if (!window.gsap || !window.ScrollTrigger || reduced()) {
      sections.forEach(p => advance(p, p.steps.length, true));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    // The scene draws its moving parts only while its screen is in view, pinned or not.
    const seen = new IntersectionObserver(entries => entries.forEach(e => {
      const p = sections.find(q => q.screen === e.target);
      if (e.isIntersecting && p.played > 0) p.stage.start(); else if (!e.isIntersecting) p.stage.stop();
    }));
    sections.forEach(p => seen.observe(p.screen));
    sections.forEach(p => {
      // The chapter card plays as the act scrolls into view.
      ScrollTrigger.create({
        trigger: p.section, start: 'top 55%', once: true,
        onEnter: () => advance(p, 1),
      });
      // Then the act holds still while scrolling steps through its story.
      const storySteps = p.steps.length - 1;
      const stepPart = (STEP_SCROLL * storySteps) / (STEP_SCROLL * storySteps + LEVEL_HOLD);
      ScrollTrigger.create({
        trigger: p.section,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * (STEP_SCROLL * storySteps + LEVEL_HOLD)),
        pin: p.screen,
        anticipatePin: 1,
        onUpdate: self => {
          const u = Math.min(1, self.progress / stepPart);
          advance(p, 1 + Math.min(storySteps, Math.floor(u * storySteps * 0.999) + 1));
        },
        // Moving on before the story is told plays the rest quickly.
        onLeave: () => { advance(p, p.steps.length); if (p.running) p.running.timeScale(3); },
      });
    });
    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; catchUp(); });
    }, { passive: true });
    ScrollTrigger.refresh();
    catchUp();
  }

  // Redraw every hero, after the look changes.
  function refreshHeroes() {
    sections.forEach(p => {
      const prev = previous(p.i);
      const done = p.section.classList.contains('is-unlocked');
      p.hero.src = done ? Pixel.heroURL(p.act.hero.gear, p.act.color) : Pixel.heroURL(prev ? prev.hero.gear : 'none', prev ? prev.color : Pixel.GRAY);
    });
  }

  window.Acts = { BEATS, STEP_SCROLL, LEVEL_HOLD, sections, build, unlock, advance, watch, refreshHeroes };
})();
