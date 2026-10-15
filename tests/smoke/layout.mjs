// The layout at each window size: laptops, shorter laptop screens, tall windows, narrow windows and tablets,
// and phones. Each size checks that the story panels, skills, buttons, Next tags, belt and bar fit and sit clear of each other.
import { devices } from 'playwright-core';
import { check, open, pins, scrollTo, storyCard, storyHidden } from './helpers.mjs';

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

export default async function layout(browser) {
  await shortScreens(browser);
  await panelFit(browser);
  await narrowWindows(browser);
  await laptopNext(browser);
  await phone(browser);
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
