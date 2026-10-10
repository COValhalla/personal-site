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
 * While the act is pinned, every bit of scrolling moves something: the hero
 * walks across the scene and the progress rail under it fills, both in step
 * with the scroll. When the act is done a Next tag points on.
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
  const STEP_SCROLL = 0.6;
  const LEVEL_HOLD = 0.7;
  // Playback speed for moments scrolled past, and for finishing an act you are leaving.
  const CATCH_UP = 1.5;
  const LEAVE_SPEED = 3;
  // After scrolling stops, the page glides to a whole moment once this many seconds pass.
  const SETTLE_DELAY = 0.16;
  // A nudge this far (in moments) past a stop counts as going on to the next one.
  const SETTLE_BIAS = 0.3;
  // How far the hero walks across the scene while the story is told, in scene pixels.
  const WALK = 34;

  const sections = [];
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function previous(i) {
    return i > 0 ? Story.acts[i - 1] : null;
  }

  // The hair and beard an act gives the hero (see hero in the recipes).
  const styleOf = act => ({ hair: act.hero.hair, beard: act.hero.beard });

  // The hero before this act's level-up, in the look the story has reached.
  function heroBefore(p) {
    const prev = previous(p.i);
    return Pixel.heroURL(prev ? prev.hero.gear : 'none', prev ? prev.color : Pixel.GRAY, p.style);
  }

  // A moment can change the hero's hair or beard (look in the recipe).
  function restyle(p, beat) {
    if (!beat.look) return;
    p.style = Object.assign({}, p.style, beat.look);
    if (!p.section.classList.contains('is-unlocked')) p.hero.src = heroBefore(p);
  }

  // The stage each step plays in: moment k in stage k, the level-up in the last stage.
  function stageOf(p, step) {
    if (p.stages.length === 1) return 0;
    return step.kind === 'beat' ? step.k : p.stages.length - 1;
  }

  function build(act, i) {
    const prev = previous(i);
    const stages = (act.stages || [act.scene]).map((name, s) => {
      const canvas = el('canvas', { class: 'px scene-canvas', width: Scenes.W, height: Scenes.H });
      const mounted = Scenes.mount(name, canvas, act.color, Story.acts);
      mounted.render();
      if (s > 0) canvas.style.visibility = 'hidden';
      const drawn = Scenes.get(name);
      return { canvas, stage: mounted, heroX: drawn.heroX, walkFrom: Math.max(2, drawn.heroX - WALK), door: drawn.door };
    });
    const scene = stages[0];
    // Until the level-up the hero keeps the last act's gear, hair and beard.
    const style = styleOf(prev || act);
    const hero = Pixel.hero(prev ? prev.hero.gear : 'none', prev ? prev.color : Pixel.GRAY, 1, '', style);
    hero.className = 'px scene-hero';
    const heroLeft = (scene.heroX / Scenes.W) * 100;
    // The hero walks from walkFrom to heroX as the story is told.
    const walkFrom = Math.max(2, scene.heroX - WALK);
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
      el('span', { class: 'chapter-num', text: Story.name(act) }),
      el('b', { class: 'chapter-title', text: act.title }));
    const sceneEl = el('div', { class: 'scene', role: 'img', 'aria-label': `${Story.name(act)} scene: your character in ${act.title.toLowerCase()}.` },
      ...stages.map(st => st.canvas), flash, hero, el('div', { class: 'scene-burst', 'aria-hidden': 'true' }), label, pop, chapter);
    // The progress rail: a node per moment and one for the level-up, filled as you scroll.
    const beatCount = Story.beatsOf(act).length;
    const railFill = el('i', { class: 'rail-fill' });
    const railNodes = Array.from({ length: beatCount + 1 }, (_, k) => el('b', { class: 'rail-node', style: `left:${(k / beatCount) * 100}%` }));
    const railLabel = el('span', { class: 'rail-label', text: `Moment 1 of ${beatCount}` });
    const rail = el('div', { class: 'act-rail', 'aria-hidden': 'true' }, el('div', { class: 'rail-track' }, railFill, railNodes), railLabel);

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
    const story = el('aside', { class: 'story', 'aria-label': `What happened in ${Story.name(act)}` },
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
      el('p', { class: 'act-num', text: Story.name(act) }),
      el('h2', { class: 'act-title', id: `title-${act.id}`, text: act.title }),
      el('p', { class: 'act-years', text: act.years }));

    const hint = el('p', { class: 'act-hint', 'aria-hidden': 'true' }, 'Scroll to continue the story ', el('span', { class: 'act-hint-arrow', text: '▼' }));
    const after = Story.acts[i + 1];
    const next = el('a', { class: 'act-next', href: after ? `#act-${after.id}` : '#facts' }, after ? `Next: ${Story.name(after)} ` : 'Next: the short version ', el('span', { 'aria-hidden': 'true', text: '▼' }));
    const screen = el('div', { class: `act-screen act--${act.theme || 'light'}`, style: colorVars(act) + (act.color.accent ? `;--ca:${act.color.accent}` : '') },
      head,
      el('div', { class: 'act-stage' },
        el('div', { class: 'act-left' }, el('div', { class: 'scene-box' }, sceneEl, rail), foot),
        story),
      hint, next);
    const section = el('section', { class: 'act is-locked', id: `act-${act.id}`, 'data-act': String(i), 'aria-labelledby': `title-${act.id}` }, screen);

    // On a laptop the hero turns to face the pointer.
    if (window.matchMedia('(pointer: fine)').matches) {
      sceneEl.addEventListener('pointermove', e => {
        const box = hero.getBoundingClientRect();
        hero.classList.toggle('is-flipped', e.clientX < box.left + box.width / 2);
      });
    }

    const steps = [{ kind: 'intro' }, ...Story.beatsOf(act).map((beat, k) => ({ kind: 'beat', beat, k })), { kind: 'level' }];
    const parts = { act, i, style, startStyle: style, section, screen, head, hero, heroLeft, walkFrom, heroX: scene.heroX, label, pop, flash, chapter, sceneEl, stages, stageIdx: 0, beats, skillCards, story, actions, hint, rail, railFill, railNodes, railLabel, steps, played: 0, target: 0, running: null, walkOn: 1, fill: 1, local: 1, inView: false, heroAt: scene.heroX };
    sections.push(parts);
    return section;
  }

  // ---------- The hero's walk and the progress rail, in step with the scroll ----------

  // Where the hero stands: walked on by the intro (walkOn), then across the scene by the scroll (fill).
  function place(p) {
    const along = p.walkFrom + (p.heroX - p.walkFrom) * p.local;
    const x = Math.round(-16 + (along + 16) * p.walkOn);
    if (x === p.heroAt) return;
    p.hero.classList.toggle('is-flipped', x < p.heroAt);
    p.heroAt = x;
    p.hero.style.left = (x / Scenes.W) * 100 + '%';
  }

  function railNote(p) {
    const beats = p.steps.length - 2;
    p.railFill.style.transform = `scaleX(${p.fill})`;
    p.railNodes.forEach((node, k) => node.classList.toggle('is-on', p.fill * beats >= k - 0.001));
    const done = p.played >= p.steps.length;
    p.railLabel.textContent = done ? `${p.act.tutorial ? 'Tutorial complete' : `Level ${Story.levelOf(p.i)}`} · ${p.act.hero.title}` : `Moment ${Math.min(beats, Math.max(1, p.target - 1))} of ${beats}`;
    p.screen.classList.toggle('is-done', done);
  }

  // Scrolling while pinned: fill is how far through the moments the scroll has come, 0 to 1.
  function scrub(p, fill, local) {
    if (fill === p.fill && local === p.local) return;
    p.fill = fill;
    p.local = local;
    place(p);
    railNote(p);
    if (p.walkOn < 1) return;
    p.hero.classList.add('is-walking');
    clearTimeout(p.walkTimer);
    p.walkTimer = setTimeout(() => p.hero.classList.remove('is-walking'), 180);
  }

  // ---------- Stages: one scene per moment, changed by a dive through a door ----------

  function runStage(p, on) {
    p.stages.forEach((st, s) => (on && s === p.stageIdx ? st.stage.start() : st.stage.stop()));
  }

  function setStage(p, s, local) {
    p.stageIdx = s;
    const st = p.stages[s];
    p.heroX = st.heroX;
    p.walkFrom = st.walkFrom;
    p.local = local;
    p.stages.forEach((o, k) => { o.canvas.style.visibility = k === s ? 'visible' : 'hidden'; });
    st.stage.render();
    p.label.style.left = ((st.heroX + 8) / Scenes.W) * 100 + '%';
    p.heroAt = -1;
    place(p);
  }

  // The camera dives through the door the hero walks to, and the next scene zooms in from the middle.
  function dive(p, s) {
    const from = p.stages[p.stageIdx];
    const to = p.stages[s];
    const door = from.door;
    const tl = gsap.timeline();
    tl.to(p.hero, { left: (door.x / Scenes.W) * 100 + '%', duration: 0.4, ease: 'power1.in' }, 0);
    tl.to(p.hero, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.35);
    tl.to(from.canvas, { scale: 3, opacity: 0, transformOrigin: `${(door.x / Scenes.W) * 100}% ${(door.y / Scenes.H) * 100}%`, duration: 0.6, ease: 'power2.in' }, 0.4);
    tl.call(() => {
      gsap.set(from.canvas, { clearProps: 'transform,opacity' });
      setStage(p, s, 0);
      gsap.set(p.hero, { clearProps: 'scale,opacity' });
      runStage(p, p.inView);
    }, null, 1.0);
    tl.fromTo(to.canvas, { scale: 0.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }, 1.0);
    return tl;
  }

  // ---------- Steps, played with motion ----------

  function intro(p) {
    const { act, section, screen, head, hero, chapter } = p;
    const tl = gsap.timeline();
    tl.call(() => { section.classList.remove('is-locked'); runStage(p, true); }, null, 0);
    tl.fromTo(chapter, { xPercent: -100, opacity: 1 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' }, BEATS.chapterIn);
    tl.fromTo(chapter.children, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, BEATS.chapterIn + 0.15);
    tl.fromTo(head.children, { x: -56, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, BEATS.chapterIn);
    tl.fromTo(screen, { '--gray': 1 }, { '--gray': 0, duration: 0.9, ease: 'power1.inOut' }, BEATS.color);
    tl.fromTo(p, { walkOn: 0 }, { walkOn: 1, duration: 0.8, ease: 'steps(10)', onUpdate: () => place(p) }, BEATS.walk);
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
      p.pop.style.left = ((p.heroAt + 8) / Scenes.W) * 100 + '%';
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
    const cue = step.beat.cue && p.stages[stageOf(p, step)].stage.cue(step.beat.cue);
    if (cue) tl.add(cue, 0);
    p.act.skills.forEach((skill, n) => {
      if (skill.moment !== step.k + 1) return;
      const card = p.skillCards[n];
      tl.call(() => lightSkill(p, card), null, 0.9);
      tl.fromTo(card, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, 0.9);
    });
    if (step.beat.look) {
      tl.call(() => restyle(p, step.beat), null, 0.3);
      tl.fromTo(p.flash, { opacity: 0.3 }, { opacity: 0, duration: 0.35 }, 0.3);
    }
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
    const left = ((p.heroX + 7) / Scenes.W) * 100 + '%';
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
    const pending = skillCards.filter(card => !card.classList.contains('is-on'));
    const tl = gsap.timeline();
    tl.to(hero, { yPercent: -40, duration: 0.25, ease: 'power2.out' }, BEATS.jump);
    tl.call(() => {
      hero.src = Pixel.heroURL(act.hero.gear, act.color, styleOf(act));
      p.section.classList.add('is-unlocked');
      pill.textContent = act.unlock.banner;
      Story.state.unlocked.add(i);
      Story.emit('unlock', i);
      if (window.Belt) Belt.levelUp(Story.level());
    }, null, BEATS.gearSwap);
    tl.add(burst(p), BEATS.gearSwap);
    tl.to(hero, { yPercent: 0, duration: 0.45, ease: 'bounce.out' }, BEATS.gearSwap);
    tl.fromTo(label, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' }, BEATS.gearSwap);
    tl.fromTo(pill, { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, BEATS.gearSwap);
    // Items no moment gave arrive with the level-up.
    Story.leftoverItems(act).forEach((item, k) => tl.add(popItem(p, item), BEATS.gearSwap + 0.3 + k * 0.5));
    const equip = p.stages[p.stages.length - 1].stage.cue('equip');
    if (equip) tl.add(equip, BEATS.gearSwap);
    // The skills no moment lit light now, each with the skills it grew from.
    pending.forEach((card, k) => {
      const t = BEATS.skills + k * BEATS.skillGap;
      const chips = card.querySelectorAll('.skill-chip');
      if (chips.length) tl.fromTo(chips, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, t);
      tl.call(() => lightSkill(p, card), null, t + 0.15);
      tl.fromTo(card, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, t + 0.15);
    });
    const tEnd = BEATS.skills + pending.length * BEATS.skillGap;
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
    const target = stageOf(p, step);
    const tl = gsap.timeline();
    if (target > p.stageIdx) tl.add(dive(p, target));
    tl.add(step.kind === 'beat' ? beat(p, step) : level(p));
    return tl;
  }

  // ---------- The same steps, settled at once without motion ----------

  function settleStep(p, k) {
    const { act, i, section, screen, hero, story } = p;
    const step = p.steps[k];
    const target = step.kind === 'intro' ? 0 : stageOf(p, step);
    if (step.kind === 'intro') {
      section.classList.remove('is-locked');
      screen.classList.add('is-colored');
      gsap && gsap.set(screen, { clearProps: '--gray' });
      return;
    }
    if (target !== p.stageIdx) setStage(p, target, 1);
    if (step.kind === 'beat') {
      const li = p.beats[step.k];
      li.classList.remove('is-locked');
      const chip = li.querySelector('.beat-item');
      if (chip) chip.classList.add('is-on');
      if (step.beat.cue) p.stages[target].stage.settle(step.beat.cue);
      restyle(p, step.beat);
      if (step.beat.give) { own(step.beat.give.id); if (window.Belt) Belt.fill(step.beat.give.id); }
      act.skills.forEach((skill, n) => { if (skill.moment === step.k + 1) lightSkill(p, p.skillCards[n]); });
      return;
    }
    hero.src = Pixel.heroURL(act.hero.gear, act.color, styleOf(act));
    section.classList.add('is-unlocked');
    story.querySelector('.unlock-pill').textContent = act.unlock.banner;
    Story.leftoverItems(act).forEach(item => { own(item.id); if (window.Belt) Belt.fill(item.id); });
    p.stages[target].stage.settle('equip');
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
    railNote(p);
    if (window.Belt) {
      const done = Story.level();
      Belt.xp(done, p.played >= p.steps.length ? 0 : p.played / p.steps.length);
    }
  }

  function speedFor(p) {
    if (p.leaving) return LEAVE_SPEED;
    return p.target - p.played > 1 ? CATCH_UP : 1;
  }

  function advance(p, target, instant) {
    p.target = Math.max(p.target, Math.min(target, p.steps.length));
    if (instant || reduced() || !window.gsap) {
      // Finish the step that is playing, without letting it start the next one.
      const running = p.running;
      p.running = null;
      if (running) { running.eventCallback('onComplete', null); running.progress(1); running.kill(); p.played += 1; }
      while (p.played < p.target) { settleStep(p, p.played); p.played += 1; }
      p.stages[p.stageIdx].stage.render();
      progressNote(p);
      return;
    }
    if (p.running) {
      p.running.timeScale(speedFor(p));
      return;
    }
    if (p.played >= p.target) return;
    const k = p.played;
    const tl = play(p, k);
    p.running = tl;
    tl.timeScale(speedFor(p));
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

  // ---------- Rewind: scrolling back above an act puts it back the way it started ----------

  function rewind(p) {
    if (p.played === 0 && !p.running) return;
    const { act, i, section, screen, hero, story } = p;
    if (p.running) { p.running.eventCallback('onComplete', null); p.running.kill(); p.running = null; }
    p.played = 0; p.target = 0; p.leaving = false;
    section.classList.add('is-locked');
    section.classList.remove('is-unlocked');
    screen.classList.remove('is-colored', 'is-ready', 'is-done');
    gsap.set(screen, { clearProps: '--gray' });
    p.beats.forEach(li => {
      li.classList.add('is-locked');
      li.classList.remove('is-new');
      const text = li.querySelector('.beat-text');
      text.textContent = text.dataset.text;
      const chip = li.querySelector('.beat-item');
      if (chip) chip.classList.remove('is-on');
    });
    p.skillCards.forEach(card => {
      card.classList.add('is-locked');
      card.classList.remove('is-on');
      card.querySelector('.skill-name').textContent = '???';
    });
    story.querySelector('.unlock-pill').textContent = 'Locked';
    gsap.set([p.label, p.pop, p.flash], { clearProps: 'transform,opacity' });
    gsap.set(p.chapter, { opacity: 0, xPercent: 0 });
    // Every stage goes back to its first frame.
    p.stages.forEach(st => {
      gsap.killTweensOf(st.stage.state);
      Object.assign(st.stage.state, (st.stage.scene.init && st.stage.scene.init()) || {});
      gsap.set(st.canvas, { clearProps: 'transform,opacity' });
    });
    p.style = p.startStyle;
    hero.src = heroBefore(p);
    gsap.set(hero, { clearProps: 'transform,opacity' });
    hero.className = 'px scene-hero';
    setStage(p, 0, 0);
    p.walkOn = 0; p.fill = 0; p.local = 0;
    place(p);
    railNote(p);
    runStage(p, false);
    // The act's items, skills and level leave the sheet; what was read stays read.
    act.items.forEach(item => { Story.state.owned.delete(item.id); if (window.Belt) Belt.empty(item.id); });
    act.skills.forEach(skill => Story.state.skills.delete(skill.id));
    Story.state.unlocked.delete(i);
    p.hint.classList.remove('is-done');
    Story.emit('rewind', i);
    if (window.Belt) Belt.xp(Story.level(), 0);
  }

  // Rewind this act and every act after it.
  function rewindFrom(i) {
    for (let j = sections.length - 1; j >= i; j--) rewind(sections[j]);
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
      p.inView = e.isIntersecting;
      if (e.isIntersecting && p.played > 0) runStage(p, true); else if (!e.isIntersecting) runStage(p, false);
    }));
    sections.forEach(p => seen.observe(p.screen));
    sections.forEach(p => {
      p.fill = 0;
      p.local = 0;
      place(p);
      railNote(p);
      // The chapter card plays as the act scrolls into view.
      ScrollTrigger.create({
        trigger: p.section, start: 'top 55%',
        onEnter: () => advance(p, 1),
        // Back above the act: it and every act after it rewind, ready to play again.
        onLeaveBack: () => rewindFrom(p.i),
      });
      // Then the act holds still while scrolling steps through its story.
      const storySteps = p.steps.length - 1;
      const stepPart = (STEP_SCROLL * storySteps) / (STEP_SCROLL * storySteps + LEVEL_HOLD);
      // Stops sit just past each moment's start, so onUpdate has already counted that moment as told.
      const stops = Array.from({ length: storySteps }, (_, k) => (stepPart * k * 1.001) / storySteps).concat(1);
      const bias = (SETTLE_BIAS * stepPart) / storySteps;
      let heading = 1;
      const toStop = raw => {
        const aim = raw + heading * bias;
        return stops.reduce((best, s) => (Math.abs(s - aim) < Math.abs(best - aim) ? s : best), stops[0]);
      };
      ScrollTrigger.create({
        trigger: p.section,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * (STEP_SCROLL * storySteps + LEVEL_HOLD)),
        pin: p.screen,
        anticipatePin: 1,
        snap: { snapTo: toStop, directional: false, delay: SETTLE_DELAY, duration: { min: 0.18, max: 0.45 }, ease: 'power3.out' },
        onUpdate: self => {
          heading = self.direction;
          const u = Math.min(1, self.progress / stepPart);
          advance(p, 1 + Math.min(storySteps, Math.floor(u * storySteps * 0.999) + 1));
          // The walk and the rail reach the end as the level-up starts; each stage's walk runs within its own span.
          // Within an act nothing un-tells: the walk and the rail never fall behind the story.
          const told = p.played >= p.steps.length ? storySteps : Math.max(0, p.played - 2);
          const span = Math.max(u * storySteps, told);
          const fill = Math.min(1, span / (storySteps - 1));
          scrub(p, fill, p.stages.length > 1 ? Math.min(1, Math.max(0, span - p.stageIdx)) : fill);
        },
        // Moving on before the story is told finishes the act at the leave speed.
        onLeave: () => { p.leaving = true; advance(p, p.steps.length); },
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

  window.Acts = { styleOf, BEATS, STEP_SCROLL, LEVEL_HOLD, sections, build, unlock, advance, watch, rewind, rewindFrom };
})();
