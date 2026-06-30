package db

import "time"

// Session represents one live terminal session.
// GORM will create a "sessions" table from this struct.
// json tags control how Go serializes this to JSON for the frontend.
// Without them, Go uses the exported field name verbatim: "ID" not "id".
type Session struct {
	ID   string `gorm:"primaryKey" json:"id"`
	Name string `gorm:"not null"   json:"name"`
	Cwd  string `gorm:"not null"   json:"cwd"`
	Pid  int    `json:"pid"`

	CreatedAt  time.Time `json:"createdAt"`
	LastActive time.Time `json:"lastActive"`
}

// RecentFile tracks which files have been opened in the editor.
type RecentFile struct {
	ID       uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Path     string    `gorm:"uniqueIndex;not null"    json:"path"`
	OpenedAt time.Time `json:"openedAt"`
}
