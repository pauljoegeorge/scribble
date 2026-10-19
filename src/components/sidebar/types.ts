import type { AppState, ScribbleElement } from '@/types';
export interface PropertiesSidebarProps {
  appState: AppState; selectedElements: ScribbleElement[];
  onPreviewStyle: (updates: Partial<ScribbleElement>) => void;
  onUpdateElementStyle: (updates: Partial<ScribbleElement>) => void;
}
