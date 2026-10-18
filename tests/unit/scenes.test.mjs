// The scene registry in engine/scenes/index.js: each scene file registers one scene by
// name, and the pages draw what was registered. Each test loads the real files in
// a fresh sandbox, in the order index.html loads them. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const sceneFiles = [...read('index.html').matchAll(/<script src="((?:engine|story)\/scenes\/[^"]+)"><\/script>/g)].map(m => m[1]);
const [registry, props, ...scenes] = sceneFiles;

// The canvas's ImageData, enough for the scenes that read their background back to draw.
class ImageDataStub {
  constructor(a, w, h) {
    if (typeof a === 'number') { this.width = a; this.height = w; this.data = new Uint8ClampedArray(a * w * 4); }
    else { this.data = a; this.width = w; this.height = h; }
  }
}

function sandbox(files) {
  const ctx = vm.createContext({});
  ctx.window = ctx;
  ctx.ImageData = ImageDataStub;
  ['engine/pixel.js', 'story/sprites.js', 'engine/draw.js', ...files].forEach(file => vm.runInContext(read(file), ctx, { filename: file }));
  return ctx;
}

test('each scene file registers exactly one scene', () => {
  const ctx = sandbox([registry, props]);
  const counts = scenes.map(file => {
    const before = ctx.Scenes.names.length;
    vm.runInContext(read(file), ctx, { filename: file });
    return [file, ctx.Scenes.names.length - before];
  });
  assert.deepEqual(counts.filter(([, n]) => n !== 1), []);
});

test('the scenes are named in the order the pages load their files, the character sheet last', () => {
  const { Scenes } = sandbox(sceneFiles);
  assert.equal(Scenes.names.length, scenes.length);
  assert.equal(Scenes.names[0], 'early-night');
  assert.equal(Scenes.names.at(-1), 'sheet');
});

test('a second scene with a name already taken is refused', () => {
  const { Scenes } = sandbox(sceneFiles);
  assert.throws(() => Scenes.add('mountains', {}), { message: 'Two scenes are called "mountains".' });
});

test('a name with no scene gets the plain floor', () => {
  const { Scenes } = sandbox(sceneFiles);
  const floor = Scenes.get('castle');
  assert.equal(floor.heroX, 72);
  assert.deepEqual([...Scenes.cuesOf('castle')], []);
});

test('the character sheet is made for the act it is asked for', () => {
  const { Scenes } = sandbox(sceneFiles);
  const act = { hero: { title: 'keyboard-kid' }, skills: [], items: [] };
  const sheet = Scenes.get('sheet', act);
  assert.equal(sheet.heroX, 26);
  assert.notEqual(Scenes.get('sheet', act), sheet);
  assert.deepEqual([...Scenes.cuesOf('sheet')], ['equip']);
});

test('a scene drawn in the sandbox paints its background without errors', () => {
  const { Scenes } = sandbox(sceneFiles);
  const calls = [];
  const blank = { getImageData: (x, y, w, h) => new ImageDataStub(w, h), putImageData() {} };
  const ctx = new Proxy(blank, { get: (t, k) => (k in t ? t[k] : () => calls.push(k)), set: (t, k, v) => { t[k] = v; return true; } });
  const ramp = { light: '#7fe0d4', base: '#22b3a3', shade: '#157a70' };
  Scenes.names.filter(n => n !== 'sheet').forEach(name => Scenes.get(name).draw(ctx, ramp, []));
  assert.ok(calls.length > 0);
});
