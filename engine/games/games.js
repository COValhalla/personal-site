/*
 * Mini-games. Each game registers a title, a one-line help text, the act it
 * belongs to, and mount(stage, ramp), which returns a function that stops it.
 * Every game opens in the same dialog and can be skipped at any time.
 */
(function () {
  'use strict';

  const games = new Map();
  let dialog;
  let stop = null;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'game';
    dialog.setAttribute('aria-labelledby', 'game-title');
    document.body.append(dialog);
    // The close event arrives a moment after close(). If another game opened in
    // between, it has already stopped the old one, so leave the new one alone.
    dialog.addEventListener('close', () => {
      if (dialog.open) return;
      if (stop) stop();
      stop = null;
      dialog.replaceChildren();
    });
    return dialog;
  }

  function open(name) {
    const game = games.get(name);
    if (!game) return;
    const act = Story.acts.find(a => a.game === name) || Story.acts[0];
    const d = ensureDialog();
    if (stop) stop();
    const frame = Sheet.el('div', { class: 'frame game-frame', style: Sheet.colorVars(act) },
      Sheet.el('button', { class: 'close', 'aria-label': 'Close the game', onclick: () => d.close() }, '×'),
      Sheet.el('h3', { class: 'game-title', id: 'game-title', text: game.title }),
      Sheet.el('p', { class: 'game-help', text: game.help }),
      Sheet.el('div', { class: 'game-stage' }));
    d.replaceChildren(frame);
    if (!d.open) d.showModal();
    const stage = frame.querySelector('.game-stage');
    stop = game.mount(stage, act.color);
    // Every game can be skipped from its own row of buttons, and its sound turned off.
    const row = stage.querySelector('.game-actions') || stage.appendChild(Sheet.el('div', { class: 'game-actions' }));
    const sound = Sheet.el('button', { class: 'btn btn--ghost game-sound', 'aria-pressed': String(Sound.on) }, Sound.on ? 'Sound on' : 'Sound off');
    sound.addEventListener('click', () => {
      Sound.set(!Sound.on);
      sound.textContent = Sound.on ? 'Sound on' : 'Sound off';
      sound.setAttribute('aria-pressed', String(Sound.on));
    });
    // Keys drive the games, so the buttons should not also react to Space.
    sound.addEventListener('keydown', e => { if (e.key === ' ') e.preventDefault(); });
    row.append(sound, Sheet.el('button', { class: 'btn btn--ghost game-skip', onclick: () => d.close() }, 'Skip'));
  }

  window.Games = {
    register(name, game) { games.set(name, game); },
    get: name => games.get(name),
    names: () => [...games.keys()],
    open,
  };
})();
