/*
 * Boot: check the recipes, build the page, then start watching the scroll.
 * Needs: gsap, ScrollTrigger, Dom, Pixel, Story, Scenes, Sheet, Games, Belt, Acts
 */
(function () {
  'use strict';

  const { el, colorVars } = Dom;

  function hud() {
    const pips = Story.acts.map((act, i) => el('a', {
      class: 'pip', href: `#act-${act.id}`, style: colorVars(act), 'data-act': String(i),
      'aria-label': `${Story.name(act)}: ${act.title}, locked`,
    }, act.numeral));
    const bar = el('header', { class: 'hud', id: 'hud' },
      el('button', { class: 'hud-me', onclick: () => Sheet.open({ tab: 'items' }), 'aria-label': 'Open the character sheet' },
        el('span', { class: 'hud-avatar' }),
        el('span', {}, el('span', { class: 'hud-name', text: Story.config.name }),
          el('span', { class: 'hud-level' }, el('span', { class: 'hud-lv', text: 'Level 0' }), el('span', { class: 'hud-class' })))),
      el('nav', { class: 'hud-acts', 'aria-label': 'Chapters' }, pips),
      helloMenu(),
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
    document.querySelector('.hud-lv').textContent = `Level ${Story.level()}`;
    document.querySelector('.hud-class').textContent = act ? ` · ${act.hero.title}` : '';
    const owned = Story.state.owned;
    document.querySelector('.hud-count').textContent = `${owned.size}/${Story.items().length}`;
    document.querySelector('.hud-sheet').classList.toggle('has-new', [...owned].some(id => !Story.state.seen.has(id)));
    document.querySelectorAll('.pip').forEach((pip, i) => {
      const on = unlocked.has(i);
      pip.classList.toggle('is-on', on);
      pip.setAttribute('aria-label', `${Story.name(Story.acts[i])}: ${Story.acts[i].title}${on ? '' : ', locked'}`);
    });
    document.querySelectorAll('.hud-strip i').forEach((bit, i) => { bit.style.background = unlocked.has(i) ? Story.acts[i].color.base : 'transparent'; });
    Belt.refresh();
    Sheet.refresh();
  }

  const linkAttrs = href => (href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {});

  // Copies the address, or selects it where the browser will not copy, so the reader can copy it.
  function copyAddress(button, address) {
    const flash = text => {
      button.textContent = text;
      setTimeout(() => { button.textContent = 'Copy'; }, 1600);
    };
    const select = () => {
      const range = document.createRange();
      range.selectNodeContents(address);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      flash('Selected');
    };
    if (navigator.clipboard) navigator.clipboard.writeText(address.textContent).then(() => flash('Copied'), select);
    else select();
  }

  // Say hello, in the top bar and at the end of the page: the address to copy, a mail link and LinkedIn.
  function helloPanel() {
    const { linkedin, email } = Story.config.contact;
    const address = el('span', { class: 'hello-address', text: email || '' });
    const copy = el('button', { class: 'btn hello-copy', type: 'button', 'data-contact': 'copy', text: 'Copy', onclick: () => copyAddress(copy, address) });
    return el('div', { class: 'hello-panel' },
      email ? el('p', { class: 'hello-kicker', text: 'Email me' }) : null,
      email ? el('div', { class: 'hello-row' }, address, copy) : null,
      email ? el('p', { class: 'hello-small' }, el('a', { href: `mailto:${email}`, text: 'or open it in your mail app' })) : null,
      linkedin ? el('a', { class: 'btn hello-linkedin', href: linkedin, text: 'Message me on LinkedIn ↗', ...linkAttrs(linkedin) }) : null);
  }

  // Say hello in the top bar opens a small panel, so reaching Joe never skips the story.
  function helloMenu() {
    const menu = el('div', { class: 'hello-menu', id: 'hello-menu', hidden: '' }, helloPanel());
    const button = el('button', { class: 'btn hud-hello', 'aria-expanded': 'false', 'aria-controls': 'hello-menu', 'aria-label': 'Say hello' },
      el('span', { class: 'hud-label', text: 'Say hello' }),
      el('span', { class: 'hud-at', 'aria-hidden': 'true', text: '@' }));
    const set = open => { menu.hidden = !open; button.setAttribute('aria-expanded', String(open)); };
    button.addEventListener('click', e => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('click', e => { if (!menu.contains(e.target)) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    return el('div', { class: 'hud-hello-wrap' }, button, menu);
  }

  // Press start glides to the first act, where the story begins.
  function start() {
    const first = Acts.sections[0];
    const pin = window.ScrollTrigger && ScrollTrigger.getAll().find(t => t.pin === first.screen);
    window.scrollTo({ top: pin ? pin.start + 2 : first.section.offsetTop, behavior: 'smooth' });
  }

  function intro() {
    const { linkedin } = Story.config.contact;
    const { shortcut } = Story.config;
    const press = el('button', { class: 'btn btn--start intro-start', onclick: start },
      el('span', { class: 'intro-start-arrow', 'aria-hidden': 'true', text: '▶' }), 'Press start');
    // Enter starts the story from the title screen, like a game.
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.target !== document.body) return;
      if (document.getElementById('top').getBoundingClientRect().bottom > window.innerHeight / 2) start();
    });
    return el('section', { class: 'intro', id: 'top' },
      el('div', { class: 'intro-inner' },
        el('h1', { class: 'intro-title', text: Story.config.fullName || Story.config.name }),
        el('p', { class: 'intro-tag', text: Story.config.welcome }),
        el('div', { class: 'intro-hero' }, Pixel.hero('none', Pixel.GRAY, 6, `${Story.config.name}, before the story starts`)),
        el('div', { class: 'intro-ground' }),
        press,
        el('p', { class: 'intro-hint', text: 'or scroll ▼' }),
        linkedin && shortcut ? el('p', { class: 'intro-note' },
          el('a', { href: linkedin, text: shortcut, ...linkAttrs(linkedin) })) : null));
  }

  // The end of the page: what Joe builds next, then Say hello with the links to reach him.
  function finale() {
    const { github } = Story.config.contact;
    return el('section', { class: 'finale', id: 'facts', 'aria-labelledby': 'facts-title' },
      el('div', { class: 'finale-inner' },
        el('p', { class: 'act-num', style: 'color:var(--ink-3)', text: Story.config.ending.kicker }),
        el('h2', { id: 'facts-title', text: Story.config.ending.heading }),
        el('div', { class: 'finale-strip', 'aria-hidden': 'true' }, Story.acts.map(act => el('i', { style: `background:${act.color.base}` }))),
        el('p', { class: 'finale-line', text: Story.config.ending.line }),
        el('div', { class: 'hello', id: 'say-hello' },
          el('h3', { class: 'hello-label', text: 'Say hello' }),
          el('p', { class: 'hello-note', text: Story.config.hello }),
          helloPanel(),
          github ? el('a', { class: 'btn btn--ghost hello-github', href: github, text: 'See my code on GitHub ↗', ...linkAttrs(github) }) : null)));
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
    ['unlock', 'item', 'skill', 'seen', 'rewind'].forEach(event => Story.on(event, updateHud));
    updateHud();
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    Acts.watch();
    markHere();
    document.documentElement.dataset.ready = 'true';
  }

  boot();
})();
