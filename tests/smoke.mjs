// End-to-end smoke test: opens index.html from disk in Chrome and does what a reader does.
// Run with `npm test` after `npm install`. Uses the installed Google Chrome, or CHROME_PATH.
import { chromium, devices } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'file://' + path.join(here, '..', 'index.html');
const launch = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' };

let failures = 0;
function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures += 1;
}

async function open(browser, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(SITE);
  await page.waitForSelector('html[data-ready="true"]');
  return { context, page, errors };
}

const scrollTo = (page, y) => page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
// The index of the scene stage on screen (its canvas is the visible one).
const stageShown = (page, id) => page.$$eval(`#${id} .scene-canvas`, cs => cs.findIndex(c => getComputedStyle(c).visibility === 'visible'));
// Where each act holds still, and for how long, in page pixels.
const pins = page => page.evaluate(() => ScrollTrigger.getAll().filter(t => t.pin).map(t => ({ start: t.start, end: t.end })));

async function desktop(browser) {
  console.log('\nLaptop, motion on');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => { window.__unlocks = 0; Story.on('unlock', () => { window.__unlocks += 1; }); });
  const ids = await page.$$eval('section.act', s => s.map(x => x.id));
  const items = await page.evaluate(() => Story.items().length);
  check(ids.length === 6, 'six acts are on the page');
  check(await page.textContent('.intro-title') === 'Joe' && await page.textContent('.hud-name') === 'Joe', 'the intro and the bar say Joe');
  check(await page.textContent('.hud-count') === `0/${items}`, 'the sheet starts empty');
  check(await page.$$eval('.belt-slot.is-filled', s => s.length) === 0, 'the inventory belt starts empty');
  check(await page.$eval('#act-school .act-screen', s => getComputedStyle(s).filter.includes('grayscale(1)')), 'acts start in gray');

  const where = await pins(page);
  for (const [n, id] of ids.entries()) {
    const { start, end } = where[n];
    const act = await page.evaluate(i => ({ beats: Story.acts[i].beats.length, items: Story.acts[i].items.map(it => it.id), skills: Story.acts[i].skills.length }), n);
    // Scroll in: the chapter card plays and the color comes in.
    await scrollTo(page, start - 450);
    await page.waitForFunction(i => Acts.sections[i].played >= 1, n, { timeout: 5000 });
    await scrollTo(page, start + 2);
    await page.waitForTimeout(200);
    const fit = await page.$eval(`#${id} .act-screen`, s => { const r = s.getBoundingClientRect(); return Math.abs(r.top) < 2 && Math.abs(r.height - window.innerHeight) < 2; });
    check(fit, `Act ${n + 1} fills the screen and holds still`);
    // The first moment plays at once and gives its item.
    await page.waitForFunction(i => Acts.sections[i].played >= 2, n, { timeout: 6000 });
    const first = await page.$$eval(`#${id} .beat:not(.is-locked)`, b => b.length);
    check(first === 1, `Act ${n + 1} tells its first moment before the rest`);
    check((end - start) <= 900 * (0.6 * (act.beats + 1) + 0.7) + 2, `Act ${n + 1} holds still for ${((end - start) / 900).toFixed(2)} screens, 0.6 a moment plus 0.7`);
    const heroAt = () => page.$eval(`#${id} .scene-hero`, h => parseFloat(h.style.left));
    const startX = await heroAt();
    // Scroll on through the story, one moment's room at a time: each stop is a whole moment.
    const room = 900 * 0.6;
    for (let k = 1; k <= act.beats; k++) {
      await scrollTo(page, start + room * k + 2);
      await page.waitForTimeout(700);
      if (n === 0) {
        // Act I: each moment dives into its own scene, and the skills light with the moment they belong to.
        const ok = await page.waitForFunction(([sel, want, lit]) => {
          const shown = [...document.querySelectorAll(sel)].findIndex(c => getComputedStyle(c).visibility === 'visible');
          return shown === want && document.querySelectorAll('.skill-card.is-on').length === lit;
        }, [`#${id} .scene-canvas`, k - 1, Math.min(k, 2)], { timeout: 8000 }).then(() => true, () => false);
        check(ok, `Act I: after moment ${k} the scene is ${k} of 4 and ${Math.min(k, 2)} skill(s) are lit`);
      }
      if (k === 1) {
        // Between moments the scroll still moves things: the hero walks and the rail fills.
        const mid = await page.$eval(`#${id}`, s => ({ fill: s.querySelector('.rail-fill').style.transform, label: s.querySelector('.rail-label').textContent }));
        check((await heroAt()) > startX && mid.fill !== 'scaleX(0)', `Act ${n + 1}: scrolling walks the hero and fills the progress rail`);
        check(/^Moment 2 of \d$/.test(mid.label), `Act ${n + 1}: the rail says ${mid.label}`);
      }
    }
    await scrollTo(page, end - 4);
    await page.waitForFunction(i => Story.state.unlocked.has(i), n, { timeout: 15000 });
    await page.waitForSelector(`#${id} .act-screen.is-ready`, { timeout: 8000 });
    if (n === 0) check((await stageShown(page, id)) === 3, 'Act I: the level-up opens on the character screen');
    await page.waitForTimeout(900);
    const done = await page.evaluate(([sel, ids]) => {
      const s = document.querySelector(sel);
      const beltTop = (document.querySelector('.belt') || { getBoundingClientRect: () => ({ top: innerHeight }) }).getBoundingClientRect().top;
      return {
        pill: s.querySelector('.unlock-pill').textContent,
        beatsShown: s.querySelectorAll('.beat:not(.is-locked)').length,
        beatsInView: [...s.querySelectorAll('.beat')].every(b => b.getBoundingClientRect().bottom <= beltTop + 1),
        skillsLit: s.querySelectorAll('.skill-card.is-on').length,
        inBelt: ids.every(id => document.querySelector(`.belt-slot[data-item="${id}"]`).classList.contains('is-filled')),
        gray: getComputedStyle(s.querySelector('.act-screen')).filter,
      };
    }, [`#${id}`, act.items]);
    check(done.pill === `Level ${n + 1}` && done.skillsLit === act.skills, `Act ${n + 1} levels up and lights its ${act.skills} skills`);
    check(done.beatsShown === act.beats && done.beatsInView, `Act ${n + 1} shows all ${act.beats} life and work moments without scrolling`);
    check(done.inBelt, `Act ${n + 1} drops its items into the inventory belt`);
    check(!done.gray.includes('grayscale(1)'), `Act ${n + 1} has its color`);
    const next = await page.$eval(`#${id} .act-next`, a => ({ text: a.textContent.trim(), shown: getComputedStyle(a).visibility === 'visible' }));
    check(next.shown && next.text.startsWith(n < 5 ? `Next: Act ${['II', 'III', 'IV', 'V', 'VI'][n]}` : 'Next: the short version'), `Act ${n + 1} ends with a Next tag (${next.text})`);
  }
  check(await page.textContent('.hud-count') === `${items}/${items}`, `the sheet holds all ${items} items`);

  await scrollTo(page, 0);
  await page.waitForTimeout(300);
  await scrollTo(page, await page.evaluate(() => document.body.scrollHeight));
  await page.waitForTimeout(300);
  check(await page.evaluate(() => window.__unlocks) === 6, 'scrolling back and forth does not replay any unlock');

  // The character sheet.
  await page.evaluate(() => Sheet.open({ tab: 'items' }));
  await page.waitForSelector('#sheet[open]');
  check(await page.$$eval('#sheet .inv-slot.is-filled', s => s.length) === items, `Items tab shows ${items} items`);
  check(await page.$$eval('#sheet .bar i', s => s.length) > 6, 'stats show as colored bars');
  check(!(await page.$eval('#sheet .stats', s => /\d/.test(s.textContent))), 'stats have no numbers');
  await page.click('#sheet .inv-slot[data-item="hammer"]');
  await page.waitForSelector('#card[open]');
  const card = await page.$eval('#card', c => c.textContent);
  check(['Hammer', 'Act II', 'life', 'Four turns', 'What it added', 'Grit', 'Play hammer throw'].every(t => card.includes(t)),
    'the hammer story card shows name, act, tag, line, what it added and Play');
  await page.keyboard.press('Escape');
  await page.click('#tab-map');
  check(await page.$$eval('#sheet .map-stop', n => n.length) === 6 && await page.$eval('#sheet .map-canvas', c => c.getBoundingClientRect().width > 300), 'the Map tab shows the map with six stops');
  await page.waitForFunction(() => document.querySelector('#sheet .map').dataset.at === '5.00', null, { timeout: 2000 });
  check(true, 'the hero stands at the furthest stop reached');
  await page.click('#sheet [data-stop="1"]');
  check((await page.textContent('#sheet .map-info')).includes('Hammer thrower. Skills: Throwing, Chemistry.'), 'a stop shows its class and skills');
  await page.waitForTimeout(400);
  const walking = Number(await page.$eval('#sheet .map', m => m.dataset.at));
  check(walking < 5 && walking > 1, `the hero walks the road toward the selected stop (at ${walking})`);
  await page.waitForFunction(() => document.querySelector('#sheet .map').dataset.at === '1.00', null, { timeout: 8000 });
  check(true, 'the hero reaches the selected stop');
  await page.click('#sheet .map-go');
  await page.waitForTimeout(400);
  check(!(await page.$('#sheet[open]')) && await page.$eval('#act-school', s => Math.abs(s.getBoundingClientRect().top) < 4), 'Go to Act II closes the sheet at Act II');
  await page.evaluate(() => Sheet.open({ tab: 'items' }));
  await page.waitForSelector('#sheet[open]');
  check(await page.$('.look-picker') === null && await page.$('.card-draft') === null, 'the look picker and the draft notes are gone');
  await page.evaluate(() => Sheet.openItem(Story.items()[0].id));
  await page.waitForSelector('#card[open]');
  check(await page.$('#card .card-photo') === null, 'a story card with no photo shows no photo box');
  await page.keyboard.press('Escape');
  check(await page.$eval('#say-hello .hello-links', ul => [...ul.querySelectorAll('a')].map(a => `${a.textContent} ${a.getAttribute('href')}`).join()) === 'LinkedIn https://www.linkedin.com/in/josephvellella/,Email mailto:connect-with-joe.next036@passmail.net,GitHub https://github.com/COValhalla', 'Say hello lists the links from the recipe');
  check(await page.getAttribute('.hud-hello', 'href') === '#say-hello' && await page.title() === 'Joe Vellella · A life in six acts', 'the top bar links to Say hello and the tab says the full name');
  check(await page.textContent('.site-foot') === 'Joe Vellella', 'the footer says the full name');
  await page.keyboard.press('Escape');

  await hammer(page);
  await bmx(page);
  check(errors.length === 0, 'no console errors or warnings' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();
}

async function hammer(page) {
  const st = '#game .game-stage';
  await page.evaluate(() => Games.open('hammer'));
  await page.waitForSelector('#game[open]');
  const ready = () => page.waitForFunction(s => document.querySelector(s).dataset.state === 'ready', st, { timeout: 8000 });
  const landed = () => page.waitForFunction(s => ['landed', 'done'].includes(document.querySelector(s).dataset.state), st, { timeout: 9000 });
  // The last two turns are faster, and the glow still lasts at least 0.1 s.
  const window4 = await page.$eval(st, s => { const h = s.hammer; h.s.omega = 9.2; const w = (2 * h.zone()) / 9.2; h.s.omega = 0; return w; });
  check(window4 >= 0.0999, `the glow lasts ${window4.toFixed(3)} s on the fastest turn`);
  // A full throw: hold through four turns and let go in the middle of the glow.
  await ready();
  await page.keyboard.down('Space');
  await page.waitForFunction(s => { const h = document.querySelector(s).hammer; return h.s.turn === 4 && Math.abs(Math.atan2(Math.sin(h.s.theta), Math.cos(h.s.theta))) < 0.08; }, st, { polling: 'raf', timeout: 12000 });
  const turnSpeed = await page.$eval(st, s => s.hammer.s.omega);
  await page.keyboard.up('Space');
  check(turnSpeed > 8.5, `the fourth turn spins fast (${turnSpeed.toFixed(2)} radians a second)`);
  check(await page.$eval(st, s => s.dataset.hit) === 'perfect', 'a centered release on the fourth turn hits: a freeze, a shake and a flash');
  await page.waitForFunction(s => document.querySelector(s).dataset.camera === 'on', st, { timeout: 2000 });
  check(true, 'a big throw cuts to the throw camera');
  await page.waitForFunction(s => document.querySelector(s).dataset.last, st, { timeout: 8000 });
  const mark = await page.$eval(st, s => s.dataset.last);
  check(/^\d+\.\d\d$/.test(mark) && Number(mark) > 76 && Number(mark) <= 79, `the camera lands it back on the mark, and a clean fourth turn still reaches the best mark (${mark} m)`);
  check(await page.$eval(st, s => s.dataset.camera) === 'done', 'the camera cuts back to the field');
  // Holding on: the turns stop at four and it is a foul.
  await ready();
  await page.keyboard.down('Space');
  let most = 0;
  for (let i = 0; i < 60; i++) {
    const d = await page.$eval(st, s => ({ turn: Number(s.dataset.turn), state: s.dataset.state }));
    most = Math.max(most, d.turn);
    if (d.state === 'landed') break;
    await page.waitForTimeout(150);
  }
  await page.keyboard.up('Space');
  check(most === 4 && await page.$eval(st, s => s.dataset.last) === 'foul', 'holding on past four turns is a foul, and the turns never pass four');
  // Letting go during the wind is a foul too.
  await ready();
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await landed();
  check(await page.$eval(st, s => s.dataset.last) === 'foul', 'letting go during the wind is a foul');
  check((await page.$$eval('#game .sb-throw', b => b.map(x => x.textContent))).join(' ') === `${mark} X X`, 'the scoreboard lists the mark and the two fouls');
  await page.click('#game .game-skip');
  check(!(await page.$('#game[open]')), 'Skip closes the game');
}

async function bmx(page) {
  const st = '#game .game-stage';
  await page.evaluate(() => Games.open('bmx'));
  await page.waitForSelector('#game[open]');
  check(await page.$eval(st, s => s.dataset.state) === 'ready', 'the BMX race waits on the start hill');
  await page.keyboard.press('Space');
  check(await page.$eval(st, s => s.dataset.state) === 'cadence', 'pressing Pump starts the gate cadence');
  check(await page.$eval(st, s => s.bmx.s.player.h > 30), 'the riders start on the raised start hill');
  check(await page.$eval(st, s => s.bmx.s.riders.map(r => r.lane * Games.get('bmx').sim.LANE_GAP).join(',')) === '0,5,10', 'you race two rivals, in lanes 5 pixels apart');
  await page.waitForFunction(s => document.querySelector(s).dataset.state === 'riding', st, { timeout: 8000 });
  check(await page.$eval(st, s => s.bmx.s.gate === 1), 'the gate drops and the race starts');
  // A bot rider: hold Pedal, and tap Pump just before each roller and each lip.
  await page.evaluate(s => {
    const g = document.querySelector(s).bmx;
    g.pedal(true);
    let done = null;
    (function loop() {
      if (g.s.phase !== 'riding') return;
      const r = g.s.player;
      const next = g.track.features.find(f => (f.kind === 'roller' ? f.x0 : f.x) > r.x + 4 && f !== done);
      if (next && r.x + 6 >= (next.kind === 'roller' ? next.x0 - 4 : next.x - 6)) { g.press(); done = next; }
      requestAnimationFrame(loop);
    })();
  }, st);
  await page.waitForFunction(s => Number(document.querySelector(s).dataset.speed) > 60, st, { timeout: 4000 });
  check(true, 'holding Pedal builds speed');
  await page.waitForFunction(s => Number(document.querySelector(s).dataset.perfect) >= 3, st, { timeout: 12000 });
  check(true, 'timed pumps in the roller section count as perfect pumps');
  await page.waitForFunction(s => document.querySelector(s).dataset.state === 'finished', st, { timeout: 30000 });
  const place = await page.$eval(st, s => Number(s.dataset.place));
  check(place >= 1 && place <= 3, `the race finishes with a place (${place})`);
  await page.click('#game .game-skip');
  // The pump rules, without drawing: the call for a press at each spot before a roller.
  const calls = await page.evaluate(() => {
    const { buildTrack, newRider, step, liftAngle } = Games.get('bmx').sim;
    const track = buildTrack();
    const rollers = track.features.filter(f => f.kind === 'roller');
    const f = rollers[0];
    const ride = pressAt => {
      const r = newRider(0, track);
      r.x = f.x0 - 60; r.h = track.heightAt(r.x); r.v = 60;
      const events = [];
      let pressed = false;
      for (let i = 0; i < 4000 && events.length < 2 && r.x < f.x1 + 60; i++) {
        if (!pressed && r.x + 6 >= pressAt) { r.press = { x: r.x + 6, used: false }; pressed = true; }
        const e = step(r, track, { pedal: false }, 0.004);
        if (e) events.push(e);
      }
      return events.join(' then ');
    };
    return {
      perfect: ride(f.x0 - 4), early: ride(f.x0 - 20), late: ride(f.x0 + 8), tooEarly: ride(f.x0 - 40), none: ride(Infinity),
      carried: ride(f.x0 + 14),
      lift: [0.035, 0.1, 0.3, 0.4].map(t => Math.round(liftAngle(t) * 180 / Math.PI)),
    };
  });
  check(calls.perfect.startsWith('perfect') && calls.early.startsWith('good-early') && calls.late.startsWith('good-late') && calls.tooEarly.startsWith('early') && calls.none.startsWith('bump'),
    `each press gets its call: ${calls.perfect}, ${calls.early}, ${calls.late}, ${calls.tooEarly}, ${calls.none}`);
  check(calls.carried === 'bump then perfect', `a press after a roller's strip counts toward the next roller (${calls.carried})`);
  check(calls.lift.join(',') === '11,22,10,0', `a press lifts the front wheel up to 22 degrees and back down (${calls.lift.join(', ')})`);
}

async function pacing(browser) {
  console.log('\nLaptop, the pace of the scroll');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  const { start } = (await pins(page))[0];
  const room = 900 * 0.6;
  await scrollTo(page, start - 450);
  await page.waitForFunction(() => Acts.sections[0].played >= 1, null, { timeout: 5000 });
  // A small nudge past a moment settles back; a bigger one glides on to the next.
  const settledAfter = async nudge => {
    await scrollTo(page, start + room);
    await page.waitForTimeout(100);
    await page.evaluate(v => window.scrollBy({ top: v, behavior: 'instant' }), nudge);
    // The settle takes up to 0.16 s to start and 0.45 s to glide; read it after a longer wait so a slow frame cannot catch it mid-glide.
    await page.waitForTimeout(1200);
    return (await page.evaluate(() => window.scrollY)) - (start + room);
  };
  const back = await settledAfter(40);
  check(Math.abs(back) < 3, `a 40 px nudge past a moment settles back onto it (${back}px)`);
  check(Math.abs((await settledAfter(120)) - room) < 3, 'a 120 px nudge glides on to the next moment');
  // A flick of about 1,150 px ends on a whole moment, and moments scrolled past play at most 1.5x.
  await scrollTo(page, start);
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    window.__peak = 0;
    window.__watch = true;
    const tick = () => {
      const r = Acts.sections[0].running;
      if (r) window.__peak = Math.max(window.__peak, r.timeScale());
      if (window.__watch) requestAnimationFrame(tick);
    };
    tick();
    window.scrollBy({ top: 1150, behavior: 'instant' });
    setTimeout(() => { window.__watch = false; }, 1500);
  });
  await page.waitForTimeout(1200);
  const moments = (await page.evaluate(() => window.scrollY) - start) / room;
  check(Math.abs(moments - Math.round(moments)) < 0.01, `a 1,150 px flick ends on a whole moment (${moments.toFixed(2)} moments in)`);
  const peak = await page.evaluate(() => window.__peak);
  check(peak <= 1.5 + 1e-6, `moments scrolled past play at most 1.5x (peak ${peak.toFixed(2)}x)`);
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}

async function reducedMotion(browser) {
  console.log('\nLaptop, motion turned off');
  const { context, page, errors } = await open(browser, { viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  const items = await page.evaluate(() => Story.items().length);
  check(await page.$$eval('section.act.is-unlocked', s => s.length) === 6, 'every act shows already unlocked');
  check(await page.$$eval('.beat.is-locked', b => b.length) === 0, 'every moment is shown');
  check(await page.textContent('.hud-count') === `${items}/${items}` && await page.$$eval('.belt-slot.is-filled', s => s.length) === items, 'the sheet and the belt are already full');
  await page.evaluate(() => Games.open('hammer'));
  await page.keyboard.down('Space');
  await page.waitForTimeout(600);
  check(['wind', 'turns'].includes(await page.$eval('#game .game-stage', s => s.dataset.state)), 'the hammer throw is still playable');
  await page.waitForFunction(() => { const h = document.querySelector('#game .game-stage').hammer; return h.s.turn === 4 && Math.abs(Math.atan2(Math.sin(h.s.theta), Math.cos(h.s.theta))) < 0.08; }, null, { polling: 'raf', timeout: 12000 });
  await page.keyboard.up('Space');
  await page.waitForFunction(() => document.querySelector('#game .game-stage').dataset.camera === 'on', null, { timeout: 2000 });
  await page.waitForTimeout(300);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('#game .game-stage').dataset.last, null, { timeout: 1000 });
  check(true, 'a tap skips the throw camera straight to the mark');
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}

async function mapPartway(browser) {
  console.log('\nThe map, partway through');
  const { context, page, errors } = await open(browser, { viewport: { width: 1280, height: 860 } });
  await page.evaluate(() => [0, 1, 2].forEach(i => Acts.unlock(i)));
  await page.evaluate(() => Sheet.open({ tab: 'map' }));
  await page.waitForSelector('#sheet[open]');
  await page.waitForFunction(() => document.querySelector('#sheet .map').dataset.at === '2.00', null, { timeout: 2000 });
  check(true, 'the hero waits at Act III, the furthest stop reached');
  await page.click('#sheet [data-stop="4"]');
  check((await page.textContent('#sheet .map-info')).includes('Not reached yet'), 'a stop not reached yet says so');
  // The year off grows the beard moment by moment.
  const looks = await page.evaluate(() => Story.acts[4].beats.map(b => b.look && b.look.beard).join(','));
  check(looks === 'stubble,short,full,long', `the beard grows through the year off (${looks})`);
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}

async function phone(browser) {
  console.log('\nPhone');
  const { context, page, errors } = await open(browser, { ...devices['iPhone 13'] });
  check(await page.$eval('.hud', h => Math.abs(h.getBoundingClientRect().bottom - window.innerHeight) < 1), 'the bar sits along the bottom');
  check(await page.isVisible('.hud-hello .hud-at') && !(await page.isVisible('.hud-hello .hud-label')), 'the bar shows an @ for Say hello');
  check(await page.$eval('.hud', h => h.scrollWidth <= h.clientWidth), 'the bar fits the phone width');
  const where = await pins(page);
  await scrollTo(page, where[1].start - 300);
  await page.waitForFunction(() => Acts.sections[1].played >= 1, null, { timeout: 5000 });
  await scrollTo(page, where[1].start + 2);
  await page.waitForTimeout(200);
  check(await page.$eval('#act-school .act-screen', s => Math.abs(s.getBoundingClientRect().height - window.innerHeight) < 2), 'Act II fills the screen');
  await scrollTo(page, where[1].end - 4);
  await page.waitForFunction(() => Story.state.unlocked.has(1), null, { timeout: 15000 });
  await page.waitForSelector('#act-school .act-screen.is-ready', { timeout: 8000 });
  await page.locator('#act-school .unlock-actions .btn--accent').tap();
  await page.waitForSelector('#sheet[open]');
  check(await page.$eval('#sheet', d => d.getBoundingClientRect().width <= window.innerWidth), 'the sheet fits the screen');
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}

const browser = await chromium.launch({ ...launch, headless: true });
try {
  await desktop(browser);
  await pacing(browser);
  await reducedMotion(browser);
  await mapPartway(browser);
  await phone(browser);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
