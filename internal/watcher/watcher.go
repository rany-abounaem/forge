// Package watcher watches a directory tree for file system changes and
// broadcasts JSON events to all connected WebSocket clients.
package watcher

import (
	"encoding/json"
	"io/fs"
	"log"
	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
)

// Event is the JSON shape we send to the browser when a file changes.
// The frontend uses Op to decide how to update the file tree.
type Event struct {
	Op   string `json:"op"`   // "create" | "write" | "delete" | "rename"
	Path string `json:"path"` // absolute path of the affected file or directory
}

// Watcher watches a directory tree and maintains a set of connected WebSocket
// clients to notify when anything changes.
type Watcher struct {
	root string // the directory we are watching

	// clients is a set of active WebSocket connections.
	// Go has no built-in Set type. A map[K]bool where the value is always true
	// is the standard idiom — the key IS the set member, the bool is ignored.
	clients map[*websocket.Conn]bool

	// mu protects the clients map. We use a plain Mutex (not RWMutex) because
	// the broadcast function both reads AND potentially deletes from the map
	// in the same operation, which always requires an exclusive write lock.
	mu sync.Mutex

	// fsw is the underlying fsnotify watcher — the library that talks to the
	// OS kernel (inotify on Linux, FSEvents on macOS, ReadDirectoryChangesW on Windows).
	fsw *fsnotify.Watcher
}

// New creates a Watcher rooted at the given directory, registers every
// subdirectory with fsnotify so changes are detected recursively, and starts
// the event loop goroutine.
func New(root string) (*Watcher, error) {

	fsw, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	w := &Watcher{
		root:    root,
		clients: make(map[*websocket.Conn]bool),
		fsw:     fsw,
	}

	err = filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {

		if err != nil {
			return nil
		}

		if d.IsDir() {
			return fsw.Add(path)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	go w.run()

	return w, nil
}

// run is the event loop. It reads from fsnotify's channels and broadcasts
// to all connected WebSocket clients.
//
// fsnotify gives us two channels:
//
//	fsw.Events — file system events (create, write, delete, rename)
//	fsw.Errors — errors from the OS watcher (e.g. a watched directory was deleted)
//
// The select statement waits until one of its cases is ready, then executes
// that case. It then loops and waits again. This is the idiomatic Go pattern
// for handling multiple event sources in a single goroutine.
func (w *Watcher) run() {
	for {
		select {
		case event, ok := <-w.fsw.Events:

			if !ok {
				return
			}

			if event.Has(fsnotify.Create) {

				w.fsw.Add(event.Name)
			}

			op := opString(event.Op)
			if op == "" {

				continue
			}

			data, err := json.Marshal(Event{Op: op, Path: event.Name})
			if err != nil {
				continue
			}

			w.broadcast(data)

		case err, ok := <-w.fsw.Errors:
			if !ok {
				return
			}
			log.Println("watcher error:", err)
		}
	}
}

// broadcast sends data to every connected client.
// Clients that have disconnected are detected by a write error and removed.
func (w *Watcher) broadcast(data []byte) {
	w.mu.Lock()
	defer w.mu.Unlock()

	for conn := range w.clients {
		err := conn.WriteMessage(websocket.TextMessage, data)
		if err != nil {

			conn.Close()
			delete(w.clients, conn)
		}
	}
}

// ServeClient registers a WebSocket connection as a broadcast target and blocks
// until that client disconnects. Called from the HTTP handler for each new client.
func (w *Watcher) ServeClient(conn *websocket.Conn) {

	w.mu.Lock()
	w.clients[conn] = true
	w.mu.Unlock()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}

	w.mu.Lock()
	delete(w.clients, conn)
	w.mu.Unlock()
}

// opString converts an fsnotify.Op bitflag to a plain string for the frontend.
// fsnotify uses bit manipulation: a single Op value can technically represent
// multiple operations ORed together, but in practice each event has one Op.
func opString(op fsnotify.Op) string {
	switch {
	case op.Has(fsnotify.Create):
		return "create"
	case op.Has(fsnotify.Write):
		return "write"
	case op.Has(fsnotify.Remove):
		return "delete"
	case op.Has(fsnotify.Rename):
		return "rename"
	default:

		return ""
	}
}
