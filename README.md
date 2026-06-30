# Forge

A self-hosted, browser-based developer IDE. Open a browser, get a full editor with a live terminal — no Electron, no cloud dependency.

## Features

- **File tree** — browse and open files from the server's working directory
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
| Frontend | React 18, TypeScript, Vite                      |
| Editor   | Monaco Editor                                   |
| Terminal | xterm.js with FitAddon                          |

## Requirements

- Go 1.21+
- Node.js 18+

## Run

```bash
# Install frontend dependencies (first time only)
cd frontend && npm install && cd ..

# Start the server (serves frontend at http://localhost:8080)
go run ./cmd/forge
```

The server serves the Vite dev proxy in development. For a production build:

```bash
cd frontend && npm run build && cd ..
go run ./cmd/forge
```

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
