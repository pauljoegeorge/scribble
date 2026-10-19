'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditorActions } from '@/hooks/useEditorActions';
import { useEditorKeyboard } from '@/hooks/useEditorKeyboard';
import { useEditorSession } from '@/hooks/useEditorSession';
import { useEditorClipboard } from '@/hooks/useEditorClipboard';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { ScribbleCanvas } from '@/components/canvas/ScribbleCanvas';
import { TopToolbar } from '@/components/toolbar/TopToolbar';
import { PropertiesSidebar } from '@/components/sidebar/PropertiesSidebar';
import { CanvasControls } from '@/components/controls/CanvasControls';
import { EditorPanel } from './EditorPanel';
import { DrawingMenu } from './DrawingMenu';
import { ContextMenu } from './ContextMenu';
import { exportCanvasToJSON, exportCanvasToPNG } from '@/utils/storage/export';
import { parseDrawing } from '@/utils/storage/import';
import { zoomAt, fitViewport } from '@/utils/canvas/transform';
import { hitElement } from '@/utils/canvas/elements';

export function ScribbleEditor() {
  const history = useCanvasHistory([]);
  const { refreshTextMetrics } = history;
  useEffect(() => {
    let disposed = false;
    document.fonts.ready.then(() => { if (!disposed) refreshTextMetrics(); });
    return () => { disposed = true; };
  }, [refreshTextMetrics]);
  const session = useEditorSession({ elements: history.committedElements, resetHistory: history.resetHistory });
  const { viewport, setViewport, appState, setAppState } = session;
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const report = useCallback((text: string) => setMessage(text), []);
  const actions = useEditorActions({ appState, setAppState, setElements: history.setElements, commitElements: history.commitElements });
  const clipboard = useEditorClipboard({ appState, setAppState, getElements: history.getElements, commitElements: history.commitElements, report });
  const zoom = (factor: number) => setViewport((state) => zoomAt(state, state.zoom * factor, { x: window.innerWidth / 2, y: window.innerHeight / 2 }));
  const fit = () => setViewport(fitViewport(history.getElements(), window.innerWidth, window.innerHeight));
  const undo = () => {
    history.handleUndo();
    setAppState((state) => ({ ...state, selectedElementIds: state.selectedElementIds.filter((id) => history.getElements().some((element) => element.id === id && !element.isDeleted)) }));
  };
  const redo = () => {
    history.handleRedo();
    setAppState((state) => ({ ...state, selectedElementIds: state.selectedElementIds.filter((id) => history.getElements().some((element) => element.id === id && !element.isDeleted)) }));
  };
  useEditorKeyboard({ ...history, handleUndo: undo, handleRedo: redo, ...actions, ...clipboard, appState, setAppState, zoom, fit });
  const selectedElements = history.elements.filter((element) => !element.isDeleted && appState.selectedElementIds.includes(element.id));
  const importFile = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a drawing smaller than 10 MB.');
      const drawing = parseDrawing(await file.text());
      if (history.getElements().some((element) => !element.isDeleted) && !window.confirm('Replace this drawing? You can undo this action.')) return;
      history.commitElements(drawing.elements);
      if (drawing.viewport) setViewport(drawing.viewport);
      if (drawing.appState) setAppState((state) => ({ ...state, ...drawing.appState, selectedElementIds: [] }));
      else setAppState((state) => ({ ...state, selectedElementIds: [] }));
      report('Drawing opened.');
    } catch (error) { report(error instanceof Error ? error.message : 'Unable to open this drawing.'); }
  };
  if (!session.isLoaded) return <main role="status" className="flex h-dvh items-center justify-center text-sm text-slate-500">Loading your drawing…</main>;
  return <main className="relative w-screen h-dvh overflow-hidden select-none" onContextMenu={(event) => {
    if (!(event.target instanceof HTMLCanvasElement)) return;
    event.preventDefault();
    const hit = hitElement(history.getElements(), { x: (event.clientX - viewport.panX) / viewport.zoom, y: (event.clientY - viewport.panY) / viewport.zoom }, viewport.zoom);
    if (hit && !appState.selectedElementIds.includes(hit.id)) setAppState((state) => ({ ...state, selectedElementIds: [hit.id] }));
    setContext({ x: event.clientX, y: event.clientY });
  }}>
    <ScribbleCanvas {...history} viewport={viewport} setViewport={setViewport} appState={appState} setAppState={setAppState} />
    <TopToolbar activeTool={appState.activeTool} setActiveTool={(activeTool) => setAppState((state) => ({ ...state, activeTool }))}
      isLocked={appState.isLocked} setIsLocked={(isLocked) => setAppState((state) => ({ ...state, isLocked }))}
      menuOpen={menuOpen} onMenu={() => setMenuOpen(!menuOpen)} />
    <EditorPanel>
      <PropertiesSidebar appState={appState} selectedElements={selectedElements}
        onUpdateElementStyle={actions.handleUpdateElementStyle} onPreviewStyle={actions.handlePreviewStyle} />
    </EditorPanel>
    {menuOpen && <DrawingMenu onClose={() => setMenuOpen(false)} onImport={(file) => void importFile(file)} onClear={actions.handleClearCanvas} onFit={fit}
      onJSON={() => exportCanvasToJSON(history.getElements(), viewport, appState)} onPNG={() => void exportCanvasToPNG(history.getElements()).catch(() => report('Image export failed. Export a drawing file instead.'))} />}
    <CanvasControls zoom={viewport.zoom} onZoom={zoom} onResetZoom={() => setViewport((state) => zoomAt(state, 1, { x: window.innerWidth / 2, y: window.innerHeight / 2 }))}
      onFit={fit} canUndo={history.canUndo} canRedo={history.canRedo} onUndo={undo} onRedo={redo} status={session.status} />
    {context && <ContextMenu x={context.x} y={context.y} hasSelection={selectedElements.length > 0} onClose={() => setContext(null)}
      onCopy={clipboard.copy} onPaste={() => void clipboard.paste()} onDuplicate={actions.handleDuplicateElements} onDelete={actions.handleDeleteElements} />}
    {session.recoveryMessage && <div role="alert" className="absolute top-20 right-3 left-3 sm:left-auto sm:w-96 z-40 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
      <p>{session.recoveryMessage}</p><p className="mt-2">Autosave is paused. Opening or editing a drawing will not overwrite the original until you resume saving.</p>
      <button className="mt-2 underline" onClick={() => { if (window.confirm('Replace the original saved data with the current drawing?')) session.resumeSaving(); }}>Resume saving</button>
    </div>}
    {message && <div role="status" className="absolute bottom-24 right-3 left-3 sm:left-auto z-40 rounded-xl border bg-white p-3 shadow text-sm flex gap-4"><span>{message}</span><button aria-label="Dismiss notification" onClick={() => setMessage('')}>✕</button></div>}
  </main>;
}
