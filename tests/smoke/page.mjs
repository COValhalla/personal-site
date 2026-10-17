// The page around the acts, and the words it says: the title screen, the words the story keeps and drops,
// the ending with Say hello, the top bar's menu, the tab and the footer.
import { check, open } from './helpers.mjs';

export default async function page(browser) {
  console.log('\nThe title screen, the words and the ending');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  const titles = await page.evaluate(() => ({ greeting: Story.config.greeting, kicker: `${Story.config.fullName} · ${Story.config.role}` }));
  check(await page.textContent('.intro-title') === titles.greeting && await page.textContent('.intro-kicker') === titles.kicker && await page.textContent('.hud-name') === 'Joe',
    `the title screen says "${titles.greeting}" under ${titles.kicker}, and the bar says Joe`);
  check(await page.$eval('.intro-room', c => c.tagName === 'CANVAS' && c.width === 160 && c.height === 72), 'the title screen draws Joe at his desk on a canvas');
  check(await page.evaluate(() => Visits.why === 'not the published site' && !document.querySelector('script[data-goatcounter]')), 'opened from a file, the visit counter stays off');
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
  check(await page.$$eval('.intro .intro-note a', a => a.map(x => `${x.textContent} ${x.getAttribute('href')} ${x.target}`).join()) === 'Short on time? See my work history on LinkedIn. https://www.linkedin.com/in/josephvellella/ _blank' && await page.$('.intro .intro-start') !== null,
    'the welcome has a Press start button and only the LinkedIn work-history link');

  // The end of the page: What I build next with Say hello inside it, with no quest log.
  const contact = await page.evaluate(() => Story.config.contact);
  const hello = await page.$eval('#say-hello', s => ({
    address: s.querySelector('.hello-address')?.textContent,
    copy: s.querySelector('.hello-copy')?.textContent,
    links: [...s.querySelectorAll('a')].map(a => a.getAttribute('href')),
  }));
  check(hello.address === contact.email && hello.copy === 'Copy' && hello.links.join() === [`mailto:${contact.email}`, contact.linkedin, contact.github].join(),
    'Say hello shows the address from the recipe with a Copy button, a mail link, LinkedIn and GitHub');
  check(await page.textContent('#say-hello .hello-note') === await page.evaluate(() => Story.config.hello), 'Say hello shows the line from story/recipes/site.js');
  const ending = await page.evaluate(() => {
    const f = document.querySelector('#facts');
    return [f.querySelector('.act-num').textContent, f.querySelector('#facts-title').textContent, f.querySelector('.finale-inner > p:not(.act-num)').textContent];
  });
  check(ending.join('|') === await page.evaluate(() => { const e = Story.config.ending; return [e.kicker, e.heading, e.line].join('|'); }) && ending[0] === 'Next level',
    `the ending reads ${ending[0]}, ${ending[1]}, from story/recipes/site.js`);
  // At the end of the page, so the menu opening without a jump shows.
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(900);
  const hereY = await page.evaluate(() => window.scrollY);
  await page.click('.hud-hello');
  check(await page.textContent('#hello-menu .hello-copy') === 'Copy email' && await page.$$eval('#hello-menu a', a => a.map(x => x.getAttribute('href')).join()) === `mailto:${contact.email},${contact.linkedin}`
    && await page.isVisible('#hello-menu') && await page.evaluate(() => window.scrollY) === hereY,
    'the top bar opens a small panel with Copy email, a mail link and LinkedIn, without jumping');
  // Joe asked for a smaller panel on desktop: it shows Copy email instead of the address, which only screen readers read.
  const menu = await page.$eval('#hello-menu', m => {
    const address = m.querySelector('.hello-address').getBoundingClientRect();
    return { text: m.querySelector('.hello-address').textContent, shown: address.width > 1 || address.height > 1, width: m.getBoundingClientRect().width };
  });
  check(menu.text === contact.email && !menu.shown && menu.width < 300, `the top bar's panel keeps the address for screen readers but does not show it, and is ${Math.round(menu.width)}px wide`);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('#hello-menu .hello-copy');
  await page.waitForFunction(() => document.querySelector('#hello-menu .hello-copy').textContent !== 'Copy email');
  check(await page.textContent('#hello-menu .hello-copy') === 'Email copied' && await page.evaluate(() => navigator.clipboard.readText()) === contact.email,
    'Copy email puts the address on the clipboard and says Email copied');
  await page.keyboard.press('Escape');
  check(!(await page.isVisible('#hello-menu')), 'Escape closes the Say hello menu');
  check(await page.$('#quest-log') === null && !(await page.evaluate(() => document.body.textContent.toLowerCase().includes('quest log'))), 'the page has no quest log');
  const end = await page.evaluate(() => {
    const last = [...document.querySelectorAll('main > section')].at(-1);
    return { id: last.id, hello: !!last.querySelector('#say-hello .hello-label'), label: last.querySelector('.hello-label')?.textContent, buttons: last.querySelectorAll('button').length };
  });
  check(end.id === 'facts' && end.hello && end.label === 'Say hello' && end.buttons === 1,
    'the page ends on one section, What I build next, with a Say hello label, its question, the Copy button and links, and no sheet button');
  check(await page.title() === 'Joe Vellella · Product engineer', 'the tab says the full name and role');
  check(await page.textContent('.site-foot') === 'Joe Vellella', 'the footer says the full name');
  check(errors.length === 0, 'no console errors or warnings' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();
}
