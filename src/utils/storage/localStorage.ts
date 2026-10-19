import type { ScribbleElement, Viewport, AppState } from '@/types';
import { parseElements, parseViewport, parseAppState } from './validation';

const STORAGE_KEYS = { ELEMENTS: 'scribble_elements_v1', VIEWPORT: 'scribble_viewport_v1', APP_STATE: 'scribble_appstate_v1' };
export interface ScribbleStoredSession {
  elements: ScribbleElement[] | null;
  viewport: Viewport | null;
  appState: Partial<AppState> | null;
  errors: string[];
}
export function saveToLocalStorage(elements: ScribbleElement[], viewport: Viewport, appState: AppState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEYS.ELEMENTS, JSON.stringify(elements.filter((element) => !element.isDeleted)));
    window.localStorage.setItem(STORAGE_KEYS.VIEWPORT, JSON.stringify(viewport));
    window.localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(parseAppState(appState)));
    return true;
  } catch { return false; }
}
export function loadFromLocalStorage(): ScribbleStoredSession {
  const errors: string[] = [];
  function load<T>(key: string, parse: (value: unknown) => T): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? null : parse(JSON.parse(raw));
    } catch {
      errors.push(`Could not restore ${key === STORAGE_KEYS.ELEMENTS ? 'drawing' : 'preferences'}. Original data was preserved.`);
      return null;
    }
  }
  const elements = load(STORAGE_KEYS.ELEMENTS, parseElements);
  const viewport = load(STORAGE_KEYS.VIEWPORT, parseViewport);
  const appState = load(STORAGE_KEYS.APP_STATE, parseAppState);
  return { elements, viewport, appState, errors };
}
