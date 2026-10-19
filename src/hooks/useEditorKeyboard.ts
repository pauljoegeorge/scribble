import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AppState, ScribbleElement, ToolType } from '@/types';
interface ScribbleKeyboardOptions {
  getElements: () => ScribbleElement[]; appState: AppState; setAppState: Dispatch<SetStateAction<AppState>>;
  commitElements: Dispatch<SetStateAction<ScribbleElement[]>>;
  handleUndo: () => void; handleRedo: () => void; handleDeleteElements: () => void;
  handleDuplicateElements: () => void; copy: () => void; paste: () => Promise<void>;
  zoom: (factor: number) => void; fit: () => void;
}
const tools: Record<string, ToolType> = { v: 'select', '1': 'select', h: 'hand', r: 'rectangle', '2': 'rectangle', d: 'diamond', '3': 'diamond', o: 'ellipse', '4': 'ellipse', a: 'arrow', '5': 'arrow', l: 'line', '6': 'line', p: 'pencil', '7': 'pencil', t: 'text', '8': 'text', c: 'cylinder', '9': 'cylinder', e: 'eraser', '0': 'eraser' };
export function useEditorKeyboard(options: ScribbleKeyboardOptions) {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input,textarea,select,[contenteditable=true],[role=dialog]')) return;
      const key = event.key.toLowerCase(), command = event.ctrlKey || event.metaKey;
      if (command) {
        if (key === 'a') options.setAppState((state) => ({ ...state, selectedElementIds: options.getElements().filter((element) => !element.isDeleted).map((element) => element.id) }));
        else if (key === 'z') (event.shiftKey ? options.handleRedo : options.handleUndo)();
        else if (key === 'y') options.handleRedo();
        else if (key === 'c') options.copy();
        else if (key === 'v') void options.paste();
        else if (key === 'd') options.handleDuplicateElements();
        else if (key === '+' || key === '=') options.zoom(1.1);
        else if (key === '-') options.zoom(1 / 1.1);
        else return;
        event.preventDefault(); return;
      }
      if (key === 'delete' || key === 'backspace') { event.preventDefault(); options.handleDeleteElements(); }
      else if (key.startsWith('arrow') && options.appState.selectedElementIds.length) {
        event.preventDefault();
        const amount = event.shiftKey ? 10 : 1;
        options.commitElements((elements) => elements.map((element) => options.appState.selectedElementIds.includes(element.id)
          ? { ...element, x: element.x + (key === 'arrowleft' ? -amount : key === 'arrowright' ? amount : 0),
            y: element.y + (key === 'arrowup' ? -amount : key === 'arrowdown' ? amount : 0) } : element));
      } else if (key === 'escape') options.setAppState((state) => ({ ...state, selectedElementIds: [], activeTool: 'select' }));
      else if (key === 'f' && !event.altKey) options.fit();
      else if (tools[key] && !event.altKey) options.setAppState((state) => ({ ...state, activeTool: tools[key] }));
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [options]);
}
