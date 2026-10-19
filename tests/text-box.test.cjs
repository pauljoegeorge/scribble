const { test } = require('node:test');
const assert = require('node:assert/strict');
const { element } = require('./fixtures.cjs');
const { finishTextBox } = require('../src/utils/canvas/elements.ts');
const { fitElementText, getTextLayout } = require('../src/utils/canvas/text.ts');
const { wrapText } = require('../src/utils/canvas/textWrapping.ts');
const { resizeElement } = require('../src/utils/canvas/transform.ts');
const { getHandlePositions } = require('../src/utils/canvas/math.ts');
const { parseElements } = require('../src/utils/storage/validation.ts');

test('dragging T creates a large field in either direction', () => {
  const box = finishTextBox(element({ type: 'text' }), { x: 500, y: 400 }, { x: 100, y: 200 }, 1);
  assert.equal(box.textBox, true);
  assert.deepEqual([box.x, box.y, box.width, box.height], [100, 200, 400, 200]);
});
test('a click or small screen-space movement preserves auto-sized text', () => {
  const text = finishTextBox(element({ type: 'text' }), { x: 10, y: 20 }, { x: 20, y: 20 }, 0.5);
  assert.equal(text.textBox, false); assert.equal(text.x, 10); assert.equal(text.width, 0);
});
test('wrapping preserves explicit line breaks and splits long words', () => {
  const lines = wrapText('hello world\n\nabcdefgh', 5, (value) => value.length);
  assert.deepEqual(lines, ['hello', 'world', '', 'abcde', 'fgh']);
});
test('typing preserves the box size and grows its height for overflow', () => {
  const box = element({ type: 'text', textBox: true, width: 120, height: 200, text: 'Hello world' });
  const fitted = fitElementText(box);
  assert.equal(fitted.width, 120); assert.equal(fitted.height, 200);
  const overflow = fitElementText({ ...box, text: 'a\n'.repeat(20) });
  assert.equal(overflow.width, 120); assert.ok(overflow.height > 200);
  assert.ok(getTextLayout({ ...box, text: 'hello world hello world' }).lines.length > 1);
});
test('text boxes resize and reflow without changing font size', () => {
  const box = element({ type: 'text', textBox: true, width: 300, height: 200, text: 'hello world hello world' });
  assert.ok(getHandlePositions(box, 1).e);
  const resized = resizeElement(box, 'e', { x: 126, y: 100 }, 1);
  assert.equal(resized.width, 120); assert.equal(resized.fontSize, box.fontSize);
  assert.ok(getTextLayout(resized).lines.length > getTextLayout(box).lines.length);
});
test('box sizing survives serialization and invalid box flags are rejected', () => {
  const box = element({ type: 'text', textBox: true, width: 400, height: 300, text: 'Hello' });
  assert.deepEqual(parseElements(JSON.parse(JSON.stringify([box]))), [box]);
  assert.throws(() => parseElements([{ ...box, textBox: 'yes' }]));
});
test('long labels in other shapes wrap and grow vertically while preserving width', () => {
  for (const type of ['diamond', 'ellipse', 'cylinder']) {
    const shape = element({ type, width: 240, height: 100, boundText: 'A longer paragraph inside a shape. '.repeat(10) });
    const fitted = fitElementText(shape);
    assert.equal(fitted.width, 240); assert.ok(fitted.height > 100);
    const layout = getTextLayout(fitted);
    assert.ok(layout.lines.length > 1);
    assert.ok(layout.x >= fitted.x); assert.ok(layout.y >= fitted.y);
    assert.ok(layout.y + layout.height <= fitted.y + fitted.height);
  }
});
test('rectangle labels never resize geometry, including short and inverted rectangles', () => {
  for (const [width, height] of [[200, 50], [200, 20], [30, 20], [-200, -50]]) {
    for (const boundText of ['Hello', 'A long paragraph. '.repeat(20), 'One\nTwo\nThree']) {
      const shape = element({ width, height, boundText });
      const fitted = fitElementText(shape);
      assert.deepEqual([fitted.x, fitted.y, fitted.width, fitted.height], [shape.x, shape.y, width, height]);
      const layout = getTextLayout(fitted);
      assert.ok(layout.x >= Math.min(shape.x, shape.x + width));
      assert.ok(layout.y >= Math.min(shape.y, shape.y + height));
      assert.ok(layout.y + layout.height <= Math.max(shape.y, shape.y + height));
      assert.ok(layout.x + layout.width <= Math.max(shape.x, shape.x + width));
    }
  }
});
test('position presets align the entire multiline shape label', () => {
  const shape = element({ width: 300, height: 300, boundText: 'First line\nSecond line\nThird line' });
  const top = getTextLayout({ ...shape, textVerticalAlign: 'top' });
  const middle = getTextLayout({ ...shape, textVerticalAlign: 'middle' });
  const bottom = getTextLayout({ ...shape, textVerticalAlign: 'bottom' });
  assert.equal(top.lines.length, 3);
  assert.equal(top.y, 12); assert.equal(middle.y, (300 - middle.height) / 2);
  assert.equal(bottom.y + bottom.height, 288);
});
