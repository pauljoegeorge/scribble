import { useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { AppState, ScribbleElement } from '@/types';
import { parseElements } from '@/utils/storage/validation';
interface ScribbleClipboardOptions {
  appState: AppState; setAppState: Dispatch<SetStateAction<AppState>>;
  getElements: () => ScribbleElement[]; commitElements: Dispatch<SetStateAction<ScribbleElement[]>>;
  report: (message: string) => void;
}
export function useEditorClipboard({ appState, setAppState, getElements, commitElements, report }: ScribbleClipboardOptions) {
  const clipboard = useRef<ScribbleElement[]>([]);
  const copy = useCallback(() => {
    const selected = getElements().filter((element) => !element.isDeleted && appState.selectedElementIds.includes(element.id));
    clipboard.current = selected;
    if (selected.length) navigator.clipboard?.writeText(JSON.stringify({ type: 'scribble', elements: selected })).catch(() => report('Copied within Scribble. System clipboard is unavailable.'));
  }, [getElements, appState.selectedElementIds, report]);
  const paste = useCallback(async () => {
    let elements = clipboard.current;
    try {
      const text = await navigator.clipboard.readText();
      const value: unknown = JSON.parse(text);
      if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'scribble' && 'elements' in value) elements = parseElements(value.elements);
    } catch { /* Internal clipboard still works when browser permissions prevent reads. */ }
    if (!elements.length) { report('Copy Scribble objects before pasting.'); return; }
    const ids = new Map(elements.map((element) => [element.id, `scribble_${crypto.randomUUID()}`]));
    const pasted = elements.map((element) => ({ ...element, id: ids.get(element.id)!, x: element.x + 20, y: element.y + 20,
      startBinding: element.startBinding ? ids.get(element.startBinding) : undefined, endBinding: element.endBinding ? ids.get(element.endBinding) : undefined }));
    commitElements((current) => [...current, ...pasted]);
    setAppState((state) => ({ ...state, activeTool: 'select', selectedElementIds: pasted.map((element) => element.id) }));
  }, [commitElements, setAppState, report]);
  return { copy, paste };
}
