import { useState, useRef, useCallback } from 'react';
import type { ScribbleElement } from '@/types';
import type { ScribbleCanvasProps } from '@/types/canvas';
import { fitElementText } from '@/utils/canvas/text';

export function useCanvasTextEditing({ setElements, commitElements }: Pick<ScribbleCanvasProps, 'setElements' | 'commitElements'>) {
  const [editingElement, setEditingElement] = useState<ScribbleElement | null>(null);
  const [textInputVal, setTextInputVal] = useState('');
  const current = useRef<{ element: ScribbleElement; value: string; isNew: boolean } | null>(null);
  const openTextEditor = useCallback((element: ScribbleElement, isNew = false) => {
    const value = element.type === 'text' ? element.text ?? '' : element.boundText ?? '';
    current.current = { element, value, isNew };
    setEditingElement(element); setTextInputVal(value);
  }, []);
  const handleTextValChange = useCallback((value: string) => {
    if (current.current) current.current.value = value;
    setTextInputVal(value);
  }, []);
  const finish = useCallback((cancel: boolean) => {
    const session = current.current;
    if (!session) return;
    current.current = null;
    setEditingElement(null); setTextInputVal('');
    if (cancel) {
      if (session.isNew) setElements((elements) => elements.filter((element) => element.id !== session.element.id));
      return;
    }
    commitElements((elements) => {
      if (session.element.type === 'text' && !session.value.trim()) return elements.filter((element) => element.id !== session.element.id);
      return elements.map((element) => element.id === session.element.id
        ? fitElementText({ ...element, ...(element.type === 'text' ? { text: session.value } : { boundText: session.value }) }) : element);
    });
  }, [commitElements, setElements]);
  const commitTextEdit = useCallback(() => finish(false), [finish]);
  const cancelTextEdit = useCallback(() => finish(true), [finish]);
  const isEditing = useCallback(() => current.current !== null, []);
  return { editingElement, textInputVal, openTextEditor, handleTextValChange, commitTextEdit, cancelTextEdit, isEditing };
}
