// The title screen's sip: as Joe lifts the cup, his right hand rises with it, and it rests at his side with the cup.
// The intent is the reported bug: the glass rose while the hand stayed at his side.
import { check, SITE } from './helpers.mjs';

export default async function title(browser) {
  console.log('\nThe title screen: the hand holds the cup through a sip');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    const real = performance.now.bind(performance);
    const t0 = real();
    window.__fixed = null;
    performance.now = () => (window.__fixed == null ? real() : t0 + window.__fixed * 1000);
  });
  const page = await context.newPage();
  await page.goto(SITE);
  await page.waitForSelector('html[data-ready="true"]');
  const geo = await page.evaluate(() => {
    const heroX = Scenes.get('title-room').heroX;
    const heroTop = Scenes.GROUND - 24;
    const grid = Pixel.heroGrid('none');
    const handRow = grid.findIndex((r, y) => y > 10 && r.lastIndexOf('s') > 8);
    return { handRest: [heroX + grid[handRow].lastIndexOf('s'), heroTop + handRow], skin: Pixel.NEUTRALS.s, cupX: heroX + 11, cupRestY: heroTop + 15 };
  });
  const readCanvas = async t => {
    await page.evaluate(t => { window.__fixed = t; }, t);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    return page.evaluate(() => {
      const c = document.querySelector('canvas.intro-room');
      return { w: c.width, data: Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data) };
    });
  };
  const hex = ({ w, data }, x, y) => '#' + [0, 1, 2].map(i => data[(y * w + x) * 4 + i].toString(16).padStart(2, '0')).join('');
  // The cup's top outline sits one row above its first white pixel, read beside its left outline (steam may cover the top).
  const cupTop = d => {
    for (let y = 1; y < 72; y++) if (hex(d, geo.cupX + 1, y) === '#f6f4ef' && hex(d, geo.cupX, y) === '#1d1b22') return y - 1;
    return null;
  };

  const rest = await readCanvas(0.1);
  check(hex(rest, ...geo.handRest) !== geo.skin, 'with the cup at rest, the hand is at the cup (covered by it), not showing at his side');
  const notHolding = [];
  for (let t = 0.25; t <= 1.75 + 1e-9; t += 0.1) {
    const d = await readCanvas(Number(t.toFixed(2)));
    const top = cupTop(d);
    if (top === geo.cupRestY) continue;
    const touching = [];
    if (top !== null) {
      for (let x = geo.cupX - 1; x <= geo.cupX + 5; x++) touching.push(hex(d, x, top + 5));
      for (let y = top; y < top + 5; y++) touching.push(hex(d, geo.cupX + 5, y));
    }
    if (!touching.includes(geo.skin)) notHolding.push(Number(t.toFixed(2)));
  }
  check(notHolding.length === 0, `at every moment of the sip the cup is lifted, skin touches its bottom or outer side${notHolding.length ? ` (not at ${notHolding.join(', ')} s)` : ''}`);
  await context.close();
}
