// Declared dependencies. Each page script opens with a "Needs:" line naming the
// globals that must load before it, and a "Needs after start-up:" line for the ones
// it reads only once the page is running. Each scene file in js/scenes/ also takes
// the drawing kit helpers and props it draws with by name from Draw and Props.
// These tests read both pages' script order and every script, and check that
// each line and each of those names is true. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

const PAGES = ['index.html', 'workshop.html'];
// The vendored scripts are minified; these are the globals they attach.
const VENDOR = { 'vendor/gsap/gsap.min.js': ['gsap'], 'vendor/gsap/ScrollTrigger.min.js': ['ScrollTrigger'] };
// The games wait for game work to resume, so their files keep no Needs lines yet.
const exempt = file => file.startsWith('js/games/');

const scriptsOf = page => [...read(page).matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

// The code with its comments removed. Strings stay, since template strings hold code.
function code(src) {
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; out += ' '; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j;
      continue;
    }
    out += c;
  }
  return out;
}

const names = line => (line == null || line.trim() === 'nothing' ? [] : line.split(',').map(s => s.trim()).filter(Boolean));
const header = src => src.slice(0, src.search(/\(function|^[A-Za-z]/m));

// What a script says about itself, and what it really attaches and reads.
function script(file, known) {
  if (VENDOR[file]) return { file, provides: VENDOR[file], vendor: true };
  const src = read(file);
  const head = header(src);
  const needs = head.match(/^\s*(?:\*|\/\/)\s*Needs:(.*)$/m);
  const later = head.match(/^\s*(?:\*|\/\/)\s*Needs after start-up:(.*)$/m);
  const body = code(src);
  const provides = [...body.matchAll(/window\.([A-Za-z]\w*)\s*=[^=]/g)].map(m => m[1]);
  const uses = known ? known.filter(g => !provides.includes(g) && new RegExp(`(?<![\\w$.])(?:window\\.)?${g}\\b`).test(body)) : [];
  return { file, provides, declared: Boolean(needs), needs: names(needs && needs[1]), later: names(later && later[1]), uses };
}

const known = [...new Set(PAGES.flatMap(page => scriptsOf(page).flatMap(file => script(file).provides)))];

// Every way a page's scripts break their Needs lines, in plain words.
function problems(page) {
  const found = [];
  const loaded = new Map();
  const all = scriptsOf(page).map(file => script(file, known));
  all.forEach(s => s.provides.forEach(g => loaded.set(g, s.file)));
  const before = new Set();
  all.forEach(s => {
    if (!s.vendor && !exempt(s.file)) {
      if (!s.declared) found.push(`${s.file} has no "Needs:" line.`);
      s.needs.forEach(g => {
        if (!loaded.has(g)) found.push(`${s.file} needs ${g}, which ${page} does not load.`);
        else if (!before.has(g)) found.push(`${s.file} needs ${g}, but ${page} loads ${loaded.get(g)} after it.`);
      });
      s.later.forEach(g => {
        if (!loaded.has(g)) found.push(`${s.file} needs ${g} after start-up, which ${page} does not load.`);
        else if (before.has(g)) found.push(`${s.file} needs ${g} after start-up, but ${page} loads it first: name it on the "Needs:" line.`);
      });
      const said = new Set([...s.needs, ...s.later]);
      s.uses.filter(g => !said.has(g)).forEach(g => found.push(`${s.file} uses ${g} but its Needs lines do not name it.`));
      [...said].filter(g => !s.uses.includes(g)).forEach(g => found.push(`${s.file} names ${g} in its Needs lines but does not use it.`));
      if (s.provides.length > 1) found.push(`${s.file} attaches ${s.provides.length} globals: ${s.provides.join(', ')}. A script attaches one.`);
    }
    s.provides.forEach(g => before.add(g));
  });
  return found;
}

PAGES.forEach(page => {
  test(`${page} loads what every script needs before it`, () => {
    assert.deepEqual(problems(page), []);
  });
});

test('every script on the story page states what it needs', () => {
  const missing = scriptsOf('index.html').filter(f => !VENDOR[f] && !exempt(f) && !script(f).declared);
  assert.deepEqual(missing, []);
});

test('each page script attaches the global ARCHITECTURE.md lists', () => {
  const listed = read('ARCHITECTURE.md').match(/Each script attaches one object to `window`: (.*)\./)[1];
  const documented = [...listed.matchAll(/`(\w+)`/g)].map(m => m[1]).sort();
  assert.deepEqual([...known].filter(g => !Object.values(VENDOR).flat().includes(g)).sort(), documented);
});

// ---------- Scenes ----------

const sceneFiles = page => scriptsOf(page).filter(file => file.startsWith('js/scenes/'));
const KIT = Object.keys(/\bwindow\.Draw = \{([^}]*)\}/.exec(read('js/draw.js'))[1].split(',').reduce((o, k) => ({ ...o, [k.trim()]: 1 }), {}));
const PROPS = /\bwindow\.Props = \{([^}]*)\}/.exec(read('js/scenes/props.js'))[1].split(',').map(k => k.trim());
const SHARED = [...KIT, ...PROPS, 'W', 'H', 'GROUND'];

test('both pages load every scene file, the registry first, in the same order', () => {
  const onDisk = readdirSync(path.join(root, 'js/scenes')).filter(f => f.endsWith('.js')).map(f => `js/scenes/${f}`);
  const loaded = sceneFiles('index.html');
  assert.deepEqual(sceneFiles('workshop.html'), loaded);
  assert.deepEqual([...loaded].sort(), onDisk.sort());
  assert.deepEqual(loaded.slice(0, 2), ['js/scenes/index.js', 'js/scenes/props.js']);
});

// What a scene file takes by name from Draw, Props and Scenes, and which shared names it uses.
function sceneFile(file) {
  const body = code(read(file));
  const taken = [...body.matchAll(/const \{([^}]*)\} = (?:Draw|Props|Scenes);/g)].flatMap(m => names(m[1]));
  const own = [...body.matchAll(/(?:function|const) (\w+)\b/g)].map(m => m[1]);
  const rest = body.replace(/const \{[^}]*\} = (?:Draw|Props|Scenes);/g, '');
  const uses = SHARED.filter(n => new RegExp(`(?<![\\w$.'])${n}\\b(?!\\s*:)`).test(rest));
  return { file, taken, own, uses };
}

test('each scene file takes by name exactly the helpers and props it uses', () => {
  const wrong = sceneFiles('index.html').map(sceneFile).flatMap(s => [
    ...s.uses.filter(n => !s.taken.includes(n) && !s.own.includes(n)).map(n => `${s.file} uses ${n} but does not take it from Draw, Props or Scenes.`),
    ...s.taken.filter(n => !s.uses.includes(n)).map(n => `${s.file} takes ${n} but does not use it.`),
  ]);
  assert.deepEqual(wrong, []);
});
