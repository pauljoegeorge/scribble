import type { ScribbleElement, Point, ResizeHandle } from '@/types';
export { getFontString, FONT_SIZES, measureText } from './text';

export function getElementAbsoluteBounds(element: ScribbleElement) {
  const points = element.points?.length && ['pencil', 'arrow', 'line'].includes(element.type)
    ? element.points.map((point) => ({ x: element.x + point.x, y: element.y + point.y }))
    : [{ x: element.x, y: element.y }, { x: element.x + element.width, y: element.y + element.height }];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x); minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
export function getElementCenter(element: ScribbleElement): Point {
  const bounds = getElementAbsoluteBounds(element);
  return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
}
export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const dx = point.x - center.x, dy = point.y - center.y;
  return { x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle), y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle) };
}
export function getRotatedBounds(element: ScribbleElement) {
  const { minX, minY, maxX, maxY } = getElementAbsoluteBounds(element);
  const center = getElementCenter(element);
  const points = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }]
    .map((point) => rotatePoint(point, center, element.angle ?? 0));
  return { minX: Math.min(...points.map((point) => point.x)), minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)), maxY: Math.max(...points.map((point) => point.y)) };
}
export function distanceToSegment(point: Point, start: Point, end: Point) {
  const length = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  const fraction = length ? Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / length)) : 0;
  return Math.hypot(point.x - start.x - fraction * (end.x - start.x), point.y - start.y - fraction * (end.y - start.y));
}
export function isPointInElement(point: Point, element: ScribbleElement, margin = 6): boolean {
  if (element.isDeleted) return false;
  point = rotatePoint(point, getElementCenter(element), -(element.angle ?? 0));
  const { minX, minY, maxX, maxY, width, height } = getElementAbsoluteBounds(element);
  if (point.x < minX - margin || point.x > maxX + margin || point.y < minY - margin || point.y > maxY + margin) return false;
  if (['pencil', 'line', 'arrow'].includes(element.type)) {
    const points = element.points ?? [{ x: 0, y: 0 }, { x: element.width, y: element.height }];
    return points.slice(1).some((end, index) => distanceToSegment(point,
      { x: element.x + points[index].x, y: element.y + points[index].y },
      { x: element.x + end.x, y: element.y + end.y }) <= margin + element.strokeWidth / 2);
  }
  if (element.type === 'ellipse') {
    return ((point.x - (minX + maxX) / 2) / (width / 2 + margin)) ** 2 + ((point.y - (minY + maxY) / 2) / (height / 2 + margin)) ** 2 <= 1;
  }
  if (element.type === 'diamond') {
    return Math.abs(point.x - (minX + maxX) / 2) / (width / 2 + margin) + Math.abs(point.y - (minY + maxY) / 2) / (height / 2 + margin) <= 1;
  }
  return true;
}
export function getHandlePositions(element: ScribbleElement, zoom: number): Partial<Record<ResizeHandle, Point>> {
  if (element.type === 'text' && !element.textBox) return {};
  if (element.type === 'arrow' || element.type === 'line') {
    const points = element.points ?? [{ x: 0, y: 0 }, { x: element.width, y: element.height }];
    const center = getElementCenter(element);
    return { nw: rotatePoint({ x: element.x + points[0].x, y: element.y + points[0].y }, center, element.angle ?? 0),
      se: rotatePoint({ x: element.x + points[1].x, y: element.y + points[1].y }, center, element.angle ?? 0) };
  }
  const bounds = getElementAbsoluteBounds(element), padding = 6 / zoom;
  const minX = bounds.minX - padding, minY = bounds.minY - padding, maxX = bounds.maxX + padding, maxY = bounds.maxY + padding;
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
  const handles: Partial<Record<ResizeHandle, Point>> = { nw: { x: minX, y: minY }, n: { x: midX, y: minY }, ne: { x: maxX, y: minY },
    e: { x: maxX, y: midY }, se: { x: maxX, y: maxY }, s: { x: midX, y: maxY }, sw: { x: minX, y: maxY }, w: { x: minX, y: midY },
    rotation: { x: midX, y: minY - 20 / zoom } };
  return Object.fromEntries(Object.entries(handles).map(([key, value]) => [key, rotatePoint(value, getElementCenter(element), element.angle ?? 0)]));
}
export function getResizeHandleAtPosition(point: Point, element: ScribbleElement, zoom: number): ResizeHandle | null {
  for (const [handle, position] of Object.entries(getHandlePositions(element, zoom))) {
    if (Math.hypot(point.x - position.x, point.y - position.y) <= 9 / zoom) return handle as ResizeHandle;
  }
  return isPointInElement(point, element, 6 / zoom) ? 'inside' : null;
}
