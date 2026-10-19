import rough from 'roughjs';
import type { ScribbleElement, Viewport, AppState } from '@/types';
import { getRotatedBounds } from '@/utils/canvas/math';
import { renderElementToCanvas } from '@/utils/canvas/roughRenderer';
function download(blob: Blob, extension: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `scribble-${new Date().toISOString().slice(0, 10)}.${extension}`;
  link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportCanvasToJSON(elements: ScribbleElement[], viewport?: Viewport, appState?: AppState) {
  download(new Blob([JSON.stringify({ type: 'scribble', version: 2, source: 'scribble-note', elements: elements.filter((element) => !element.isDeleted), viewport, appState }, null, 2)], { type: 'application/json' }), 'scribble');
}
export async function exportCanvasToPNG(elements: ScribbleElement[]) {
  await document.fonts.ready;
  const active = elements.filter((element) => !element.isDeleted), bounds = active.map(getRotatedBounds);
  const minX = bounds.length ? Math.min(...bounds.map((b) => b.minX)) : 0, minY = bounds.length ? Math.min(...bounds.map((b) => b.minY)) : 0;
  const maxX = bounds.length ? Math.max(...bounds.map((b) => b.maxX)) : 300, maxY = bounds.length ? Math.max(...bounds.map((b) => b.maxY)) : 200;
  const width = maxX - minX + 48, height = maxY - minY + 48, ratio = Math.min(2, 8192 / Math.max(width, height));
  const canvas = document.createElement('canvas'); canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image export is unavailable');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(ratio, ratio); ctx.translate(24 - minX, 24 - minY);
  const rc = rough.canvas(canvas);
  for (const element of active) renderElementToCanvas(rc, ctx, element, false, 1);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Image export failed')), 'image/png'));
  download(blob, 'png');
}
