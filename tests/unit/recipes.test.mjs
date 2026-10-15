// Unit tests for the recipe rules in engine/story.js. Each test runs the registry in a
// fresh sandbox, so no test sees another test's recipes. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const silent = { error() {} };
const sceneFiles = [...read('index.html').matchAll(/<script src="((?:engine|story)\/scenes\/[^"]+)"><\/script>/g)].map(m => m[1]);

// The page's own scripts run in one sandbox whose global object is `window`, as in the browser.
function page(files) {
  const ctx = vm.createContext({ console: silent });
  ctx.window = ctx;
  files.forEach(file => vm.runInContext(read(file), ctx, { filename: file }));
  return ctx;
}

const known = {
  scenes: ['field', 'track'],
  cues: scene => (scene === 'field' ? ['run'] : []),
  gear: ['none', 'backpack'],
  hair: ['short', 'bun'],
  beards: ['none', 'goatee'],
  sprites: ['floppy', 'box'],
  games: ['bmx'],
};

const site = { name: 'Joe', stats: [{ id: 'code' }] };

function problemsFor(acts, { config = site, known: facts = known } = {}) {
  const ctx = page(['engine/story.js']);
  const { Story } = ctx;
  Story.site(config);
  acts.forEach(a => Story.addAct(a));
  return Array.from(Story.validate(facts));
}

const floppy = { id: 'floppy', name: 'Floppy disk', sprite: 'floppy', tag: 'life', line: 'Saved.', adds: { code: 1 }, photo: null };

function act(overrides = {}) {
  return {
    id: 'early', numeral: '1', title: 'Early', years: '2000',
    color: { name: 'Blue', light: '#9cf', base: '#36c', shade: '#126' },
    theme: 'light', scene: 'field',
    hero: { gear: 'backpack', title: 'Kid', hair: 'short', beard: 'none' },
    beats: [{ tag: 'life', text: 'First.', item: 'floppy', cue: 'run' }],
    unlock: { banner: 'Level 1', say: 'New class' },
    items: [{ ...floppy }],
    skills: [{ id: 'typing', name: 'Typing', parents: [], line: 'Fast.' }],
    game: null,
    ...overrides,
  };
}

const twoMoments = [{ tag: 'life', text: 'First.', item: 'floppy' }, { tag: 'work', text: 'Second.' }];

test('a complete recipe has no problems', () => {
  assert.deepEqual(problemsFor([act()]), []);
});

test('without Story.site() the page reports it, and the stats cannot be checked', () => {
  assert.deepEqual(problemsFor([act()], { config: null }), [
    'story/recipes/site.js did not call Story.site().',
    'Act 1: item "floppy" adds unknown stat "code".',
  ]);
});

test('an act needs a title', () => {
  assert.deepEqual(problemsFor([act({ title: '' })]), ['Act 1 has no title.']);
});

test('an act needs a light, base and shade color', () => {
  assert.deepEqual(problemsFor([act({ color: { light: '#9cf', base: '#36c' } })]),
    ['Act 1 needs color.light, color.base and color.shade.']);
});

test('an act must name a scene that a file in story/scenes/ draws', () => {
  assert.deepEqual(problemsFor([act({ scene: 'castle', beats: [{ tag: 'life', text: 'x', item: 'floppy' }] })]),
    ['Act 1 uses scene "castle", which no file in story/scenes/ draws.']);
});

test('staged acts need one stage per moment plus the level-up', () => {
  assert.deepEqual(problemsFor([act({ stages: ['field'] })]),
    ['Act 1 needs 2 stages: one for each moment, then one for the level-up.']);
});

test('each stage must name a scene that a file in story/scenes/ draws', () => {
  assert.deepEqual(problemsFor([act({ stages: ['field', 'castle'], beats: [{ tag: 'life', text: 'x', item: 'floppy' }] })]),
    ['Act 1 uses stage scene "castle", which no file in story/scenes/ draws.']);
});

test('moments in one stage scene must come one after another', () => {
  assert.deepEqual(problemsFor([act({ stages: ['field', 'track', 'field'], beats: twoMoments })]),
    ['Act 1 goes back to stage scene "field": moments in the same scene must come one after another.']);
});

test('the hero gear must be one that pixel.js has', () => {
  assert.deepEqual(problemsFor([act({ hero: { gear: 'jetpack', title: 'Kid', hair: 'short', beard: 'none' } })]),
    ['Act 1 uses hero gear "jetpack", which pixel.js does not have.']);
});

test('a hair style in a moment must be one that pixel.js has', () => {
  assert.deepEqual(problemsFor([act({ beats: [{ tag: 'life', text: 'x', item: 'floppy', look: { hair: 'mohawk' } }] })]),
    ['Act 1 uses hair "mohawk", which pixel.js does not have.']);
});

test('a beard in the hero must be one that pixel.js has', () => {
  assert.deepEqual(problemsFor([act({ hero: { gear: 'none', title: 'Kid', hair: 'short', beard: 'mustache' } })]),
    ['Act 1 uses beard "mustache", which pixel.js does not have.']);
});

test('an item id can be used by one act only', () => {
  const second = act({ id: 'late', numeral: '2', scene: 'track', beats: [{ tag: 'work', text: 'x' }], skills: [] });
  assert.deepEqual(problemsFor([act(), second]), ['Act 2: item id "floppy" is used twice.']);
});

test('an item must name a sprite that story/sprites.js has', () => {
  assert.deepEqual(problemsFor([act({ items: [{ ...floppy, sprite: 'castle' }] })]),
    ['Act 1: item "floppy" uses sprite "castle", which story/sprites.js does not have.']);
});

test('an item needs a life or work tag', () => {
  assert.deepEqual(problemsFor([act({ items: [{ ...floppy, tag: 'hobby' }] })]),
    ['Act 1: item "floppy" needs tag "life" or "work".']);
});

test('an item can only add to a stat the site defines', () => {
  assert.deepEqual(problemsFor([act({ items: [{ ...floppy, adds: { speed: 1 } }] })]),
    ['Act 1: item "floppy" adds unknown stat "speed".']);
});

test('an item can only open a game that is registered', () => {
  assert.deepEqual(problemsFor([act({ items: [{ ...floppy, game: 'chess' }] })]),
    ['Act 1: item "floppy" opens game "chess", which is not registered.']);
});

test('a moment can only give an item from its own act', () => {
  assert.deepEqual(problemsFor([act({ beats: [{ tag: 'life', text: 'x', item: 'box' }] })]),
    ['Act 1, moment 1: gives item "box", which is not one of this act\'s items.']);
});

test('an item is given by one moment only', () => {
  assert.deepEqual(problemsFor([act({ beats: [{ tag: 'life', text: 'x', item: 'floppy' }, { tag: 'work', text: 'y', item: 'floppy' }] })]),
    ['Act 1: item "floppy" is given by two moments.']);
});

test('a moment needs a life or work tag', () => {
  assert.deepEqual(problemsFor([act({ beats: [{ tag: 'hobby', text: 'x', item: 'floppy' }] })]),
    ['Act 1, moment 1: tag must be "life" or "work".']);
});

test('a moment can only play a cue its scene has', () => {
  assert.deepEqual(problemsFor([act({ beats: [{ tag: 'life', text: 'x', item: 'floppy', cue: 'fly' }] })]),
    ['Act 1, moment 1: scene "field" has no animation called "fly".']);
});

test('a skill can only light after one of the act\'s moments', () => {
  assert.deepEqual(problemsFor([act({ skills: [{ id: 'typing', name: 'Typing', parents: [], line: 'Fast.', moment: 2 }] })]),
    ['Act 1: skill "typing" lights after moment 2, which is not one of this act\'s moments.']);
});

test('a skill can only grow from a skill that exists', () => {
  assert.deepEqual(problemsFor([act({ skills: [{ id: 'typing', name: 'Typing', parents: ['ghost'], line: 'Fast.' }] })]),
    ['Skill "typing" grows from "ghost", which no act defines.']);
});

test('a skill can only grow from a skill in its own or an earlier act', () => {
  const first = act({ skills: [{ id: 'typing', name: 'Typing', parents: ['coding'], line: 'Fast.' }] });
  const second = act({
    id: 'later', numeral: '2', scene: 'track',
    items: [{ ...floppy, id: 'box', sprite: 'box' }],
    beats: [{ tag: 'work', text: 'y', item: 'box' }],
    skills: [{ id: 'coding', name: 'Coding', parents: [], line: 'Code.' }],
  });
  assert.deepEqual(problemsFor([first, second]),
    ['Skill "typing" grows from "coding", which comes from a later act.']);
});

test('a skill may grow from a skill in an earlier act', () => {
  const first = act();
  const second = act({
    id: 'later', numeral: '2', scene: 'track',
    items: [{ ...floppy, id: 'box', sprite: 'box' }],
    beats: [{ tag: 'work', text: 'y', item: 'box' }],
    skills: [{ id: 'coding', name: 'Coding', parents: ['typing'], line: 'Code.' }],
  });
  assert.deepEqual(problemsFor([first, second]), []);
});

test('the shipped recipes pass every rule against the real scenes, art and games', () => {
  // Every recipe, sprite, scene and game the story page loads, so a fork's own story is checked too.
  const scripts = [...read('index.html').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const story = scripts.filter(file => file.startsWith('story/') && !sceneFiles.includes(file));
  const games = scripts.filter(file => file.startsWith('engine/games/'));
  const ctx = page(['engine/pixel.js', 'engine/draw.js', 'engine/story.js', ...story, ...sceneFiles, ...games]);
  const { Story, Scenes, Pixel, Games } = ctx;
  const problems = Array.from(Story.validate({
    scenes: Scenes.names,
    cues: Scenes.cuesOf,
    gear: Object.keys(Pixel.HERO_GEAR),
    hair: Object.keys(Pixel.HAIR),
    beards: Object.keys(Pixel.BEARD),
    sprites: Object.keys(Pixel.ITEMS),
    games: Games.names(),
  }));
  assert.equal(Story.acts.length, story.filter(file => /^story\/recipes\/act-/.test(file)).length);
  assert.ok(Story.acts.length > 0);
  assert.deepEqual(problems, []);
});
