import { parseElements, parseViewport, parseAppState } from './validation';
export function parseDrawing(raw: string) {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== 'object' || !value || !('type' in value) || value.type !== 'scribble' || !('elements' in value)) throw new Error('Choose a Scribble drawing file.');
  if ('version' in value && value.version !== 1 && value.version !== 2) throw new Error('This drawing version is not supported.');
  return { elements: parseElements(value.elements),
    viewport: 'viewport' in value && value.viewport ? parseViewport(value.viewport) : null,
    appState: 'appState' in value && value.appState ? parseAppState(value.appState) : null };
}
