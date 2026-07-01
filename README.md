# Forge

A self-hosted, browser-based developer IDE. Open a browser, get a full editor with a live terminal — no Electron, no cloud dependency.

## Features

- **File tree** — browse and open files from the working directory
- **Monaco editor** — the same editor that powers VS Code, with syntax highlighting
- **Integrated terminal** — real PTY sessions via xterm.js (ConPTY on Windows, openpty on Unix)
- **Multiple terminal tabs** — create, rename, and close sessions; they persist across browser refreshes
- **File watcher** — the file tree updates automatically when files change on disk
- **Session persistence** — terminal sessions survive browser refreshes (SQLite-backed)

## Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Go, chi router, gorilla/websocket, go-pty, GORM |
| Database | SQLite (pure-Go, no CGO required)               |
| Frontend | React 19, TypeScript, Vite                      |
| Editor   | Monaco Editor                                   |
| Terminal | xterm.js with FitAddon                          |

## Docker (recommended)

No Go or Node.js installation required. The image is published to GHCR on every release.

```bash
docker run -p 8080:8080 -v /path/to/your/project:/workspace ghcr.io/rany-abounaem/forge:latest
```

Then open `http://localhost:8080`. The file tree and terminal operate on whatever folder you mount at `/workspace`.

To persist the session database across container restarts, mount a volume for it:

```bash
docker run -p 8080:8080 \
  -v /path/to/your/project:/workspace \
  -v forge-data:/workspace/.forge \
  ghcr.io/rany-abounaem/forge:latest
```

## Local development

**Requirements:** Go 1.25+, Node.js 22+

The backend and frontend run as separate processes. Both need to be running at the same time.

```bash
# Terminal 1 — Go API server on :8080
go run ./cmd/forge

# Terminal 2 — Vite dev server on :5173 (proxies /api and /ws to :8080)
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. Vite handles hot reload and proxies API requests to Go.

### Production build (without Docker)

```bash
cd frontend && npm run build && cd ..
go run ./cmd/forge --dist frontend/dist
```

Open `http://localhost:8080`. Go serves the built SPA and the API from a single process.

## Project structure

```
cmd/forge/          # entrypoint
internal/
  api/              # HTTP + WebSocket handlers
  db/               # GORM models and database setup
  terminal/         # PTY session lifecycle manager
  watcher/          # fsnotify file watcher
frontend/
  src/
    components/     # React components (Editor, FileTree, Terminal, etc.)
    hooks/          # Custom hooks
    store/          # Zustand global state
```
