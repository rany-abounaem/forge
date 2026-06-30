package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"forge/internal/api"
	"forge/internal/db"
	"forge/internal/terminal"
	"forge/internal/watcher"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	distDir := flag.String("dist", "", "path to built frontend dist directory (empty = API-only mode for dev)")
	flag.Parse()

	database, err := db.Init("forge.db")
	if err != nil {
		log.Fatal("failed to initialise database: ", err)
	}

	mgr := terminal.NewManager(database)

	w, err := watcher.New(".")
	if err != nil {
		log.Fatal("failed to start file watcher: ", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	r.Mount("/api/files", api.FileRoutes(database))
	r.Mount("/api/sessions", api.SessionRoutes(database, mgr))
	r.Mount("/ws", api.TerminalRoutes(mgr))
	r.Get("/ws/filetree", api.FileTreeWS(w))

	if *distDir != "" {
		r.Handle("/*", spaHandler(*distDir))
	}

	addr := ":8080"
	log.Println("Forge listening on", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}

func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := filepath.Join(dir, filepath.Clean("/"+r.URL.Path))
		if _, err := os.Stat(p); os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
