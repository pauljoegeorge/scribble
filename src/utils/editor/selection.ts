import type { ScribbleElement } from '@/types';
import { getRotatedBounds } from '@/utils/canvas/math';
import { getSelectionBounds } from '@/utils/canvas/elements';
export type ScribbleLayerAction = 'front' | 'forward' | 'backward' | 'back';
export type ScribbleAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export function reorderElements(elements: ScribbleElement[], ids: string[], action: ScribbleLayerAction) {
  const selected = new Set(ids);
  if (action === 'front' || action === 'back') {
    const targets = elements.filter((element) => selected.has(element.id));
    const rest = elements.filter((element) => !selected.has(element.id));
    return action === 'front' ? [...rest, ...targets] : [...targets, ...rest];
  }
  const next = [...elements];
  if (action === 'forward') {
    for (let index = next.length - 2; index >= 0; index--) if (selected.has(next[index].id) && !selected.has(next[index + 1].id)) [next[index], next[index + 1]] = [next[index + 1], next[index]];
  } else {
    for (let index = 1; index < next.length; index++) if (selected.has(next[index].id) && !selected.has(next[index - 1].id)) [next[index], next[index - 1]] = [next[index - 1], next[index]];
  }
  return next;
}
export function alignElements(elements: ScribbleElement[], ids: string[], alignment: ScribbleAlignment) {
  const targets = elements.filter((element) => !element.isDeleted && ids.includes(element.id));
  if (targets.length < 2) return elements;
  const bounds = getSelectionBounds(targets);
  return elements.map((element) => {
    if (!ids.includes(element.id)) return element;
    const box = getRotatedBounds(element);
    const dx = alignment === 'left' ? bounds.minX - box.minX : alignment === 'right' ? bounds.maxX - box.maxX : alignment === 'center' ? (bounds.minX + bounds.maxX - box.minX - box.maxX) / 2 : 0;
    const dy = alignment === 'top' ? bounds.minY - box.minY : alignment === 'bottom' ? bounds.maxY - box.maxY : alignment === 'middle' ? (bounds.minY + bounds.maxY - box.minY - box.maxY) / 2 : 0;
    return { ...element, x: element.x + dx, y: element.y + dy };
  });
}
export function distributeElements(elements: ScribbleElement[], ids: string[], axis: 'horizontal' | 'vertical') {
  const targets = elements.filter((element) => !element.isDeleted && ids.includes(element.id));
  if (targets.length < 3) return elements;
  const coordinate = (element: ScribbleElement) => {
    const bounds = getRotatedBounds(element);
    return axis === 'horizontal' ? (bounds.minX + bounds.maxX) / 2 : (bounds.minY + bounds.maxY) / 2;
  };
  targets.sort((a, b) => coordinate(a) - coordinate(b));
  const start = coordinate(targets[0]), gap = (coordinate(targets[targets.length - 1]) - start) / (targets.length - 1);
  const positions = new Map(targets.map((element, index) => [element.id, start + index * gap - coordinate(element)]));
  return elements.map((element) => positions.has(element.id) ? { ...element,
    x: element.x + (axis === 'horizontal' ? positions.get(element.id)! : 0), y: element.y + (axis === 'vertical' ? positions.get(element.id)! : 0) } : element);
}
