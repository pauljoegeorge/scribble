import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_APP_STATE, DEFAULT_VIEWPORT } from '@/constants/editorDefaults';
import { INITIAL_DEMO_ELEMENTS } from '@/constants/initialDemo';
import { loadFromLocalStorage, saveToLocalStorage } from '@/utils/storage/localStorage';
import { fitElementText } from '@/utils/canvas/text';
import type { ScribbleElement } from '@/types';

export type ScribbleSaveStatus = 'loading' | 'pending' | 'saved' | 'error' | 'recovery';
interface ScribbleSessionOptions {
  elements: ScribbleElement[];
  resetHistory: (elements: ScribbleElement[]) => void;
}
export function useEditorSession({ elements, resetHistory }: ScribbleSessionOptions) {
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [appState, setAppState] = useState(DEFAULT_APP_STATE);
  const [status, setStatus] = useState<ScribbleSaveStatus>('loading');
  const [isLoaded, setIsLoaded] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [saveAllowed, setSaveAllowed] = useState(true);
  const latest = useRef({ elements, viewport, appState });
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      await Promise.race([document.fonts.ready, new Promise<void>((resolve) => window.setTimeout(resolve, 1500))]);
      if (cancelled) return;
      const session = loadFromLocalStorage();
      resetHistory((session.elements ?? (session.errors.length ? [] : INITIAL_DEMO_ELEMENTS)).map(fitElementText));
      if (session.viewport) setViewport(session.viewport);
      if (session.appState) setAppState((previous) => ({ ...previous, ...session.appState }));
      setRecoveryMessage(session.errors.join(' '));
      setSaveAllowed(session.errors.length === 0);
      setStatus(session.errors.length ? 'recovery' : 'saved');
      setIsLoaded(true);
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [resetHistory]);
  useEffect(() => {
    latest.current = { elements, viewport, appState };
    if (!isLoaded || !saveAllowed) return;
    const pending = window.setTimeout(() => setStatus('pending'), 0);
    const timer = window.setTimeout(() => {
      setStatus(saveToLocalStorage(elements, viewport, appState) ? 'saved' : 'error');
    }, 400);
    return () => { window.clearTimeout(pending); window.clearTimeout(timer); };
  }, [elements, viewport, appState, isLoaded, saveAllowed]);
  useEffect(() => {
    if (!isLoaded || !saveAllowed) return;
    const flush = () => {
      const session = latest.current;
      saveToLocalStorage(session.elements, session.viewport, session.appState);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [isLoaded, saveAllowed]);
  const resumeSaving = useCallback(() => { setSaveAllowed(true); setRecoveryMessage(''); }, []);
  return { viewport, setViewport, appState, setAppState, status, isLoaded, recoveryMessage, resumeSaving };
}
