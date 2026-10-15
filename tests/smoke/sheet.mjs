// The character sheet and its story cards: a story card from the belt, a lit skill or a moment before the sheet
// was ever opened, the Items tab and its stats, the map with its stops, and the hero walking it.
import { check, closeCard, open, scrollTo, storyCard } from './helpers.mjs';

export default async function sheet(browser) {
  await fullSheet(browser);
  await mapPartway(browser);
  await momentCard(browser);
}

async function fullSheet(browser) {
  console.log('\nThe sheet and its story cards, every act played');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  const items = await page.evaluate(() => Story.items().length);
  await playAll(page, items);
  // A first-time reader who has never opened the sheet selects an item in the belt.
  check(await page.$('#sheet') === null, 'the sheet has not been opened yet');
  check(await storyCard(page, '.belt-slot[data-item="hammer"]', ['Hammer', 'Act III', 'Four turns', 'Play hammer throw']),
    'before the sheet is ever opened, selecting the hammer in the belt opens its story card with Play');
  await page.click('#card .btn--accent');
  check(await page.waitForSelector('#game[open]', { timeout: 2000 }).then(() => true, () => false) && await page.textContent('#game .game-title') === 'Hammer throw',
    'Play on that story card opens the hammer throw');
  await page.click('#game .game-skip');
  await closeCard(page);
  // A lit skill card opens a story card with its line and the skills it grew from, by click or keyboard.
  check(await storyCard(page, '#act-high-school .skill-card[data-skill="leading"]', ['Leading', 'Act II', 'Finding my party', 'Earning the C by doing the work first.', 'Grew from', 'Teaching', 'Teamwork']),
    "selecting Act II's lit Leading skill opens its story card with its line and the skills it grew from");
  await closeCard(page);
  await page.focus('#act-high-school .skill-card[data-skill="teamwork"]');
  await page.keyboard.press('Enter');
  const skillOpened = await page.waitForSelector('#card[open]', { timeout: 2000 }).then(() => true, () => false);
  const skillText = skillOpened ? await page.$eval('#card', c => c.textContent) : '';
  check(['Teamwork', 'Pick people who make you better, then pull your weight for them.', 'A root skill'].every(w => skillText.includes(w)), 'Enter on the lit Teamwork skill opens its story card with its line');
  await closeCard(page);

  // Selecting Act II's skills scrolled back up to it, so play every act again before opening the sheet.
  await playAll(page, items);

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
  // The discus throw is gone as a game, and the discus stays an item.
  await page.evaluate(() => Sheet.openItem('discus'));
  await page.waitForSelector('#card[open]');
  const disc = await page.$eval('#card', c => ({ text: c.textContent, play: c.querySelectorAll('.card-actions .btn--accent').length }));
  check(disc.text.includes('Discus') && disc.text.includes('let it fly flat') && !disc.text.includes('Play') && disc.play === 0, 'the discus is still an item, and its story card offers no game');
  await closeCard(page);
  check(errors.length === 0, 'no console errors or warnings' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();
}

// Scrolling to the end of the page plays every act, so every item is in the belt.
async function playAll(page, items) {
  await scrollTo(page, await page.evaluate(() => document.body.scrollHeight));
  await page.waitForFunction(n => Story.state.unlocked.size === 8 && document.querySelectorAll('.belt-slot.is-filled').length === n, items, { timeout: 15000 });
  await page.waitForTimeout(900);
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

// On a fresh page with motion off, every act is already told and the sheet has never been opened:
// the item button on a moment still opens its story card.
async function momentCard(browser) {
  console.log('\nA story card from a moment, motion turned off');
  const { context, page, errors } = await open(browser, { viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  check(await page.$('#sheet') === null && await storyCard(page, '#act-high-school .beat-item[data-item="discus"]', ['Discus', 'Act II', 'let it fly flat']),
    'before the sheet is ever opened, selecting the discus on its moment opens its story card');
  await closeCard(page);
  check(errors.length === 0, 'no console errors or warnings');
  await context.close();
}
