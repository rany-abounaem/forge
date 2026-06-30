package db

import (
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

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
