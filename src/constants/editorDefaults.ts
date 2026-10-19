import type { AppState, Viewport } from '@/types';

export const DEFAULT_VIEWPORT: Viewport = { panX: 0, panY: 0, zoom: 1 };
export const DEFAULT_APP_STATE: AppState = {
    activeTool: 'select',
    selectedElementIds: [],
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'none',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    fontFamily: 'hand',
    fontSize: 'M',
    textAlign: 'left',
    textVerticalAlign: 'middle',
    isLocked: false,
    gridSize: null,
  };
