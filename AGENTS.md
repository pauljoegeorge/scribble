<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Scribble Architecture & Code Standards

## 1. File Size & Modularization Limits
- **Max File Length**: No single file should exceed **250 lines of code**.
- If a component or file approaches 250 lines, split it into modular hooks, sub-components, or utility modules.

## 2. Directory Structure & Responsibilities
- `src/types/`: Core domain interfaces (`ScribbleElement`, `AppState`, `Viewport`).
- `src/constants/`: Static configuration, default canvas demo data, and design tokens.
- `src/hooks/`: Reusable state logic (history stack, canvas mouse/touch gesture interactions).
- `src/components/`: Pure UI presentation components separated into logical subdirectories (`canvas/`, `toolbar/`, `sidebar/`, `controls/`).
- `src/utils/`: Pure utility functions for geometry (`canvas/math.ts`), rendering (`canvas/roughRenderer.ts`), and storage (`storage/localStorage.ts`).

## 3. Code & Naming Conventions
- Maintain 100% strict TypeScript types without using `any`.
- All branding, filenames, interfaces, and variables must strictly use **Scribble**. Never leak vendor names or references.
- Always run `npm run build` after making structural changes to verify strict TypeScript and Next.js compliance.

## 4. Dependency Boundaries
- Read `docs/architecture.md` before changing module ownership.
- `app` owns routing and metadata; compose the editor through a small client entry point.
- Components own presentation and composition; hooks own state, effects, and event lifecycles.
- Hooks must not import components or routes. Utilities must not import hooks, components, or routes.
- Constants may import domain types only. Domain types must not import application implementation.
- Avoid circular imports. Import implementation modules directly; keep the types index limited to domain contracts.
- Use descriptive, vendor-neutral identifiers; product-specific public names use Scribble. Framework-required filenames stay unchanged.

## 5. Change Guidelines
- Aim for 50–150 lines per module; split by responsibility before reaching the hard 250-line limit, including comments and blank lines.
- Extract cohesive behavior, not arbitrary numbered chunks. Avoid speculative abstractions or empty folders for future features.
- Keep transient gesture/text state local to canvas hooks. Keep persistent scene state and history in editor hooks.
- Keep rendering independent of React state. Put browser storage and export access behind utility adapters.
- Preserve existing storage keys and export contracts during refactors; document intentional migrations.
- Use strict types and `unknown` with validation at external-data boundaries. Do not bypass checks with `any` or blanket lint suppression.
- Run `npm run check` and `npm run build` after structural changes. Add focused behavioral tests when changing domain behavior.
- For interaction changes, verify drawing, selection, drag/resize, text editing, undo/redo, zoom/pan, reload, and export in the browser.
