import type { ScribbleElement } from '@/types';

export interface ScribbleHistory {
  snapshots: ScribbleElement[][];
  index: number;
}
export const HISTORY_LIMIT = 100;
export const createHistory = (elements: ScribbleElement[]): ScribbleHistory => ({ snapshots: [elements], index: 0 });
export function commitHistory(history: ScribbleHistory, elements: ScribbleElement[]): ScribbleHistory {
  if (JSON.stringify(history.snapshots[history.index]) === JSON.stringify(elements)) return history;
  const snapshots = [...history.snapshots.slice(0, history.index + 1), elements].slice(-HISTORY_LIMIT);
  return { snapshots, index: snapshots.length - 1 };
}
