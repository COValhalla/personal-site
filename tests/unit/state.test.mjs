// The story's state changes only through js/story.js: give, light, unlock, seeAll
// and rewind. Each test runs the registry in a fresh sandbox. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// A registry with two acts, and every event it sends, in order.
function story() {
  const ctx = vm.createContext({ console });
  ctx.window = ctx;
  vm.runInContext(readFileSync(path.join(root, 'js/story.js'), 'utf8'), ctx, { filename: 'js/story.js' });
  const { Story } = ctx;
  Story.addAct({ items: [{ id: 'floppy' }, { id: 'bike' }], skills: [{ id: 'typing' }] });
  Story.addAct({ items: [{ id: 'hammer' }], skills: [{ id: 'throwing' }] });
  const events = [];
  ['item', 'skill', 'unlock', 'seen', 'rewind'].forEach(e => Story.on(e, data => events.push(data === undefined ? e : `${e} ${data}`)));
  return { Story, events };
}

const list = view => [...view];

test('the state cannot be changed from outside story.js', () => {
  const { Story } = story();
  ['unlocked', 'owned', 'skills', 'seen'].forEach(name => {
    const view = Story.state[name];
    assert.equal(view.add, undefined, `state.${name} has no add`);
    assert.equal(view.delete, undefined, `state.${name} has no delete`);
    assert.equal(view.clear, undefined, `state.${name} has no clear`);
    assert.throws(() => { 'use strict'; view.size = 3; }, TypeError);
  });
  assert.throws(() => { 'use strict'; Story.state.owned = new Set(['floppy']); }, TypeError);
  assert.deepEqual(list(Story.state.owned), []);
});

test('give, light and unlock change the state once and announce it once', () => {
  const { Story, events } = story();
  assert.equal(Story.give('floppy'), true);
  assert.equal(Story.give('floppy'), false);
  assert.equal(Story.light('typing'), true);
  assert.equal(Story.light('typing'), false);
  assert.equal(Story.unlock(0), true);
  assert.equal(Story.unlock(0), false);
  assert.deepEqual(events, ['item floppy', 'skill typing', 'unlock 0']);
  assert.ok(Story.state.owned.has('floppy'));
  assert.equal(Story.state.skills.size, 1);
  assert.deepEqual(list(Story.state.unlocked), [0]);
  assert.equal(Story.level(), 1);
});

test('seeAll marks every item owned so far as seen, and says so each time', () => {
  const { Story, events } = story();
  Story.give('floppy');
  Story.seeAll();
  Story.give('bike');
  Story.seeAll();
  assert.deepEqual(list(Story.state.seen), ['floppy', 'bike']);
  assert.deepEqual(events, ['item floppy', 'seen', 'item bike', 'seen']);
});

test('rewind takes back one act and leaves the others and what was seen', () => {
  const { Story, events } = story();
  ['floppy', 'bike', 'hammer'].forEach(id => Story.give(id));
  Story.light('typing');
  Story.light('throwing');
  Story.unlock(0);
  Story.unlock(1);
  Story.seeAll();
  events.length = 0;
  Story.rewind(0);
  assert.deepEqual(events, ['rewind 0']);
  assert.deepEqual(list(Story.state.owned), ['hammer']);
  assert.deepEqual(list(Story.state.skills), ['throwing']);
  assert.deepEqual(list(Story.state.unlocked), [1]);
  assert.deepEqual(list(Story.state.seen), ['floppy', 'bike', 'hammer']);
  assert.equal(Story.give('floppy'), true, 'a rewound item can be given again');
});
