package api

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// FileRoutes returns a chi.Router with all file-system API routes mounted.
// Accepting *gorm.DB here lets us record recent files without a global variable.
func FileRoutes(db *gorm.DB) chi.Router {

	r := chi.NewRouter()

	r.Get("/", listDirectory)
	r.Get("/read", readFile)
	r.Post("/write", writeFile)
	r.Post("/create", createPath)
	r.Delete("/", deletePath)
	r.Post("/rename", renamePath)

	return r
}

// These structs define the shape of JSON request bodies.
// The `json:"name"` tag controls the JSON key name (camelCase by convention for APIs).
type writeRequest struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type createRequest struct {
	Path  string `json:"path"`
	IsDir bool   `json:"isDir"`
}

type renameRequest struct {
	OldPath string `json:"oldPath"`
	NewPath string `json:"newPath"`
}

// dirEntry is what we send back for each item in a directory listing.
type dirEntry struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	IsDir bool   `json:"isDir"`
}

// respond encodes v as JSON and writes it to w with a 200 status.
// Centralising this avoids repeating json.NewEncoder boilerplate in every handler.
func respond(w http.ResponseWriter, v any) {

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

// respondErr writes a JSON error message with the given HTTP status code.
func respondErr(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// listDirectory handles GET /api/files?path=<dir>
func listDirectory(w http.ResponseWriter, r *http.Request) {

	dir := r.URL.Query().Get("path")
	if dir == "" {
		respondErr(w, http.StatusBadRequest, "path is required")
		return
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		respondErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	result := make([]dirEntry, 0, len(entries))

	for _, e := range entries {
		result = append(result, dirEntry{
			Name:  e.Name(),
			Path:  filepath.Join(dir, e.Name()),
			IsDir: e.IsDir(),
		})
	}

	respond(w, result)
}

// readFile handles GET /api/files/read?path=<file>
func readFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		respondErr(w, http.StatusBadRequest, "path is required")
		return
	}

	content, err := os.ReadFile(path)
	if err != nil {
		respondErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	respond(w, map[string]string{"content": string(content)})
}

// writeFile handles POST /api/files/write
func writeFile(w http.ResponseWriter, r *http.Request) {
	// Decode the JSON request body into our writeRequest struct.
	// &req passes a pointer so Decode can populate the struct's fields.
	var req writeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if err := os.WriteFile(req.Path, []byte(req.Content), 0644); err != nil {
		respondErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	respond(w, map[string]string{"status": "ok"})
}

// createPath handles POST /api/files/create (file or directory)
func createPath(w http.ResponseWriter, r *http.Request) {
	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if req.IsDir {

		if err := os.MkdirAll(req.Path, 0755); err != nil {
			respondErr(w, http.StatusInternalServerError, err.Error())
			return
		}
	} else {

		if err := os.MkdirAll(filepath.Dir(req.Path), 0755); err != nil {
			respondErr(w, http.StatusInternalServerError, err.Error())
			return
		}

		if err := os.WriteFile(req.Path, []byte{}, 0644); err != nil {
			respondErr(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	respond(w, map[string]string{"status": "ok"})
}

// deletePath handles DELETE /api/files?path=<path>
func deletePath(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		respondErr(w, http.StatusBadRequest, "path is required")
		return
	}

	if err := os.RemoveAll(path); err != nil {
		respondErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	respond(w, map[string]string{"status": "ok"})
}

// renamePath handles POST /api/files/rename
func renamePath(w http.ResponseWriter, r *http.Request) {
	var req renameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if err := os.Rename(req.OldPath, req.NewPath); err != nil {
		respondErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	respond(w, map[string]string{"status": "ok"})
}
