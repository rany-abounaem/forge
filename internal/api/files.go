package api

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

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

type dirEntry struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	IsDir bool   `json:"isDir"`
}

func respond(w http.ResponseWriter, v any) {

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func respondErr(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

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

func writeFile(w http.ResponseWriter, r *http.Request) {

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
