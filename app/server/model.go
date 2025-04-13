package server

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
	Active bool                   `json:"active"`
	Name   string                 `json:"name"`
	Data   map[string]interface{} `gorm:"serializer:json" json:"data"`
}

type Validation struct {
	Model
	Error     string           `json:"error,omitempty" gorm:"default:null"`
	UserAgent string           `json:"userAgent" gorm:"default:null"`
	IP        string           `json:"ip" gorm:"default:null"`
	LicenseID string           `json:"-" gorm:"default:null"`
	License   *License         `json:"license"`
	Status    ValidationStatus `json:"status"`

	Signature string   `json:"signature" gorm:"default:null"`
	TrackerID string   `json:"-" gorm:"default:null"`
	Tracker   *Tracker `json:"tracker"`
}

type Tracker struct {
	Model
	LicenseID     string     `json:"-" gorm:"default:null"`
	License       *License   `json:"license"`
	Name          string     `json:"name"`
	Enabled       bool       `json:"enabled"`
	ActivatedDate *time.Time `json:"activatedDate"`
	Expiration    *time.Time `json:"expiration"`
}

type Preset struct {
	Model
	LicenseID     string                 `json:"-" gorm:"default:null"`
	License       *License               `json:"license"`
	CreateTracker bool                   `json:"createTracker"`
	Data          map[string]interface{} `gorm:"serializer:json" json:"data"`
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

type Client struct {
	Model
	ApiKey string `json:"apiKey" gorm:"unqiue"`
}

type KeyPair struct {
	Model
	PublicKey  string `json:"publicKey"`
	PrivateKey string `json:"-"`
}

type ValidationStatus string

const (
	StatusAccepted            ValidationStatus = "Accepted"
	StatusSignatureInvalid    ValidationStatus = "SignatureInvalid"
	StatusSignatureExpired    ValidationStatus = "SignatureExpired"
	StatusLicenseInactive     ValidationStatus = "LicenseInactive"
	StatusLicenseUnavailable  ValidationStatus = "LicenseUnavailable"
	StatusTrackerDisabled     ValidationStatus = "TrackerDisabled"
	StatusTrackerUnavailable  ValidationStatus = "TrackerUnavailable"
	StatusTrackerNotActivated ValidationStatus = "TrackerNotActivated"
	StatusTrackerExpired      ValidationStatus = "TrackerExpired"
	StatusInternalError       ValidationStatus = "InternalError"
)
