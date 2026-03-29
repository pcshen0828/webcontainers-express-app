# CLAUDE.md

## Project Overview

Browser-based in-browser IDE using the [WebContainers API](https://webcontainers.io). Boots a real Node.js runtime in the browser, mounts a virtual Express project, and provides a live editor + terminal + preview pane.

## Tech Stack

- React 19 + TypeScript
- Vite 8 (with React Compiler via Babel)
- WebContainers API (`@webcontainer/api`)
- xterm.js (`@xterm/xterm`) for the terminal
- Express 5 (runs inside the WebContainer, not the host)

## Dev Commands

```bash
npm run dev      # Start Vite dev server (includes required COOP/COEP headers)
npm run build    # tsc + vite build
npm run lint     # ESLint
npm start        # Run index.js locally with nodemon (not the in-browser server)
```

## Key Files

- `src/App.tsx` — boots WebContainer, wires editor/terminal/preview, handles drag-resize
- `src/files.ts` — virtual filesystem snapshot (`index.js` + `package.json`) mounted into the container
- `index.js` — standalone Express server (local reference / development server, separate from the in-browser one)
- `slides.html` — standalone 12-slide presentation about WebContainers (bilingual EN/ZH-TW); built as a separate Vite entry point
- `vite.config.ts` — sets `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers required by WebContainers
- `vercel.json` — same COOP/COEP headers for production deployment on Vercel

## Slides

`slides.html` is a standalone presentation (no React, no build dependencies) about the WebContainers API. It is built as a separate Vite entry point alongside `index.html`.

- 12 slides covering WebContainers concepts, architecture, API, and use cases
- Bilingual: English and Traditional Chinese (toggle via EN/中文 buttons)
- Keyboard navigation (arrow keys, space, home/end), swipe support, and direct page input
- Self-contained — all CSS and JS are inline in the single HTML file
- Built output: `dist/slides.html`

## Important Constraints

- **COOP/COEP headers are required** for WebContainers to work. Both `vite.config.ts` (dev) and `vercel.json` (prod) must keep these headers. Do not remove them.
- WebContainers only work in browsers that support cross-origin isolation (`SharedArrayBuffer`).
- The React Compiler is enabled — avoid patterns that break its assumptions (e.g., mutating refs during render).
