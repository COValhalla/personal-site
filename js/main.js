/*
 * Boot: check the recipes, build the page, then start watching the scroll.
 */
(function () {
  'use strict';

  const { el, colorVars } = Sheet;

  function hud() {
    const pips = Story.acts.map((act, i) => el('a', {
      class: 'pip', href: `#act-${act.id}`, style: colorVars(act), 'data-act': String(i),
      'aria-label': `Act ${act.numeral}: ${act.title}, locked`,
    }, act.numeral));
    const bar = el('header', { class: 'hud', id: 'hud' },
      el('button', { class: 'hud-me', onclick: () => Sheet.open({ tab: 'items' }), 'aria-label': 'Open the character sheet' },
        el('span', { class: 'hud-avatar' }),
        el('span', {}, el('span', { class: 'hud-name', text: Story.config.name }),
          el('span', { class: 'hud-level' }, el('span', { class: 'hud-lv', text: 'Level 0' }), el('span', { class: 'hud-class' })))),
      el('nav', { class: 'hud-acts', 'aria-label': 'Chapters' }, pips),
      el('button', { class: 'btn hud-sheet', onclick: () => Sheet.open({ tab: 'items' }) },
        el('span', { class: 'hud-label', text: 'Sheet' }),
        el('span', { class: 'hud-count', text: `0/${Story.items().length}` }),
        el('span', { class: 'hud-new', 'aria-hidden': 'true' })),
      el('div', { class: 'hud-strip', 'aria-hidden': 'true' }, Story.acts.map(() => el('i'))));
    return bar;
  }

  function updateHud() {
    const unlocked = Story.state.unlocked;
    const top = Math.max(-1, ...unlocked);
    const act = Story.acts[top];
    const avatar = document.querySelector('.hud-avatar');
    avatar.replaceChildren(Pixel.hero(act ? act.hero.gear : 'none', act ? act.color : Pixel.GRAY, 1, '', act && Acts.styleOf(act)));
    document.querySelector('.hud-lv').textContent = `Level ${unlocked.size}`;
    document.querySelector('.hud-class').textContent = act ? ` · ${act.hero.title}` : '';
    const owned = Story.state.owned;
    document.querySelector('.hud-count').textContent = `${owned.size}/${Story.items().length}`;
    document.querySelector('.hud-sheet').classList.toggle('has-new', [...owned].some(id => !Story.state.seen.has(id)));
    document.querySelectorAll('.pip').forEach((pip, i) => {
      const on = unlocked.has(i);
      pip.classList.toggle('is-on', on);
      pip.setAttribute('aria-label', `Act ${Story.acts[i].numeral}: ${Story.acts[i].title}${on ? '' : ', locked'}`);
    });
    document.querySelectorAll('.hud-strip i').forEach((bit, i) => { bit.style.background = unlocked.has(i) ? Story.acts[i].color.base : 'transparent'; });
    Belt.refresh();
    Sheet.refresh();
  }

  function intro() {
    return el('section', { class: 'intro', id: 'top' },
      el('div', { class: 'intro-inner' },
        el('p', { class: 'intro-kicker', text: 'Press start' }),
        el('h1', { class: 'intro-title', text: Story.config.name }),
        el('p', { class: 'intro-tag', text: Story.config.tagline }),
        el('div', { class: 'intro-hero' }, Pixel.hero('none', Pixel.GRAY, 6, `${Story.config.name}, before the story starts`)),
        el('div', { class: 'intro-ground' }),
        el('p', { class: 'intro-hint', text: 'Scroll to start ▼' }),
        el('p', { class: 'intro-note' }, 'Draft proof of concept: every word is a placeholder. ', el('a', { href: '#facts', text: 'Short on time? Read the quick facts.' }))));
  }

  function finale() {
    return el('section', { class: 'finale', id: 'facts', 'aria-labelledby': 'facts-title' },
      el('div', { class: 'finale-inner' },
        el('p', { class: 'act-num', style: 'color:var(--ink-3)', text: 'To be continued' }),
        el('h2', { id: 'facts-title', text: 'The sheet so far' }),
        el('div', { class: 'finale-strip', 'aria-hidden': 'true' }, Story.acts.map(act => el('i', { style: `background:${act.color.base}` }))),
        el('p', {}, `Every act added a color, new items and new skills. There is room to grow.`),
        el('button', { class: 'btn', onclick: () => Sheet.open({ tab: 'items' }) }, 'Open the full sheet ▸'),
        el('h3', { style: 'margin-top:40px;font-family:var(--mono)', text: 'Quick facts' }),
        el('p', { class: 'facts-note', text: 'The whole story in six lines, for anyone in a hurry.' }),
        el('ol', { class: 'facts' }, Story.acts.map(act => el('li', {},
          el('b', { text: `Act ${act.numeral} · ${act.title}` }), ` (${act.years}): ${act.summary}`)))));
  }

  function markHere() {
    if (!window.ScrollTrigger) return;
    Acts.sections.forEach(p => ScrollTrigger.create({
      trigger: p.section, start: 'top center', end: 'bottom center',
      onToggle: self => document.querySelectorAll('.pip').forEach((pip, i) => pip.classList.toggle('is-here', self.isActive && i === p.i)),
    }));
  }

  function boot() {
    Pixel.setLook(Story.config && Story.config.look);
    const problems = Story.validate({
      scenes: Scenes.names, cues: Scenes.cuesOf, gear: Object.keys(Pixel.HERO_GEAR), hair: Object.keys(Pixel.HAIR), beards: Object.keys(Pixel.BEARD), sprites: Object.keys(Pixel.ITEMS), games: Games.names(),
    });
    const main = document.querySelector('main');
    document.body.prepend(hud());
    document.body.append(Belt.build(), el('div', { id: 'fly-layer', 'aria-hidden': 'true' }));
    main.append(intro());
    if (problems.length) {
      main.append(el('section', { class: 'finale' }, el('div', { class: 'finale-inner' },
        el('h2', { text: 'A recipe needs fixing' }), el('ul', {}, problems.map(p => el('li', { text: p }))))));
    }
    Story.acts.forEach((act, i) => main.append(Acts.build(act, i)));
    main.append(finale());
    ['unlock', 'item', 'skill', 'seen'].forEach(event => Story.on(event, updateHud));
    Story.on('look', () => {
      document.querySelector('.intro-hero').replaceChildren(Pixel.hero('none', Pixel.GRAY, 6, `${Story.config.name}, before the story starts`));
      Acts.refreshHeroes();
      updateHud();
    });
    updateHud();
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    Acts.watch();
    markHere();
    document.documentElement.dataset.ready = 'true';
  }

  boot();
})();
