/*
 * The character sheet: an Items tab (stats and inventory), a Map tab (the
 * world map of the six acts, in js/map.js), and the story card that opens
 * when you select an item.
 */
(function () {
  'use strict';

  const SLOTS = 18;
  const state = { tab: 'items' };
  let sheet;
  let card;

  function el(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style') node.style.cssText = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    kids.flat().forEach(kid => kid != null && node.append(kid));
    return node;
  }

  function colorVars(act) {
    return `--c1:${act.color.light};--c2:${act.color.base};--c3:${act.color.shade}`;
  }

  const unlocked = () => Story.state.unlocked;
  const level = () => unlocked().size;
  const currentAct = () => Story.acts[Math.max(...unlocked(), -1)] || null;

  function build() {
    sheet = el('dialog', { id: 'sheet', 'aria-labelledby': 'sheet-name' },
      el('div', { class: 'frame' },
        el('button', { class: 'close', 'aria-label': 'Close the sheet', onclick: () => sheet.close() }, '×'),
        el('header', { class: 'sheet-head' },
          el('div', { class: 'sheet-portrait' }),
          el('div', {},
            el('p', { class: 'sheet-kicker', text: 'Character sheet' }),
            el('h2', { class: 'sheet-name', id: 'sheet-name', text: Story.config.name }),
            el('p', { class: 'sheet-class' }),
            el('div', { class: 'sheet-strip', 'aria-hidden': 'true' }, Story.acts.map(() => el('i'))))),
        el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Sheet sections' },
          el('button', { class: 'tab', role: 'tab', id: 'tab-items', 'aria-controls': 'panel-items', onclick: () => show('items'), onkeydown: tabKeys }, 'Items'),
          el('button', { class: 'tab', role: 'tab', id: 'tab-map', 'aria-controls': 'panel-map', onclick: () => show('map'), onkeydown: tabKeys }, 'Map')),
        el('section', { id: 'panel-items', role: 'tabpanel', 'aria-labelledby': 'tab-items' },
          el('div', { class: 'items-panel' },
            el('div', {},
              el('p', { class: 'panel-label', text: 'Stats' }),
              el('div', { class: 'stats' })),
            el('div', {},
              el('p', { class: 'panel-label inv-label' }),
              el('div', { class: 'inv-grid' }),
              el('p', { class: 'inv-hint', text: 'Select an item to read its story.' })))),
        el('section', { id: 'panel-map', role: 'tabpanel', 'aria-labelledby': 'tab-map', hidden: '' }, WorldMap.build())));

    card = el('dialog', { id: 'card', 'aria-labelledby': 'card-name' });
    document.body.append(sheet, card);
    sheet.addEventListener('close', () => {
      Story.state.owned.forEach(id => Story.state.seen.add(id));
      Story.emit('seen');
    });
    sheet.addEventListener('close', () => WorldMap.stop());
  }

  function tabKeys(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    show(state.tab === 'items' ? 'map' : 'items');
    sheet.querySelector(state.tab === 'items' ? '#tab-items' : '#tab-map').focus();
  }

  function show(tab) {
    state.tab = tab;
    sheet.querySelector('#tab-items').setAttribute('aria-selected', tab === 'items');
    sheet.querySelector('#tab-map').setAttribute('aria-selected', tab === 'map');
    sheet.querySelector('#tab-items').tabIndex = tab === 'items' ? 0 : -1;
    sheet.querySelector('#tab-map').tabIndex = tab === 'map' ? 0 : -1;
    sheet.querySelector('#panel-items').hidden = tab !== 'items';
    sheet.querySelector('#panel-map').hidden = tab !== 'map';
    if (tab === 'map') WorldMap.show(); else WorldMap.stop();
  }

  function renderHead() {
    const act = currentAct();
    const portrait = sheet.querySelector('.sheet-portrait');
    portrait.replaceChildren(Pixel.hero(act ? act.hero.gear : 'none', act ? act.color : Pixel.GRAY, 4, 'Your character', act && Acts.styleOf(act)));
    sheet.querySelector('.sheet-class').textContent = act
      ? `Level ${level()} · ${act.hero.title}`
      : 'Level 0 · Scroll down to start';
    sheet.querySelectorAll('.sheet-strip i').forEach((bar, i) => { bar.style.background = unlocked().has(i) ? Story.acts[i].color.base : ''; });
    sheet.querySelector('.frame').style.cssText = act ? colorVars(act) : '';
  }

  function renderStats() {
    const items = Story.items();
    const owned = Story.state.owned;
    const totals = {};
    items.forEach(item => Object.entries(item.adds || {}).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; }));
    const box = sheet.querySelector('.stats');
    box.replaceChildren(...Story.config.stats.map(stat => {
      // The full bar is one more than everything the story adds: there is always room to grow.
      const max = (totals[stat.id] || 0) + 1;
      const units = act => act.items.reduce((sum, item) => sum + (owned.has(item.id) ? ((item.adds || {})[stat.id] || 0) : 0), 0);
      const segments = Story.acts.map(act => {
        const n = units(act);
        return n ? el('i', { style: `width:${(n / max) * 100}%;background:${act.color.base}`, title: `Act ${act.numeral}` }) : null;
      });
      const filled = Story.acts.reduce((sum, act) => sum + units(act), 0);
      const words = filled === 0 ? 'empty' : filled / max < 0.4 ? 'a little' : filled / max < 0.75 ? 'growing' : 'strong';
      return el('div', { class: 'stat' },
        el('span', { class: 'stat-name', text: stat.name }),
        el('div', { class: 'bar', role: 'img', 'aria-label': `${stat.name}: ${words}` }, segments));
    }));
  }

  function renderInventory(highlightAct) {
    const items = Story.items();
    const owned = items.filter(item => Story.state.owned.has(item.id)).length;
    sheet.querySelector('.inv-label').textContent = `Inventory · ${owned} of ${SLOTS} slots`;
    const grid = sheet.querySelector('.inv-grid');
    const slots = [];
    for (let i = 0; i < SLOTS; i++) {
      const item = items[i];
      if (item && Story.state.owned.has(item.id)) {
        const act = Story.acts[item.act];
        const slot = el('button', {
          class: 'inv-slot is-filled' + (item.act === highlightAct ? ' is-pulse' : ''),
          style: colorVars(act),
          'aria-label': `${item.name}, Act ${act.numeral}. Read its story.`,
          title: item.name,
          'data-item': item.id,
          onclick: () => openItem(item.id),
        }, Pixel.item(item.sprite, act.color, 4, ''));
        if (!Story.state.seen.has(item.id)) slot.append(el('span', { class: 'new', text: 'NEW' }));
        slots.push(slot);
      } else {
        slots.push(el('div', { class: 'inv-slot', role: 'img', 'aria-label': item ? 'Empty slot, still to unlock' : 'Empty slot, room to grow' }));
      }
    }
    grid.replaceChildren(...slots);
  }

  function open(opts) {
    const options = opts || {};
    if (!sheet) build();
    renderHead();
    renderStats();
    renderInventory(options.highlightAct);
    if (!sheet.open) sheet.showModal();
    show(options.tab || state.tab);
  }

  function openItem(id) {
    const item = Story.items().find(i => i.id === id);
    if (!item) return;
    const act = Story.acts[item.act];
    const statName = sid => (Story.config.stats.find(s => s.id === sid) || { name: sid }).name;
    const game = item.game && Games.get(item.game);
    card.replaceChildren(el('article', { class: 'frame card-frame', style: colorVars(act) },
      el('button', { class: 'close', 'aria-label': 'Close the story card', onclick: () => card.close() }, '×'),
      el('div', { class: 'card-art' }, Pixel.item(item.sprite, act.color, 8, item.name)),
      el('div', {},
        el('h3', { class: 'card-name', id: 'card-name', text: item.name }),
        el('p', { class: 'card-meta' }, `Act ${act.numeral} · ${act.title}`, el('span', { class: 'tag tag--' + item.tag, text: item.tag })),
        el('blockquote', { class: 'card-line', text: `“${item.line}”` }),
        el('div', { class: 'card-section' },
          el('p', { class: 'panel-label', text: 'What it added' }),
          el('ul', { class: 'card-adds' }, Object.keys(item.adds || {}).map(k => el('li', { text: '+ ' + statName(k) }))))),
      item.photo ? el('figure', { class: 'card-photo' },
        el('img', { src: item.photo, alt: item.name, style: 'width:auto;max-width:100%;height:auto;max-height:260px;opacity:1' })) : null,
      el('footer', { class: 'card-actions' },
        game ? el('button', { class: 'btn btn--accent', onclick: () => Games.open(item.game) }, '▶ Play ' + game.title.toLowerCase()) : null,
        el('button', { class: 'btn btn--ghost', onclick: () => card.close() }, 'Close'))));
    card.showModal();
  }

  function refresh() {
    if (sheet && sheet.open) open({});
  }

  window.Sheet = { open, openItem, refresh, el, colorVars };
})();
