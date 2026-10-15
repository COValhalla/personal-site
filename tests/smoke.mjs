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

// Selects an item and reads the story card it opens: true when the card opens and shows every word.
async function storyCard(page, selector, words) {
  await page.click(selector);
  const opened = await page.waitForSelector('#card[open]', { timeout: 2000 }).then(() => true, () => false);
  const text = opened ? await page.$eval('#card', c => c.textContent) : '';
  return opened && words.every(w => text.includes(w));
}

const scrollTo = (page, y) => page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
// The index of the scene stage on screen (its canvas is the visible one).
const stageShown = (page, id) => page.$$eval(`#${id} .scene-canvas`, cs => cs.findIndex(c => getComputedStyle(c).visibility === 'visible'));
// Where each act holds still, and for how long, in page pixels.
const pins = page => page.evaluate(() => ScrollTrigger.getAll().filter(t => t.pin).map(t => ({ start: t.start, end: t.end })));
// How many pixels of an act's moments fall outside its story panel's edges, so only scrolling inside it would show them.
const storyHidden = (page, id) => page.$eval(`#${id} .story`, st => {
  const top = st.getBoundingClientRect().top + st.clientTop;
  const bottom = top + st.clientHeight;
  const beats = [...st.querySelectorAll('.beat')].map(b => b.getBoundingClientRect());
  return Math.round(Math.max(st.scrollHeight - st.clientHeight, ...beats.map(b => Math.max(top - b.top, b.bottom - bottom))));
});
// With every act unlocked, how tall each act's story panel is and how much of each moment it shows
// when that moment is the newest and the panel scrolls to it as the story does.
const storyRoom = page => page.evaluate(() => Acts.sections.map(({ act, screen }) => {
  const st = screen.querySelector('.story');
  const shown = [...st.querySelectorAll('.beat')].map(li => {
    st.scrollTop = Math.max(0, li.offsetTop - st.offsetTop - 40);
    const top = st.getBoundingClientRect().top + st.clientTop;
    const b = li.getBoundingClientRect();
    const cs = getComputedStyle(li);
    // The moment's top border and padding, then two lines of its words.
    const need = parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop) + 2 * parseFloat(cs.lineHeight);
    return Math.min(b.bottom, top + st.clientHeight) - Math.max(b.top, top) - Math.min(need, b.height);
  });
  st.scrollTop = 0;
  return { id: act.id, height: st.clientHeight, short: Math.round(-Math.min(...shown)) };
}));
// With every act unlocked, what each act's Next tag covers at the top of its pulse: a button, a skill card,
// or the bar along the bottom (the belt on laptops and tablets, the bar on phones).
async function nextCovers(page, bar = '.hud', barName = 'the bar') {
  // From the top, so scrolling down to each act never rewinds one.
  await scrollTo(page, 0);
  await page.waitForTimeout(300);
  await page.evaluate(() => Acts.sections.forEach((_, i) => Acts.unlock(i)));
  const where = await pins(page);
  const covered = [];
  for (let i = 0; i < where.length; i++) {
    await scrollTo(page, where[i].end - 4);
    await page.waitForTimeout(300);
    covered.push(...await page.evaluate(([i, bar, barName]) => {
      const { act, screen } = Acts.sections[i];
      const tag = screen.querySelector('.act-next');
      if (!screen.classList.contains('is-done') || getComputedStyle(tag).visibility !== 'visible') return [`${act.id} shows no Next tag`];
      tag.getAnimations().forEach(a => { a.pause(); a.currentTime = a.effect.getTiming().duration / 2; });
      const t = tag.getBoundingClientRect();
      const hits = [...screen.querySelectorAll('.unlock-actions .btn, .skill-card')].filter(el => {
        const b = el.getBoundingClientRect();
        return b.left < t.right && t.left < b.right && b.top < t.bottom && t.top < b.bottom;
      }).map(el => `${act.id} ${(el.querySelector('.skill-name') || el).textContent.trim()}`);
      // The bar covers the bottom of the act's screen, which is one screen tall.
      const barH = window.innerHeight - document.querySelector(bar).getBoundingClientRect().top;
      if (t.bottom > screen.getBoundingClientRect().bottom - barH) hits.push(`${act.id} ${barName}`);
      return hits;
    }, [i, bar, barName]));
  }
  return covered;
}

async function desktop(browser) {
  console.log('\nLaptop, motion on');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => { window.__unlocks = 0; Story.on('unlock', () => { window.__unlocks += 1; }); });
  const ids = await page.$$eval('section.act', s => s.map(x => x.id));
  const items = await page.evaluate(() => Story.items().length);
  check(ids.length === 8, 'the tutorial and seven acts are on the page');
  check(await page.textContent('.intro-title') === 'Joe Vellella' && await page.textContent('.hud-name') === 'Joe', 'the title screen says Joe Vellella and the bar says Joe');
  const welcome = await page.textContent('.intro-tag');
  check(welcome === await page.evaluate(() => Story.config.welcome) && welcome.startsWith('I build products.') && !welcome.includes('Joe') && welcome.includes('Press start'),
    'the title screen shows the welcome from the recipe, which starts with what Joe does, does not repeat his name and leads to Press start');
  // Words only gamers read, and words Joe asked to drop, stay off the page.
  const page1 = await page.evaluate(() => document.body.textContent + Story.acts.map(a => a.beats.map(b => b.text).join(' ')).join(' '));
  const dropped = ['classes', 'whatever the work needed next', 'respec', 'Respec', 'quest log', 'Quest log', 'scooter', 'From 12', 'got at home', 'needed a security clearance'].filter(w => page1.includes(w));
  check(dropped.length === 0, `no page text says classes, respec or quest log, or keeps the old lines${dropped.length ? ` (found: ${dropped.join(', ')})` : ''}`);
  check(await page.$eval('#act-year-off .act-title', t => t.textContent) === 'The leap', 'Act VI is called The leap');
  const clearance = await page.evaluate(() => Story.acts.flatMap(a => a.beats.map(b => b.text)).filter(t => t.includes('clearance')));
  check(clearance.length === 1 && clearance[0].startsWith('My clearance stalled, so rather than wait I moved to Sioux City'), 'the clearance comes up once, as the reason Joe moved to Sioux City');
  // The early acts describe what Joe did and learned, not brands or rankings.
  const said = await page.evaluate(() => [Story.config.welcome, ...Story.acts.flatMap(a => a.beats.map(b => b.text))]);
  const banned = ['Diablo', 'Accelerated Reader', 'by far', 'basketball', 'three towns', 'in shape'].filter(w => said.some(t => t.includes(w)));
  check(banned.length === 0, `no moment and not the welcome names a game brand, a ranking or a setback with no payoff${banned.length ? ` (found: ${banned.join(', ')})` : ''}`);
  const callbacks = await page.evaluate(() => [Story.acts[0].beats[1].text, Story.acts[7].beats.at(-1).text, Story.acts[2].beats[0].text, Story.acts[2].beats.at(-1).text]);
  check(callbacks[0].includes('typing class') && callbacks[1].includes('typing game') && callbacks[2].includes("team's captain") && callbacks[3].startsWith('Summers I worked') && callbacks[3].includes('only as good as the forms you build first'),
    "Act VII's last moment calls back to the Tutorial's typing class, and Act II opens on the team's captain and ends on the summer jobs' lesson about forms");
  // The Tutorial's third moment is the holiday box work at the family business, in place of the reading game.
  const box = await page.evaluate(() => ({ beat: Story.acts[0].beats[2], skills: Story.acts[0].skills.map(s => s.name), item: Story.item('box') }));
  check(box.beat.tag === 'work' && box.beat.text.startsWith('Every holiday rush I worked at our family business') && box.beat.item === 'box' && box.item.name === 'Shipping box' && box.skills.join() === 'Gaming,Typing,Process' && !(await page.evaluate(() => Story.skill('reading'))),
    'the Tutorial\'s third moment is holiday box work: it gives the Shipping box and lights Process, and Reading is gone');
  check(await page.evaluate(() => Story.skill('chemistry').parents.includes('process') && Story.skill('product').parents.includes('process') && Story.skill('planning').parents.includes('process')),
    'Chemistry, Product and Planning grow from Process');
  // Every moment plays a scene animation for most of the time its words type out, as Act I's do, and it shows: half way, the scene has moved.
  const cues = await page.evaluate(() => Story.acts.flatMap(act => {
    const names = act.stages || [act.scene];
    return act.beats.map((beat, k) => {
      const name = names[act.stages ? k : 0];
      const canvas = document.createElement('canvas');
      canvas.width = Scenes.W;
      canvas.height = Scenes.H;
      // Read back often, so ask for a context made for it before the scene draws.
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const stage = Scenes.mount(Scenes.get(name, act), canvas, act.color, Story.acts);
      act.beats.slice(0, k).forEach((b, j) => { if (b.cue && names[act.stages ? j : 0] === name) stage.settle(b.cue); });
      const pixels = () => ctx.getImageData(0, 0, Scenes.W, Scenes.H).data;
      stage.render();
      const before = pixels();
      const tl = beat.cue && stage.cue(beat.cue);
      const seconds = tl ? tl.duration() : 0;
      if (tl) { tl.pause(seconds / 2); stage.render(); tl.kill(); }
      const half = pixels();
      const changed = half.some((v, i) => v !== before[i]);
      const typing = Math.max(0.3, beat.text.length / Acts.BEATS.typeRate);
      return { where: `${act.id} ${k + 1}`, seconds, typing, changed };
    });
  }));
  const short = cues.filter(c => c.seconds < 0.8 || c.seconds < 0.8 * c.typing || !c.changed);
  check(short.length === 0, `every moment's scene animation runs at least 0.8 s and 0.8 of its typing time, and moves the scene (${cues.length} moments${short.length ? `; short: ${short.map(c => `${c.where} ${c.seconds.toFixed(1)}/${c.typing.toFixed(1)} s${c.changed ? '' : ' still'}`).join(', ')}` : ''})`);
  const locked = await page.$eval('#act-high-school .skill-card[data-skill="teamwork"]', b => { b.click(); return b.disabled; });
  check(locked && await page.$('#card[open]') === null, 'a locked skill card opens nothing');
  check(await page.$$eval('.intro .intro-note a', a => a.map(x => `${x.textContent} ${x.getAttribute('href')} ${x.target}`).join()) === 'Short on time? See my work history on LinkedIn. https://www.linkedin.com/in/josephvellella/ _blank' && await page.$('.intro .intro-start') !== null,
    'the welcome has a Press start button and only the LinkedIn work-history link');
  check(await page.textContent('.hud-count') === `0/${items}`, 'the sheet starts empty');
  check(await page.$$eval('.belt-slot.is-filled', s => s.length) === 0, 'the inventory belt starts empty');
  check(await page.$eval('#act-high-school .act-screen', s => getComputedStyle(s).filter.includes('grayscale(1)')), 'acts start in gray');

  // Every moment's item and skill wait for its words: the item pops in once the words are whole, then the skill lights,
  // then the item flies to the inventory. Watched across the whole walk through the acts below.
  await page.evaluate(() => {
    window.__order = [];
    const note = (what, i, k) => {
      const li = Acts.sections[i].beats[k];
      const text = li.querySelector('.beat-text');
      const chip = li.querySelector('.beat-item');
      window.__order.push({ what, act: i, k, whole: text.textContent === text.dataset.text, chip: !!chip && chip.classList.contains('is-on') });
    };
    Story.acts.forEach((act, i) => {
      const beats = Story.beatsOf(act);
      beats.forEach((beat, k) => {
        const chip = Acts.sections[i].beats[k].querySelector('.beat-item');
        if (chip) new MutationObserver(() => { if (chip.classList.contains('is-on')) note('chip', i, k); }).observe(chip, { attributeFilter: ['class'] });
      });
      act.skills.forEach((skill, n) => {
        if (!skill.moment) return;
        const card = Acts.sections[i].skillCards[n];
        new MutationObserver(() => { if (card.classList.contains('is-on')) note('skill', i, skill.moment - 1); }).observe(card, { attributeFilter: ['class'] });
      });
    });
    Story.on('item', id => Story.acts.forEach((act, i) => Story.beatsOf(act).forEach((beat, k) => {
      if (beat.give && beat.give.id === id) {
        note('fly', i, k);
        const skill = act.skills.find(sk => sk.moment === k + 1);
        window.__order.at(-1).skill = !skill || Story.state.skills.has(skill.id);
      }
    })));
  });
  const where = await pins(page);
  await page.click('.intro-start');
  await page.waitForTimeout(1500);
  check(Math.abs((await page.evaluate(() => window.scrollY)) - (where[0].start + 2)) < 4, 'Press start glides to the first act');
  await scrollTo(page, 0);
  await page.waitForTimeout(300);
  // Scrolling back above the Tutorial rewound it, so the watch starts over for the walk.
  await page.evaluate(() => { window.__order = []; });
  const names = ['Tutorial', 'Act I', 'Act II', 'Act III', 'Act IV', 'Act V', 'Act VI', 'Act VII'];
  // The Tutorial and Act I dive into a scene per moment, then one for the level-up. Act II tells two moments on the
  // football field, then dives into the summer jobs for the third, then the character screen for the level-up.
  // Acts III and IV dive into a new place for their third moment (the office in Texas, the plant in Sioux City), and
  // Act V into the factory for its second and third. Each list is the scene after each moment.
  const scenes = { 0: [0, 1, 2], 1: [0, 1], 2: [0, 0, 1], 3: [0, 0, 1], 4: [0, 0, 1], 5: [0, 1, 1] };
  const lastScene = { 0: [3, 'the high-score board'], 1: [2, 'the character screen'], 2: [2, 'the character screen'], 3: [2, 'the character screen'], 4: [2, 'the character screen'], 5: [2, 'the character screen'] };
  // In the Tutorial and Acts I and II every moment lights one skill.
  const litEach = new Set([0, 1, 2]);
  // What each act's own moment shows once it has played: night falls in the Tutorial, the crew arrives in Act I,
  // and high school plays out on the football field in Act II. Key n,0 is read after the first moment, before the second starts.
  const shows = {
    '0,1': ['the Tutorial opens at night, with the computer glowing', () => { const st = Acts.sections[0].stages[0].stage.state; return st.dark === 1 && st.screen === 1; }],
    '1,2': ['Act I: the new hires stand at the table in their aprons', () => { const st = Acts.sections[1].stages[1].stage.state; return st.crew === 1 && st.aprons === 1 && st.work === 1; }],
    '0,3': ['the Tutorial packs boxes at the family business: eight boxes stack by the door', () => { const st = Acts.sections[0].stages[2].stage.state; return st.packed === 8; }],
    '2,0': ['Act II, moment 1: night falls, the lights come on, friends and then the team walk on, and the scoreboard says captain', () => { const st = Acts.sections[2].stages[0].stage.state; return st.night === 1 && st.lights === 1 && st.crew === 1 && st.team === 1 && st.captain === 1 && st.hop === 1; }],
    '2,2': ['Act II: the discus lands and the scoreboard counts to 176 feet', () => { const st = Acts.sections[2].stages[0].stage.state; return st.disc === 1 && st.mark === 176; }],
    '2,3': ['Act II, the summer jobs: the forms go up, the concrete pours, and a painted machine rolls onto the truck', () => { const st = Acts.sections[2].stages[1].stage.state; return st.forms === 1 && st.pour === 1 && st.paint === 1 && st.ship === 1; }],
    '3,3': ['Act III, the office in Texas: the sun sets, the executives sit down, the cost and ROI model builds and the room applauds', () => { const st = Acts.sections[3].stages[1].stage.state; return st.sun === 1 && st.seats === 1 && st.bars === 1 && st.roi === 1 && st.clap === 1; }],
    '4,3': ['Act IV, the plant in Sioux City: five crews are trained, the fishbone finds the root cause and the savings show', () => { const st = Acts.sections[4].stages[1].stage.state; return st.train === 1 && st.fish === 1 && st.cause === 1 && st.saved === 1; }],
    '5,2': ['Act V, the factory: the plane flies over, three lines are lowered in and the budget fills on time', () => { const st = Acts.sections[5].stages[1].stage.state; return st.plane === 1 && st.build === 1 && st.budget === 1 && st.ontime === 1; }],
    '5,3': ['Act V, the factory: the design office lights, ten engineers cross the bridge and the line runs', () => { const st = Acts.sections[5].stages[1].stage.state; return st.cad === 1 && st.bridge === 1 && st.eng === 1 && st.line === 1; }],
  };
  for (const [n, id] of ids.entries()) {
    const { start, end } = where[n];
    const act = await page.evaluate(i => ({ beats: Story.acts[i].beats.length, items: Story.acts[i].items.map(it => it.id), skills: Story.acts[i].skills.length }), n);
    // Scroll in: the chapter card plays and the color comes in.
    await scrollTo(page, start - 450);
    await page.waitForFunction(i => Acts.sections[i].played >= 1, n, { timeout: 5000 });
    await scrollTo(page, start + 2);
    await page.waitForTimeout(200);
    const fit = await page.$eval(`#${id} .act-screen`, s => { const r = s.getBoundingClientRect(); return Math.abs(r.top) < 2 && Math.abs(r.height - window.innerHeight) < 2; });
    check(fit, `${names[n]} fills the screen and holds still`);
    // The first moment plays at once and gives its item.
    await page.waitForFunction(i => Acts.sections[i].played >= 2, n, { timeout: 6000 });
    const first = await page.$$eval(`#${id} .beat:not(.is-locked)`, b => b.length);
    check(first === 1, `${names[n]} tells its first moment before the rest`);
    if (shows[`${n},0`]) {
      const [what, test] = shows[`${n},0`];
      check(await page.waitForFunction(test, null, { timeout: 8000 }).then(() => true, () => false), what);
    }
    check((end - start) <= 900 * (0.6 * (act.beats + 1) + 0.7) + 2, `${names[n]} holds still for ${((end - start) / 900).toFixed(2)} screens, 0.6 a moment plus 0.7`);
    const heroAt = () => page.$eval(`#${id} .scene-hero`, h => parseFloat(h.style.left));
    const startX = await heroAt();
    // Scroll on through the story, one moment's room at a time: each stop is a whole moment.
    const room = 900 * 0.6;
    for (let k = 1; k <= act.beats; k++) {
      await scrollTo(page, start + room * k + 2);
      await page.waitForTimeout(700);
      if (scenes[n]) {
        // Each moment plays in its own scene, and where every moment lights a skill, the skills light with their moments.
        const lit = litEach.has(n) ? k : -1;
        const ok = await page.waitForFunction(([sel, want, lit, scope]) => {
          const shown = [...document.querySelectorAll(sel)].findIndex(c => getComputedStyle(c).visibility === 'visible');
          return shown === want && (lit < 0 || document.querySelectorAll(`${scope} .skill-card.is-on`).length === lit);
        }, [`#${id} .scene-canvas`, scenes[n][k - 1], lit, `#${id}`], { timeout: 8000 }).then(() => true, () => false);
        check(ok, `${names[n]}: after moment ${k} the scene is ${scenes[n][k - 1] + 1} of ${lastScene[n][0] + 1}${lit < 0 ? '' : ` and ${k} skill(s) are lit`}`);
      }
      if (shows[`${n},${k}`]) {
        const [what, test] = shows[`${n},${k}`];
        check(await page.waitForFunction(test, null, { timeout: 8000 }).then(() => true, () => false), what);
      }
      if (k === 1) {
        // Between moments the scroll still moves things: the hero walks and the rail fills.
        const mid = await page.$eval(`#${id}`, s => ({ fill: s.querySelector('.rail-fill').style.transform, label: s.querySelector('.rail-label').textContent }));
        check((await heroAt()) > startX && mid.fill !== 'scaleX(0)', `${names[n]}: scrolling walks the hero and fills the progress rail`);
        check(/^Moment 2 of \d$/.test(mid.label), `${names[n]}: the rail says ${mid.label}`);
      }
    }
    // Before the level-up, every skill a moment lights is on and the skills the level-up lights are not yet.
    const onMoments = await page.evaluate(i => Story.acts[i].skills.filter(s => s.moment).map(s => s.name).sort().join(', '), n);
    const litBefore = await page.waitForFunction(([scope, want]) => !document.querySelector(`${scope} .act-screen.is-unlocked, ${scope}.is-unlocked`)
      && [...document.querySelectorAll(`${scope} .skill-card.is-on .skill-name`)].map(s => s.textContent.trim()).sort().join(', ') === want && want,
    [`#${id}`, onMoments], { timeout: 12000 }).then(h => h.jsonValue(), () => '');
    check(litBefore === onMoments, `${names[n]}: before the level-up, its moments have lit ${onMoments}${litBefore === onMoments ? '' : ' (they did not)'}`);
    await scrollTo(page, end - 4);
    await page.waitForFunction(i => Story.state.unlocked.has(i), n, { timeout: 15000 });
    await page.waitForSelector(`#${id} .act-screen.is-ready`, { timeout: 8000 });
    if (scenes[n]) check((await stageShown(page, id)) === lastScene[n][0], `${names[n]}: the level-up opens on ${lastScene[n][1]}`);
    await page.waitForTimeout(900);
    const done = await page.evaluate(([sel, ids]) => {
      const s = document.querySelector(sel);
      return {
        pill: s.querySelector('.unlock-pill').textContent,
        beatsShown: s.querySelectorAll('.beat:not(.is-locked)').length,
        skillsLit: s.querySelectorAll('.skill-card.is-on').length,
        inBelt: ids.every(id => document.querySelector(`.belt-slot[data-item="${id}"]`).classList.contains('is-filled')),
        gray: getComputedStyle(s.querySelector('.act-screen')).filter,
      };
    }, [`#${id}`, act.items]);
    const pill = n === 0 ? 'Tutorial complete' : `Level ${n}`;
    check(done.pill === pill && done.skillsLit === act.skills, `${names[n]} levels up and lights its ${act.skills} skills`);
    const hidden = await storyHidden(page, id);
    check(done.beatsShown === act.beats && hidden <= 1, `${names[n]} shows all ${act.beats} life and work moments in its story panel without scrolling (${hidden}px hidden)`);
    check(done.inBelt, `${names[n]} drops its items into the inventory belt`);
    check(!done.gray.includes('grayscale(1)'), `${names[n]} has its color`);
    const next = await page.$eval(`#${id} .act-next`, a => ({ text: a.textContent.trim(), shown: getComputedStyle(a).visibility === 'visible' }));
    check(next.shown && next.text.startsWith(n < ids.length - 1 ? `Next: ${names[n + 1]}` : 'Next: what I build next'), `${names[n]} ends with a Next tag (${next.text})`);
  }
  const order = await page.evaluate(() => window.__order);
  const chips = order.filter(o => o.what === 'chip');
  const gives = await page.evaluate(() => Story.acts.reduce((sum, act) => sum + Story.beatsOf(act).filter(b => b.give).length, 0));
  check(chips.length === gives && chips.every(o => o.whole), `in every act, each moment's item pops in only once its words are whole (${chips.filter(o => o.whole).length} of ${gives})`);
  const skillsLit = order.filter(o => o.what === 'skill');
  const early = skillsLit.filter(o => !o.whole || (!o.chip && chips.some(c => c.act === o.act && c.k === o.k)));
  check(skillsLit.length > 0 && early.length === 0, `each moment's skill lights after its words and its item (${skillsLit.length} skills${early.length ? `, early: ${early.map(o => `${o.act},${o.k}`).join(' ')}` : ''})`);
  const flights = order.filter(o => o.what === 'fly');
  check(flights.length === gives && flights.every(o => o.whole && o.chip && o.skill), "each moment's item flies to the inventory after it pops in and after the moment's skill lights");
  check(await page.textContent('.hud-count') === `${items}/${items}`, `the sheet holds all ${items} items`);
  const college = await page.$eval('#act-college', s => ({ num: s.querySelector('.act-num').textContent, title: s.querySelector('.act-title').textContent, color: s.querySelector('.act-screen').style.getPropertyValue('--c2') }));
  check(college.num === 'Act III' && college.title === 'Training arc' && college.color === '#d6449a', `college is Act III, Training arc, in magenta (${college.num}, ${college.title}, ${college.color})`);
  // A first-time reader who has never opened the sheet selects an item in the belt.
  check(await page.$('#sheet') === null, 'the sheet has not been opened yet');
  check(await storyCard(page, '.belt-slot[data-item="hammer"]', ['Hammer', 'Act III', 'Four turns', 'Play hammer throw']),
    'before the sheet is ever opened, selecting the hammer in the belt opens its story card with Play');
  await page.click('#card .btn--accent');
  check(await page.waitForSelector('#game[open]', { timeout: 2000 }).then(() => true, () => false) && await page.textContent('#game .game-title') === 'Hammer throw',
    'Play on that story card opens the hammer throw');
  await page.click('#game .game-skip');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#card').open, null, { timeout: 2000 });
  // A lit skill card opens a story card with its line and the skills it grew from, by click or keyboard.
  check(await storyCard(page, '#act-high-school .skill-card[data-skill="leading"]', ['Leading', 'Act II', 'Finding my party', 'Earning the C by doing the work first.', 'Grew from', 'Teaching', 'Teamwork']),
    "selecting Act II's lit Leading skill opens its story card with its line and the skills it grew from");
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#card').open, null, { timeout: 2000 });
  await page.focus('#act-high-school .skill-card[data-skill="teamwork"]');
  await page.keyboard.press('Enter');
  const skillOpened = await page.waitForSelector('#card[open]', { timeout: 2000 }).then(() => true, () => false);
  const skillText = skillOpened ? await page.$eval('#card', c => c.textContent) : '';
  check(['Teamwork', 'Pick people who make you better, then pull your weight for them.', 'A root skill'].every(w => skillText.includes(w)), 'Enter on the lit Teamwork skill opens its story card with its line');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#card').open, null, { timeout: 2000 });

  await scrollTo(page, 0);
  await page.waitForTimeout(300);
  await scrollTo(page, await page.evaluate(() => document.body.scrollHeight));
  await page.waitForTimeout(300);
  await scrollTo(page, 0);
  await page.waitForTimeout(600);
  check(await page.evaluate(() => Story.state.unlocked.size) === 0 && await page.textContent('.hud-count') === `0/${items}`,
    'scrolling back above the tutorial rewinds every act and empties the sheet');
  const before = await page.evaluate(() => window.__unlocks);
  await scrollTo(page, await page.evaluate(() => document.body.scrollHeight));
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => [window.__unlocks, Story.state.unlocked.size]);
  const replay = [after[0] - before, after[1]];
  check(replay[0] === 8 && replay[1] === 8, `scrolling down again plays every act once more (${replay.join(', ')})`);

  // The character sheet.
  await page.evaluate(() => Sheet.open({ tab: 'items' }));
  await page.waitForSelector('#sheet[open]');
  check(await page.$$eval('#sheet .inv-slot.is-filled', s => s.length) === items, `Items tab shows ${items} items`);
  check(await page.$$eval('#sheet .bar i', s => s.length) > 6, 'stats show as colored bars');
  check(!(await page.$eval('#sheet .stats', s => /\d/.test(s.textContent))), 'stats have no numbers');
  await page.click('#sheet .inv-slot[data-item="hammer"]');
  await page.waitForSelector('#card[open]');
  const card = await page.$eval('#card', c => c.textContent);
  check(['Hammer', 'Act III', 'life', 'Four turns', 'What it added', 'Grit', 'Play hammer throw'].every(t => card.includes(t)),
    'the hammer story card shows name, act, tag, line, what it added and Play');
  await page.keyboard.press('Escape');
  await page.click('#tab-map');
  check(await page.$$eval('#sheet .map-stop', n => n.length) === 8 && await page.$eval('#sheet .map-canvas', c => c.getBoundingClientRect().width > 300), 'the Map tab shows the map with eight stops');
  await page.waitForFunction(() => document.querySelector('#sheet .map').dataset.at === '7.00', null, { timeout: 2000 });
  check(true, 'the hero stands at the furthest stop reached');
  await page.click('#sheet [data-stop="3"]');
  check((await page.textContent('#sheet .map-info')).includes('Act III · Training arc · Hammer thrower. Skills: Harder thing, Chemistry, Pitching.'), 'the college stop shows Act III, its class and skills');
  await page.click('#sheet [data-stop="2"]');
  check((await page.textContent('#sheet .map-info')).includes('Act II · Finding my party · Team captain. Skills: Teamwork, Throwing, Planning, Leading.'), 'the high school stop shows Act II, its class and skills');
  await page.waitForTimeout(400);
  const walking = Number(await page.$eval('#sheet .map', m => m.dataset.at));
  check(walking < 7 && walking > 2, `the hero walks the road toward the selected stop (at ${walking})`);
  await page.waitForFunction(() => document.querySelector('#sheet .map').dataset.at === '2.00', null, { timeout: 8000 });
  check(true, 'the hero reaches the selected stop');
  await page.click('#sheet .map-go');
  await page.waitForTimeout(400);
  check(!(await page.$('#sheet[open]')) && await page.$eval('#act-high-school', s => Math.abs(s.getBoundingClientRect().top) < 4), 'Go to Act II closes the sheet at Act II');
  await page.evaluate(() => Sheet.open({ tab: 'items' }));
  await page.waitForSelector('#sheet[open]');
  check(await page.$('.look-picker') === null && await page.$('.card-draft') === null, 'the look picker and the draft notes are gone');
  await page.evaluate(() => Sheet.openItem(Story.items()[0].id));
  await page.waitForSelector('#card[open]');
  check(await page.$('#card .card-photo') === null, 'a story card with no photo shows no photo box');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#sheet').open, null, { timeout: 2000 });
  check(await page.$eval('#say-hello .hello-links', ul => [...ul.querySelectorAll('a')].map(a => `${a.textContent} ${a.getAttribute('href')}`).join()) === 'LinkedIn https://www.linkedin.com/in/josephvellella/,Email mailto:connect-with-joe.next036@passmail.net,GitHub https://github.com/COValhalla', 'Say hello lists the links from the recipe');
  check(await page.textContent('#say-hello .hello-note') === await page.evaluate(() => Story.config.hello), 'Say hello shows the line from recipes/site.js');
  const ending = await page.evaluate(() => {
    const f = document.querySelector('#facts');
    return [f.querySelector('.act-num').textContent, f.querySelector('#facts-title').textContent, f.querySelector('.finale-inner > p:not(.act-num)').textContent];
  });
  check(ending.join('|') === await page.evaluate(() => { const e = Story.config.ending; return [e.kicker, e.heading, e.line].join('|'); }) && ending[0] === 'Next level',
    `the ending reads ${ending[0]}, ${ending[1]}, from recipes/site.js`);
  const hereY = await page.evaluate(() => window.scrollY);
  await page.click('.hud-hello');
  check(await page.$$eval('#hello-menu a', a => a.map(x => x.textContent).join()) === 'LinkedIn,Email,GitHub' && await page.isVisible('#hello-menu')
    && await page.evaluate(() => window.scrollY) === hereY, 'the top bar opens a small menu of the three links without jumping');
  await page.keyboard.press('Escape');
  check(!(await page.isVisible('#hello-menu')), 'Escape closes the Say hello menu');
  await pageEnd(page);
  check(await page.title() === 'Joe Vellella · Product engineer', 'the tab says the full name and role');
  check(await page.textContent('.site-foot') === 'Joe Vellella', 'the footer says the full name');
  await page.keyboard.press('Escape');

  await hammer(page);
  await bmx(page);
  await typing(page);
  check(errors.length === 0, 'no console errors or warnings' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();
}

// The end of the page: What I build next with Say hello inside it, with no quest log and no discus throw.
async function pageEnd(page) {
  check(await page.$('#quest-log') === null && !(await page.evaluate(() => document.body.textContent.toLowerCase().includes('quest log'))), 'the page has no quest log');
  const end = await page.evaluate(() => {
    const last = [...document.querySelectorAll('main > section')].at(-1);
    return { id: last.id, hello: !!last.querySelector('#say-hello .hello-label'), label: last.querySelector('.hello-label')?.textContent, buttons: last.querySelectorAll('button').length };
  });
  check(end.id === 'facts' && end.hello && end.label === 'Say hello' && end.buttons === 0,
    'the page ends on one section, What I build next, with a Say hello label, its question and links, and no sheet button');
  check(!(await page.evaluate(() => Games.names())).includes('discus'), 'there is no discus throw game');
  check((await page.$$eval('#act-high-school .unlock-actions button', b => b.map(x => x.textContent))).join() === 'Open sheet ▸', 'Act II ends with Open sheet and no Play button');
  await page.evaluate(() => Sheet.openItem('discus'));
  await page.waitForSelector('#card[open]');
  const disc = await page.$eval('#card', c => ({ text: c.textContent, play: c.querySelectorAll('.card-actions .btn--accent').length }));
  check(disc.text.includes('Discus') && disc.text.includes('let it fly flat') && !disc.text.includes('Play') && disc.play === 0, 'the discus is still an item, and its story card offers no game');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#card').open, null, { timeout: 2000 });
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
  check(await page.$eval(st, s => s.dataset.state) === 'cadence', 'pressing Jump starts the gate cadence');
  check(await page.$eval(st, s => s.bmx.s.player.h > 30), 'the riders start on the raised start hill');
  check(await page.$eval(st, s => s.bmx.s.riders.map(r => r.lane * Games.get('bmx').sim.LANE_GAP).join(',')) === '0,5,10', 'you race two rivals, in lanes 5 pixels apart');
  check(await page.$eval(st, s => Math.abs((s.bmx.s.dropAt - s.bmx.s.redAt) - 0.9) < 1e-9), 'the start lights come on 0.3 seconds apart');
  await page.waitForFunction(s => document.querySelector(s).dataset.state === 'riding', st, { timeout: 8000 });
  check(await page.$eval(st, s => s.bmx.s.gate === 1), 'the gate drops and the race starts');
  const shape = await page.evaluate(() => {
    const { buildTrack } = Games.get('bmx').sim;
    const t = buildTrack();
    const jumps = t.jumps;
    return {
      straights: t.straights.length, berms: t.berms.length, jumps: jumps.length,
      tables: jumps.filter(j => j.shape === 'table').length, steps: jumps.filter(j => j.shape === 'step').length,
      rollers: t.rollers.length,
    };
  });
  check(shape.straights === 6 && shape.berms === 5 && shape.jumps === 13, `the track has six straights, five berms and 13 jumps (${JSON.stringify(shape)})`);
  check(shape.tables === 10 && shape.steps === 3, `the 13 jumps are 10 tabletops and 3 step-ups, with no gaps (${shape.tables} and ${shape.steps})`);
  await page.evaluate(s => document.querySelector(s).bmx.setBot(true), st);
  await page.waitForFunction(s => document.querySelector(s).dataset.state === 'finished', st, { timeout: 90000 });
  const place = await page.$eval(st, s => Number(s.dataset.place));
  check(place >= 1 && place <= 3, `a rider finishes the race with a place (${place})`);
  await page.click('#game .game-skip');
  const calls = await page.evaluate(() => {
    const { buildTrack, newRider, step, liftAngle } = Games.get('bmx').sim;
    const track = buildTrack();
    const f = track.rollers[0];
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
    const jump = track.jumps[0];
    const wheelie = tap => {
      const r = newRider(0, track);
      r.x = jump.x0 - 60; r.h = track.heightAt(r.x); r.v = 90;
      const events = [];
      let pressed = false;
      for (let i = 0; i < 4000 && events.length < 1 && r.x < jump.lip; i++) {
        if (!pressed && r.x + 6 >= tap) { r.press = { x: r.x + 6, used: false }; pressed = true; }
        const e = step(r, track, { pedal: false, held: false, heldFor: 0 }, 0.004);
        if (e) events.push(e);
      }
      return events.join(' then ');
    };
    const flight = () => {
      const r = newRider(0, track);
      r.x = jump.x0 - 20; r.h = track.heightAt(r.x); r.v = 110;
      let event = null;
      for (let i = 0; i < 4000 && !event; i++) {
        const held = r.x > jump.x0 - 10;
        event = step(r, track, { pedal: false, held, heldFor: held ? 0.5 : 0 }, 0.004) || event;
      }
      return { event, air: r.air };
    };
    const roll = () => {
      const r = newRider(0, track);
      r.x = jump.x0 - 20; r.h = track.heightAt(r.x); r.v = 100;
      let event = null;
      for (let i = 0; i < 4000 && !event; i++) event = step(r, track, { pedal: false, held: false, heldFor: 0 }, 0.004) || event;
      return { event, v: Math.round(r.v) };
    };
    return {
      perfect: ride(f.x0 - 4), early: ride(f.x0 - 20), late: ride(f.x0 + 8), tooEarly: ride(f.x0 - 40), none: ride(Infinity),
      carried: ride(f.x0 + 14),
      wheelie: wheelie(jump.x0 - 6),
      flight: flight(),
      roll: roll(),
      lift: [0.035, 0.1, 0.3, 0.4].map(t => Math.round(liftAngle(t) * 180 / Math.PI)),
    };
  });
  check(calls.perfect.startsWith('perfect') && calls.early.startsWith('good-early') && calls.late.startsWith('good-late') && calls.tooEarly.startsWith('early') && calls.none.startsWith('bump'),
    `each roller press gets its call: ${calls.perfect}, ${calls.early}, ${calls.late}, ${calls.tooEarly}, ${calls.none}`);
  check(calls.carried === 'bump then perfect', `a press after a roller's strip counts toward the next roller (${calls.carried})`);
  check(calls.wheelie === 'manual', `a tap on the lit strip wheelies over the jump (${calls.wheelie})`);
  check(calls.flight.event === 'air' && calls.flight.air, 'holding Jump through the lip flies the jump');
  check(calls.roll.event === 'roll' && calls.roll.v < 100, `no press rolls over the jump at 90% speed (${calls.roll.v})`);
  check(calls.lift.join(',') === '11,22,10,0', `a press lifts the front wheel up to 22 degrees and back down (${calls.lift.join(', ')})`);
}

async function typing(page) {
  const st = '#game .game-stage';
  await page.evaluate(() => Games.open('typing'));
  await page.waitForSelector('#game[open]');
  check(await page.$eval(st, s => s.dataset.state) === 'ready', 'the typing race waits for Start');
  await page.keyboard.press('Enter');
  await page.waitForFunction(s => document.querySelector(s).dataset.state === 'racing', st, { timeout: 6000 });
  await page.keyboard.type(await page.textContent('#game .type-line'), { delay: 0 });
  await page.waitForFunction(s => document.querySelector(s).dataset.state === 'done', st, { timeout: 6000 });
  check(await page.$eval(st, s => s.dataset.place) === '1' && await page.textContent('#game .game-msg') !== '',
    `typing the whole line first wins the class race at ${await page.$eval(st, s => s.dataset.wpm)} words a minute`);
  await page.click('#game .game-skip');
  check(!(await page.$('#game[open]')), 'Skip closes the typing race');
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
  check(await page.$$eval('section.act.is-unlocked', s => s.length) === 8, 'every act shows already unlocked');
  check(await page.$$eval('.beat.is-locked', b => b.length) === 0, 'every moment is shown');
  check(await page.textContent('.hud-count') === `${items}/${items}` && await page.$$eval('.belt-slot.is-filled', s => s.length) === items, 'the sheet and the belt are already full');
  // On a fresh page the sheet has never been opened: the item button on a moment still opens its story card.
  check(await page.$('#sheet') === null && await storyCard(page, '#act-high-school .beat-item[data-item="discus"]', ['Discus', 'Act II', 'let it fly flat']),
    'before the sheet is ever opened, selecting the discus on its moment opens its story card');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#card').open, null, { timeout: 2000 });
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

// Laptop screens shorter than 1440 x 900, and the room a browser leaves on them: every moment still fits.
async function shortScreens(browser) {
  console.log('\nShorter laptop screens, motion turned off');
  for (const [width, height] of [[1440, 790], [1366, 768], [1366, 657], [1280, 800], [1280, 720], [1280, 680]]) {
    const { context, page, errors } = await open(browser, { viewport: { width, height }, reducedMotion: 'reduce' });
    const hidden = [];
    for (const id of await page.$$eval('section.act', s => s.map(x => x.id))) {
      const px = await storyHidden(page, id);
      if (px > 1) hidden.push(`${id} ${px}px`);
    }
    check(hidden.length === 0, `at ${width} x ${height} every act shows all its moments in its story panel without scrolling${hidden.length ? ` (hidden: ${hidden.join(', ')})` : ''}`);
    check(errors.length === 0, `at ${width} x ${height}, no console errors or warnings`);
    await context.close();
  }
}

// Laptops and tall windows, motion turned off: each story panel ends under its last moment, the act sits in the middle
// of a tall window, and every moment ends on its own row for the item it gives and the skill it lights.
async function panelFit(browser) {
  console.log('\nStory panels and their last rows, motion turned off');
  for (const [width, height] of [[1184, 1260], [1440, 900]]) {
    const { context, page, errors } = await open(browser, { viewport: { width, height }, reducedMotion: 'reduce' });
    const acts = await page.evaluate(() => Acts.sections.map(({ act, screen, story }) => {
      const st = story.getBoundingClientRect();
      const beats = [...story.querySelectorAll('.beat')];
      const s = screen.getBoundingClientRect();
      const cs = getComputedStyle(screen);
      const inner = { top: s.top + parseFloat(cs.paddingTop), bottom: s.bottom - parseFloat(cs.paddingBottom) };
      const top = Math.min(screen.querySelector('.act-head').getBoundingClientRect().top, st.top);
      const bottom = Math.max(screen.querySelector('.act-foot').getBoundingClientRect().bottom, st.bottom);
      // Each moment's last element is its row of tags, below its words, with every tag showing.
      const rows = beats.map(li => {
        const body = li.querySelector('.beat-body');
        const row = body.lastElementChild;
        const text = li.querySelector('.beat-text').getBoundingClientRect();
        return row.classList.contains('beat-tags') && row.getBoundingClientRect().top >= text.bottom - 1
          && [...row.children].every(t => getComputedStyle(t).visibility === 'visible');
      });
      // The panel is as tall before its tags appear as after.
      const tags = [...story.querySelectorAll('.beat-item, .beat-skill')];
      const after = story.getBoundingClientRect().height;
      tags.forEach(t => t.classList.remove('is-on'));
      const before = story.getBoundingClientRect().height;
      tags.forEach(t => t.classList.add('is-on'));
      const lights = act.skills.filter(skill => skill.moment).map(skill => skill.id).sort().join();
      return {
        id: act.id, gap: Math.round(st.bottom - beats.at(-1).getBoundingClientRect().bottom),
        above: Math.round(top - inner.top), below: Math.round(inner.bottom - bottom),
        rows: rows.every(Boolean), same: Math.abs(after - before) < 0.5,
        skills: [...story.querySelectorAll('.beat-skill')].map(t => t.dataset.skill).sort().join() === lights,
      };
    }));
    const loose = acts.filter(a => a.gap > 24);
    check(loose.length === 0, `at ${width} x ${height} every story panel ends within 24 px under its last moment (${acts.map(a => `${a.id} ${a.gap}`).join(', ')})`);
    if (height > 1000) {
      const off = acts.filter(a => Math.abs(a.above - a.below) >= 40);
      check(off.length === 0, `at ${width} x ${height} every act sits in the middle of the screen (above / below: ${acts.map(a => `${a.id} ${a.above}/${a.below}`).join(', ')})`);
    }
    check(acts.every(a => a.rows), `at ${width} x ${height} every moment ends on a row of its own, below its words, with its item and skill showing`);
    check(acts.every(a => a.skills), `at ${width} x ${height} each skill a moment lights has a tag on that moment`);
    check(acts.every(a => a.same), `at ${width} x ${height} every story panel is as tall before its tags appear as after`);
    if (width === 1184) {
      check((await page.textContent('#act-high-school .beat[data-beat="0"] .beat-text')).startsWith('Freshman year my proudest win was a server first on Gruul the Dragonkiller in World of Warcraft.'),
        "Act II's first moment opens with the server first on Gruul the Dragonkiller");
      check(await storyCard(page, '#act-high-school .beat-skill[data-skill="throwing"]', ['Throwing', 'Timing, rhythm and one clean release.']),
        "selecting the Throwing tag on Act II's discus moment opens its story card");
      await page.keyboard.press('Escape');
    }
    check(errors.length === 0, `at ${width} x ${height}, no console errors or warnings`);
    await context.close();
  }
}

// Narrow windows and tablets, 760 to 1279 px wide: with every act unlocked, how far each act's skills and buttons
// run past its left column and into the belt, and which of them its Next tag covers.
async function narrowWindows(browser) {
  console.log('\nNarrow windows and tablets, motion turned off');
  for (const [width, height] of [[760, 600], [800, 600], [800, 1280], [900, 700], [1024, 600], [1024, 768], [1180, 820], [1200, 700], [1279, 720]]) {
    const { context, page, errors } = await open(browser, { viewport: { width, height }, reducedMotion: 'reduce' });
    await page.evaluate(() => Acts.sections.forEach((_, i) => Acts.unlock(i)));
    await page.waitForTimeout(300);
    const acts = await page.evaluate(() => Acts.sections.map(({ act, screen }) => {
      const s = screen.getBoundingClientRect();
      const belt = s.bottom - document.querySelector('.belt').getBoundingClientRect().height;
      const left = screen.querySelector('.act-left').getBoundingClientRect().bottom;
      const els = [...screen.querySelectorAll('.skill-card, .unlock-actions .btn')];
      const bottom = Math.max(...els.map(el => el.getBoundingClientRect().bottom));
      const tag = screen.querySelector('.act-next').getBoundingClientRect();
      const covers = els.filter(el => {
        const b = el.getBoundingClientRect();
        return b.left < tag.right && tag.left < b.right && b.top < tag.bottom && tag.top < b.bottom;
      }).map(el => (el.querySelector('.skill-name') || el).textContent.trim());
      return { id: act.id, past: Math.round(bottom - left), belt: Math.round(bottom - belt), tagBelt: Math.round(tag.bottom - belt), covers };
    }));
    const over = acts.filter(a => a.past > 1 || a.belt > 0);
    check(over.length === 0, `at ${width} x ${height} every act's skills and buttons sit inside its left column, above the belt${over.length ? ` (past the column: ${over.map(a => `${a.id} ${a.past}px, ${a.belt}px into the belt`).join('; ')})` : ''}`);
    const covered = acts.filter(a => a.covers.length || a.tagBelt > 0);
    check(covered.length === 0, `at ${width} x ${height} every act's Next tag sits clear of its skills, its buttons and the belt${covered.length ? ` (covers: ${covered.map(a => `${a.id} ${[...a.covers, ...(a.tagBelt > 0 ? ['the belt'] : [])].join(', ')}`).join('; ')})` : ''}`);
    check(errors.length === 0, `at ${width} x ${height}, no console errors or warnings`);
    await context.close();
  }
}

// Laptops and tablets from 800 x 600 up, motion on: every act's Next tag, held at the top of its pulse,
// sits clear of its skills, its Open sheet and Play buttons, and the belt.
async function laptopNext(browser) {
  console.log('\nThe Next tag on laptops and tablets');
  for (const [width, height] of [[800, 600], [1024, 768], [1200, 700], [1280, 680], [1280, 720], [1280, 800], [1366, 657], [1366, 768], [1440, 790], [1440, 900], [1920, 1080]]) {
    const { context, page, errors } = await open(browser, { viewport: { width, height } });
    const covered = await nextCovers(page, '.belt', 'the belt');
    check(covered.length === 0, `at ${width} x ${height}, every act's Next tag sits clear of its skills, its buttons and the belt at the top of its pulse${covered.length ? ` (covers: ${covered.join(', ')})` : ''}`);
    check(errors.length === 0, `at ${width} x ${height}, no console errors or warnings`);
    await context.close();
  }
}

async function mapPartway(browser) {
  console.log('\nThe map, partway through');
  const { context, page, errors } = await open(browser, { viewport: { width: 1280, height: 860 } });
  await page.evaluate(() => [0, 1, 2, 3].forEach(i => Acts.unlock(i)));
  await page.evaluate(() => Sheet.open({ tab: 'map' }));
  await page.waitForSelector('#sheet[open]');
  await page.waitForFunction(() => document.querySelector('#sheet .map').dataset.at === '3.00', null, { timeout: 2000 });
  check(true, 'the hero waits at Act III, the furthest stop reached');
  await page.click('#sheet [data-stop="5"]');
  check((await page.textContent('#sheet .map-info')).includes('Not reached yet'), 'a stop not reached yet says so');
  // The year off grows the beard moment by moment.
  const looks = await page.evaluate(() => Story.acts[6].beats.map(b => b.look && b.look.beard).join(','));
  check(looks === 'stubble,full,long',`the beard grows through the year off (${looks})`);
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}

async function phone(browser) {
  console.log('\nPhone');
  const { context, page, errors } = await open(browser, { ...devices['iPhone 13'] });
  check(await page.$eval('.hud', h => Math.abs(h.getBoundingClientRect().bottom - window.innerHeight) < 1), 'the bar sits along the bottom');
  check(await page.isVisible('.hud-hello .hud-at') && !(await page.isVisible('.hud-hello .hud-label')), 'the bar shows an @ for Say hello');
  check(await page.$eval('.hud', h => h.scrollWidth <= h.clientWidth), 'the bar fits the phone width');
  check(await page.$eval('#facts', s => s.scrollWidth <= s.clientWidth && document.documentElement.scrollWidth <= window.innerWidth), 'the ending fits the phone width');
  check(await page.$eval('.intro-title', h => h.scrollWidth <= h.clientWidth && h.getBoundingClientRect().height < 100), 'the title screen heading fits the phone width');
  const where = await pins(page);
  await scrollTo(page, where[2].start - 300);
  await page.waitForFunction(() => Acts.sections[2].played >= 1, null, { timeout: 5000 });
  await scrollTo(page, where[2].start + 2);
  await page.waitForTimeout(200);
  check(await page.$eval('#act-high-school .act-screen', s => Math.abs(s.getBoundingClientRect().height - window.innerHeight) < 2), 'Act II fills the screen');
  await scrollTo(page, where[2].end - 4);
  await page.waitForFunction(() => Story.state.unlocked.has(2), null, { timeout: 15000 });
  await page.waitForSelector('#act-high-school .act-screen.is-ready', { timeout: 8000 });
  await page.locator('#act-high-school .unlock-actions .btn--accent').tap();
  await page.waitForSelector('#sheet[open]');
  check(await page.$eval('#sheet', d => d.getBoundingClientRect().width <= window.innerWidth), 'the sheet fits the screen');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#sheet').open, null, { timeout: 2000 });
  await page.locator('#act-high-school .skill-card[data-skill="teamwork"]').tap();
  const skillCard = await page.waitForSelector('#card[open]', { timeout: 2000 }).then(() => page.$eval('#card .card-frame', c => ({ text: c.textContent, fits: c.getBoundingClientRect().width <= window.innerWidth })), () => ({ text: '', fits: false }));
  check(skillCard.text.includes('Pick people who make you better, then pull your weight for them.') && skillCard.fits, 'tapping the lit Teamwork skill opens its story card, which shows its line and fits the screen');
  await page.keyboard.press('Escape');
  const covered = await nextCovers(page);
  check(covered.length === 0, `every act's Next tag sits clear of its Open sheet and Play buttons, its skills and the bar${covered.length ? ` (covers: ${covered.join(', ')})` : ''}`);
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
  // Narrower phones wrap the skills and buttons differently.
  for (const name of ['iPhone SE (3rd gen)', 'Galaxy S8', 'iPhone SE']) {
    const { context, page, errors } = await open(browser, { ...devices[name] });
    if (name === 'iPhone SE') {
      // The first iPhone SE, 320 x 568: every act's story panel still has room for the newest moment's first lines.
      await page.evaluate(() => Acts.sections.forEach((_, i) => Acts.unlock(i)));
      await page.waitForTimeout(300);
      const room = await storyRoom(page);
      const low = room.filter(r => r.height < 100);
      check(low.length === 0, `on the ${name}, every act's story panel is at least 100 px tall (${room.map(r => `${r.id} ${r.height}`).join(', ')})`);
      const cut = room.filter(r => r.short > 0);
      check(cut.length === 0, `on the ${name}, every act's story panel shows the newest moment's first two lines${cut.length ? ` (short by: ${cut.map(r => `${r.id} ${r.short}px`).join(', ')})` : ''}`);
    }
    const covered = await nextCovers(page);
    check(covered.length === 0, `on the ${name}, every act's Next tag sits clear of its buttons, its skills and the bar${covered.length ? ` (covers: ${covered.join(', ')})` : ''}`);
    check(errors.length === 0, `on the ${name}, no console errors or warnings`);
    await context.close();
  }
}

const browser = await chromium.launch({ ...launch, headless: true });
try {
  await desktop(browser);
  await pacing(browser);
  await reducedMotion(browser);
  await shortScreens(browser);
  await panelFit(browser);
  await narrowWindows(browser);
  await laptopNext(browser);
  await mapPartway(browser);
  await phone(browser);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
