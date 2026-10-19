import type React from 'react';
import type { AppState, ScribbleElement, Viewport } from './index';

export interface ScribbleCanvasProps {
  elements: ScribbleElement[];
  setElements: React.Dispatch<React.SetStateAction<ScribbleElement[]>>;
  viewport: Viewport;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  commitElements: React.Dispatch<React.SetStateAction<ScribbleElement[]>>;
  getElements: () => ScribbleElement[];
}


export type ScribbleCanvasAction = 'none' | 'drawing' | 'moving' | 'resizing' | 'panning';
