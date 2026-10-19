import type { ReactNode } from 'react';
interface ScribbleEditorPanelProps { children: ReactNode }
export function EditorPanel({ children }: ScribbleEditorPanelProps) {
  return <aside aria-label="Properties" className="absolute top-20 left-3 z-20 w-72 max-w-[calc(100vw-1.5rem)] max-h-[min(65dvh,calc(100dvh-10rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg p-4 sm:max-h-[calc(100dvh-10rem)]">
    <h2 className="mb-4 sticky -top-4 bg-white py-2 z-10 text-sm font-semibold text-slate-700">Properties</h2>
    {children}
  </aside>;
}
