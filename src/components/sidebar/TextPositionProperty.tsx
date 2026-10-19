import type { TextAlign, TextVerticalAlign } from '@/types';

interface ScribbleTextPositionProps {
  horizontal: TextAlign | null;
  vertical: TextVerticalAlign | null;
  onChange: (position: { textAlign: TextAlign; textVerticalAlign: TextVerticalAlign }) => void;
}

const horizontalPositions = ['left', 'center', 'right'] as const;
const verticalPositions = ['top', 'middle', 'bottom'] as const;

export function TextPositionProperty({ horizontal, vertical, onChange }: ScribbleTextPositionProps) {
  const mixed = horizontal === null || vertical === null;
  return <fieldset className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
    <legend className="px-1 text-xs font-semibold text-slate-600">Text position inside shape</legend>
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
      {verticalPositions.flatMap((textVerticalAlign) => horizontalPositions.map((textAlign) => {
        const label = `${textVerticalAlign} ${textAlign}`;
        const active = horizontal === textAlign && vertical === textVerticalAlign;
        return <button type="button" key={label} aria-label={`Text position: ${label}`} title={label}
          aria-pressed={active} onClick={() => onChange({ textAlign, textVerticalAlign })}
          className={`flex h-10 rounded-md p-2 transition-colors ${active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white/70'}`}
          style={{ justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
            alignItems: textVerticalAlign === 'top' ? 'flex-start' : textVerticalAlign === 'bottom' ? 'flex-end' : 'center' }}>
          <span aria-hidden="true" className="flex w-5 flex-col gap-0.5"><span className="h-0.5 w-full bg-current" /><span className="h-0.5 w-full bg-current" /></span>
        </button>;
      }))}
    </div>
    <p className="mt-2 text-xs text-slate-500">{mixed ? 'Mixed positions. Choose one to align the selected labels.' : 'Choose where the label sits within its shape.'}</p>
  </fieldset>;
}
