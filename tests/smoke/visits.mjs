// The visit counter: the page is served as if from its published address, and GoatCounter's server is
// stood in for, so nothing leaves this computer. A visitor is counted; the test and a browser that
// asks not to be tracked are not.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { check, scrollTo } from './helpers.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLISHED = 'https://covalhalla.github.io/personal-site/';
const COUNTER = 'https://covalhalla.goatcounter.com/count';
async function openPublished(browser, init) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  const sent = [];
  const other = [];
  await context.route(() => true, route => {
    const url = route.request().url();
    if (url.startsWith(PUBLISHED)) return route.fulfill({ path: path.join(root, decodeURIComponent(new URL(url).pathname).slice('/personal-site/'.length) || 'index.html') });
    if (url.startsWith(COUNTER + '?')) {
      sent.push(Object.fromEntries(new URL(url).searchParams));
      return route.fulfill({ status: 200, body: '' });
    }
    other.push(url);
    return route.abort();
  });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PUBLISHED);
  await page.waitForSelector('html[data-ready="true"]');
  return { context, page, errors, sent, other };
}

export default async function visits(browser) {
  console.log('\nVisit counts');
  // A visitor's browser, which the counter cannot tell from a person.
  const person = 'Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false });';
  {
    const { context, page, errors, sent, other } = await openPublished(browser, person);
    await page.waitForFunction(() => Visits.sent.length === 0 && document.querySelector('script[data-goatcounter]'));
    await page.waitForTimeout(500);
    check(sent.length === 1 && !sent[0].e && sent[0].p === '/personal-site/', `on the published site, the page view is counted once (${sent.map(s => s.p).join(', ')})`);
    await page.click('.hud-sheet');
    await page.waitForSelector('#sheet[open]');
    await page.keyboard.press('Escape');
    await page.click('.hud-sheet');
    await page.keyboard.press('Escape');
    // The reader scrolls through every act to the ending.
    for (const top of await page.evaluate(() => Acts.sections.map(p => p.section.getBoundingClientRect().top + scrollY))) {
      await scrollTo(page, top);
      await page.waitForTimeout(150);
    }
    await scrollTo(page, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.waitForFunction(() => Visits.sent.includes('ending'), null, { timeout: 8000 });
    // The links open other sites; the test counts the click and stays on the page.
    await page.evaluate(() => document.addEventListener('click', e => e.preventDefault()));
    await page.click('#say-hello a[href*="linkedin"]');
    await page.click('#say-hello a[href*="linkedin"]');
    await page.click('#say-hello a[href^="mailto:"]');
    await page.waitForTimeout(500);
    const events = sent.filter(s => s.e === 'true').map(s => s.p);
    const acts = await page.evaluate(() => Story.acts.map(a => `act-${a.id}`));
    const want = [...acts, 'sheet', 'ending', 'contact-linkedin', 'contact-email'];
    const missing = want.filter(p => !events.includes(p));
    check(missing.length === 0 && events.length === want.length && new Set(events).size === events.length,
      `each act reached, the sheet opened, the ending reached and each contact link clicked is counted once (${events.join(', ')})`);
    check(sent.every(s => s.t), 'each count has a title the dashboard shows');
    check((await context.cookies()).length === 0 && await page.evaluate(() => document.cookie) === '', 'the counter sets no cookies');
    check(other.length === 0, `the page asks for no other outside address${other.length ? ` (asked: ${other.join(', ')})` : ''}`);
    check(errors.length === 0, `no console errors or warnings${errors.length ? ` (${errors.join('; ')})` : ''}`);
    await context.close();
  }
  for (const [who, init, why] of [
    ['a browser that asks not to be tracked', person + 'Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1" });', 'the browser asks not to be tracked'],
    ['a browser with Global Privacy Control on', person + 'Object.defineProperty(Navigator.prototype, "globalPrivacyControl", { get: () => true });', 'the browser asks not to be tracked'],
    ['the test\'s own automated browser', '', 'an automated browser'],
  ]) {
    const { context, page, errors, sent, other } = await openPublished(browser, init);
    await page.click('.hud-sheet');
    await page.keyboard.press('Escape');
    await scrollTo(page, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    const state = await page.evaluate(() => ({ why: Visits.why, script: !!document.querySelector('script[data-goatcounter]') }));
    check(sent.length === 0 && other.length === 0 && !state.script && state.why === why, `on the published site, ${who} loads no counter and sends nothing (${state.why})`);
    check(errors.length === 0, 'no console errors or warnings');
    await context.close();
  }
}
