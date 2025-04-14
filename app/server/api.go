package server

import (
	cyrptrand "crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"
	"time"

	"github.com/Devpro-Software/licensify/licensify"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type API struct {
	db *gorm.DB
}

var (
	ErrUserAlreadyExists = errors.New("username already exists")
	ErrLogin             = errors.New("failed to login")
	ErrInternal          = errors.New("internal error")
	ErrInvalidKeyFile    = errors.New("invalid key file")
	ErrValidation        = errors.New("failed to validate")
	ErrActivation        = errors.New("failed to activate")
)

func wrapInternalErr(err error) error {
	return fmt.Errorf("%w: %w", ErrInternal, err)
}

func newAPI(dsn string) *API {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	db.AutoMigrate(&License{})
	db.AutoMigrate(&Validation{})
	db.AutoMigrate(&Preset{})
	db.AutoMigrate(&Tracker{})
	db.AutoMigrate(&User{})
	db.AutoMigrate(&Session{})
	db.AutoMigrate(&Client{})
	db.AutoMigrate(&KeyPair{})

	return &API{
		db: db,
	}
}

func (a *API) RegisterUser(username, password, firstName, lastName string) (*User, error) {
	var existing User
	err := a.db.First(&existing, "username = ?", username).Error
	if err == nil {
		return nil, fmt.Errorf("Failed to register user: %w", ErrUserAlreadyExists)
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, wrapInternalErr(err)
	}

	user := &User{}
	user.ID = uuid.New().String()
	user.Username = username
	user.Password = password // TODO: hash
	user.Role = "Admin"
	user.FirstName = firstName
	user.LastName = lastName
	if err := a.db.Create(user).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return user, nil
}

func (a *API) Login(username, password string) (*Session, error) {
	var user User
	err := a.db.First(&user, "username = ?", username).Error
	if err != nil {
		return nil, ErrLogin
	}

	if user.Password != password {
		return nil, ErrLogin
	}

	bytes := make([]byte, 32)
	if _, err := cyrptrand.Read(bytes); err != nil {
		return nil, wrapInternalErr(err)
	}

	token := base64.URLEncoding.EncodeToString(bytes)
	session := &Session{}
	session.ID = uuid.New().String()
	session.Token = token
	session.Expires = time.Now().Add(time.Hour * 24 * 7)
	session.UserID = user.ID
	session.User = &user

	if err := a.db.Create(session).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return session, nil
}

func (a *API) Logout(s *Session) error {
	if err := a.db.Delete(s).Error; err != nil {
		return wrapInternalErr(err)
	}
	return nil
}

func (a *API) Session(token string) *Session {
	var session Session
	if err := a.db.Preload("User").First(&session, "token = ?", token).Error; err != nil {
		return nil
	}

	if time.Now().After(session.Expires) {
		a.db.Delete(&session)
		return nil
	}

	return &session
}

func (a *API) TestSession() *Session {
	const testUsername = "john"
	var user User
	if a.db.First(&user, "username = ?", testUsername).Error != nil {
		user.ID = uuid.NewString()
		user.CreatedAt = time.Now()
		user.UpdatedAt = time.Now()
		user.Username = "john"
		user.FirstName = "john"
		user.LastName = "pork"
		a.db.Create(user)
	}

	testSession := Session{}
	testSession.ID = "3eeec35e-c292-4c06-a01f-eb3a7ec75fec"
	testSession.CreatedAt = time.Now()
	testSession.UpdatedAt = time.Now()
	testSession.Token = "ac2d416c-e674-4956-ba2f-2ed3c06a4ae9"
	testSession.Expires = time.Now().Add(time.Hour)
	testSession.User = &user
	return &testSession
}

func (a *API) Licenses() ([]*License, error) {
	var licenses []*License
	if err := a.db.Find(&licenses).Error; err != nil {
		return nil, wrapInternalErr(err)
	}
	return licenses, nil
}

func (a *API) License(id string) *License {
	var license License
	if err := a.db.First(&license, "id = ?", id).Error; err != nil {
		return nil
	}

	return &license
}

func (a *API) NewLicense(name string, active bool, data map[string]any) (*License, error) {
	license := License{}
	license.ID = uuid.New().String()
	license.Active = active
	license.Name = name
	license.Data = data

	if err := a.db.Create(&license).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return &license, nil
}

func (a *API) SaveLicense(l *License) error {
	if err := a.db.Save(l).Error; err != nil {
		return wrapInternalErr(err)
	}
	return nil
}

func (a *API) DeleteLicense(id string) error {
	err := a.db.Transaction(func(tx *gorm.DB) error {
		var license License
		if err := tx.First(&license, "id = ?", id).Error; err != nil {
			return err
		}

		if err := tx.Where("license_id = ?", license.ID).Delete(&Validation{}).Error; err != nil {
			return err
		}

		if err := tx.Where("license_id = ?", license.ID).Delete(&Tracker{}).Error; err != nil {
			return err
		}

		err := tx.Delete(&license).Error
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return wrapInternalErr(err)
	}

	return nil
}

func (a *API) Sign(claims map[string]any) (*licensify.Signature, error) {
	var keyPair KeyPair
	if err := a.db.First(&keyPair).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	priv, err := licensify.LoadPrivateKeyBase64(keyPair.PrivateKey)
	if err != nil {
		return nil, wrapInternalErr(err)
	}

	sig, err := licensify.NewSigner(priv).Sign(licensify.NewLicense(claims))
	if err != nil {
		return nil, wrapInternalErr(err)
	}

	return sig, nil
}

type TrackersOptions struct {
	LicenseID string
	Name      string
	Page      int
	PageSize  int
}

func (a *API) Trackers(ops TrackersOptions) ([]*Tracker, error) {
	var err error
	page := 1
	pageSize := 30

	q := a.db.Model(&Tracker{})
	q = q.Preload("License")

	if ops.LicenseID != "" {
		q = q.Where("license_id = ?", ops.LicenseID)
	}

	if ops.Page > 0 {
		page = ops.Page
	}
	if ops.PageSize > 0 {
		pageSize = ops.PageSize
	}

	if ops.Name != "" {
		search := "%" + ops.Name + "%"
		q = q.Where("name LIKE ?", search)
	}

	q = q.Offset((page - 1) * pageSize).Limit(pageSize)
	q = q.Order("created_at DESC")

	var trackers []*Tracker
	err = q.Find(&trackers).Error
	if err != nil {
		return nil, wrapInternalErr(err)
	}

	return trackers, nil
}

func (a *API) NewTracker(licenseID string, name string) (*Tracker, error) {
	tracker := &Tracker{}
	tracker.ID = uuid.NewString()
	tracker.Enabled = false
	tracker.LicenseID = licenseID
	if name != "" {
		tracker.Name = name
	} else {
		var count int64
		a.db.Model(&Tracker{}).Where("license_id = ?", licenseID).Count(&count)
		tracker.Name = fmt.Sprintf("Tracker %d", count+1)
	}

	if err := a.db.Create(tracker).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return tracker, nil
}

func (a *API) Tracker(id string) *Tracker {
	var tracker Tracker
	if err := a.db.Preload("License").First(&tracker, "id = ?", id).Error; err != nil {
		return nil
	}
	return &tracker
}

func (a *API) TrackerCount(licenseID string) (int, error) {
	var count int64
	q := a.db.Model(&Tracker{})
	if licenseID != "" {
		q = q.Where("license_id = ?", licenseID)
	}

	if err := q.Count(&count).Error; err != nil {
		return 0, wrapInternalErr(err)
	}

	return int(count), nil
}

func (a *API) DeleteTracker(id string) error {
	t := a.Tracker(id)

	if err := a.db.Model(&Validation{}).
		Where("tracker_id = ?", t.ID).
		Update("tracker_id", nil).Error; err != nil {
		return wrapInternalErr(err)
	}

	if err := a.db.Delete(t).Error; err != nil {
		return wrapInternalErr(err)
	}

	return nil
}

type ValidationsOptions struct {
	Page      int
	PageSize  int
	LicenseID string
	TrackerID string
}

func (a *API) Validations(ops ValidationsOptions) ([]*Validation, error) {
	page := 1
	pageSize := 30

	if ops.Page > 0 {
		page = ops.Page
	}

	if ops.PageSize > 0 {
		pageSize = ops.PageSize
	}

	query := a.db.Model(&Validation{})
	query = query.Preload("License")
	query = query.Preload("Tracker")

	if ops.LicenseID != "" {
		query = query.Where("license_id = ?", ops.LicenseID)
	}

	if ops.TrackerID != "" {
		query = query.Where("tracker_id = ?", ops.TrackerID)
	}

	query = query.Offset((page - 1) * pageSize).Limit(pageSize)
	query = query.Order("created_at desc")

	var validations []*Validation
	if err := query.Find(&validations).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return validations, nil
}

func (a *API) NewValidation(c *gin.Context, license *License, tracker *Tracker, status ValidationStatus, sig *licensify.Signature, error error) (*Validation, error) {
	v := &Validation{}
	v.ID = uuid.New().String()

	if error != nil {
		v.Error = error.Error()
	}

	v.UserAgent = c.Request.UserAgent()
	v.LicenseID = license.ID
	v.TrackerID = tracker.ID
	v.IP = c.ClientIP()
	v.Status = status

	if sig != nil {
		b, _ := json.Marshal(sig)
		v.Signature = string(b)
	} else {
		v.Signature = ""
	}

	if err := a.db.Create(v).Error; err != nil {
		log.Printf("Error creating validation log %s", err.Error())
	}
	return v, nil
}

func (a *API) ValidationCount(licenseID, trackerID string) (int, error) {
	q := a.db.Model(&Validation{})
	if licenseID != "" {
		q = q.Where("license_id = ?", licenseID)
	}

	if trackerID != "" {
		q = q.Where("tracker_id = ?", trackerID)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return 0, wrapInternalErr(err)
	}

	return int(total), nil
}

type ValidationLisenceActivityResult struct {
	Date         string `json:"date"`
	Count        int    `json:"count"`
	SuccessCount int    `json:"successCount"`
}

func (a *API) ValidationLisenceActivity(licenseID string) ([]*ValidationLisenceActivityResult, error) {
	var result []*ValidationLisenceActivityResult
	start := time.Now().AddDate(0, -1, 0)
	err := a.db.Raw(`
                SELECT
                    date(created_at) AS date,
                    COUNT(*) AS count,
                    COUNT(CASE WHEN status = 'Accepted' THEN 1 ELSE NULL END) as success_count
                FROM validations
                WHERE created_at >= ? AND license_id = ?
                GROUP BY date(created_at)
                ORDER BY date(created_at) ASC
                `, start, licenseID).Scan(&result).Error
	if err != nil {
		return nil, wrapInternalErr(err)
	}

	return result, nil
}

type ValidationLisencesActivityResult struct {
	*License     `json:"license"`
	SuccessCount int64 `json:"successCount"`
	TotalCount   int64 `json:"totalCount"`
}

func (a *API) ValidationLisencesActivity() ([]*ValidationLisencesActivityResult, error) {
	var result []*ValidationLisencesActivityResult
	err := a.db.Raw(`
                WITH stats AS (
                    SELECT
                        license_id,
                        COUNT(CASE WHEN status = 'Accepted' THEN 1 ELSE NULL END) as success_count,
                        COUNT(*) as total_count
                    FROM validations
                    GROUP BY license_id
                )
                SELECT * FROM stats
                JOIN licenses ON stats.license_id = licenses.id
                ORDER BY stats.total_count ASC
                `).Scan(&result).Error
	if err != nil {
		return nil, wrapInternalErr(err)
	}

	return result, nil
}

type ValidationTrackerActivityResult struct {
	Date         string `json:"date"`
	Count        int    `json:"count"`
	SuccessCount int    `json:"successCount"`
}

func (a *API) ValidationTrackerActivity(trackerID string) ([]*ValidationTrackerActivityResult, error) {
	var result []*ValidationTrackerActivityResult
	start := time.Now().AddDate(0, -1, 0)
	err := a.db.Raw(`
                SELECT
                    date(created_at) AS date,
                    COUNT(*) AS count,
                    COUNT(CASE WHEN status = 'Accepted' THEN 1 ELSE NULL END) as success_count
                FROM validations
                WHERE created_at >= ? AND tracker_id = ?
                GROUP BY date(created_at)
                ORDER BY date(created_at) ASC
                `, start, trackerID).Scan(&result).Error
	if err != nil {
		return nil, wrapInternalErr(err)
	}
	return result, nil
}

type ValidationActivityResult struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

func (a *API) ValidationActivity() ([]*ValidationActivityResult, error) {
	weekStart := time.Now().AddDate(0, 0, -7)
	var result []*ValidationActivityResult
	err := a.db.Raw(`
            SELECT
                date(created_at) AS date,
                COUNT(*) AS count
            FROM validations
            WHERE created_at >= ?
            GROUP BY date(created_at)
            ORDER BY date(created_at) ASC
	`, weekStart).Scan(&result).Error
	if err != nil {
		return nil, wrapInternalErr(err)
	}

	return result, nil
}

func (a *API) KeyPair() *KeyPair {
	var kp KeyPair
	if err := a.db.First(&kp).Error; err != nil {
		return nil
	}
	return &kp
}

func (a *API) SetKeyPairFiles(pub, priv *multipart.FileHeader) (*KeyPair, error) {
	pubFile, err := pub.Open()
	if err != nil {
		return nil, ErrInvalidKeyFile
	}

	privFile, err := priv.Open()
	if err != nil {
		return nil, ErrInvalidKeyFile
	}

	pubStr, _ := io.ReadAll(pubFile)
	privStr, _ := io.ReadAll(privFile)

	pub64 := base64.StdEncoding.EncodeToString(pubStr)
	priv64 := base64.StdEncoding.EncodeToString(privStr)

	var kp KeyPair
	if err := a.db.First(&kp).Error; err != nil {
		kp.ID = uuid.NewString()
	}

	kp.PublicKey = pub64
	kp.PrivateKey = priv64

	if err := a.db.Save(&kp).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return &kp, nil
}

func (a *API) SetKeyPair(pub64, priv64 string) (*KeyPair, error) {
	var kp KeyPair
	if err := a.db.First(&kp).Error; err != nil {
		kp.ID = uuid.NewString()
	}

	kp.PublicKey = pub64
	kp.PrivateKey = priv64

	if err := a.db.Save(&kp).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return &kp, nil
}

func (a *API) Client() *Client {
	var client Client
	if a.db.First(&client).Error == nil {
		return &client
	} else {
		return nil
	}
}

func (a *API) SetClient() (*Client, error) {
	var client Client
	if a.db.First(&client).Error != nil {
		client = Client{}
		client.ID = uuid.NewString()
	}

	bytes := make([]byte, 32)
	if _, err := cyrptrand.Read(bytes); err != nil {
		return nil, wrapInternalErr(err)
	}

	client.ApiKey = base64.URLEncoding.EncodeToString(bytes)
	if err := a.db.Save(&client).Error; err != nil {
		return nil, wrapInternalErr(err)
	}

	return &client, nil
}

func (a *API) Validate(ctx *gin.Context) error {
	wrapErr := func(s string) error {
		return fmt.Errorf("%w: %s", ErrValidation, s)
	}

	var sig licensify.Signature
	if err := ctx.ShouldBindJSON(&sig); err != nil {
		a.NewValidation(ctx, nil, nil, StatusSignatureInvalid, nil, err)
		return wrapErr("Invalid signature")
	}

	// Signature validity
	kp := a.KeyPair()
	pub, err := licensify.LoadPublicKeyBase64(kp.PublicKey)
	if err != nil {
		a.NewValidation(ctx, nil, nil, StatusInternalError, nil, err)
		return wrapInternalErr(err)
	}

	err = licensify.NewVerifier(pub).Verify(&sig)
	if err != nil {
		a.NewValidation(ctx, nil, nil, StatusSignatureInvalid, &sig, err)
		return wrapErr("Invalid signature")
	}

	// License validity
	licenseID, ok := sig.License["license-id"].(string)
	if !ok {
		a.NewValidation(ctx, nil, nil, StatusSignatureInvalid, &sig, err)
		return wrapErr("Invalid license ID")
	}

	license := a.License(licenseID)
	if license == nil {
		a.NewValidation(ctx, nil, nil, StatusLicenseUnavailable, &sig, nil)
		return wrapErr("License unavailable")
	}

	// Tracker detection
	var tracker *Tracker
	if sig.License["tracker"] != nil {
		tracker = a.Tracker(sig.License["tracker"].(string))
		if tracker == nil {
			a.NewValidation(ctx, license, nil, StatusTrackerUnavailable, &sig, nil)
			return wrapErr(string(StatusTrackerUnavailable))
		}
	}

	// License active
	if !license.Active {
		a.NewValidation(ctx, license, tracker, StatusLicenseInactive, &sig, nil)
		return wrapErr("License Inactive")
	}

	// Expiration in claims
	exp := sig.License["expiration"]
	if exp != nil {
		expNum := int64(0)
		switch val := exp.(type) {
		case string:
			expNum, err = strconv.ParseInt(val, 10, 64)
			if err != nil {
				a.NewValidation(ctx, license, tracker, StatusSignatureInvalid, &sig, err)
				return wrapErr("Invalid expiration value")
			}
		case float64:
			expNum = int64(val)
		default:
			a.NewValidation(ctx, license, tracker, StatusSignatureInvalid, &sig, nil)
			return wrapErr("Invalid expiration value")
		}

		expTime := time.Unix(expNum, 0)
		if expTime.Before(time.Now()) {
			a.NewValidation(ctx, license, tracker, StatusSignatureExpired, &sig, nil)
			return wrapErr("Signature Expired")
		}
	}

	// Tracker checks
	if tracker != nil {
		// Enabled
		if !tracker.Enabled {
			a.NewValidation(ctx, license, tracker, StatusTrackerDisabled, &sig, nil)
			return wrapErr("Tracker Disabled")
		}

		// Activation
		if tracker.ActivatedDate == nil {
			a.NewValidation(ctx, license, tracker, StatusTrackerNotActivated, &sig, nil)
			return wrapErr("Tracker Not Activated")
		}

		// Expiration
		if tracker.Expiration != nil && tracker.Expiration.Before(time.Now()) {
			a.NewValidation(ctx, license, tracker, StatusTrackerExpired, &sig, err)
			return wrapErr("Tracker Expired")
		}
	}

	a.NewValidation(ctx, license, tracker, StatusAccepted, &sig, nil)
	ctx.Status(http.StatusOK)
	return nil
}

func (a *API) ActivateTracker(id string) error {
	var tracker Tracker
	if err := a.db.First(&tracker, "id = ?", id).Error; err != nil {
		return ErrActivation
	}

	now := time.Now()
	tracker.ActivatedDate = &now
	if err := a.db.Save(&tracker).Error; err != nil {
		return wrapInternalErr(err)
	}

	return nil
}
