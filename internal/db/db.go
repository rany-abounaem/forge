package db

import (
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Init opens the SQLite file at the given path and runs AutoMigrate.
// It returns a *gorm.DB (pointer to the database handle) and an error.
// The caller (main.go) is responsible for checking the error.
//
// Multiple return values are idiomatic Go — functions commonly return
// (result, error) so the caller can handle both the happy path and failures.
func Init(path string) (*gorm.DB, error) {

	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {

		return nil, err
	}

	err = db.AutoMigrate(&Session{}, &RecentFile{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
