'use client';

import { useRef, useCallback } from 'react';
import type { ScribbleCanvasProps } from '@/types/canvas';
import { useCanvasTextEditing } from '@/hooks/canvas/useCanvasTextEditing';
import { useCanvasRendering } from '@/hooks/canvas/useCanvasRendering';
import { useCanvasGestures } from '@/hooks/canvas/useCanvasGestures';
import { useCanvasNavigation } from '@/hooks/canvas/useCanvasNavigation';
import { TextEditOverlay } from './TextEditOverlay';

export function ScribbleCanvas(props: ScribbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spacePressed = useCanvasNavigation(canvasRef, props.setViewport);
  const screenToWorld = useCallback((x: number, y: number) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    return { x: (x - (bounds?.left ?? 0) - props.viewport.panX) / props.viewport.zoom,
      y: (y - (bounds?.top ?? 0) - props.viewport.panY) / props.viewport.zoom };
  }, [props.viewport]);
  const textEditing = useCanvasTextEditing(props);
  const gestures = useCanvasGestures({ ...props, spacePressed, screenToWorld, textEditing });
  useCanvasRendering({ ...props, canvasRef, editingElement: textEditing.editingElement });
  const marquee = gestures.marquee;
  return <div className="absolute inset-0 overflow-hidden bg-[#fafafa]">
    <canvas ref={canvasRef} tabIndex={0} aria-label="Scribble drawing canvas. Use the drawing tools. Double-click text or a shape to edit its label."
      onPointerDown={gestures.onPointerDown} onPointerMove={gestures.onPointerMove}
      onPointerUp={gestures.onPointerUp} onPointerCancel={gestures.onPointerCancel}
      onLostPointerCapture={gestures.onPointerCancel} onDoubleClick={gestures.onDoubleClick}
      className={`w-full h-full block touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
        props.appState.activeTool === 'hand' || spacePressed || gestures.mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : props.appState.activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`} />
    {marquee && <div className="absolute pointer-events-none border border-indigo-500 bg-indigo-200/20" style={{
      left: Math.min(marquee.start.x, marquee.end.x) * props.viewport.zoom + props.viewport.panX,
      top: Math.min(marquee.start.y, marquee.end.y) * props.viewport.zoom + props.viewport.panY,
      width: Math.abs(marquee.end.x - marquee.start.x) * props.viewport.zoom,
      height: Math.abs(marquee.end.y - marquee.start.y) * props.viewport.zoom }} />}
    {textEditing.editingElement && <TextEditOverlay element={textEditing.editingElement} value={textEditing.textInputVal}
      viewport={props.viewport} onChange={textEditing.handleTextValChange} onCommit={textEditing.commitTextEdit} onCancel={textEditing.cancelTextEdit} />}
  </div>;
}
