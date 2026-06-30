package db

import "time"

type Session struct {
	ID   string `gorm:"primaryKey" json:"id"`
	Name string `gorm:"not null"   json:"name"`
	Cwd  string `gorm:"not null"   json:"cwd"`
	Pid  int    `json:"pid"`

	CreatedAt  time.Time `json:"createdAt"`
	LastActive time.Time `json:"lastActive"`
}

type RecentFile struct {
	ID       uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Path     string    `gorm:"uniqueIndex;not null"    json:"path"`
	OpenedAt time.Time `json:"openedAt"`
}
