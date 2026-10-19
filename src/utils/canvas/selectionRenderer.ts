import type { ScribbleElement } from '@/types';
import { getElementAbsoluteBounds, getElementCenter, getHandlePositions } from './math';

export function renderSelectionBoundingBox(ctx: CanvasRenderingContext2D, element: ScribbleElement, zoom: number) {
  ctx.save();
  ctx.strokeStyle = '#6965db';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 1.5 / zoom;
  const bounds = getElementAbsoluteBounds(element), center = getElementCenter(element);
  ctx.translate(center.x, center.y); ctx.rotate(element.angle ?? 0); ctx.translate(-center.x, -center.y);
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.strokeRect(bounds.minX - 6 / zoom, bounds.minY - 6 / zoom, bounds.width + 12 / zoom, bounds.height + 12 / zoom);
  ctx.restore();
  ctx.save(); ctx.strokeStyle = '#6965db'; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.5 / zoom;
  for (const [name, point] of Object.entries(getHandlePositions(element, zoom))) {
    if (name === 'rotation') {
      const top = getHandlePositions(element, zoom).n;
      if (top) { ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(point.x, point.y); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(point.x, point.y, 5 / zoom, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else { ctx.fillRect(point.x - 4 / zoom, point.y - 4 / zoom, 8 / zoom, 8 / zoom); ctx.strokeRect(point.x - 4 / zoom, point.y - 4 / zoom, 8 / zoom, 8 / zoom); }
  }
  ctx.restore();
}
