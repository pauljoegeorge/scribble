import type { ScribbleElement, Point } from '@/types';
import { canBindText } from './text';
import { getElementCenter, rotatePoint, getElementAbsoluteBounds } from './math';
import { hitElement } from './elements';
function boundary(shape: ScribbleElement, toward: Point): Point {
  const center = getElementCenter(shape), local = rotatePoint(toward, center, -(shape.angle ?? 0));
  const bounds = getElementAbsoluteBounds(shape), dx = local.x - center.x, dy = local.y - center.y;
  const rx = Math.max(1, bounds.width / 2), ry = Math.max(1, bounds.height / 2);
  const scale = shape.type === 'ellipse' ? 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    : shape.type === 'diamond' ? 1 / (Math.abs(dx) / rx + Math.abs(dy) / ry) : 1 / Math.max(Math.abs(dx) / rx, Math.abs(dy) / ry);
  if (!Number.isFinite(scale)) return center;
  return rotatePoint({ x: center.x + dx * scale, y: center.y + dy * scale }, center, shape.angle ?? 0);
}
export function bindConnector(element: ScribbleElement, elements: ScribbleElement[], zoom: number) {
  if (!['line', 'arrow'].includes(element.type) || !element.points || element.points.length < 2) return element;
  const shapes = elements.filter(canBindText);
  const first = element.points[0], last = element.points[1];
  const startBinding = hitElement(shapes, { x: element.x + first.x, y: element.y + first.y }, zoom)?.id;
  const endBinding = hitElement(shapes, { x: element.x + last.x, y: element.y + last.y }, zoom)?.id;
  // An ordinary line inside one shape must not collapse into a self-connection.
  return { ...element, startBinding: startBinding === endBinding ? undefined : startBinding,
    endBinding: startBinding === endBinding ? undefined : endBinding };
}
export function reconcileBindings(elements: ScribbleElement[]): ScribbleElement[] {
  const shapes = new Map(elements.filter((element) => !element.isDeleted && canBindText(element)).map((element) => [element.id, element]));
  return elements.map((element) => {
    if ((!element.startBinding && !element.endBinding) || !element.points || element.points.length < 2) return element;
    const start = shapes.get(element.startBinding ?? ''), end = shapes.get(element.endBinding ?? '');
    const first = { x: element.x + element.points[0].x, y: element.y + element.points[0].y };
    const last = { x: element.x + element.points[1].x, y: element.y + element.points[1].y };
    if (start && start.id === end?.id) return { ...element, startBinding: undefined, endBinding: undefined };
    const p1 = start ? boundary(start, end ? getElementCenter(end) : last) : first;
    const p2 = end ? boundary(end, start ? getElementCenter(start) : first) : last;
    if (Math.hypot(p2.x - p1.x, p2.y - p1.y) <= 2 && Math.hypot(last.x - first.x, last.y - first.y) > 2) {
      return { ...element, startBinding: undefined, endBinding: undefined };
    }
    return { ...element, angle: 0, x: p1.x, y: p1.y, width: p2.x - p1.x, height: p2.y - p1.y,
      points: [{ x: 0, y: 0 }, { x: p2.x - p1.x, y: p2.y - p1.y }], startBinding: start?.id, endBinding: end?.id };
  });
}
