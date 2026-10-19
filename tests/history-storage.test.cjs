const { test } = require('node:test');
const assert = require('node:assert/strict');
const { element } = require('./fixtures.cjs');
const { createHistory, commitHistory, HISTORY_LIMIT } = require('../src/utils/editor/history.ts');
const { parseElements, parseViewport, parseAppState } = require('../src/utils/storage/validation.ts');
const { parseDrawing } = require('../src/utils/storage/import.ts');
const { loadFromLocalStorage, saveToLocalStorage } = require('../src/utils/storage/localStorage.ts');

test('first undo baseline retains the loaded scene', () => {
  const original = [element()];
  const history = commitHistory(createHistory(original), [element({ x: 20 })]);
  assert.deepEqual(history.snapshots[history.index - 1], original);
});
test('no-op edits do not add an undo step', () => {
  const history = createHistory([element()]);
  assert.equal(commitHistory(history, [element()]), history);
});
test('branching from undo discards redo atomically', () => {
  let history = commitHistory(createHistory([element()]), [element({ x: 10 })]);
  history = commitHistory(history, [element({ x: 20 })]);
  history = commitHistory({ ...history, index: 0 }, [element({ x: 30 })]);
  assert.equal(history.snapshots.length, 2);
  assert.equal(history.index, 1);
  assert.equal(history.snapshots[1][0].x, 30);
});
test('history retains at most 100 snapshots', () => {
  let history = createHistory([]);
  for (let index = 0; index < 150; index++) history = commitHistory(history, [element({ x: index })]);
  assert.equal(history.snapshots.length, HISTORY_LIMIT);
  assert.equal(history.index, HISTORY_LIMIT - 1);
});
test('empty persisted drawing differs from a missing drawing', () => {
  const data = new Map(); global.window = { localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } };
  assert.equal(loadFromLocalStorage().elements, null);
  data.set('scribble_elements_v1', '[]');
  assert.deepEqual(loadFromLocalStorage().elements, []);
});
test('invalid preferences do not discard valid elements or overwrite original data', () => {
  const data = new Map([['scribble_elements_v1', JSON.stringify([element()])], ['scribble_viewport_v1', '{broken']]);
  global.window = { localStorage: { getItem: (key) => data.get(key) ?? null } };
  const loaded = loadFromLocalStorage();
  assert.equal(loaded.elements.length, 1); assert.equal(loaded.errors.length, 1);
  assert.equal(data.get('scribble_viewport_v1'), '{broken');
});
test('storage failure is observable by the UI', () => {
  global.window = { localStorage: { setItem: () => { throw new Error('quota'); } } };
  assert.equal(saveToLocalStorage([], { panX: 0, panY: 0, zoom: 1 }, {}), false);
});
test('invalid elements and duplicate IDs are rejected', () => {
  assert.throws(() => parseElements({}));
  assert.throws(() => parseElements([element({ points: [{ x: 1, y: 'wrong' }] })]));
  assert.throws(() => parseElements([element(), element()]));
  assert.throws(() => parseElements([element({ opacity: 200 })]));
});
test('invalid viewport cannot inject NaN or zero zoom', () => {
  assert.throws(() => parseViewport({ panX: 0, panY: 0, zoom: 0 }));
  assert.throws(() => parseViewport({ panX: NaN, panY: 0, zoom: 1 }));
});
test('preferences include vertical alignment but exclude transient selection', () => {
  assert.deepEqual(parseAppState({ textVerticalAlign: 'bottom', selectedElementIds: ['bad'] }), { textVerticalAlign: 'bottom' });
});
test('drawing imports validate file type and version', () => {
  assert.throws(() => parseDrawing('{"type":"other","elements":[]}'));
  assert.throws(() => parseDrawing('{"type":"scribble","version":99,"elements":[]}'));
  assert.deepEqual(parseDrawing('{"type":"scribble","version":2,"elements":[]}').elements, []);
});
test('non-renderable tools and invalid CSS colors are rejected as stored elements', () => {
  assert.throws(() => parseElements([element({ type: 'select' })]));
  assert.throws(() => parseElements([element({ strokeColor: '#abcde' })]));
});
