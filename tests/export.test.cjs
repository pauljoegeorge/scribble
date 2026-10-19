const { test } = require('node:test');
const assert = require('node:assert/strict');
const { element } = require('./fixtures.cjs');
const { exportCanvasToPNG, exportCanvasToJSON } = require('../src/utils/storage/export.ts');
function environment() {
  const canvases = [], downloads = [], blobs = [];
  global.window = { setTimeout: (callback) => callback() };
  global.document = { fonts: { ready: Promise.resolve() }, createElement: (tag) => {
    if (tag === 'a') {
      const link = { click: () => downloads.push(link.download) };
      return link;
    }
    const context = new Proxy({}, { get: (target, property) => property === 'measureText' ? (value) => ({ width: value.length * 10 }) : target[property] ?? (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
    const canvas = { width: 0, height: 0, getContext: () => context, toBlob: (callback) => callback(new Blob(['png'], { type: 'image/png' })) };
    canvases.push(canvas); return canvas;
  } };
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = (blob) => { blobs.push(blob); return 'blob:scribble-test'; };
  URL.revokeObjectURL = () => {};
  return { canvases, downloads, blobs, restore: () => { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; delete global.document; delete global.window; } };
}
test('PNG export includes the full scene outside the screen and excludes deleted objects', async () => {
  const env = environment();
  try {
    await exportCanvasToPNG([element({ x: 2000, y: -1000 }), element({ id: 'deleted', x: 9000, isDeleted: true })]);
    assert.equal(env.canvases[0].width, 296); assert.equal(env.canvases[0].height, 296);
    assert.equal(env.downloads.length, 1); assert.match(env.downloads[0], /\.png$/);
  } finally { env.restore(); }
});
test('drawing export preserves reopenable viewport and preferences', async () => {
  const env = environment();
  try {
    exportCanvasToJSON([element()], { panX: 12, panY: 34, zoom: 2 }, { textVerticalAlign: 'bottom' });
    const value = JSON.parse(await env.blobs[0].text());
    assert.equal(value.type, 'scribble'); assert.equal(value.viewport.zoom, 2);
    assert.equal(value.appState.textVerticalAlign, 'bottom'); assert.match(env.downloads[0], /\.scribble$/);
  } finally { env.restore(); }
});
