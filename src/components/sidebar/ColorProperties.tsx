import { useId } from 'react';
import { STROKE_COLORS, BG_COLORS } from '@/constants/styleOptions';
interface ScribbleColorPropertiesProps {
  label: string; value: string | null; background?: boolean; onChange: (value: string) => void;
}
export function ColorProperties({ label, value, background, onChange }: ScribbleColorPropertiesProps) {
  const id = useId();
  return <fieldset>
    <legend className="mb-2 text-xs font-semibold text-slate-600">{label}{value === null && ' · Mixed'}</legend>
    <div className="flex gap-2">
      {(background ? BG_COLORS : STROKE_COLORS).map((color) => <button key={color} type="button" aria-label={`${label}: ${color === 'transparent' ? 'transparent' : color}`}
        aria-pressed={value === color} onClick={() => onChange(color)} className={`h-8 w-8 rounded-lg border border-slate-300 ${value === color ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
        style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}>{color === 'transparent' && <span aria-hidden="true" className="text-red-500">╱</span>}</button>)}
      <label htmlFor={id} className="sr-only">Custom {label.toLowerCase()}</label>
      <input id={id} type="color" value={value && value !== 'transparent' ? value : '#ffffff'} onChange={(event) => onChange(event.target.value)} className="h-8 w-8 cursor-pointer rounded-lg" />
    </div>
  </fieldset>;
}
