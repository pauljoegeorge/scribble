import { Minus, Plus, Undo2, Redo2, Scan } from 'lucide-react';
import type { ScribbleSaveStatus } from '@/hooks/useEditorSession';
interface ScribbleCanvasControlsProps {
  zoom: number; onZoom: (factor: number) => void; onResetZoom: () => void; onFit: () => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void; status: ScribbleSaveStatus;
}
const statuses = { loading: 'Loading drawing…', pending: 'Saving…', saved: 'Saved on this device', error: 'Save failed · export a backup', recovery: 'Recovery mode · autosave paused' };
export function CanvasControls({ zoom, onZoom, onResetZoom, onFit, canUndo, canRedo, onUndo, onRedo, status }: ScribbleCanvasControlsProps) {
  return <footer className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
    <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm pointer-events-auto">
      <button aria-label="Zoom out" title="Zoom out (Ctrl/Cmd −)" onClick={() => onZoom(1 / 1.1)} className="p-2 rounded-lg hover:bg-slate-100"><Minus size={16} /></button>
      <button aria-label="Reset zoom to 100 percent" onClick={onResetZoom} className="min-w-12 p-2 text-xs font-semibold rounded-lg hover:bg-slate-100">{Math.round(zoom * 100)}%</button>
      <button aria-label="Zoom in" title="Zoom in (Ctrl/Cmd +)" onClick={() => onZoom(1.1)} className="p-2 rounded-lg hover:bg-slate-100"><Plus size={16} /></button>
      <button aria-label="Fit drawing to screen" title="Fit drawing (F)" onClick={onFit} className="p-2 rounded-lg hover:bg-slate-100"><Scan size={16} /></button>
      <span className="h-5 border-l border-slate-200" />
      <button aria-label="Undo" disabled={!canUndo} onClick={onUndo} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><Undo2 size={16} /></button>
      <button aria-label="Redo" disabled={!canRedo} onClick={onRedo} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><Redo2 size={16} /></button>
    </div>
    <p role="status" className={`bg-white rounded-lg px-2 py-1 text-[11px] ${status === 'error' || status === 'recovery' ? 'text-red-700' : 'text-slate-500'}`}>{statuses[status]}</p>
  </footer>;
}
