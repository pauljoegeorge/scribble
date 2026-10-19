import { getShapeDrawables } from './shapeDrawables';
import { renderSelectionBoundingBox } from './selectionRenderer';
import { RoughCanvas } from 'roughjs/bin/canvas';
import { ScribbleElement } from '@/types';
import { getElementCenter } from './math';
import { renderElementText } from './textRenderer';

export const renderElementToCanvas = (
  rc: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  element: ScribbleElement,
  isSelected: boolean,
  zoom: number,
  isEditingText: boolean = false
) => {
  if (element.isDeleted) return;

  ctx.save();
  const center = getElementCenter(element);
  ctx.translate(center.x, center.y);
  ctx.rotate(element.angle ?? 0);
  ctx.translate(-center.x, -center.y);
  ctx.globalAlpha = element.opacity / 100;

  for (const drawable of getShapeDrawables(element)) rc.draw(drawable);
  if (!isEditingText) renderElementText(ctx, element);

  ctx.restore();

  if (isSelected) {
    renderSelectionBoundingBox(ctx, element, zoom);
  }
};

