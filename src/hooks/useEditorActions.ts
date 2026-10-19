import type { Dispatch, SetStateAction } from 'react';
import type { AppState, ScribbleElement } from '@/types';
import { fitElementText } from '@/utils/canvas/text';

interface ScribbleActionOptions {
  appState: AppState; setAppState: Dispatch<SetStateAction<AppState>>;
  setElements: Dispatch<SetStateAction<ScribbleElement[]>>;
  commitElements: Dispatch<SetStateAction<ScribbleElement[]>>;
}
export function useEditorActions({ appState, setAppState, commitElements, setElements }: ScribbleActionOptions) {
  const ids = appState.selectedElementIds;
  const select = (selectedElementIds: string[]) => setAppState((state) => ({ ...state, selectedElementIds }));
  const handlePreviewStyle = (updates: Partial<ScribbleElement>) => {
    setAppState((state) => ({ ...state, ...updates }));
    if (ids.length) setElements((elements) => elements.map((element) => ids.includes(element.id) ? fitElementText({ ...element, ...updates }) : element));
  };
  const handleUpdateElementStyle = (updates: Partial<ScribbleElement>) => {
    setAppState((state) => ({ ...state, ...updates }));
    if (ids.length) commitElements((elements) => elements.map((element) => ids.includes(element.id) ? fitElementText({ ...element, ...updates }) : element));
  };
  const handleDuplicateElements = () => {
    const newIds: string[] = [];
    commitElements((elements) => {
      const mapping = new Map(elements.filter((element) => !element.isDeleted && ids.includes(element.id)).map((element) => [element.id, `scribble_${crypto.randomUUID()}`]));
      const duplicates = elements.filter((element) => !element.isDeleted && ids.includes(element.id)).map((element) => {
        const id = mapping.get(element.id)!; newIds.push(id);
        return { ...element, id, x: element.x + 20, y: element.y + 20, startBinding: element.startBinding ? mapping.get(element.startBinding) : undefined, endBinding: element.endBinding ? mapping.get(element.endBinding) : undefined };
      });
      return [...elements, ...duplicates];
    });
    select(newIds);
  };
  const handleDeleteElements = () => {
    commitElements((elements) => elements.map((element) => ids.includes(element.id) ? { ...element, isDeleted: true } : element));
    select([]);
  };
  const handleClearCanvas = () => {
    if (!window.confirm('Clear this drawing? You can undo this action.')) return;
    commitElements([]); select([]);
  };
  return { handlePreviewStyle, handleUpdateElementStyle, handleDuplicateElements, handleDeleteElements, handleClearCanvas };
}
