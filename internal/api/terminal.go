package api

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"

	"forge/internal/terminal"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func TerminalRoutes(mgr *terminal.Manager) chi.Router {
	r := chi.NewRouter()
	r.Get("/terminal/{id}", terminalWS(mgr))
	return r
}

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
