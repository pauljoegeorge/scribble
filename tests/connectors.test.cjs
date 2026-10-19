const { test } = require('node:test');
const assert = require('node:assert/strict');
const { element } = require('./fixtures.cjs');
const { bindConnector, reconcileBindings } = require('../src/utils/canvas/bindings.ts');
const { updateDrawing, hasVisibleGeometry } = require('../src/utils/canvas/elements.ts');

function finish(shapes, type, start, end) {
  const draft = updateDrawing(element({ id: 'connector', type, points: [{ x: 0, y: 0 }] }), start, end);
  return reconcileBindings([...shapes, bindConnector(draft, shapes, 1)]).at(-1);
}
test('lines and arrows remain visible when both endpoints touch the same shape', () => {
  for (const type of ['line', 'arrow']) {
    const connector = finish([element()], type, { x: 10, y: 50 }, { x: 90, y: 50 });
    assert.equal(connector.x, 10); assert.equal(connector.width, 80);
    assert.equal(connector.startBinding, undefined); assert.equal(connector.endBinding, undefined);
    assert.ok(hasVisibleGeometry(connector));
  }
});
test('connector drafts keep their original anchor while passing over shapes', () => {
  const shape = element();
  for (const type of ['line', 'arrow']) {
    const start = { x: 50, y: 50 };
    let draft = element({ id: 'connector', type, x: 50, y: 50, points: [{ x: 0, y: 0 }] });
    for (const end of [{ x: 60, y: 50 }, { x: 90, y: 50 }, { x: 180, y: 50 }]) {
      draft = reconcileBindings([shape, updateDrawing(draft, start, end)]).at(-1);
      assert.equal(draft.x, 50); assert.equal(draft.width, end.x - 50);
    }
    const committed = reconcileBindings([shape, bindConnector(draft, [shape], 1)]).at(-1);
    assert.equal(committed.startBinding, shape.id); assert.equal(committed.x, 100);
    assert.equal(committed.width, 80); assert.ok(hasVisibleGeometry(committed));
  }
});
test('line and arrow endpoints bind correctly when ending at another shape', () => {
  const shapes = [element({ id: 'first' }), element({ id: 'second', x: 300 })];
  for (const type of ['line', 'arrow']) {
    const connector = finish(shapes, type, { x: 50, y: 50 }, { x: 350, y: 50 });
    assert.equal(connector.startBinding, 'first'); assert.equal(connector.endBinding, 'second');
    assert.equal(connector.x, 100); assert.equal(connector.width, 200); assert.ok(hasVisibleGeometry(connector));
  }
});
test('overlapping bound shapes cannot collapse a visible connector', () => {
  const shapes = [element({ id: 'first' }), element({ id: 'second' })];
  const connector = element({ id: 'connector', type: 'arrow', x: 10, y: 50, width: 80, height: 0,
    points: [{ x: 0, y: 0 }, { x: 80, y: 0 }], startBinding: 'first', endBinding: 'second' });
  const result = reconcileBindings([...shapes, connector]).at(-1);
  assert.equal(result.width, 80); assert.equal(result.startBinding, undefined); assert.ok(hasVisibleGeometry(result));
});
test('existing self-bound connectors recover without losing their geometry', () => {
  const shape = element();
  const connector = element({ id: 'connector', type: 'line', width: 80, height: 0,
    points: [{ x: 0, y: 0 }, { x: 80, y: 0 }], startBinding: shape.id, endBinding: shape.id });
  const result = reconcileBindings([shape, connector]).at(-1);
  assert.equal(result.width, 80); assert.equal(result.startBinding, undefined); assert.equal(result.endBinding, undefined);
});
