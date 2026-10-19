const { test } = require('node:test');
const assert = require('node:assert/strict');
const { element } = require('./fixtures.cjs');
const { getTextLayout, getTextBaselineOffset, measureText } = require('../src/utils/canvas/text.ts');
const { renderElementText } = require('../src/utils/canvas/textRenderer.ts');

test('canvas baseline centers font ascent and descent within the CSS line box', () => {
  assert.equal(getTextBaselineOffset(27, 20, 6), 20.5);
  assert.equal(getTextBaselineOffset(27, 28, 10), 22.5);
});
test('baseline uses font bounds rather than glyph bounds that change with content', () => {
  const previous = global.document;
  global.document = { createElement: () => ({ getContext: () => ({ measureText: (text) => ({
    width: text.length * 10, fontBoundingBoxAscent: 28, fontBoundingBoxDescent: 10,
    actualBoundingBoxAscent: text === 'g' ? 10 : 20,
  }) }) }) };
  try {
    assert.equal(measureText('g', 'M', 'hand').baselineOffset, 22.5);
    assert.equal(measureText('ABC', 'M', 'hand').baselineOffset, 22.5);
  } finally { if (previous === undefined) delete global.document; else global.document = previous; }
});
test('multiline rendering uses the same line-box origin and spacing as the editor', () => {
  for (const fontFamily of ['hand', 'sans', 'code']) {
    const shape = element({ fontFamily, width: 300, height: 200, textAlign: 'center', boundText: 'First\nSecond' });
    const layout = getTextLayout(shape), calls = [];
    const context = { save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillText: (...args) => calls.push(args) };
    renderElementText(context, shape);
    assert.equal(context.textBaseline, 'alphabetic');
    assert.equal(calls[0][1], layout.x + layout.width / 2);
    assert.equal(calls[0][2], layout.y + layout.baselineOffset);
    assert.equal(calls[1][2] - calls[0][2], layout.lineHeight);
  }
});
