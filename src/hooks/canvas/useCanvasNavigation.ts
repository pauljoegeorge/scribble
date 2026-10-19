import { useState, useEffect, type RefObject } from 'react';
import type { ScribbleCanvasProps } from '@/types/canvas';
import { zoomAt } from '@/utils/canvas/transform';
export function useCanvasNavigation(canvasRef: RefObject<HTMLCanvasElement | null>, setViewport: ScribbleCanvasProps['setViewport']) {
  const [spacePressed, setSpacePressed] = useState(false);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.target instanceof HTMLElement && event.target.closest('input,textarea,[contenteditable=true],button')) return;
      event.preventDefault(); setSpacePressed(true);
    };
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') setSpacePressed(false); };
    const blur = () => setSpacePressed(false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      setViewport((state) => event.ctrlKey || event.metaKey
        ? zoomAt(state, state.zoom * Math.exp(-event.deltaY * 0.005), { x: event.clientX - bounds.left, y: event.clientY - bounds.top })
        : { ...state, panX: state.panX - event.deltaX, panY: state.panY - event.deltaY });
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, [canvasRef, setViewport]);
  return spacePressed;
}
