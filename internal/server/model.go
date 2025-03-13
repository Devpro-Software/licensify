package main

import (
	"time"
)

type Model struct {
	ID        string `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type License struct {
	Model
	Active  bool
	Product string
	Data    map[string]interface{} `gorm:"serializer:json"`
}
