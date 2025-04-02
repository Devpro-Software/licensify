package main

import (
	"time"
)

type Model struct {
	ID        string    `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type License struct {
	Model
	Active  bool                   `json:"active"`
	Product string                 `json:"product"`
	Data    map[string]interface{} `gorm:"serializer:json" json:"data"`
}

type Validation struct {
	Model
	Error     string           `json:"error,omitempty" gorm:"default:null"`
	UserAgent string           `json:"userAgent" gorm:"default:null"`
	IP        string           `json:"ip" gorm:"default:null"`
	LicenseID string           `json:"-" gorm:"default:null"`
	License   *License         `json:"license"`
	Status    ValidationStatus `json:"status"`
}

type User struct {
	Model
	Username  string `json:"username" gorm:"unique"`
	Password  string `json:"-"`
	Role      string `json:"role"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type Session struct {
	Model
	UserID  string    `json:"-"`
	User    *User     `json:"user"`
	Token   string    `json:"-" gorm:"unique"`
	Expires time.Time `json:"expires"`
}

type ValidationStatus string

const (
	StatusAccepted           ValidationStatus = "Accepted"
	StatusInvalidSignature   ValidationStatus = "InvalidSignature"
	StatusLicenseInactive    ValidationStatus = "LicenseInactive"
	StatusLicenseUnavailable ValidationStatus = "LicenseUnavailable"
	StatusInternalError      ValidationStatus = "InternalError"
)
