package api

import (
	"net/http"

	"forge/internal/watcher"
)

// FileTreeWS upgrades the connection to WebSocket and registers it as a
// broadcast target with the watcher. It blocks until the client disconnects.
func FileTreeWS(w *watcher.Watcher) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(rw, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		w.ServeClient(conn)
	}
}
