import rough from 'roughjs';
import type { Options, Drawable } from 'roughjs/bin/core';
import type { ScribbleElement } from '@/types';

const cache = new WeakMap<ScribbleElement, Drawable[]>();
const generator = rough.generator();
export function getShapeDrawables(element: ScribbleElement): Drawable[] {
  const previous = cache.get(element);
  if (previous) return previous;
  const drawables: Drawable[] = [];
  const options: Options = {
    seed: element.seed,
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    roughness: element.roughness,
  };

  if (element.fillStyle !== 'none' && element.backgroundColor !== 'transparent') {
    options.fill = element.backgroundColor;
    options.fillStyle = element.fillStyle;
  }

  if (element.strokeStyle === 'dashed') {
    options.strokeLineDash = [8, 8];
  } else if (element.strokeStyle === 'dotted') {
    options.strokeLineDash = [3, 3];
  }

  const { x, y, width, height } = element;
  const absX = Math.min(x, x + width);
  const absY = Math.min(y, y + height);
  const absW = Math.abs(width);
  const absH = Math.abs(height);

  switch (element.type) {
    case 'rectangle': {
      drawables.push(generator.rectangle(absX, absY, absW, absH, options));
      break;
    }

    case 'diamond': {
      const top = [absX + absW / 2, absY];
      const right = [absX + absW, absY + absH / 2];
      const bottom = [absX + absW / 2, absY + absH];
      const left = [absX, absY + absH / 2];
      drawables.push(generator.polygon([top, right, bottom, left] as [number, number][], options));
      break;
    }

    case 'ellipse': {
      drawables.push(generator.ellipse(absX + absW / 2, absY + absH / 2, absW, absH, options));
      break;
    }

    case 'cylinder': {
      const hEll = absH * 0.22;
      const rx = absX + absW / 2;
      const ryTop = absY + hEll / 2;
      const ryBottom = absY + absH - hEll / 2;

      drawables.push(generator.ellipse(rx, ryTop, absW, hEll, options));
      drawables.push(generator.ellipse(rx, ryBottom, absW, hEll, options));

      drawables.push(generator.line(absX, ryTop, absX, ryBottom, options));
      drawables.push(generator.line(absX + absW, ryTop, absX + absW, ryBottom, options));
      break;
    }

    case 'line': {
      if (element.points && element.points.length >= 2) {
        const p1 = element.points[0];
        const p2 = element.points[1];
        drawables.push(generator.line(x + p1.x, y + p1.y, x + p2.x, y + p2.y, options));
      } else {
        drawables.push(generator.line(x, y, x + width, y + height, options));
      }
      break;
    }

    case 'arrow': {
      if (element.points && element.points.length >= 2) {
        const p1 = element.points[0];
        const p2 = element.points[1];
        const startX = x + p1.x;
        const startY = y + p1.y;
        const endX = x + p2.x;
        const endY = y + p2.y;

        const dist = Math.hypot(endX - startX, endY - startY);
        if (dist > 2) {
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowLength = Math.min(dist * 0.4, Math.max(12, 16 * (element.strokeWidth / 2)));
          const arrowAngle = Math.PI / 6;

          const shaftEndX = endX - arrowLength * Math.cos(angle);
          const shaftEndY = endY - arrowLength * Math.sin(angle);
          drawables.push(generator.line(startX, startY, shaftEndX, shaftEndY, options));

          const leftX = endX - arrowLength * Math.cos(angle - arrowAngle);
          const leftY = endY - arrowLength * Math.sin(angle - arrowAngle);
          const rightX = endX - arrowLength * Math.cos(angle + arrowAngle);
          const rightY = endY - arrowLength * Math.sin(angle + arrowAngle);

          drawables.push(generator.polygon([[endX, endY], [leftX, leftY], [rightX, rightY]], {
            ...options,
            fill: element.strokeColor,
            fillStyle: 'solid',
          }));
        }
      }
      break;
    }

    case 'pencil': {
      if (element.points && element.points.length > 0) {
        const pts: [number, number][] = element.points.map((p) => [x + p.x, y + p.y]);
        if (pts.length > 1) {
          drawables.push(generator.curve(pts, options));
        }
      }
      break;
    }

    case 'text': break;
  }
  cache.set(element, drawables);
  return drawables;
}
