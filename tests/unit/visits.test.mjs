// Unit tests for the visit counter's rule in engine/addons/visits.js: who is counted.
// The add-on runs without a page here, so it only defines the rule. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = 'engine/addons/visits.js';
const ctx = vm.createContext({});
ctx.window = ctx;
vm.runInContext(readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
const { decide } = ctx.Visits;

const visitor = { origin: 'https://covalhalla.github.io', webdriver: false, doNotTrack: null, globalPrivacyControl: undefined };

test('a visitor on the published site is counted', () => {
  assert.equal(decide(visitor), '');
  assert.equal(decide({ ...visitor, doNotTrack: '0' }), '');
  assert.equal(decide({ ...visitor, doNotTrack: 'unspecified' }), '');
});

test('a page opened from a file, on this computer or on another address is not counted', () => {
  for (const origin of ['null', 'file://', 'http://localhost:8000', 'http://covalhalla.github.io', 'https://someone-else.github.io', 'https://covalhalla.github.io.example.com']) {
    assert.equal(decide({ ...visitor, origin }), 'not the published site', origin);
  }
});

test('an automated browser, such as the smoke test, is not counted', () => {
  assert.equal(decide({ ...visitor, webdriver: true }), 'an automated browser');
});

test('a browser that asks not to be tracked is not counted', () => {
  assert.equal(decide({ ...visitor, doNotTrack: '1' }), 'the browser asks not to be tracked');
  assert.equal(decide({ ...visitor, doNotTrack: 'yes' }), 'the browser asks not to be tracked');
  assert.equal(decide({ ...visitor, globalPrivacyControl: true }), 'the browser asks not to be tracked');
});

test('without a page the add-on loads nothing and counts nothing', () => {
  assert.equal(ctx.Visits.why, '');
  assert.equal(ctx.Visits.sent.length, 0);
  assert.equal(ctx.goatcounter, undefined);
});
