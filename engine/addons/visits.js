/*
 * Visit counts, the first add-on. On the published site it counts the page view,
 * each act reached, the sheet opened, the ending reached and each contact link
 * clicked, with GoatCounter, which sets no cookies. Opened from a file, on any
 * other address, in an automated browser, or when the browser asks not to be
 * tracked, it loads nothing and sends nothing. Why: docs/decisions/0007-visit-counts.md.
 * The story works the same without this file. It loads after main.js, which
 * builds the page it watches.
 * Needs: Story
 */
(function () {
  'use strict';

  // Where the site is published, and the counter only its owner can read.
  const SITE = 'https://covalhalla.github.io';
  const COUNTER = 'https://covalhalla.goatcounter.com/count';

  // Why this browser is not counted, or '' when it is.
  function decide(env) {
    if (env.origin !== SITE) return 'not the published site';
    if (env.webdriver) return 'an automated browser';
    if (env.doNotTrack === '1' || env.doNotTrack === 'yes' || env.globalPrivacyControl === true) return 'the browser asks not to be tracked';
    return '';
  }

  const visits = { decide, why: '', sent: [] };
  window.Visits = visits;
  // In the unit tests there is no page, only the rule above.
  if (typeof document === 'undefined') return;

  visits.why = decide({
    origin: location.origin,
    webdriver: navigator.webdriver,
    doNotTrack: navigator.doNotTrack || window.doNotTrack,
    globalPrivacyControl: navigator.globalPrivacyControl,
  });
  if (visits.why) return;

  // The counter's script counts the page view when it loads and attaches `goatcounter`;
  // this file sends the events. Events from before it loads wait in a queue.
  const queue = [];
  // Each thing is counted once per page view, so scrolling back and forth adds nothing.
  const once = new Set();
  function count(path, title) {
    if (once.has(path)) return;
    once.add(path);
    visits.sent.push(path);
    if (window.goatcounter) window.goatcounter.count({ path, title, event: true });
    else queue.push({ path, title });
  }

  const script = document.createElement('script');
  script.async = true;
  script.dataset.goatcounter = COUNTER;
  script.dataset.goatcounterSettings = JSON.stringify({ no_events: true });
  script.src = 'vendor/goatcounter/count.js';
  script.onload = () => queue.splice(0).forEach(vars => window.goatcounter.count({ ...vars, event: true }));
  document.head.append(script);

  // An act or the ending is reached when half of it is in view, with or without motion.
  const watched = new Map();
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    seen.unobserve(entry.target);
    count(...watched.get(entry.target));
  }), { threshold: 0.5 });
  function watch(el, path, title) {
    if (!el) return;
    watched.set(el, [path, title]);
    seen.observe(el);
  }
  Story.acts.forEach(act => watch(document.querySelector(`#act-${act.id} .act-screen`), `act-${act.id}`, `Reached ${Story.name(act)}: ${act.title}`));
  watch(document.getElementById('facts'), 'ending', 'Reached the ending');
  Story.on('sheet', () => count('sheet', 'Opened the character sheet'));

  // The contact links from story/recipes/site.js, wherever the page shows them.
  const contact = Object.entries((Story.config && Story.config.contact) || {})
    .map(([name, value]) => [name, name === 'email' ? `mailto:${value}` : value]);
  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('a[href]');
    const hit = link && contact.find(([, href]) => link.getAttribute('href') === href);
    if (hit) count(`contact-${hit[0]}`, `Clicked the ${hit[0]} link`);
  }, true);
})();
