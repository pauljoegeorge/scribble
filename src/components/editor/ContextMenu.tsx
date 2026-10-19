import { useDismissableLayer } from '@/hooks/useDismissableLayer';
interface ScribbleContextMenuProps {
  x: number; y: number; hasSelection: boolean; onClose: () => void;
  onCopy: () => void; onPaste: () => void; onDuplicate: () => void; onDelete: () => void;
}
export function ContextMenu(props: ScribbleContextMenuProps) {
  const ref = useDismissableLayer(props.onClose);
  const action = (callback: () => void) => { callback(); props.onClose(); };
  return <div ref={ref} role="dialog" aria-label="Object actions" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); props.onClose(); } }}
    className="fixed z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl" style={{ left: Math.max(8, Math.min(props.x, window.innerWidth - 200)), top: Math.max(8, Math.min(props.y, window.innerHeight - 285)) }}>
    <button disabled={!props.hasSelection} className="menu-action" onClick={() => action(props.onCopy)}>Copy</button>
    <button className="menu-action" onClick={() => action(props.onPaste)}>Paste</button>
    <button disabled={!props.hasSelection} className="menu-action" onClick={() => action(props.onDuplicate)}>Duplicate</button>
    <button disabled={!props.hasSelection} className="menu-action text-red-700" onClick={() => action(props.onDelete)}>Delete</button>
  </div>;
}
