/*
 * The character sheet: an Items tab (stats and inventory), a Skill tree tab,
 * and the story card that opens when you select an item.
 */
(function () {
  'use strict';

  const SLOTS = 18;
  const NS = 'http://www.w3.org/2000/svg';
  const state = { tab: 'items', selectedSkill: null };
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

  function svg(tag, attrs, ...kids) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
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
        Story.config.draft && window.Look ? Look.panel() : null,
        el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Sheet sections' },
          el('button', { class: 'tab', role: 'tab', id: 'tab-items', 'aria-controls': 'panel-items', onclick: () => show('items'), onkeydown: tabKeys }, 'Items'),
          el('button', { class: 'tab', role: 'tab', id: 'tab-tree', 'aria-controls': 'panel-tree', onclick: () => show('tree'), onkeydown: tabKeys }, 'Skill tree')),
        el('section', { id: 'panel-items', role: 'tabpanel', 'aria-labelledby': 'tab-items' },
          el('div', { class: 'items-panel' },
            el('div', {},
              el('p', { class: 'panel-label', text: 'Stats' }),
              el('div', { class: 'stats' })),
            el('div', {},
              el('p', { class: 'panel-label inv-label' }),
              el('div', { class: 'inv-grid' }),
              el('p', { class: 'inv-hint', text: 'Select an item to read its story.' })))),
        el('section', { id: 'panel-tree', role: 'tabpanel', 'aria-labelledby': 'tab-tree', hidden: '' },
          el('div', { class: 'tree-wrap' }),
          el('p', { class: 'tree-info', 'aria-live': 'polite' }))));

    card = el('dialog', { id: 'card', 'aria-labelledby': 'card-name' });
    document.body.append(sheet, card);
    sheet.addEventListener('close', () => {
      Story.state.owned.forEach(id => Story.state.seen.add(id));
      Story.emit('seen');
    });
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (sheet.open && state.tab === 'tree') renderTree(); }, 120);
    });
  }

  function tabKeys(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    show(state.tab === 'items' ? 'tree' : 'items');
    sheet.querySelector(state.tab === 'items' ? '#tab-items' : '#tab-tree').focus();
  }

  function show(tab) {
    state.tab = tab;
    sheet.querySelector('#tab-items').setAttribute('aria-selected', tab === 'items');
    sheet.querySelector('#tab-tree').setAttribute('aria-selected', tab === 'tree');
    sheet.querySelector('#tab-items').tabIndex = tab === 'items' ? 0 : -1;
    sheet.querySelector('#tab-tree').tabIndex = tab === 'tree' ? 0 : -1;
    sheet.querySelector('#panel-items').hidden = tab !== 'items';
    sheet.querySelector('#panel-tree').hidden = tab !== 'tree';
    if (tab === 'tree') renderTree();
  }

  function renderHead() {
    const act = currentAct();
    const portrait = sheet.querySelector('.sheet-portrait');
    portrait.replaceChildren(Pixel.hero(act ? act.hero.gear : 'none', act ? act.color : Pixel.GRAY, 4, 'Your character'));
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

  // Layout in two axes: u runs through the acts, v across an act's skills.
  // Wide screens put the acts in columns; phones put them in rows. An act's
  // skills sit in up to three rows; with two skills they take the outer rows.
  const rowsOf = n => (n === 1 ? [1] : n === 2 ? [0, 2] : [0, 1, 2]);

  function treeLayout(wide) {
    const nodes = new Map();
    Story.acts.forEach((act, a) => {
      const rows = rowsOf(act.skills.length);
      act.skills.forEach((skill, k) => nodes.set(skill.id, { act: a, row: rows[Math.min(k, rows.length - 1)] }));
    });
    const L = wide
      ? { wide, w: 760, h: 300, nodeW: 114, nodeH: 34, halfU: 57, halfV: 17, step: 125, U: a => 66 + a * 125, V: r => [110, 180, 250][r], pt: (u, v) => [u, v] }
      : { wide, w: 400, h: 80 + (Story.acts.length - 1) * 96, nodeW: 96, nodeH: 34, halfU: 17, halfV: 48, step: 96, U: a => 46 + a * 96, V: r => [110, 214, 318][r], pt: (u, v) => [v, u] };
    nodes.forEach(n => { n.u = L.U(n.act); n.v = L.V(n.row); });
    L.nodes = nodes;
    return L;
  }

  // Links between neighbouring acts curve straight across. Longer links run in
  // lanes outside the nodes, above the top row or below the bottom row, so they
  // never pass under another skill. A link into a middle-row skill comes down
  // the gap beside its act and enters from the side.
  function treeEdges(L, skills) {
    const byId = new Map(skills.map(s => [s.id, s]));
    const row = s => L.nodes.get(s.id).row;
    const edges = [];
    skills.forEach(child => (child.parents || []).forEach(pid => { if (byId.has(pid)) edges.push({ parent: byId.get(pid), child }); }));
    const lanes = { 0: [], 1: [] };
    const long = edges.filter(e => e.child.act - e.parent.act >= 2)
      .sort((a, b) => (a.child.act - a.parent.act) - (b.child.act - b.parent.act) || a.parent.act - b.parent.act);
    long.forEach(e => {
      const c = row(e.child);
      const side = c === 0 ? 0 : c === 2 ? 1 : (row(e.parent) === 2 ? 1 : 0);
      const lo = e.parent.act;
      const hi = e.child.act;
      let k = 0;
      while ((lanes[side][k] || []).some(([a, b]) => !(hi < a || lo > b))) k++;
      (lanes[side][k] = lanes[side][k] || []).push([lo, hi]);
      Object.assign(e, { side, lane: k, middle: c === 1 });
    });
    const sideRow = side => (side ? 2 : 0);
    const spread = (list, key, max) => {
      const groups = new Map();
      list.forEach(e => { const g = key(e); groups.set(g, (groups.get(g) || []).concat(e)); });
      return groups.forEach(group => group.forEach((e, i) => { e[max.name] = (i - (group.length - 1) / 2) * max.gap; }));
    };
    spread(long, e => e.child.id + e.side, { name: 'inOff', gap: L.wide ? 14 : 8 });
    spread(long.filter(e => row(e.parent) === sideRow(e.side)), e => e.parent.id, { name: 'outOff', gap: L.wide ? 14 : 8 });
    spread(long.filter(e => row(e.parent) !== sideRow(e.side)), e => e.parent.act, { name: 'gapOff', gap: 5 });
    const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + L.pt(p[0], p[1]).join(' ')).join(' ');
    edges.forEach(e => {
      const P = L.nodes.get(e.parent.id);
      const C = L.nodes.get(e.child.id);
      if (P.act === C.act) {
        const [top, bottom] = P.row < C.row ? [P, C] : [C, P];
        e.d = path([[P.u, top.v + L.halfV], [P.u, bottom.v - L.halfV]]);
        return;
      }
      if (C.act - P.act === 1) {
        const a = L.pt(P.u + L.halfU, P.v);
        const b = L.pt(C.u - L.halfU, C.v);
        const c1 = L.pt(P.u + L.halfU + 32, P.v);
        const c2 = L.pt(C.u - L.halfU - 32, C.v);
        e.d = `M${a.join(' ')} C${c1.join(' ')} ${c2.join(' ')} ${b.join(' ')}`;
        return;
      }
      const sign = e.side === 0 ? -1 : 1;
      const laneV = L.V(sideRow(e.side)) + sign * (L.halfV + 12 + e.lane * 7);
      const edgeV = n => n.v + sign * L.halfV;
      const pts = [];
      if (P.row === sideRow(e.side)) {
        pts.push([P.u + e.outOff, edgeV(P)], [P.u + e.outOff, laneV]);
      } else {
        const gapU = P.u + L.step / 2 + e.gapOff;
        pts.push([P.u + L.halfU, P.v], [gapU, P.v], [gapU, laneV]);
      }
      if (e.middle) {
        const gapC = C.u - L.step / 2 + e.inOff;
        pts.push([gapC, laneV], [gapC, C.v], [C.u - L.halfU, C.v]);
      } else {
        pts.push([C.u + e.inOff, laneV], [C.u + e.inOff, edgeV(C)]);
      }
      e.d = path(pts);
    });
    return edges;
  }

  function renderTree() {
    const wrap = sheet.querySelector('.tree-wrap');
    const wide = (wrap.clientWidth || sheet.clientWidth) >= 600;
    const L = treeLayout(wide);
    const skills = Story.skills();
    const lit = skill => Story.state.skills.has(skill.id);
    const sel = state.selectedSkill;
    // Links appear once the skill they lead to is unlocked; locked skills show as ???.
    const edges = treeEdges(L, skills).filter(e => lit(e.child)).map(e => {
      const on = lit(e.child) && lit(e.parent);
      const touches = !sel || e.child.id === sel || e.parent.id === sel;
      return svg('path', {
        d: e.d, fill: 'none',
        stroke: on ? Story.acts[e.child.act].color.base : '#3b3846',
        'stroke-width': on ? 3 : 2,
        'stroke-dasharray': on ? '' : '4 5',
        'stroke-linejoin': 'round',
        opacity: touches ? 1 : 0.22,
      });
    });
    const labels = Story.acts.map((act, i) => {
      const [x, y] = wide ? [L.U(i), 30] : [L.V(0) - L.halfV, L.U(i) - L.halfU - 7];
      return svg('text', { x, y, 'text-anchor': wide ? 'middle' : 'start', fill: unlocked().has(i) ? act.color.light : '#4a4652' }, wide ? act.numeral : `Act ${act.numeral}`);
    });
    const nodes = skills.map(skill => {
      const n = L.nodes.get(skill.id);
      const [x, y] = L.pt(n.u, n.v);
      const act = Story.acts[skill.act];
      const on = lit(skill);
      const selected = sel === skill.id;
      const g = svg('g', { class: 'node', tabindex: '0', role: 'button', 'data-skill': skill.id, 'aria-label': on ? `${skill.name}, Act ${act.numeral}` : `Locked skill in Act ${act.numeral}` },
        svg('rect', {
          x: x - L.nodeW / 2, y: y - L.nodeH / 2, width: L.nodeW, height: L.nodeH, rx: 4,
          fill: on ? Scenes.mix(act.color.base, '#1d1b24', 0.62) : '#1d1b24',
          stroke: on ? (selected ? '#ffffff' : act.color.base) : '#3b3846',
          'stroke-width': selected ? 3 : 2,
          'stroke-dasharray': on ? '' : '4 4',
        }),
        svg('text', Object.assign({ x, y: y + 4, 'text-anchor': 'middle', fill: on ? '#ece8f2' : '#6f6a79' },
          // Long names squeeze to fit their box.
          on && skill.name.length * 6.8 > L.nodeW - 10 ? { textLength: L.nodeW - 10, lengthAdjust: 'spacingAndGlyphs' } : {}), on ? skill.name : '???'));
      const pick = () => { state.selectedSkill = skill.id; renderTree(); sheet.querySelector(`[data-skill="${skill.id}"]`).focus(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      return g;
    });
    const tree = svg('svg', { class: 'tree', viewBox: `0 0 ${L.w} ${L.h}`, role: 'group', 'aria-label': 'Skill tree. Each skill links to the skills it grew from.' }, edges, labels, nodes);
    if (!wide) tree.style.maxWidth = '440px';
    wrap.replaceChildren(tree);
    renderTreeInfo();
  }

  function renderTreeInfo() {
    const info = sheet.querySelector('.tree-info');
    const skill = state.selectedSkill && Story.skill(state.selectedSkill);
    if (!skill) {
      info.textContent = Story.state.skills.size ? 'Select a skill to see what it grew from. Product ties every branch together.' : 'Nothing unlocked yet. Scroll down to start.';
      return;
    }
    const act = Story.acts[skill.act];
    if (!Story.state.skills.has(skill.id)) {
      info.textContent = `Locked. Keep scrolling to unlock Act ${act.numeral}.`;
      return;
    }
    const parents = (skill.parents || []).map(id => Story.skill(id)).filter(Boolean);
    const from = parents.length ? 'Grew from ' + parents.map(p => (Story.state.skills.has(p.id) ? p.name : '???')).join(', ') + '.' : 'A root skill.';
    info.replaceChildren(el('b', { text: skill.name }), ` · Act ${act.numeral} · ${from} `, skill.line || '');
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
        Story.config.draft ? el('p', { class: 'card-draft', text: 'Draft words. Your own line goes here.' }) : null,
        el('div', { class: 'card-section' },
          el('p', { class: 'panel-label', text: 'What it added' }),
          el('ul', { class: 'card-adds' }, Object.keys(item.adds || {}).map(k => el('li', { text: '+ ' + statName(k) }))))),
      el('figure', { class: 'card-photo' },
        item.photo
          ? el('img', { src: item.photo, alt: item.name, style: 'width:auto;max-width:100%;height:auto;max-height:260px;opacity:1' })
          : [Pixel.item('camera', Pixel.GRAY, 3, ''), el('figcaption', { text: 'Photo goes here. Add one to this item in its recipe.' })]),
      el('footer', { class: 'card-actions' },
        game ? el('button', { class: 'btn btn--accent', onclick: () => Games.open(item.game) }, '▶ Play ' + game.title.toLowerCase()) : null,
        el('button', { class: 'btn btn--ghost', onclick: () => card.close() }, 'Close'))));
    card.showModal();
  }

  function refresh() {
    if (sheet && sheet.open) open({});
  }

  window.Sheet = { open, openItem, refresh, el, svg, colorVars };
})();
