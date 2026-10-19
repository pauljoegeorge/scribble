import { useState } from 'react';
interface ScribbleOpacityProps { value: number | null; onChange: (opacity: number) => void; onPreview: (opacity: number) => void }
export function OpacityProperty({ value, onChange, onPreview }: ScribbleOpacityProps) {
  const [draft, setDraft] = useState<number | null>(null);
  const commit = (opacity: number) => { onChange(opacity); setDraft(null); };
  return <label className="text-xs font-semibold text-slate-600 flex flex-col gap-2">Opacity · {draft ?? (value === null ? 'Mixed' : `${value}%`)}
    <input aria-label="Opacity" type="range" min={0} max={100} value={draft ?? value ?? 100}
      onChange={(event) => { const opacity = Number(event.target.value); setDraft(opacity); onPreview(opacity); }}
      onPointerUp={(event) => commit(Number(event.currentTarget.value))}
      onKeyUp={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) commit(Number(event.currentTarget.value)); }}
      onBlur={(event) => { if (draft !== null) commit(Number(event.currentTarget.value)); }} className="w-full accent-indigo-600" />
  </label>;
}
