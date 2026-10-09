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
    // Scroll on through the story, one step at a time.
    const steps = act.beats + 1;
    for (let k = 1; k <= steps; k++) {
      await scrollTo(page, start + ((end - start) * k) / steps - 4);
      await page.waitForTimeout(120);
    }
    await page.waitForFunction(i => Story.state.unlocked.has(i), n, { timeout: 15000 });
    await page.waitForSelector(`#${id} .act-screen.is-ready`, { timeout: 8000 });
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
  check(['Hammer', 'Act II', 'life', 'Four turns', 'What it added', 'Grit', 'Photo goes here', 'Play hammer throw'].every(t => card.includes(t)),
    'the hammer story card shows name, act, tag, line, what it added, photo slot and Play');
  await page.keyboard.press('Escape');
  await page.click('#tab-tree');
  const skills = await page.evaluate(() => Story.skills().length);
  check(await page.$$eval('#sheet .tree .node', n => n.length) === skills, `Skill tree tab shows ${skills} skills`);
  check(!(await page.$eval('#sheet .tree', t => t.textContent.includes('???'))), 'every skill is named once its act is unlocked');
  await page.click('#sheet [data-skill="product"]');
  check((await page.textContent('#sheet .tree-info')).includes('Grew from Throwing, Capital projects, Mountains, Debugging'), 'Product shows the branches it ties together');
  // The draft look picker changes the character everywhere and gives the line to keep.
  const before = await page.$eval('.intro-hero img', i => i.src);
  await page.click('#sheet .look-picker summary');
  await page.selectOption('#sheet .look-field select >> nth=0', 'long');
  await page.click('#sheet .look-check input');
  const after = await page.$eval('.intro-hero img', i => i.src);
  check(after !== before && (await page.textContent('#sheet .look-line')).includes("hairStyle: 'long'") && (await page.textContent('#sheet .look-line')).includes('glasses: true'),
    'the look picker restyles the character and shows the line to keep');
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
  // A full throw: hold through four turns and let go while it glows.
  await ready();
  await page.keyboard.down('Space');
  await page.waitForFunction(s => { const d = document.querySelector(s).dataset; return d.turn === '4' && d.zone === 'yes'; }, st, { polling: 'raf', timeout: 12000 });
  await page.keyboard.up('Space');
  await page.waitForFunction(s => document.querySelector(s).dataset.last, st, { timeout: 6000 });
  const mark = await page.$eval(st, s => s.dataset.last);
  check(/^\d+\.\d\d$/.test(mark) && Number(mark) > 60, `a release in the glow on the fourth turn lands in the sector (${mark} m)`);
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
  check(place >= 1 && place <= 4, `the race finishes with a place (${place})`);
  await page.click('#game .game-skip');
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
  await page.keyboard.up('Space');
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}

async function phone(browser) {
  console.log('\nPhone');
  const { context, page, errors } = await open(browser, { ...devices['iPhone 13'] });
  check(await page.$eval('.hud', h => Math.abs(h.getBoundingClientRect().bottom - window.innerHeight) < 1), 'the bar sits along the bottom');
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
  await reducedMotion(browser);
  await phone(browser);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
