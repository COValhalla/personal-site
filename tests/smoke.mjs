// End-to-end smoke test: opens index.html from disk in Chrome and does what a reader does.
// Run with `npm test` after `npm install`. Uses the installed Google Chrome, or CHROME_PATH.
// Each surface of the page has its own file in tests/smoke/. Name surfaces to run only those:
// `node tests/smoke.mjs sheet games`.
import { chromium } from 'playwright-core';
import { failures, launch } from './smoke/helpers.mjs';
import page from './smoke/page.mjs';
import acts from './smoke/acts.mjs';
import sheet from './smoke/sheet.mjs';
import games from './smoke/games.mjs';
import layout from './smoke/layout.mjs';

const surfaces = { page, acts, sheet, games, layout };
const asked = process.argv.slice(2);
const unknown = asked.filter(name => !surfaces[name]);
if (unknown.length) {
  console.error(`No surface called ${unknown.join(', ')}. The surfaces are ${Object.keys(surfaces).join(', ')}.`);
  process.exit(2);
}

const browser = await chromium.launch({ ...launch, headless: true });
try {
  for (const [name, run] of Object.entries(surfaces)) {
    if (!asked.length || asked.includes(name)) await run(browser);
  }
} finally {
  await browser.close();
}
console.log(failures() ? `\n${failures()} check(s) failed` : '\nAll checks passed');
process.exit(failures() ? 1 : 0);
