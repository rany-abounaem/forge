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

type Event struct {
	Op   string `json:"op"`
	Path string `json:"path"`
}

type Watcher struct {
	root string

	clients map[*websocket.Conn]bool

	mu sync.Mutex

	fsw *fsnotify.Watcher
}

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
