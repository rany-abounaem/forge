package api

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"

	"forge/internal/terminal"
)

// upgrader converts a plain HTTP connection into a WebSocket connection.
// CheckOrigin returns true unconditionally — required for LAN access where
// the origin header won't match the server's host.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// TerminalRoutes returns the router for WebSocket terminal connections.
// Mounted at /ws in main.go.
func TerminalRoutes(mgr *terminal.Manager) chi.Router {
	r := chi.NewRouter()
	r.Get("/terminal/{id}", terminalWS(mgr))
	return r
}

// terminalWS returns an http.HandlerFunc that upgrades the connection to
// WebSocket and then hands off to Session.Attach for the data pump.
//
// Returning a HandlerFunc from a function (rather than writing the handler
// inline) is called a "handler factory" or "closure handler". It's the
// idiomatic Go way to inject dependencies (mgr) into handlers without globals.
func terminalWS(mgr *terminal.Manager) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")

		sess, ok := mgr.Get(id)
		if !ok {
			log.Printf("terminalWS: session %s not found in memory (stale SQLite record?)", id)
			respondErr(w, http.StatusNotFound, "session not found")
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {

			return
		}

		defer conn.Close()

		sess.Attach(conn)
	}
}
