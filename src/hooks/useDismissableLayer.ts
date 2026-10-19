import { useEffect, useEffectEvent, useRef } from 'react';
export function useDismissableLayer(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useEffectEvent(onClose);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const pointer = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) close(); };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    };
    window.addEventListener('pointerdown', pointer);
    ref.current?.addEventListener('keydown', keyboard);
    const node = ref.current;
    return () => { window.removeEventListener('pointerdown', pointer); node?.removeEventListener('keydown', keyboard); };
  }, []);
  return ref;
}
