// The acts: how each act tells its story as a reader scrolls, one moment at a time, and levels up;
// how the scroll paces the moments; scrolling back to rewind; and every act already told when motion is off.
import { check, open, pins, scrollTo, storyHidden } from './helpers.mjs';

// The index of the scene stage on screen (its canvas is the visible one).
const stageShown = (page, id) => page.$$eval(`#${id} .scene-canvas`, cs => cs.findIndex(c => getComputedStyle(c).visibility === 'visible'));

export default async function acts(browser) {
  await walk(browser);
  await roomChanges(browser);
  await pacing(browser);
  await reducedMotion(browser);
  await typingKeepsRoom(browser);
}

// Intent: the captain's report on the act card shrinking as text types in (PES-76). While a moment types, its box and the panel hold their height.
async function typingKeepsRoom(browser) {
  for (const [label, viewport] of [['Laptop', { width: 1440, height: 900 }], ['Phone', { width: 390, height: 844 }]]) {
    console.log(`\n${label}, the first moment types out`);
    const { context, page } = await open(browser, { viewport });
    const { start } = (await pins(page))[0];
    await scrollTo(page, start - 450);
    await page.waitForFunction(() => Acts.sections[0].played >= 1, null, { timeout: 5000 });
    await page.evaluate(() => {
      const section = document.querySelector('.act[data-act="0"]');
      const beat = section.querySelector('.beat[data-beat="0"]');
      const text = beat.querySelector('.beat-text');
      const panel = section.querySelector('.story');
      const typed = () => [...text.childNodes].filter(n => n.nodeType === 3).reduce((sum, n) => sum + n.data.length, 0);
      window.__sizes = [];
      const t0 = performance.now();
      const tick = () => {
        window.__sizes.push({ box: beat.getBoundingClientRect().height, panel: panel.getBoundingClientRect().height, typing: typed() < text.dataset.text.length });
        if (performance.now() - t0 < 4500) requestAnimationFrame(tick);
      };
      tick();
    });
    await scrollTo(page, start + 2);
    await page.waitForTimeout(4700);
    const sizes = await page.evaluate(() => window.__sizes);
    const [first] = sizes;
    const typing = sizes.filter(s => s.typing);
    const least = key => Math.min(...typing.map(s => s[key]));
    check(!first.typing && typing.length > 0 && least('box') >= first.box - 1 && least('panel') >= first.panel - 1,
      `${label}: while its words type out, the first moment's box and the story panel keep their height (box ${Math.round(first.box)} px, least ${Math.round(least('box'))}; panel ${Math.round(first.panel)} px, least ${Math.round(least('panel'))}; ${typing.length} frames)`);
    await context.close();
  }
}

async function walk(browser) {
  console.log('\nLaptop, motion on');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => { window.__unlocks = 0; Story.on('unlock', () => { window.__unlocks += 1; }); });
  const ids = await page.$$eval('section.act', s => s.map(x => x.id));
  const items = await page.evaluate(() => Story.items().length);
  check(ids.length === 8, 'the tutorial and seven acts are on the page');
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
      const typed = [...text.childNodes].filter(n => n.nodeType === 3).map(n => n.data).join('');
      window.__order.push({ what, act: i, k, whole: typed === text.dataset.text, chip: !!chip && chip.classList.contains('is-on') });
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
  const lastScene = { 0: [3, 'the Tutorial tally'], 1: [2, 'the character screen'], 2: [2, 'the character screen'], 3: [2, 'the character screen'], 4: [2, 'the character screen'], 5: [2, 'the character screen'] };
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
  check((await page.$$eval('#act-high-school .unlock-actions button', b => b.map(x => x.textContent))).join() === 'Open sheet ▸', 'Act II ends with Open sheet and no Play button');

  // Scrolling back to the top rewinds, and scrolling down again plays every act once more.
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
  check(errors.length === 0, 'no console errors or warnings' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();
}

// Intent: the captain's answers on the Tutorial plan (PES-82, built in PES-85): direction A, "Follow the story". The camera
// dives into the bedroom computer's screen and the lab opens out of the hero's own screen; the lab's bell rings and its door
// opens onto the snow before the camera leaves through it; the packing room opens from its left side as the hero walks in;
// and the level-up is a Tutorial tally (GAMES, TYPING 1ST, ORDERS 48, then KEYBOARD KID) instead of the high-score board.
async function roomChanges(browser) {
  console.log('\nLaptop, the Tutorial changes rooms');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  const { start, end } = (await pins(page))[0];
  // Every frame: where each stage's canvas sits and how far it is zoomed, the hero's left edge, all in scene pixels of
  // the scene box (across and down apart, as the box's border can stretch it a little), and the lab's bell and door.
  await page.evaluate(() => {
    const p = Acts.sections[0];
    window.__frames = [];
    window.__watch = true;
    const tick = () => {
      const box = p.sceneEl.getBoundingClientRect();
      const left = box.left + p.sceneEl.clientLeft;
      const top = box.top + p.sceneEl.clientTop;
      const unit = p.sceneEl.clientWidth / Scenes.W;
      const unitY = p.sceneEl.clientHeight / Scenes.H;
      const hero = p.hero.getBoundingClientRect();
      window.__frames.push({
        stages: p.stages.map(st => {
          const r = st.canvas.getBoundingClientRect();
          const css = getComputedStyle(st.canvas);
          return { shown: css.visibility === 'visible' && Number(css.opacity) > 0, x: (r.left - left) / unit, y: (r.top - top) / unitY, zoom: r.width / p.sceneEl.clientWidth };
        }),
        hero: { x: (hero.left - left) / unit, shown: hero.width > 0.5 * unit * 16 && Number(getComputedStyle(p.hero).opacity) > 0.5 },
        bell: p.stages[1].stage.state.bell,
        door: p.stages[1].stage.state.door,
      });
      if (window.__watch) requestAnimationFrame(tick);
    };
    tick();
  });
  const room = 900 * 0.6;
  await scrollTo(page, start - 450);
  await page.waitForFunction(() => Acts.sections[0].played >= 1, null, { timeout: 5000 });
  for (const [k, y] of [[2, start + 2], [3, start + room + 2], [4, start + room * 2 + 2]]) {
    await scrollTo(page, y);
    await page.waitForFunction(n => Acts.sections[0].played >= n, k, { timeout: 15000 });
  }
  await scrollTo(page, end - 4);
  await page.waitForSelector('#act-early-years .act-screen.is-ready', { timeout: 15000 });
  const frames = await page.evaluate(() => { window.__watch = false; return window.__frames; });
  const spots = await page.evaluate(() => Acts.sections[0].stages.map(st => ({ door: st.door, enter: st.enter, heroX: st.heroX, walkFrom: st.walkFrom })));
  const [bedroom, lab, shop] = spots;
  // Where a scene point lands in the scene box, in scene pixels, on a frame where its stage is drawn.
  const at = (f, s, pt) => ({ x: f.stages[s].x + pt.x * f.stages[s].zoom, y: f.stages[s].y + pt.y * f.stages[s].zoom });
  const size = await page.evaluate(() => ({ w: Scenes.W, h: Scenes.H }));
  const middle = pt => Math.abs(pt.x - size.w / 2) < 2 && Math.abs(pt.y - size.h / 2) < 2;
  const deepest = (s, also = () => true) => frames.filter(f => f.stages[s].shown && also(f)).reduce((a, f) => (!a || f.stages[s].zoom > a.stages[s].zoom ? f : a), null);
  const firstShown = s => frames.find(f => f.stages[s].shown);

  const intoScreen = deepest(0);
  check(!!bedroom.door.zoom && intoScreen.stages[0].zoom >= bedroom.door.zoom * 0.9 && middle(at(intoScreen, 0, bedroom.door)),
    `the camera dives into the bedroom computer's screen (${intoScreen.stages[0].zoom.toFixed(1)}x, centred on it)`);
  const outOfScreen = firstShown(1);
  check(!!lab.enter && outOfScreen.stages[1].zoom >= lab.enter.zoom * 0.8 && middle(at(outOfScreen, 1, lab.enter)) && lab.enter.x === lab.heroX + 8,
    `the lab opens out of the hero's own screen (${outOfScreen.stages[1].zoom.toFixed(1)}x, centred on it)`);
  const ringing = frames.findIndex(f => f.bell > 0 && f.bell < 1);
  const opens = frames.findIndex(f => f.door > 0);
  const leaves = frames.findIndex(f => f.stages[1].shown && f.stages[1].zoom > 1.05 && f.door > 0);
  check(ringing >= 0 && opens > ringing && leaves > opens, 'leaving the lab, the bell rings, then the door opens, then the camera moves');
  const intoSnow = deepest(1, f => f.door > 0);
  check(!!intoSnow && !!lab.door.zoom && intoSnow.stages[1].zoom >= lab.door.zoom * 0.9 && middle(at(intoSnow, 1, lab.door)) && intoSnow.door === 1,
    `the camera leaves the lab through its open door, into the snow (${intoSnow ? intoSnow.stages[1].zoom.toFixed(1) : 1}x)`);
  const opening = frames.find(f => f.stages[2].shown && f.stages[2].zoom < 0.9);
  const edge = opening && shop.enter && at(opening, 2, shop.enter);
  check(!!edge && Math.abs(edge.x - shop.enter.x) < 1 && Math.abs(edge.y - shop.enter.y) < 1 && opening.stages[1].shown,
    'the packing room opens from its left side, over the snow');
  const inShop = frames.filter(f => f.stages[2].shown && !f.stages[1].shown && f.hero.shown);
  check(inShop.length > 0 && inShop[0].hero.x < 0 && inShop.some(f => Math.abs(f.hero.x - shop.walkFrom) < 1),
    `the hero walks into the packing room from its left edge (from ${inShop.length ? inShop[0].hero.x.toFixed(0) : '?'} to ${shop.walkFrom})`);
  const stops = frames.filter(f => f.stages.filter(st => st.shown).length === 1).map(f => f.stages.findIndex(st => st.shown));
  check(stops.filter((s, i) => i === 0 || s !== stops[i - 1]).join() === '0,1,2,3', 'the rooms come in order: bedroom, lab, packing room, tally');
  const tally = await page.waitForFunction(() => { const st = Acts.sections[0].stages[3].stage.state; return st.rows === 3 && st.orders === 48 && st.kid === 1; }, null, { timeout: 5000 }).then(() => true, () => false);
  check(tally, 'the Tutorial levels up on its tally: GAMES, TYPING 1ST, ORDERS 48, then KEYBOARD KID');
  check(errors.length === 0, 'no console errors or warnings' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();
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
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}
