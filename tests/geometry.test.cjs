const { test } = require('node:test');
const assert = require('node:assert/strict');
const { element } = require('./fixtures.cjs');
const { getElementAbsoluteBounds, isPointInElement, getHandlePositions, getResizeHandleAtPosition } = require('../src/utils/canvas/math.ts');
const { resizeElement, zoomAt } = require('../src/utils/canvas/transform.ts');
const { fitElementText, getTextLayout } = require('../src/utils/canvas/text.ts');
const { reconcileBindings } = require('../src/utils/canvas/bindings.ts');
const { transformGroup } = require('../src/utils/canvas/groupTransform.ts');
const { reorderElements, alignElements, distributeElements } = require('../src/utils/editor/selection.ts');

test('freehand bounds include every point, including negative coordinates', () => {
  const bounds = getElementAbsoluteBounds(element({ type: 'pencil', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 200, y: -50 }] }));
  assert.equal(bounds.maxX, 200); assert.equal(bounds.minY, -50);
});
test('freehand hit testing rejects blank space inside bounding box', () => {
  const stroke = element({ type: 'pencil', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }] });
  assert.equal(isPointInElement({ x: 20, y: 80 }, stroke, 2), false);
  assert.equal(isPointInElement({ x: 100, y: 80 }, stroke, 2), true);
});
test('ellipse and diamond corners are not selectable', () => {
  for (const type of ['ellipse', 'diamond']) {
    assert.equal(isPointInElement({ x: 0, y: 0 }, element({ type }), 0), false);
    assert.equal(isPointInElement({ x: 50, y: 50 }, element({ type }), 0), true);
  }
});
test('drawn resize handles match hit targets at multiple zoom levels and rotations', () => {
  for (const zoom of [0.2, 1, 5]) for (const angle of [0, Math.PI / 4]) {
    const shape = element({ width: 300, height: 200, angle });
    for (const [handle, point] of Object.entries(getHandlePositions(shape, zoom))) assert.equal(getResizeHandleAtPosition(point, shape, zoom), handle);
  }
});
test('rotation changes angle without changing bounds', () => {
  const shape = element(), rotated = resizeElement(shape, 'rotation', { x: 100, y: 50 }, 1);
  assert.equal(rotated.width, 100); assert.equal(rotated.height, 100); assert.equal(rotated.angle, Math.PI / 2);
});
test('freehand resizing transforms points', () => {
  const stroke = element({ type: 'pencil', points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] });
  const next = resizeElement(stroke, 'se', { x: 206, y: 206 }, 1);
  assert.equal(next.points[1].x, 200); assert.equal(next.points[1].y, 200);
});
test('standalone text has no misleading geometric resize handles', () => assert.deepEqual(getHandlePositions(element({ type: 'text' }), 1), {}));
test('zoom preserves the world coordinate beneath the anchor', () => {
  const before = { panX: 30, panY: 40, zoom: 1 }, anchor = { x: 300, y: 200 };
  const after = zoomAt(before, 2, anchor);
  assert.equal((anchor.x - before.panX) / before.zoom, (anchor.x - after.panX) / after.zoom);
  assert.equal((anchor.y - before.panY) / before.zoom, (anchor.y - after.panY) / after.zoom);
});
test('text layout height and fitting use the same line-height', () => {
  const text = fitElementText(element({ type: 'text', text: 'One\nTwo', fontSize: 'XL' }));
  assert.equal(text.height, getTextLayout(text).height);
  assert.ok(text.height > 70);
});
test('font changes preserve rectangle geometry and keep its label within bounds', () => {
  const shape = fitElementText(element({ boundText: 'A long label that needs space', fontSize: 'XL' }));
  assert.equal(shape.width, 100);
  assert.equal(shape.height, 100);
  const layout = getTextLayout(shape);
  assert.ok(layout.y + layout.height <= shape.y + shape.height);
});
test('connectors follow shapes to their boundaries', () => {
  const start = element({ id: 'start', x: 0 }), end = element({ id: 'end', x: 300 });
  const connector = element({ id: 'arrow', type: 'arrow', startBinding: 'start', endBinding: 'end', points: [{ x: 0, y: 0 }, { x: 300, y: 0 }] });
  const next = reconcileBindings([start, end, connector])[2];
  assert.equal(next.x, 100); assert.equal(next.y, 50); assert.equal(next.points[1].x, 200);
  const moved = reconcileBindings([{ ...start, y: 100 }, end, next])[2];
  assert.notEqual(moved.y, next.y);
});
test('group rotation rotates positions and element angles', () => {
  const shapes = [element({ id: 'a' }), element({ id: 'b', x: 200 })];
  const rotated = transformGroup(shapes, ['a', 'b'], 'rotation', { x: 300, y: 50 }, 1);
  assert.equal(rotated[0].angle, Math.PI / 2);
  assert.notEqual(rotated[0].y, shapes[0].y);
});
test('layer operations keep selected relative order', () => {
  const shapes = ['a', 'b', 'c', 'd'].map((id) => element({ id }));
  assert.deepEqual(reorderElements(shapes, ['a', 'c'], 'front').map((e) => e.id), ['b', 'd', 'a', 'c']);
  assert.deepEqual(reorderElements(shapes, ['a', 'b'], 'forward').map((e) => e.id), ['c', 'a', 'b', 'd']);
});
test('alignment and distribution handle multiple objects', () => {
  const shapes = [element({ id: 'a', x: 0 }), element({ id: 'b', x: 100 }), element({ id: 'c', x: 400 })];
  assert.equal(alignElements(shapes, ['a', 'b'], 'left')[1].x, 0);
  assert.equal(distributeElements(shapes, ['a', 'b', 'c'], 'horizontal')[1].x, 200);
});
test('rotated shapes hit-test in local coordinates', () => {
  const shape = element({ width: 200, height: 30, angle: Math.PI / 2 });
  assert.equal(isPointInElement({ x: 100, y: 80 }, shape, 0), true);
  assert.equal(isPointInElement({ x: 20, y: 15 }, shape, 0), false);
});
test('group resize scales positions and geometry together', () => {
  const shapes = [element({ id: 'a' }), element({ id: 'b', x: 200 })];
  const next = transformGroup(shapes, ['a', 'b'], 'se', { x: 606, y: 206 }, 1);
  assert.equal(next[0].width, 200); assert.equal(next[1].x, 400);
});
test('deleted bound target releases connector binding', () => {
  const shape = element({ id: 'a', isDeleted: true });
  const arrow = element({ id: 'b', type: 'arrow', startBinding: 'a', points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] });
  assert.equal(reconcileBindings([shape, arrow])[1].startBinding, undefined);
});
test('rough geometry is cached for unchanged elements', () => {
  const { getShapeDrawables } = require('../src/utils/canvas/shapeDrawables.ts');
  const shape = element();
  assert.equal(getShapeDrawables(shape), getShapeDrawables(shape));
  assert.notEqual(getShapeDrawables({ ...shape, x: 10 }), getShapeDrawables(shape));
});
