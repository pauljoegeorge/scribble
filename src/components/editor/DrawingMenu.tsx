import { useDismissableLayer } from '@/hooks/useDismissableLayer';
interface ScribbleDrawingMenuProps {
  onJSON: () => void; onPNG: () => void; onImport: (file: File) => void; onClear: () => void; onFit: () => void; onClose: () => void;
}
export function DrawingMenu({ onJSON, onPNG, onImport, onClear, onFit, onClose }: ScribbleDrawingMenuProps) {
  const ref = useDismissableLayer(onClose);
  const action = (callback: () => void) => { callback(); onClose(); };
  return <div ref={ref} role="dialog" aria-label="Drawing menu" className="absolute top-20 left-3 z-40 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
    <div className="flex items-center justify-between px-2 py-1"><strong className="text-sm">Scribble</strong><button onClick={onClose} aria-label="Close drawing menu" className="rounded-lg p-2">✕</button></div>
    <button className="menu-action" onClick={() => action(onJSON)}>Export drawing file</button>
    <button className="menu-action" onClick={() => action(onPNG)}>Export PNG image</button>
    <label className="menu-action cursor-pointer">Open drawing file
      <input type="file" accept=".scribble,.json,application/json" className="block w-full mt-2 text-xs" aria-label="Open Scribble drawing" onChange={(event) => {
        const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ''; onClose();
      }} />
    </label>
    <button className="menu-action" onClick={() => action(onFit)}>Fit drawing to screen · F</button>
    <button className="menu-action text-red-700" onClick={() => action(onClear)}>Clear drawing</button>
    <p className="px-3 py-2 text-xs text-slate-500">Shift-click to select multiple objects. Escape cancels text editing. Ctrl/Cmd+C/V copies and pastes.</p>
  </div>;
}
