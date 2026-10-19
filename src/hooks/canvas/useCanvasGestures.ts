import { useRef, useState, useEffect, useEffectEvent, type PointerEvent } from 'react';
import type { Point, ResizeHandle, ScribbleElement, Viewport } from '@/types';
import type { ScribbleCanvasProps } from '@/types/canvas';
import { getResizeHandleAtPosition, getRotatedBounds } from '@/utils/canvas/math';
import { selectionElement, transformGroup } from '@/utils/canvas/groupTransform';
import { bindConnector } from '@/utils/canvas/bindings';
import { resizeElement, zoomAt } from '@/utils/canvas/transform';
import { canBindText } from '@/utils/canvas/text';
import { createElement, hitElement, hasVisibleGeometry, finishTextBox, updateDrawing } from '@/utils/canvas/elements';
import type { useCanvasTextEditing } from './useCanvasTextEditing';

interface ScribbleGesture {
  pointerId: number;
  mode: 'draw' | 'move' | 'resize' | 'pan' | 'erase' | 'marquee';
  start: Point; last: Point; screen: Point; before: ScribbleElement[];
  ids: string[]; handle?: ResizeHandle; id?: string; additive?: boolean;
}
interface ScribbleGestureOptions extends ScribbleCanvasProps {
  screenToWorld: (x: number, y: number) => Point;
  spacePressed: boolean;
  textEditing: ReturnType<typeof useCanvasTextEditing>;
}
export function useCanvasGestures(options: ScribbleGestureOptions) {
  const { appState, setAppState, viewport, setViewport, setElements, getElements, commitElements, screenToWorld, textEditing, spacePressed } = options;
  const gesture = useRef<ScribbleGesture | null>(null);
  const touches = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; center: Point; viewport: Viewport } | null>(null);
  const [mode, setMode] = useState<ScribbleGesture['mode'] | null>(null);
  const [marquee, setMarquee] = useState<{ start: Point; end: Point } | null>(null);
  const select = (ids: string[]) => setAppState((state) => ({ ...state, selectedElementIds: ids }));
  const erase = (point: Point) => {
    const hit = hitElement(getElements(), point, viewport.zoom);
    if (hit) setElements((elements) => elements.map((element) => element.id === hit.id ? { ...element, isDeleted: true } : element));
  };
  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    if (textEditing.isEditing()) { textEditing.commitTextEdit(); return; }
    if (event.pointerType === 'touch') {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.current.size === 2) {
        endGesture(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        const [first, second] = [...touches.current.values()];
        pinch.current = { distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
          center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }, viewport };
        setMode('pan'); return;
      }
    }
    if (gesture.current || pinch.current) return;
    event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
    const start = screenToWorld(event.clientX, event.clientY), before = getElements();
    const base = { pointerId: event.pointerId, start, last: start, screen: { x: event.clientX, y: event.clientY }, before, ids: appState.selectedElementIds };
    if (event.button === 1 || spacePressed || appState.activeTool === 'hand') gesture.current = { ...base, mode: 'pan' };
    else if (appState.activeTool === 'eraser') { gesture.current = { ...base, mode: 'erase' }; erase(start); }
    else if (appState.activeTool === 'select') {
      const selected = before.filter((element) => !element.isDeleted && base.ids.includes(element.id));
      const group = selectionElement(selected);
      const handle = group ? getResizeHandleAtPosition(start, group, viewport.zoom) : null;
      if (handle && handle !== 'inside') gesture.current = { ...base, mode: 'resize', handle, id: selected.length === 1 ? selected[0].id : undefined };
      else {
        const hit = hitElement(before, start, viewport.zoom);
        if (hit) {
          const ids = event.shiftKey ? base.ids.includes(hit.id) ? base.ids.filter((id) => id !== hit.id) : [...base.ids, hit.id] : base.ids.includes(hit.id) ? base.ids : [hit.id];
          select(ids); gesture.current = { ...base, mode: 'move', ids };
        } else {
          gesture.current = { ...base, mode: 'marquee', additive: event.shiftKey };
          if (!event.shiftKey) select([]);
        }
      }
    } else if (appState.activeTool === 'text') {
      const hit = hitElement(before, start, viewport.zoom);
      if (hit && (hit.type === 'text' || canBindText(hit))) { select([hit.id]); textEditing.openTextEditor(hit); }
      else {
        const element = createElement('text', start, appState);
        setElements([...before, element]); select([element.id]);
        gesture.current = { ...base, mode: 'draw', id: element.id };
      }
    } else {
      const element = createElement(appState.activeTool, start, appState);
      setElements([...before, element]); select([]);
      gesture.current = { ...base, mode: 'draw', id: element.id };
    }
    setMode(gesture.current?.mode ?? null);
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'touch' && touches.current.has(event.pointerId)) touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && touches.current.size >= 2) {
      const [first, second] = [...touches.current.values()], initial = pinch.current;
      const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      const scaled = zoomAt(initial.viewport, initial.viewport.zoom * distance / initial.distance, initial.center);
      setViewport({ ...scaled, panX: scaled.panX + center.x - initial.center.x, panY: scaled.panY + center.y - initial.center.y });
      return;
    }
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const point = screenToWorld(event.clientX, event.clientY);
    if (active.mode === 'pan') {
      const dx = event.clientX - active.screen.x, dy = event.clientY - active.screen.y;
      setViewport((state) => ({ ...state, panX: state.panX + dx, panY: state.panY + dy }));
      active.screen = { x: event.clientX, y: event.clientY };
    } else if (active.mode === 'erase') erase(point);
    if (active.mode === 'draw') {
      setElements((elements) => elements.map((element) => element.id === active.id ? updateDrawing(element, active.start, point) : element));
    } else if (active.mode === 'move') {
      setElements(active.before.map((element) => active.ids.includes(element.id) ? { ...element, x: element.x + point.x - active.start.x, y: element.y + point.y - active.start.y, startBinding: element.startBinding && active.ids.includes(element.startBinding) ? element.startBinding : undefined, endBinding: element.endBinding && active.ids.includes(element.endBinding) ? element.endBinding : undefined } : element));
    } else if (active.mode === 'resize' && active.handle) {
      setElements(active.id ? active.before.map((element) => element.id === active.id ? resizeElement({ ...element, startBinding: undefined, endBinding: undefined }, active.handle!, point, viewport.zoom) : element) : transformGroup(active.before, active.ids, active.handle, point, viewport.zoom));
    } else if (active.mode === 'marquee') {
      setMarquee({ start: active.start, end: point });
      const left = Math.min(active.start.x, point.x), right = Math.max(active.start.x, point.x), top = Math.min(active.start.y, point.y), bottom = Math.max(active.start.y, point.y);
      const ids = active.before.filter((element) => {
        const bounds = getRotatedBounds(element);
        return !element.isDeleted && bounds.minX >= left && bounds.maxX <= right && bounds.minY >= top && bounds.maxY <= bottom;
      }).map((element) => element.id);
      select(active.additive ? [...new Set([...active.ids, ...ids])] : ids);
    }
    active.last = point;
  };
  function endGesture(cancel: boolean) {
    const active = gesture.current;
    if (!active) return;
    gesture.current = null; setMode(null); setMarquee(null);
    if (cancel) { setElements(active.before); select(active.ids); return; }
    if (active.mode === 'draw' || active.mode === 'resize') {
      setElements((elements) => elements.map((element) => element.id === active.id ? bindConnector(element, elements, viewport.zoom) : element));
    }
    if (active.mode === 'draw') {
      const text = getElements().find((element) => element.id === active.id && element.type === 'text');
      if (text) {
        const element = finishTextBox(text, active.start, active.last, viewport.zoom);
        setElements((elements) => elements.map((value) => value.id === element.id ? element : value));
        select([element.id]); textEditing.openTextEditor(element, true); return;
      }
      setElements((elements) => elements.filter((element) => element.id !== active.id || hasVisibleGeometry(element)));
      if (!appState.isLocked) setAppState((state) => ({ ...state, activeTool: 'select', selectedElementIds: getElements().some((element) => element.id === active.id) ? [active.id!] : [] }));
    }
    if (['draw', 'move', 'resize', 'erase'].includes(active.mode)) commitElements(getElements());
  };
  const cancelGesture = useEffectEvent(() => { touches.current.clear(); pinch.current = null; endGesture(true); setMode(null); });
  useEffect(() => {
    const blur = () => cancelGesture();
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') cancelGesture(); };
    window.addEventListener('blur', blur); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('blur', blur); window.removeEventListener('keydown', key); };
  }, []);
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!pinch.current && gesture.current?.pointerId === event.pointerId && ['draw', 'resize'].includes(gesture.current.mode)) onPointerMove(event);
    touches.current.delete(event.pointerId);
    if (pinch.current) { pinch.current = null; setMode(null); }
    else if (gesture.current?.pointerId === event.pointerId) endGesture(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = hitElement(getElements(), screenToWorld(event.clientX, event.clientY), viewport.zoom);
    if (hit && (hit.type === 'text' || canBindText(hit))) { select([hit.id]); textEditing.openTextEditor(hit); }
  };
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: () => { touches.current.clear(); pinch.current = null; endGesture(true); setMode(null); }, onDoubleClick, mode, marquee };
}
