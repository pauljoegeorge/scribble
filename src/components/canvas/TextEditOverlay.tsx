import type { ScribbleElement, Viewport } from '@/types';
import { getElementCenter } from '@/utils/canvas/math';
import { getFontString, getTextLayout, fitElementText } from '@/utils/canvas/text';

interface ScribbleTextEditProps {
  element: ScribbleElement; value: string; viewport: Viewport;
  onChange: (value: string) => void; onCommit: () => void; onCancel: () => void;
}
export function TextEditOverlay({ element, value, viewport, onChange, onCommit, onCancel }: ScribbleTextEditProps) {
  const preview = fitElementText({ ...element, ...(element.type === 'text' ? { text: value } : { boundText: value }) });
  const layout = getTextLayout(preview, value), center = getElementCenter(element);
  const wraps = element.textBox || element.type !== 'text';
  return <div className="absolute pointer-events-none z-40" style={{
    left: center.x * viewport.zoom + viewport.panX, top: center.y * viewport.zoom + viewport.panY,
    transform: `rotate(${element.angle ?? 0}rad) scale(${viewport.zoom})`, transformOrigin: '0 0' }}>
    <textarea autoFocus aria-label={element.type === 'text' ? 'Edit text' : 'Edit shape label'} value={value} wrap={wraps ? 'soft' : 'off'}
      onChange={(event) => onChange(event.target.value)} onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); }
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); onCommit(); }
      }} style={{ position: 'absolute', left: layout.x - center.x, top: layout.y - center.y,
        width: layout.width, height: layout.height, font: getFontString(element.fontSize, element.fontFamily),
        lineHeight: `${layout.lineHeight}px`, color: element.strokeColor, opacity: element.opacity / 100, textAlign: element.textAlign,
        background: 'transparent', border: 'none', outline: '1px dashed #6965db', padding: 0, margin: 0,
        boxShadow: 'none', resize: 'none', overflow: element.type === 'rectangle' ? 'auto' : 'hidden', scrollbarWidth: 'none',
        overflowWrap: wraps ? 'anywhere' : 'normal', pointerEvents: 'auto' }} />
  </div>;
}
