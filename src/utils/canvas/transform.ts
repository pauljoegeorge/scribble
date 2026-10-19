import type { ScribbleElement, Point, ResizeHandle, Viewport } from '@/types';
import { getElementAbsoluteBounds, getRotatedBounds, getElementCenter, rotatePoint } from './math';
import { fitElementText } from './text';

export function resizeElement(element: ScribbleElement, handle: ResizeHandle, position: Point, zoom: number): ScribbleElement {
  const center = getElementCenter(element);
  if (handle === 'rotation') return { ...element, angle: Math.atan2(position.y - center.y, position.x - center.x) + Math.PI / 2 };
  const point = rotatePoint(position, center, -(element.angle ?? 0));
  if (element.type === 'line' || element.type === 'arrow') {
    const points = element.points ?? [{ x: 0, y: 0 }, { x: element.width, y: element.height }];
    const next = points.map((value, index) => index === (handle === 'nw' ? 0 : 1) ? { x: point.x - element.x, y: point.y - element.y } : value);
    return { ...element, points: next, width: next[1].x - next[0].x, height: next[1].y - next[0].y };
  }
  if (element.type === 'text' && !element.textBox) return element;
  const bounds = getElementAbsoluteBounds(element);
  let { minX, minY, maxX, maxY } = bounds;
  if (handle.includes('e')) maxX = point.x - 6 / zoom;
  if (handle.includes('w')) minX = point.x + 6 / zoom;
  if (handle.includes('s')) maxY = point.y - 6 / zoom;
  if (handle.includes('n')) minY = point.y + 6 / zoom;
  const x = Math.min(minX, maxX), y = Math.min(minY, maxY);
  const width = Math.max(1, Math.abs(maxX - minX)), height = Math.max(1, Math.abs(maxY - minY));
  const newCenter = { x: x + width / 2, y: y + height / 2 };
  const shiftedCenter = rotatePoint(newCenter, center, element.angle ?? 0);
  const next = { ...element, x: x + shiftedCenter.x - newCenter.x, y: y + shiftedCenter.y - newCenter.y, width, height };
  if (element.type === 'pencil' && element.points) {
    return { ...next, points: element.points.map((value) => ({ x: (element.x + value.x - bounds.minX) * width / (bounds.width || 1), y: (element.y + value.y - bounds.minY) * height / (bounds.height || 1) })) };
  }
  return fitElementText(next);
}
export function zoomAt(viewport: Viewport, zoom: number, anchor: Point): Viewport {
  zoom = Math.min(5, Math.max(0.1, zoom));
  return { zoom, panX: anchor.x - (anchor.x - viewport.panX) * zoom / viewport.zoom,
    panY: anchor.y - (anchor.y - viewport.panY) * zoom / viewport.zoom };
}
export function fitViewport(elements: ScribbleElement[], width: number, height: number): Viewport {
  const active = elements.filter((element) => !element.isDeleted);
  if (!active.length) return { zoom: 1, panX: width / 2, panY: height / 2 };
  const bounds = active.map(getRotatedBounds);
  const minX = Math.min(...bounds.map((b) => b.minX)), minY = Math.min(...bounds.map((b) => b.minY));
  const maxX = Math.max(...bounds.map((b) => b.maxX)), maxY = Math.max(...bounds.map((b) => b.maxY));
  const zoom = Math.max(0.1, Math.min(1, (width - 100) / Math.max(1, maxX - minX), (height - 180) / Math.max(1, maxY - minY)));
  return { zoom, panX: width / 2 - (minX + maxX) / 2 * zoom, panY: height / 2 - (minY + maxY) / 2 * zoom };
}
