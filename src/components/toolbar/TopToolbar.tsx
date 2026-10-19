import { useRef, useEffect } from 'react';
import { Lock, Unlock, Hand, MousePointer, Square, Diamond, Circle, MoveRight, Minus, Pencil, Type, Database, Eraser, Menu } from 'lucide-react';
import type { ToolType } from '@/types';
interface ScribbleToolbarProps {
  activeTool: ToolType; setActiveTool: (tool: ToolType) => void; isLocked: boolean; setIsLocked: (locked: boolean) => void;
  onMenu: () => void; menuOpen: boolean;
}
const tools = [
  { id: 'hand', label: 'Pan', icon: Hand, key: 'H' }, { id: 'select', label: 'Select', icon: MousePointer, key: 'V' },
  { id: 'rectangle', label: 'Rectangle', icon: Square, key: 'R' }, { id: 'diamond', label: 'Diamond', icon: Diamond, key: 'D' },
  { id: 'ellipse', label: 'Ellipse', icon: Circle, key: 'O' }, { id: 'arrow', label: 'Arrow', icon: MoveRight, key: 'A' },
  { id: 'line', label: 'Line', icon: Minus, key: 'L' }, { id: 'pencil', label: 'Pencil', icon: Pencil, key: 'P' },
  { id: 'text', label: 'Text', icon: Type, key: 'T' }, { id: 'cylinder', label: 'Cylinder', icon: Database, key: 'C' },
  { id: 'eraser', label: 'Eraser', icon: Eraser, key: 'E' },
] as const;
export function TopToolbar({ activeTool, setActiveTool, isLocked, setIsLocked, onMenu, menuOpen }: ScribbleToolbarProps) {
  const toolbar = useRef<HTMLElement>(null);
  useEffect(() => { toolbar.current?.querySelector(`[data-tool="${activeTool}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [activeTool]);
  return <header className="absolute top-3 left-3 right-3 z-30 flex items-center gap-2">
    <button onClick={onMenu} aria-label="Drawing menu" aria-expanded={menuOpen} className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><Menu size={18} /></button>
    <nav ref={toolbar} aria-label="Drawing tools" className="min-w-0 mx-auto flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button onClick={() => setIsLocked(!isLocked)} aria-label="Keep drawing tool active" aria-pressed={isLocked} title="Keep drawing tool active" className={`shrink-0 rounded-lg p-3 ${isLocked ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}>{isLocked ? <Lock size={16} /> : <Unlock size={16} />}</button>
      {tools.map(({ id, label, icon: Icon, key }) => <button key={id} data-tool={id} onClick={() => setActiveTool(id)} aria-label={label} aria-pressed={activeTool === id} title={`${label} (${key})${id === 'text' ? ' — click to type or drag a text box' : ''}`}
        className={`relative shrink-0 rounded-lg p-3 ${activeTool === id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={17} /><span aria-hidden="true" className="absolute bottom-0.5 right-1 text-[9px]">{key}</span></button>)}
    </nav>
  </header>;
}
