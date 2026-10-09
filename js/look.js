/*
 * A look picker for the draft: try hair, skin, beard and glasses on the hero,
 * see it everywhere at once, then copy the line into recipes/site.js.
 * It only shows while Story.config.draft is true.
 */
(function () {
  'use strict';

  const { el } = Sheet;
  const SKIN = [['#f6d3b3', '#d9a982'], ['#f0c29a', '#c98f66'], ['#d9a066', '#b07a45'], ['#a86b42', '#7f4e2e'], ['#6f4529', '#4f2f1b']];
  const HAIR = [['Black', '#2b1d14'], ['Brown', '#5a3b22'], ['Light brown', '#8a5a2b'], ['Blond', '#d8a548'], ['Red', '#a3462a'], ['Gray', '#7d808a']];
  const STYLES = [['short', 'Short'], ['buzz', 'Buzz cut'], ['swoop', 'Swept'], ['long', 'Long']];
  const BEARDS = [['none', 'None'], ['stubble', 'Stubble'], ['full', 'Full beard']];

  const current = () => Object.assign({ skin: SKIN[1][0], skinShade: SKIN[1][1], hair: HAIR[1][1], hairStyle: 'short', beard: 'none', glasses: false }, Story.config.look || {});

  function apply(look) {
    Story.config.look = look;
    Pixel.setLook(look);
    Story.emit('look', look);
  }

  const line = look => `look: { skin: '${look.skin}', skinShade: '${look.skinShade}', hair: '${look.hair}', hairStyle: '${look.hairStyle}', beard: '${look.beard}', glasses: ${look.glasses} },`;

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
          swatches('Hair color', HAIR.map(([label, c]) => [label, c]), look.hair, c => set({ hair: c }))),
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
