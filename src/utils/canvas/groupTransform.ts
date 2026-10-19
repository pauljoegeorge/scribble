import type { ScribbleElement, Point, ResizeHandle } from '@/types';
import { getSelectionBounds } from './elements';
import { resizeElement } from './transform';
import { getElementCenter, rotatePoint } from './math';
import { FONT_SIZES, fitElementText } from './text';
export function selectionElement(elements: ScribbleElement[]): ScribbleElement | null {
  if (elements.length < 2) return elements[0] ?? null;
  const bounds = getSelectionBounds(elements);
  return { ...elements[0], id: 'scribble_selection', type: 'rectangle', points: undefined, boundText: undefined,
    x: bounds.minX, y: bounds.minY, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY, angle: 0 };
}
export function transformGroup(elements: ScribbleElement[], ids: string[], handle: ResizeHandle, point: Point, zoom: number) {
  const targets = elements.filter((element) => !element.isDeleted && ids.includes(element.id));
  const group = selectionElement(targets);
  if (!group) return elements;
  const resized = resizeElement(group, handle, point, zoom), center = getElementCenter(group);
  return elements.map((element) => {
    if (!ids.includes(element.id)) return element;
    if (handle === 'rotation') {
      const nextCenter = rotatePoint(getElementCenter(element), center, resized.angle ?? 0);
      const originalCenter = getElementCenter(element);
      return { ...element, x: element.x + nextCenter.x - originalCenter.x, y: element.y + nextCenter.y - originalCenter.y,
        angle: (element.angle ?? 0) + (resized.angle ?? 0), startBinding: undefined, endBinding: undefined };
    }
    const sx = resized.width / (group.width || 1), sy = resized.height / (group.height || 1);
    const next = { ...element, x: resized.x + (element.x - group.x) * sx, y: resized.y + (element.y - group.y) * sy,
      width: element.width * sx, height: element.height * sy, points: element.points?.map((p) => ({ x: p.x * sx, y: p.y * sy })) };
    if (element.type === 'text') {
      const size = FONT_SIZES[element.fontSize] * Math.min(sx, sy);
      const fontSize = (Object.keys(FONT_SIZES) as Array<keyof typeof FONT_SIZES>).reduce((best, key) => Math.abs(FONT_SIZES[key] - size) < Math.abs(FONT_SIZES[best] - size) ? key : best, element.fontSize);
      return fitElementText({ ...next, fontSize });
    }
    return fitElementText(next);
  });
}
