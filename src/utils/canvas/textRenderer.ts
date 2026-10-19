import type { ScribbleElement } from '@/types';
import { getFontString, getTextLayout } from './text';
export function renderElementText(ctx: CanvasRenderingContext2D, element: ScribbleElement) {
  const text = element.type === 'text' ? element.text : element.boundText;
  if (!text) return;
  const layout = getTextLayout(element, text);
  ctx.save();
  if (element.type === 'rectangle') {
    ctx.beginPath(); ctx.rect(layout.x, layout.y, layout.width, layout.height); ctx.clip();
  }
  ctx.fillStyle = element.strokeColor; ctx.font = getFontString(element.fontSize, element.fontFamily);
  ctx.textAlign = element.textAlign; ctx.textBaseline = 'alphabetic';
  const x = element.textAlign === 'center' ? layout.x + layout.width / 2 : element.textAlign === 'right' ? layout.x + layout.width : layout.x;
  layout.lines.forEach((line, index) => ctx.fillText(line, x, layout.y + layout.baselineOffset + index * layout.lineHeight));
  ctx.restore();
}
