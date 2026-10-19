import type { AppState, ScribbleElement } from '@/types';
import { OpacityProperty } from './OpacityProperty';
import { ColorProperties } from './ColorProperties';
import { PropertyChoices } from './PropertyChoices';
import { TextPositionProperty } from './TextPositionProperty';
import { canBindText } from '@/utils/canvas/text';
import type { PropertiesSidebarProps } from './types';

export function PropertiesSidebar(props: PropertiesSidebarProps) {
  const { appState, selectedElements, onUpdateElementStyle: update } = props;
  function value<K extends keyof AppState & keyof ScribbleElement>(key: K): AppState[K] | ScribbleElement[K] | null {
    if (!selectedElements.length) return appState[key];
    const first = selectedElements[0][key] ?? appState[key];
    return selectedElements.every((element) => (element[key] ?? appState[key]) === first) ? first : null;
  }
  const hasText = appState.activeTool === 'text' || selectedElements.some((element) => element.type === 'text' || Boolean(element.boundText));
  const shape = selectedElements.length ? selectedElements.some((element) => ['rectangle', 'diamond', 'ellipse', 'cylinder'].includes(element.type)) : ['rectangle', 'diamond', 'ellipse', 'cylinder'].includes(appState.activeTool);
  const opacity = value('opacity');
  const labels = selectedElements.filter((element) => canBindText(element) && Boolean(element.boundText));
  const labelHorizontal = labels[0]?.textAlign ?? 'center';
  const labelVertical = labels[0]?.textVerticalAlign ?? 'middle';
  return <div className="flex flex-col gap-4">
    {labels.length > 0 && <TextPositionProperty
      horizontal={labels.every((element) => element.textAlign === labelHorizontal) ? labelHorizontal : null}
      vertical={labels.every((element) => (element.textVerticalAlign ?? 'middle') === labelVertical) ? labelVertical : null}
      onChange={update} />}
    <ColorProperties label="Stroke color" value={value('strokeColor')} onChange={(strokeColor) => update({ strokeColor })} />
    {shape && <>
      <ColorProperties label="Background" value={value('backgroundColor')} background onChange={(backgroundColor) => update({ backgroundColor })} />
      <PropertyChoices label="Fill" value={value('fillStyle')} options={[
        { value: 'none', label: 'None' }, { value: 'hachure', label: 'Hatch' }, { value: 'solid', label: 'Solid' }, { value: 'cross-hatch', label: 'Cross hatch' },
      ]} onChange={(fillStyle) => update({ fillStyle })} />
    </>}
    {!hasText || shape ? <>
      <PropertyChoices label="Stroke width" value={value('strokeWidth')} options={[{ value: 2, label: 'Thin' }, { value: 4, label: 'Medium' }, { value: 6, label: 'Thick' }]} onChange={(strokeWidth) => update({ strokeWidth })} />
      <PropertyChoices label="Stroke style" value={value('strokeStyle')} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} onChange={(strokeStyle) => update({ strokeStyle })} />
      <PropertyChoices label="Roughness" value={value('roughness')} options={[{ value: 0, label: 'Smooth' }, { value: 1, label: 'Sketch' }, { value: 2, label: 'Rough' }]} onChange={(roughness) => update({ roughness })} />
    </> : null}
    {hasText && <>
      <PropertyChoices label="Font" value={value('fontFamily')} options={[{ value: 'hand', label: 'Hand' }, { value: 'sans', label: 'Sans' }, { value: 'code', label: 'Code' }]} onChange={(fontFamily) => update({ fontFamily })} />
      <PropertyChoices label="Font size" value={value('fontSize')} options={[{ value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' }, { value: 'XL', label: 'XL' }]} onChange={(fontSize) => update({ fontSize })} />
      <PropertyChoices label="Horizontal alignment" value={value('textAlign')} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} onChange={(textAlign) => update({ textAlign })} />
      {(shape || appState.activeTool === 'text') && <PropertyChoices label="Vertical alignment" value={value('textVerticalAlign') ?? (selectedElements.length ? null : 'middle')} options={[{ value: 'top', label: 'Top' }, { value: 'middle', label: 'Middle' }, { value: 'bottom', label: 'Bottom' }]} onChange={(textVerticalAlign) => update({ textVerticalAlign })} />}
    </>}
    <OpacityProperty key={selectedElements.map((element) => element.id).join(',')} value={opacity} onPreview={(opacity) => props.onPreviewStyle({ opacity })} onChange={(opacity) => update({ opacity })} />
  </div>;
}
