import type { FontSize, ScribbleElement } from '@/types';
import { wrapText } from './textWrapping';

export const FONT_SIZES = { S: 16, M: 20, L: 28, XL: 36 };
export const TEXT_PADDING = { x: 16, y: 12 };
export function getTextBaselineOffset(lineHeight: number, ascent: number, descent: number) {
  return (lineHeight + ascent - descent) / 2;
}
export const getFontString = (size: string, family: string) => {
  const pixels = FONT_SIZES[size as FontSize] ?? 20;
  const name = family === 'sans' ? 'Inter, sans-serif' : family === 'code' ? '"Fira Code", monospace' : 'Caveat, "Architects Daughter", cursive';
  return `${pixels}px ${name}`;
};
export function measureText(text: string, size: string, family: string, maxWidth?: number) {
  const pixels = FONT_SIZES[size as FontSize] ?? 20;
  const ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  if (ctx) ctx.font = getFontString(size, family);
  const fontMetrics = ctx?.measureText('Mg');
  const ascent = Number.isFinite(fontMetrics?.fontBoundingBoxAscent) ? fontMetrics!.fontBoundingBoxAscent : pixels * 0.8;
  const descent = Number.isFinite(fontMetrics?.fontBoundingBoxDescent) ? fontMetrics!.fontBoundingBoxDescent : pixels * 0.2;
  const baselineOffset = getTextBaselineOffset(pixels * 1.35, ascent, descent);
  const measure = (line: string) => ctx ? ctx.measureText(line).width : Array.from(line).length * pixels * 0.6;
  const lines = maxWidth === undefined ? text.split('\n') : wrapText(text, Math.max(1, maxWidth), measure);
  const width = lines.reduce((largest, line) => Math.max(largest, measure(line)), 1);
  return { width: Math.max(width + 2, 20), height: Math.max(lines.length * pixels * 1.35, pixels * 1.35), lines, baselineOffset };
}
export const canBindText = (element: ScribbleElement) => ['rectangle', 'diamond', 'ellipse', 'cylinder'].includes(element.type);
const textInset = (element: ScribbleElement) => element.type === 'diamond' ? 2 : element.type === 'ellipse' ? 1.5 : 1;
const labelWidth = (element: ScribbleElement) => element.type === 'rectangle'
  ? Math.max(1, Math.abs(element.width) - Math.min(TEXT_PADDING.x, Math.abs(element.width) / 4) * 2)
  : Math.max(40, Math.abs(element.width) / textInset(element) - TEXT_PADDING.x * 2);
export function fitElementText(element: ScribbleElement): ScribbleElement {
  // A rectangle's geometry belongs to the user, even when its label overflows.
  if (element.type === 'rectangle') return element;
  if (element.type === 'text') {
    if (element.textBox) {
      const width = Math.max(40, Math.abs(element.width));
      const measured = measureText(element.text ?? '', element.fontSize, element.fontFamily, width);
      return { ...element, width, height: Math.max(Math.abs(element.height), measured.height) };
    }
    const { width, height } = measureText(element.text ?? '', element.fontSize, element.fontFamily);
    return { ...element, width, height };
  }
  if (!element.boundText || !canBindText(element)) return element;
  const inset = textInset(element);
  const width = Math.max(Math.abs(element.width), (40 + TEXT_PADDING.x * 2) * inset);
  const measured = measureText(element.boundText, element.fontSize, element.fontFamily, labelWidth({ ...element, width }));
  const height = Math.max(Math.abs(element.height), (measured.height + TEXT_PADDING.y * 2) * inset);
  return { ...element, width: Math.sign(element.width || 1) * width, height: Math.sign(element.height || 1) * height };
}
export function getTextLayout(element: ScribbleElement, text = element.type === 'text' ? element.text ?? '' : element.boundText ?? '') {
  const size = FONT_SIZES[element.fontSize];
  const lineHeight = size * 1.35;
  const bound = canBindText(element);
  const measured = measureText(text, element.fontSize, element.fontFamily, bound ? labelWidth(element) : element.textBox ? Math.abs(element.width) : undefined);
  const x = Math.min(element.x, element.x + element.width);
  const y = Math.min(element.y, element.y + element.height);
  const width = Math.abs(element.width);
  const height = Math.abs(element.height);
  const typography = { lineHeight, lines: measured.lines, baselineOffset: measured.baselineOffset };
  if (element.type === 'text') return { x, y, width: element.textBox ? width : Math.max(width, measured.width), height: element.textBox ? Math.max(height, measured.height) : measured.height, ...typography };
  const contentWidth = labelWidth(element);
  if (element.type === 'rectangle') {
    const padding = Math.min(TEXT_PADDING.y, Math.max(0, (height - measured.height) / 2));
    const visibleHeight = Math.min(measured.height, Math.max(0, height - padding * 2));
    const align = element.textVerticalAlign ?? 'middle';
    const top = align === 'top' ? y + padding : align === 'bottom' ? y + height - visibleHeight - padding : y + (height - visibleHeight) / 2;
    return { x: x + (width - contentWidth) / 2, y: top, width: contentWidth, height: visibleHeight, ...typography };
  }
  const insetY = (height - height / textInset(element)) / 2 + TEXT_PADDING.y;
  const align = element.textVerticalAlign ?? 'middle';
  const top = align === 'top' ? y + insetY : align === 'bottom' ? y + height - measured.height - insetY : y + (height - measured.height) / 2;
  return { x: x + (width - contentWidth) / 2, y: top, width: contentWidth, height: measured.height, ...typography };
}
