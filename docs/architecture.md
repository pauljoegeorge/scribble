# Scribble architecture

Scribble is a browser whiteboard built with the Next.js App Router, React, TypeScript, and a canvas renderer. This structure separates the route, editor state, interaction handlers, presentation, and browser adapters while retaining the existing drawing behavior.

## Module ownership

| Location | Responsibility | Allowed first-party dependencies |
| --- | --- | --- |
| `src/app/` | Route composition, metadata, global styles | app, components, types |
| `src/components/editor/` | Client editor composition | components, hooks, utils, constants, types |
| `src/components/{canvas,sidebar,toolbar,controls}/` | UI and composition of local hooks | components, hooks, utils, constants, types |
| `src/hooks/` | Scene state, history, session persistence, editor commands, keyboard lifecycle | hooks, utils, constants, types |
| `src/hooks/canvas/` | Pointer gestures, text editing, canvas rendering lifecycle | hooks, utils, constants, types |
| `src/utils/canvas/` | Geometry and imperative drawing | utils, constants, types |
| `src/utils/storage/` | Validated persistence, import, and export adapters | utils, constants, types |
| `src/utils/editor/` | Pure history and selection transformations | utils, constants, types |
| `src/constants/` | Defaults, palettes, demo data | constants, types |
| `src/types/` | Domain and integration contracts | types |

External libraries may be imported where needed. Type-only React contracts in integration types are acceptable. Browser-dependent utilities, such as text measurement and local storage, must guard access or be called from client lifecycles. Do not access browser globals at module initialization.

## Editor flow

`app/page.tsx` renders the client `ScribbleEditor`. The editor composes history, session state, actions, keyboard shortcuts, the canvas, and controls. Session hydration and autosave live in `useEditorSession`; selection commands live in `useEditorActions`.

`ScribbleCanvas` composes gesture, navigation, rendering, and text-editing hooks. `useCanvasGestures` owns the pointer lifecycle, including capture, cancellation, and touch gestures. Scene data flows down through typed props; draft updates and atomic commits flow back to the editor. History retains committed snapshots separately from live drafts, and persistence saves only committed state. Do not introduce a global store until independent consumers actually require it.

Canvas rendering draws cached shape drawables and shared text layouts through `roughRenderer`; selection rendering lives in `selectionRenderer`. Geometry belongs in `math`, transformations in the dedicated transform modules, and connector reconciliation in `bindings`. Rendering functions receive their context and data explicitly rather than reading editor state. Import and persistence validate unknown data before it reaches the editor; failed recovery pauses autosave until the user resumes it.

## Adding a feature

1. Define the domain contract in `types` and defaults in `constants` where necessary.
2. Implement reusable transformations in `utils`, stateful behavior in `hooks`, and presentation in `components`.
3. Wire the feature through the nearest owning composition component.
4. Keep every source file at or below 250 physical lines; aim for 50–150. Split by responsibility instead of line count alone.
5. Preserve persistence/export compatibility or write an explicit migration.
6. Run `npm run check` and `npm run build`. Test changed behavior at the smallest useful boundary; manually verify changed gestures in the browser.

Introduce subdirectories only when there are cohesive modules to group. Avoid a generic `helpers` dumping ground, broad barrel exports, circular imports, and abstractions created solely for hypothetical future features. Collaboration, accounts, and remote persistence should get their own modules when implemented; they should not be added to the canvas event handlers.

## Enforcement

`npm run check:architecture` checks all TypeScript and CSS source files for the 250-line limit, first-party dependency direction, circular imports, and obsolete product naming. It resolves static imports using relative paths and the `@/` alias; keep first-party imports static so the checker can see them.

ESLint additionally rejects oversized TypeScript files, explicit `any`, unused declarations, and invalid React hook usage. `npm run check` runs architecture, lint (zero warnings), TypeScript checks, and regression tests. `npm run build` validates Next.js production compilation. These checks do not replace browser interaction coverage.
