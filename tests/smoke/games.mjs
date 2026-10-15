// The mini-games: the hammer throw, the BMX race and the typing race, played by keyboard with motion on,
// and the hammer throw again with motion off.
import { check, open } from './helpers.mjs';

export default async function games(browser) {
  console.log('\nThe games, motion on');
  const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  check(!(await page.evaluate(() => Games.names())).includes('discus'), 'there is no discus throw game');
  await hammer(page);
  await bmx(page);
  await typing(page);
  check(errors.length === 0, 'no console errors or warnings' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();
  await reducedMotion(browser);
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

async function reducedMotion(browser) {
  console.log('\nThe hammer throw, motion turned off');
  const { context, page, errors } = await open(browser, { viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
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
