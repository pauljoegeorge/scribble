import type { AppState, ScribbleElement, Viewport } from '@/types';

const tools = ['rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'pencil', 'text', 'cylinder'];
const enums = {
  fillStyle: ['none', 'hachure', 'solid', 'cross-hatch'],
  strokeStyle: ['solid', 'dashed', 'dotted'], fontFamily: ['hand', 'sans', 'code'],
  fontSize: ['S', 'M', 'L', 'XL'], textAlign: ['left', 'center', 'right'],
  textVerticalAlign: ['top', 'middle', 'bottom'],
};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const color = (value: unknown) => typeof value === 'string' && (value === 'transparent' || /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value));
function validStyle(value: Record<string, unknown>, partial = false) {
  for (const [key, values] of Object.entries(enums)) {
    if (value[key] === undefined && (partial || key === 'textVerticalAlign')) continue;
    if (typeof value[key] !== 'string' || !values.includes(value[key] as string)) return false;
  }
  for (const key of ['strokeColor', 'backgroundColor']) {
    if (!(partial && value[key] === undefined) && !color(value[key])) return false;
  }
  for (const [key, min, max] of [['strokeWidth', 0.1, 100], ['roughness', 0, 10], ['opacity', 0, 100]] as const) {
    if (partial && value[key] === undefined) continue;
    const number = value[key];
    if (!finite(number) || number < min || number > max) return false;
  }
  return true;
}
export function isScribbleElement(value: unknown): value is ScribbleElement {
  if (!record(value) || typeof value.id !== 'string' || !value.id || !tools.includes(String(value.type))) return false;
  if (['x', 'y', 'width', 'height', 'seed'].some((key) => !finite(value[key]))) return false;
  if (!validStyle(value)) return false;
  if (value.angle !== undefined && !finite(value.angle)) return false;
  if (value.isDeleted !== undefined && typeof value.isDeleted !== 'boolean') return false;
  if (value.textBox !== undefined && typeof value.textBox !== 'boolean') return false;
  if (['text', 'boundText', 'startBinding', 'endBinding'].some((key) => value[key] !== undefined && typeof value[key] !== 'string')) return false;
  return value.points === undefined || (Array.isArray(value.points) && value.points.every((point: unknown) => record(point) && finite(point.x) && finite(point.y)));
}
export function parseElements(value: unknown): ScribbleElement[] {
  if (!Array.isArray(value) || !value.every(isScribbleElement)) throw new Error('Invalid drawing data');
  const ids = value.map((element) => element.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate element IDs');
  return value;
}
export function parseViewport(value: unknown): Viewport {
  if (!record(value) || !finite(value.panX) || !finite(value.panY) || !finite(value.zoom) || value.zoom < 0.1 || value.zoom > 5) throw new Error('Invalid viewport');
  return { panX: value.panX, panY: value.panY, zoom: value.zoom };
}
export function parseAppState(value: unknown): Partial<AppState> {
  if (!record(value) || !validStyle(value, true)) throw new Error('Invalid preferences');
  const allowed = ['strokeColor', 'backgroundColor', 'strokeWidth', 'roughness', 'opacity', ...Object.keys(enums)];
  return Object.fromEntries(Object.entries(value).filter(([key]) => allowed.includes(key)));
}
