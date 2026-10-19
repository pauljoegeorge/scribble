import { useEffect, type RefObject } from 'react';
import rough from 'roughjs';
import type { ScribbleElement } from '@/types';
import type { ScribbleCanvasProps } from '@/types/canvas';
import { getRotatedBounds } from '@/utils/canvas/math';
import { selectionElement } from '@/utils/canvas/groupTransform';
import { renderSelectionBoundingBox } from '@/utils/canvas/selectionRenderer';
import { renderElementToCanvas } from '@/utils/canvas/roughRenderer';
interface ScribbleRenderingOptions extends Pick<ScribbleCanvasProps, 'elements' | 'viewport' | 'appState'> {
  canvasRef: RefObject<HTMLCanvasElement | null>; editingElement: ScribbleElement | null;
}
export function useCanvasRendering({ canvasRef, elements, viewport, appState, editingElement }: ScribbleRenderingOptions) {
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0, disposed = false;
    const rc = rough.canvas(canvas);
    const draw = () => {
      const bounds = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
      const width = Math.round(bounds.width * ratio), height = Math.round(bounds.height * ratio);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, bounds.width, bounds.height);
      ctx.translate(viewport.panX, viewport.panY); ctx.scale(viewport.zoom, viewport.zoom);
      const left = -viewport.panX / viewport.zoom, top = -viewport.panY / viewport.zoom;
      for (const element of elements) {
        if (element.isDeleted) continue;
        const box = getRotatedBounds(element), margin = 50 / viewport.zoom;
        if (box.maxX < left - margin || box.maxY < top - margin || box.minX > left + bounds.width / viewport.zoom + margin || box.minY > top + bounds.height / viewport.zoom + margin) continue;
        renderElementToCanvas(rc, ctx, element, appState.selectedElementIds.length === 1 && appState.selectedElementIds.includes(element.id), viewport.zoom, editingElement?.id === element.id);
      }
      const selected = elements.filter((element) => !element.isDeleted && appState.selectedElementIds.includes(element.id));
      const group = selectionElement(selected);
      if (group && selected.length > 1) renderSelectionBoundingBox(ctx, group, viewport.zoom);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); };
    schedule();
    const resize = new ResizeObserver(schedule); resize.observe(canvas);
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    document.fonts.addEventListener('loadingdone', schedule);
    return () => { disposed = true; cancelAnimationFrame(frame); resize.disconnect(); document.fonts.removeEventListener('loadingdone', schedule); };
  }, [canvasRef, elements, viewport, appState.selectedElementIds, editingElement]);
}
