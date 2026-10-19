# Scribble UX and bug fixes

This pass implements the 36 issues from the audit and its requested missing whiteboard features. Implementation is complete; production-build and physical-device verification remain outstanding. Tests intentionally exercise domain behavior and storage failures, rather than asserting component implementation details.

Current UI preferences supersede the original audit: Properties stays open, with no Objects tab or panel toggle. The selection action section (count, layer ordering, alignment/distribution, duplicate/delete, and detach labels) has been removed from Properties. Layer ordering is also removed from the context menu; copy, paste, duplicate, and delete remain available there. Shape-label text-position controls remain in Properties.

Connector drawing now preserves the pointer-down anchor until release. Endpoint binding happens after the gesture, avoiding premature snapping that collapsed lines/arrows on contact with a shape. Connectors within one shape remain ordinary visible lines; overlapping targets cannot collapse a visible connector. Pointer release includes the final cursor position.

Label editing no longer shifts the text down when entering edit mode. Canvas text uses an alphabetic baseline derived from font ascent/descent and the shared CSS line height; editing uses the exact same layout width and height. This also removes extra editor width that could shift centered text sideways.

## Audit item tracking

| Audit item | Change |
| --- | --- |
| 1. First undo clears loaded scene | Hydration resets the history baseline; history updates are atomic. |
| 2. Empty scene replaced with demo | Storage distinguishes a missing drawing from an empty array. |
| 3. Misleading saved badge | Loading, saving, saved, failed, and recovery states reflect persistence results. |
| 4. Unvalidated stored data | Validate elements, IDs, preferences, colors, points, and viewport values at runtime. |
| 5. Recovery overwrites valid data | Load records independently and pause all writes after a recovery error. |
| 6. Touch and pen input | Pointer events handle touch/pen; two-touch gestures pan and zoom. |
| 7. Release outside canvas | Capture the pointer; release commits, cancellation/blur restores the original scene. |
| 8. Right-click draws | Reject secondary-button drawing and expose a context menu. |
| 9. Rotation resizes | Dedicated angle transformation and rotated rendering/hit-testing. |
| 10. Freehand bounds incomplete | Bounds include every stroke point. |
| 11. Freehand resize broken | Resize transforms all points. |
| 12. Shape corners selectable | Ellipse and diamond tests use their actual shapes. |
| 13. Freehand empty-space hits | Segment tests return false when no stroke matches. |
| 14. Hit margin changes with zoom | Convert screen-space tolerance into world coordinates. |
| 15. Handles drawn/tested differently | Rendering and hit-testing share handle coordinates. |
| 16. Group selection lost on drag | Clicking within a selection preserves it; Shift toggles membership. |
| 17. Zoom drifts from pointer | Anchor wheel/pinch zoom to the gesture position; button zoom to screen center. |
| 18. Reset zoom resets pan | Reset preserves the world point at screen center; fit is a separate action. |
| 19. Space panning stuck | Reset on key release and focus loss; ignore text/form controls. |
| 20. Invisible elements created | Discard strokes and shapes with no meaningful geometry. |
| 21. Text editing clips | Measure content width and height as it changes. |
| 22. Edit/display text shift | Editor and renderer share layout, padding, rotation, and line-height calculations. |
| 23. Escape saves text | Escape cancels; blur and Ctrl/Cmd+Enter commit. |
| 24. Text handles imply font scaling | Standalone text uses font-size controls; group transforms adjust font size. |
| 25. Font changes leave old bounds | Remeasure text and grow bound shapes when typography changes. |
| 26. Detached text arbitrary bounds | Use measured label geometry and preserve alignment/rotation. |
| 27. Vertical alignment inconsistent | Defaults, new elements, mixed-state controls, and saved preferences include it. |
| 28. Labels bind to unsuitable geometry | Bind labels to rectangles, diamonds, ellipses, and cylinders only. |
| 29. Mixed selection values misleading | Property controls show mixed values rather than the first object's value. |
| 30. Enabled actions silently do nothing | Layers and extraction handle multiple selections; alignment/distribution state minimum counts. |
| 31. Sidebar covers drawing | Panel starts closed, can collapse, and has a dedicated toggle. |
| 32. Mobile controls overflow/overlap | Scrollable tool row, constrained panel, and wrapping bottom controls. |
| 33. Menu/Scribble+ export unexpectedly | Real drawing menu; remove the misleading upgrade button. |
| 34. Non-contextual properties | Show fill/text controls only for applicable tools or selected objects. |
| 35. Accessibility gaps | Named controls, pressed states, labelled slider, visible focus, and keyboard-accessible object list. |
| 36. Zoom shortcuts missing | Implement Ctrl/Cmd+Plus/Minus alongside existing undo shortcuts. |

## Added capabilities

- Marquee selection and Shift-additive selection.
- Group resize and rotation; preserve selected group during dragging.
- Arrow-key movement with Shift for larger steps.
- Internal/system clipboard copy and paste; Ctrl/Cmd+D duplication.
- Validated drawing-file import and reopenable JSON export.
- Complete-scene PNG export, independent of viewport and UI overlays.
- Fit drawing to screen with a button or F shortcut.
- Context menu, multi-object layer ordering, alignment, and distribution.
- Basic line/arrow endpoint binding to shapes, with updates when shapes move.
- An object list for accessible selection and text editing.

## Reliability changes

Text supports paragraphs: drag with T to create a resizable text box, or click for auto-sized text. Enter adds explicit lines; fixed-width boxes and shape labels wrap long content. Rectangle labels preserve the exact user-drawn dimensions; excess text stays saved, scrolls during editing, and is clipped to the available space when displayed. Standalone text boxes and other labelled shapes grow in height when needed. Shape-label position presets align the entire multiline block. Text-box dimensions persist through save and JSON export/import.

History is bounded to 100 snapshots. Only committed scene data is autosaved; pointer drafts and uncommitted text do not overwrite saved drawings. Autosave is debounced and flushed on page exit. Each erase gesture creates one undo transaction; unchanged edits are ignored. Opacity changes preview live and commit at gesture completion. Canvas rendering accounts for pixel density, redraws after font loading, uses animation frames, caches unchanged rough geometry, and skips offscreen objects.

## Verification

- `npm run check`: architecture, zero-warning lint, strict TypeScript, and **49 passing regression tests** (including text baselines, connector contact, paragraph wrapping, fixed rectangle geometry, text-box sizing, resizing, and persistence).
- Browser: drawing, first undo preserving the loaded scene, cancellation of existing text edits, context menu opening without drawing, desktop panel visibility, and mobile toolbar scrolling.
- Follow-up browser checks: Properties stays open without the removed controls; adding a label preserves a 40-pixel rectangle's height; an arrow connects two shapes and a line stays visible inside one rectangle. Test drawing changes were undone afterward.
- Recording-based follow-up: the "Are you sure?" label has matching text positions when displayed and edited. Test drawing changes were undone afterward.
- PNG export geometry and JSON export/import contracts have automated coverage. Browser download capture timed out, so actual file delivery remains unverified.
- Physical touch/pen hardware and cross-browser interaction coverage remain unverified.
- Production `npm run build` could not run outside the sandbox because permission was declined. Development compilation and TypeScript checks passed.
- The existing development server is running on port 3000; scripts remain configured for port 3003. Restart the existing server with `npm run dev` to use that port.
