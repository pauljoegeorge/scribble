'use client';

import { useState, useRef, useCallback, type SetStateAction } from 'react';
import type { ScribbleElement } from '@/types';
import { fitElementText } from '@/utils/canvas/text';
import { reconcileBindings } from '@/utils/canvas/bindings';
import { createHistory, commitHistory } from '@/utils/editor/history';

export function useCanvasHistory(initialElements: ScribbleElement[]) {
  const [elements, publishElements] = useState(initialElements);
  const [history, publishHistory] = useState(() => createHistory(initialElements));
  const currentElements = useRef(initialElements);
  const currentHistory = useRef(createHistory(initialElements));

  // Resolve drafts once, outside React updater callbacks, for atomic gesture commits.
  const setElements = useCallback((update: SetStateAction<ScribbleElement[]>) => {
    const next = reconcileBindings(typeof update === 'function' ? update(currentElements.current) : update);
    currentElements.current = next;
    publishElements(next);
  }, []);
  const resetHistory = useCallback((next: ScribbleElement[]) => {
    currentHistory.current = createHistory(next);
    currentElements.current = next;
    publishHistory(currentHistory.current);
    publishElements(next);
  }, []);
  const saveHistoryState = useCallback((next: ScribbleElement[]) => {
    currentHistory.current = commitHistory(currentHistory.current, next);
    publishHistory(currentHistory.current);
  }, []);
  const commitElements = useCallback((update: SetStateAction<ScribbleElement[]>) => {
    const next = reconcileBindings(typeof update === 'function' ? update(currentElements.current) : update);
    setElements(next);
    saveHistoryState(next);
  }, [setElements, saveHistoryState]);
  const getElements = useCallback(() => currentElements.current, []);
  const moveHistory = useCallback((delta: number) => {
    const previous = currentHistory.current;
    const index = Math.max(0, Math.min(previous.snapshots.length - 1, previous.index + delta));
    currentHistory.current = { ...previous, index };
    publishHistory(currentHistory.current);
    setElements(previous.snapshots[index]);
  }, [setElements]);
  const refreshTextMetrics = useCallback(() => {
    currentHistory.current = { ...currentHistory.current, snapshots: currentHistory.current.snapshots.map((snapshot) => snapshot.map(fitElementText)) };
    publishHistory(currentHistory.current);
    setElements(currentElements.current.map(fitElementText));
  }, [setElements]);
  const handleUndo = useCallback(() => moveHistory(-1), [moveHistory]);
  const handleRedo = useCallback(() => moveHistory(1), [moveHistory]);
  return { refreshTextMetrics, elements, committedElements: history.snapshots[history.index], setElements, getElements, commitElements, resetHistory, saveHistoryState,
    canUndo: history.index > 0, canRedo: history.index < history.snapshots.length - 1, handleUndo, handleRedo };
}
