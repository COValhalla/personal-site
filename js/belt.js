/*
 * The inventory belt along the bottom of the screen, with the experience bar
 * above it. Items fly into their slot as the story gives them. On a phone the
 * belt is hidden and items fly into the Sheet button in the bar instead.
 */
(function () {
  'use strict';

  const { el, colorVars } = Sheet;
  let belt;

  const phone = () => window.innerWidth < 760;

  function build() {
    const groups = Story.acts.map((act, i) => el('div', { class: 'belt-group', style: colorVars(act), 'data-act': String(i) },
      act.items.map(item => el('button', {
        class: 'belt-slot', 'data-item': item.id, disabled: '', title: 'Still to unlock',
        'aria-label': 'Empty slot, still to unlock',
        onclick: () => Sheet.openItem(item.id),
      }, Pixel.item(item.sprite, act.color, 2, '')))));
    belt = el('footer', { class: 'belt', id: 'belt', 'aria-label': 'Inventory' },
      el('div', { class: 'xp', role: 'img', 'aria-label': 'Level 0' },
        el('span', { class: 'xp-level', text: '0' }),
        el('div', { class: 'xp-track' }, el('i', { class: 'xp-fill' }))),
      el('div', { class: 'belt-row' },
        el('span', { class: 'belt-label', text: 'Inventory' }),
        el('div', { class: 'belt-slots' }, groups),
        el('button', { class: 'belt-skills', onclick: () => Sheet.open({ tab: 'map' }) },
          el('span', { class: 'belt-skills-label', text: 'Skills' }),
          el('b', { class: 'belt-skills-count', text: `0/${Story.skills().length}` }))));
    return belt;
  }

  // Where an item lands: its belt slot, or the Sheet button on a phone.
  function target(id) {
    if (phone() || !belt) return document.querySelector('.hud-sheet');
    return belt.querySelector(`.belt-slot[data-item="${id}"]`);
  }

  function fill(id) {
    if (!belt) return;
    const slot = belt.querySelector(`.belt-slot[data-item="${id}"]`);
    const item = Story.item(id);
    if (!slot || !item) return;
    slot.disabled = false;
    slot.classList.add('is-filled');
    slot.title = item.name;
    slot.setAttribute('aria-label', `${item.name}. Read its story.`);
  }

  // Fly a copy of the item's sprite from a point on screen into its slot.
  function fly(id, from) {
    const item = Story.item(id);
    const act = Story.acts[item.act];
    const to = target(id);
    const layer = document.getElementById('fly-layer');
    const ghost = Pixel.item(item.sprite, act.color, 4, '');
    ghost.className = 'px fly-item';
    layer.append(ghost);
    const end = to.getBoundingClientRect();
    const size = 64;
    const x0 = from.left + from.width / 2 - size / 2;
    const y0 = from.top + from.height / 2 - size / 2;
    const x1 = end.left + end.width / 2 - size / 2;
    const y1 = end.top + end.height / 2 - size / 2;
    // A curve that rises before it drops into the slot.
    const lift = Math.min(160, Math.abs(y1 - y0) * 0.5 + 60);
    const ctrl = { x: (x0 + x1) / 2, y: Math.min(y0, y1) - lift };
    const p = { t: 0 };
    const place = () => {
      const u = p.t;
      const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * ctrl.x + u * u * x1;
      const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * ctrl.y + u * u * y1;
      const scale = 1 - u * (1 - Math.min(1, end.width / size));
      ghost.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };
    place();
    const tl = gsap.timeline({ onComplete: () => ghost.remove() });
    tl.to(p, { t: 1, duration: 0.75, ease: 'power2.in', onUpdate: place });
    tl.call(() => {
      fill(id);
      to.classList.remove('is-landing');
      void to.offsetWidth;
      to.classList.add('is-landing');
    });
    return tl;
  }

  function refresh() {
    if (!belt) return;
    const total = Story.skills().length;
    belt.querySelector('.belt-skills-count').textContent = `${Story.state.skills.size}/${total}`;
    belt.querySelectorAll('.belt-group').forEach(g => g.classList.toggle('is-on', Story.state.unlocked.has(Number(g.dataset.act))));
  }

  // The bar shows progress through the act being told; the number is the level reached.
  function xp(level, fraction) {
    if (!belt) return;
    belt.querySelector('.xp-level').textContent = String(level);
    belt.querySelector('.xp').setAttribute('aria-label', `Level ${level}`);
    const fill = belt.querySelector('.xp-fill');
    if (window.gsap) gsap.to(fill, { scaleX: Math.max(0, Math.min(1, fraction)), duration: 0.5, ease: 'power2.out' });
    else fill.style.transform = `scaleX(${fraction})`;
  }

  // The bar fills to the end, then the level number ticks up and the bar starts again.
  function levelUp(level) {
    if (!belt || !window.gsap) { xp(level, 0); return; }
    const fill = belt.querySelector('.xp-fill');
    const num = belt.querySelector('.xp-level');
    gsap.timeline()
      .to(fill, { scaleX: 1, duration: 0.3, ease: 'power2.out' })
      .call(() => {
        num.textContent = String(level);
        belt.querySelector('.xp').setAttribute('aria-label', `Level ${level}`);
        num.classList.remove('is-up');
        void num.offsetWidth;
        num.classList.add('is-up');
      })
      .to(fill, { scaleX: 0, duration: 0.4, ease: 'power2.in' }, '+=0.25');
  }

  window.Belt = { build, target, fill, fly, refresh, xp, levelUp };
})();
