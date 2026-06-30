package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"forge/internal/db"
	"forge/internal/terminal"
)

func SessionRoutes(database *gorm.DB, mgr *terminal.Manager) chi.Router {
	r := chi.NewRouter()

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		listSessions(w, r, mgr)
	})
	r.Post("/", func(w http.ResponseWriter, r *http.Request) {
		createSession(w, r, mgr)
	})
	r.Delete("/{id}", func(w http.ResponseWriter, r *http.Request) {
		deleteSession(w, r, mgr)
	})
	r.Patch("/{id}/name", func(w http.ResponseWriter, r *http.Request) {
		renameSession(w, r, database)
	})

	return r
}

func listSessions(w http.ResponseWriter, r *http.Request, mgr *terminal.Manager) {
	respond(w, mgr.List())
}

func createSession(w http.ResponseWriter, r *http.Request, mgr *terminal.Manager) {
	var body struct {
		Name string `json:"name"`
		Cwd  string `json:"cwd"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if body.Cwd == "" {
		respondErr(w, http.StatusBadRequest, "cwd is required")
		return
	}
	if body.Name == "" {
		body.Name = "terminal"
	}

	sess, err := mgr.Create(body.Name, body.Cwd)
	if err != nil {
		respondErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	respond(w, map[string]string{"id": sess.ID, "name": body.Name})
}

func deleteSession(w http.ResponseWriter, r *http.Request, mgr *terminal.Manager) {
	id := chi.URLParam(r, "id")
	mgr.Delete(id)
	respond(w, map[string]string{"status": "ok"})
}

// renameSession handles PATCH /api/sessions/{id}/name
// Updates only the display name in SQLite — the PTY process is unaffected.
// The parameter is named `database` (not `db`) so it doesn't shadow the
// imported `db` package, which we need to reference db.Session{}.
func renameSession(w http.ResponseWriter, r *http.Request, database *gorm.DB) {
	id := chi.URLParam(r, "id")

	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if body.Name == "" {
		respondErr(w, http.StatusBadRequest, "name is required")
		return
	}

	database.Model(&db.Session{}).Where("id = ?", id).Update("name", body.Name)

	respond(w, map[string]string{"status": "ok"})
}
