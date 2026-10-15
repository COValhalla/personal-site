// What every surface of the smoke test shares: where the page is, how a check is counted, how a page opens,
// and the readings more than one surface takes.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SITE = 'file://' + path.join(here, '..', '..', 'index.html');
export const launch = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' };

let failed = 0;
export function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failed += 1;
}
export const failures = () => failed;

export async function open(browser, options) {
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
export async function storyCard(page, selector, words) {
  await page.click(selector);
  const opened = await page.waitForSelector('#card[open]', { timeout: 2000 }).then(() => true, () => false);
  const text = opened ? await page.$eval('#card', c => c.textContent) : '';
  return opened && words.every(w => text.includes(w));
}

// Escape closes the story card, and the next step waits until it has.
export async function closeCard(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#card').open, null, { timeout: 2000 });
}

export const scrollTo = (page, y) => page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
// Where each act holds still, and for how long, in page pixels.
export const pins = page => page.evaluate(() => ScrollTrigger.getAll().filter(t => t.pin).map(t => ({ start: t.start, end: t.end })));
// How many pixels of an act's moments fall outside its story panel's edges, so only scrolling inside it would show them.
export const storyHidden = (page, id) => page.$eval(`#${id} .story`, st => {
  const top = st.getBoundingClientRect().top + st.clientTop;
  const bottom = top + st.clientHeight;
  const beats = [...st.querySelectorAll('.beat')].map(b => b.getBoundingClientRect());
  return Math.round(Math.max(st.scrollHeight - st.clientHeight, ...beats.map(b => Math.max(top - b.top, b.bottom - bottom))));
});
