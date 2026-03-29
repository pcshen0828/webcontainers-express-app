# WebContainers Express App

A browser-based in-browser development environment built with React, TypeScript, and the [WebContainers API](https://webcontainers.io). It boots a Node.js runtime directly in the browser, runs an Express server inside it, and lets you edit the server code live with an integrated terminal and preview.

Built following the [WebContainers official tutorial](https://webcontainers.io/tutorial/1-build-your-first-webcontainer-app).

## Features

- **In-browser Node.js runtime** via WebContainers API
- **Live code editor** — edit `index.js` and changes are written directly to the virtual filesystem
- **Live preview** — iframe updates automatically when the Express server is ready
- **Integrated terminal** — full `jsh` shell session with resizable split pane

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown by Vite. The app will boot a WebContainer, mount the Express project files, install dependencies, and start the dev server — all inside the browser.

## Project Structure

```
src/
  App.tsx       # Main React component — boots WebContainer, wires editor/terminal/preview
  files.ts      # Virtual filesystem snapshot (index.js + package.json) mounted into WebContainer
index.js        # Standalone Express server (used for local reference, not the in-browser one)
```

## Scripts

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm run dev`   | Start Vite dev server               |
| `npm run build` | Type-check and build for production |
| `npm run lint`  | Run ESLint                          |
| `npm start`     | Run `index.js` locally with nodemon |

## Requirements

WebContainers require a browser with cross-origin isolation enabled. Vite's dev server is configured to serve the required headers.
