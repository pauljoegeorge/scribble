import { useId, type ReactNode } from 'react';
interface ScribbleChoice<T extends string | number> { value: T; label: string; icon?: ReactNode }
interface ScribblePropertyChoices<T extends string | number> {
  label: string; value: T | null; options: ScribbleChoice<T>[]; onChange: (value: T) => void;
}
export function PropertyChoices<T extends string | number>({ label, value, options, onChange }: ScribblePropertyChoices<T>) {
  const id = useId();
  return <fieldset className="min-w-0">
    <legend id={id} className="mb-2 text-xs font-semibold text-slate-600">{label}{value === null && <span className="ml-2 text-slate-400">Mixed</span>}</legend>
    <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((option) => <button type="button" key={option.value} aria-label={`${label}: ${option.label}`} aria-pressed={value === option.value}
        onClick={() => onChange(option.value)} className={`min-h-8 flex-1 rounded-md px-2 text-xs capitalize transition-colors ${value === option.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}>
        {option.icon ?? option.label}
      </button>)}
    </div>
  </fieldset>;
}
