import type { AppState, Point, ScribbleElement, ToolType } from '@/types';
import { getRotatedBounds, isPointInElement } from './math';

export function createElement(type: ToolType, point: Point, state: AppState): ScribbleElement {
  return { id: `scribble_${crypto.randomUUID()}`, type, x: point.x, y: point.y, width: 0, height: 0,
    points: ['pencil', 'line', 'arrow'].includes(type) ? [{ x: 0, y: 0 }] : undefined,
    text: type === 'text' ? '' : undefined, strokeColor: state.strokeColor, backgroundColor: state.backgroundColor,
    fillStyle: state.fillStyle, strokeWidth: state.strokeWidth, strokeStyle: state.strokeStyle, roughness: state.roughness,
    opacity: state.opacity, fontFamily: state.fontFamily, fontSize: state.fontSize, textAlign: state.textAlign,
    textVerticalAlign: state.textVerticalAlign ?? 'middle', seed: Math.floor(Math.random() * 100000) };
}
export const hitElement = (elements: ScribbleElement[], point: Point, zoom: number) =>
  [...elements].reverse().find((element) => isPointInElement(point, element, 6 / zoom));
export function updateDrawing(element: ScribbleElement, start: Point, point: Point): ScribbleElement {
  const end = { x: point.x - start.x, y: point.y - start.y };
  return { ...element, x: start.x, y: start.y, width: end.x, height: end.y,
    startBinding: undefined, endBinding: undefined,
    points: element.type === 'pencil' ? [...(element.points ?? []), end]
      : ['line', 'arrow'].includes(element.type) ? [{ x: 0, y: 0 }, end] : undefined };
}
export function finishTextBox(element: ScribbleElement, start: Point, end: Point, zoom: number): ScribbleElement {
  const dragged = Math.hypot(end.x - start.x, end.y - start.y) * zoom > 6;
  return { ...element, x: dragged ? Math.min(start.x, end.x) : start.x, y: dragged ? Math.min(start.y, end.y) : start.y,
    width: dragged ? Math.max(40, Math.abs(end.x - start.x)) : 0,
    height: dragged ? Math.max(27, Math.abs(end.y - start.y)) : 0, textBox: dragged };
}
export function hasVisibleGeometry(element: ScribbleElement) {
  if (element.type === 'text') return Boolean(element.text?.trim());
  const bounds = getRotatedBounds(element);
  return Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) > 2;
}
export function getSelectionBounds(elements: ScribbleElement[]) {
  const bounds = elements.map(getRotatedBounds);
  return { minX: Math.min(...bounds.map((b) => b.minX)), minY: Math.min(...bounds.map((b) => b.minY)),
    maxX: Math.max(...bounds.map((b) => b.maxX)), maxY: Math.max(...bounds.map((b) => b.maxY)) };
}
