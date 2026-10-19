# Scribble

A browser whiteboard for sketching hand-drawn diagrams. Built with Next.js, React, TypeScript, and a canvas renderer.

## Features

- Rectangles, diamonds, ellipses, cylinders, lines, arrows, freehand strokes, and text.
- Shape labels, wrapped text boxes, colors, opacity, and stroke controls.
- Multiple selection, dragging, resizing, rotation, and connector binding.
- Undo/redo, copy/paste, duplication, zoom, pan, and fit-to-drawing.
- Browser autosave, drawing-file import/export, and complete-scene PNG export.

## Local development

Use Node.js 20.9 or newer and npm. No API keys, environment variables, or database are required.

```sh
npm ci
npm run dev
```

Open [localhost:3003](http://localhost:3003).

To run a production build locally:

```sh
npm run build
npm start
```

The production server also uses port 3003. In restricted environments where Turbopack cannot bind its local worker port, use `npm run build -- --webpack` to build with webpack instead.

## Drawing data and privacy

Drawings and editor preferences are saved in this browser's local storage for the current site. There are no accounts, cloud backups, or collaborative editing. Clearing site data removes saved drawings; use the drawing menu to export a `.scribble` file for backup and reopen it with import. PNG exports contain the full drawing.

Fonts load from Google Fonts, so the browser makes external font requests. Clipboard access depends on browser permissions and a secure context, such as localhost or HTTPS.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Select / pan | V / H |
| Rectangle / diamond / ellipse | R / D / O |
| Arrow / line / pencil | A / L / P |
| Text / cylinder / eraser | T / C / E |
| Select all | Ctrl/Cmd+A |
| Undo / redo | Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z |
| Copy / paste / duplicate | Ctrl/Cmd+C / Ctrl/Cmd+V / Ctrl/Cmd+D |
| Delete selection | Delete or Backspace |
| Move selection | Arrow keys; Shift for larger steps |
| Zoom in / out | Ctrl/Cmd+Plus / Ctrl/Cmd+Minus |
| Fit drawing | F |
| Clear selection / return to select | Escape |

## Validation and dependency security

```sh
npm run check
npm run build
npm audit
```

`check` enforces module boundaries, circular-dependency checks, the 250-line source limit, zero-warning lint, strict TypeScript, and behavioral regression tests. `build` verifies production compilation. Run `npm audit` against the committed lockfile before publishing or deploying; advisory results change over time. Review dependency updates and rerun both checks after applying them.

The October 19, 2026 dependency review updated Next.js and its lint configuration to 16.4.2, sharp to 0.35.5, and source-map-js to 1.2.2. One unpatched `braces` denial-of-service advisory remains in the development-only lint dependency chain (`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`); npm reports five affected packages from this single advisory. Recheck for an upstream fix before updating lint dependencies. Avoid `npm audit fix --force`, which currently proposes downgrading the lint configuration to version 14.

The repository ignores environment files, dependencies, build output, and local artifacts. Keep credentials and private drawings out of committed files.

## Project structure

| Location | Responsibility |
| --- | --- |
| `src/app/` | Routes, metadata, and global styles |
| `src/components/` | Editor and presentation components |
| `src/hooks/` | Editor state, persistence, and canvas interactions |
| `src/utils/` | Geometry, rendering, storage, import, and export |
| `src/types/` | Domain contracts |
| `src/constants/` | Defaults, styles, and demo scene |
| `tests/` | Behavioral regression tests |

Read the [architecture guide](docs/architecture.md) and [repository rules](AGENTS.md) before changing module ownership. [CLAUDE.md](CLAUDE.md) references the same rules. The [UX fixes and verification record](docs/fixes.md) documents prior interaction checks and remaining browser/device coverage limits.
