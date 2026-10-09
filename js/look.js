/*
 * A look picker for the draft: try hair, skin, beard and glasses on the hero,
 * see it everywhere at once, then copy the line into recipes/site.js.
 * The hair style and beard here are today's; each act's recipe sets its own.
 * It only shows while Story.config.draft is true.
 */
(function () {
  'use strict';

  const { el } = Sheet;
  const SKIN = [['#f4c7a6', '#d9937a'], ['#f0c29a', '#c98f66'], ['#d9a066', '#b07a45'], ['#a86b42', '#7f4e2e'], ['#6f4529', '#4f2f1b']];
  // Hair colors, each with the lighter color of its streaks.
  const HAIR = [['Auburn', '#8c4527', '#c0703c'], ['Black', '#2b1d14', '#4a3426'], ['Brown', '#5a3b22', '#7d5634'], ['Blond', '#d8a548', '#f0cc7a'], ['Red', '#a3462a', '#cf6a43'], ['Gray', '#7d808a', '#a9acb5']];
  const STYLES = [['bun', 'Top bun'], ['short', 'Short'], ['bald', 'Bald']];
  const BEARDS = [['long', 'Long beard'], ['full', 'Full beard'], ['short', 'Short beard'], ['goatee', 'Goatee'], ['stubble', 'Stubble'], ['none', 'None']];

  const current = () => Object.assign({ skin: SKIN[0][0], skinShade: SKIN[0][1], hair: HAIR[0][1], hairLight: HAIR[0][2], eyes: '#2c5a8c', hairStyle: 'bun', beard: 'long', glasses: false }, Story.config.look || {});

  function apply(look) {
    Story.config.look = look;
    Pixel.setLook(look);
    Story.emit('look', look);
  }

  const line = look => `look: { skin: '${look.skin}', skinShade: '${look.skinShade}', hair: '${look.hair}', hairLight: '${look.hairLight}', eyes: '${look.eyes}', hairStyle: '${look.hairStyle}', beard: '${look.beard}', glasses: ${look.glasses} },`;

  function swatches(name, items, value, onPick) {
    return el('div', { class: 'look-swatches', role: 'radiogroup', 'aria-label': name },
      items.map(([label, color, extra]) => {
        const b = el('button', { class: 'look-swatch', role: 'radio', 'aria-checked': String(color === value), 'aria-label': label, title: label, style: `background:${color}` });
        b.addEventListener('click', () => onPick(color, extra));
        return b;
      }));
  }

  function panel() {
    const box = el('details', { class: 'look-picker' }, el('summary', { text: 'Make the character look like you (draft only)' }));
    const body = el('div', { class: 'look-body' });
    const code = el('code', { class: 'look-line', tabindex: '0' });
    box.append(body, el('p', { class: 'look-help' }, 'To keep it, put this line in recipes/site.js in place of the look there:'), code);
    code.addEventListener('focus', () => window.getSelection().selectAllChildren(code));

    function render() {
      const look = current();
      const set = changes => { apply(Object.assign(current(), changes)); render(); };
      const select = (name, options, value, key) => {
        const s = el('select', { 'aria-label': name }, options.map(([v, label]) => {
          const o = el('option', { value: v, text: label });
          if (v === value) o.selected = true;
          return o;
        }));
        s.addEventListener('change', () => set({ [key]: s.value }));
        return el('label', { class: 'look-field' }, el('span', { text: name }), s);
      };
      const glasses = el('input', { type: 'checkbox' });
      glasses.checked = Boolean(look.glasses);
      glasses.addEventListener('change', () => set({ glasses: glasses.checked }));
      body.replaceChildren(
        el('div', { class: 'look-preview' }, Pixel.hero('none', Pixel.GRAY, 3, 'The character with no gear on')),
        el('div', { class: 'look-field' }, el('span', { text: 'Skin' }),
          swatches('Skin', SKIN.map(([c, sh], k) => [`Skin ${k + 1}`, c, sh]), look.skin, (c, sh) => set({ skin: c, skinShade: sh }))),
        el('div', { class: 'look-field' }, el('span', { text: 'Hair color' }),
          swatches('Hair color', HAIR.map(([label, c, light]) => [label, c, light]), look.hair, (c, light) => set({ hair: c, hairLight: light }))),
        select('Hair', STYLES, look.hairStyle, 'hairStyle'),
        select('Beard', BEARDS, look.beard, 'beard'),
        el('label', { class: 'look-field look-check' }, glasses, el('span', { text: 'Glasses' })));
      code.textContent = line(look);
    }
    render();
    return box;
  }

  window.Look = { panel, apply, line };
})();
