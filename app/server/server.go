package server

import (
	cyrptrand "crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/Devpro-Software/licensify/licensify"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Server struct {
	port string
	db   *gorm.DB

	prod bool
}

func newServer(port, dsn, pub, priv string, prod bool) *Server {
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

	var kp KeyPair
	if err := db.First(&kp).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			kp = KeyPair{}
			kp.ID = uuid.NewString()
			kp.PublicKey = pub
			kp.PrivateKey = priv
			db.Save(&kp)
		} else {
			log.Fatal(err)
		}
	}

	return &Server{
		port: port,
		db:   db,
		prod: prod,
	}
}

func (s *Server) Start() {
	if !s.prod {
		s.createTestUser()
	}

	g := gin.Default()
	s.setup(g)
	g.Run(fmt.Sprintf(":%s", s.port))
}

func generateErrorCode() string {
	return fmt.Sprintf("ERR-%d-%d", time.Now().UnixNano(), rand.Intn(1000))
}

func (s *Server) saveValidation(c *gin.Context, licenseID string, trackerID string, status ValidationStatus, sig *licensify.Signature, err error) {
	v := &Validation{}
	v.ID = uuid.New().String()
	if err != nil {
		v.Error = err.Error()
	}

	v.UserAgent = c.Request.UserAgent()
	v.LicenseID = licenseID
	v.TrackerID = trackerID
	v.IP = c.ClientIP()
	v.Status = status

	if sig != nil {
		b, _ := json.Marshal(sig)
		v.Signature = string(b)
	} else {
		v.Signature = ""
	}

	if err := s.db.Create(v).Error; err != nil {
		log.Printf("Error creating validation log %s", err.Error())
	}
}

func internalError(c *gin.Context, err error) {
	code := generateErrorCode()
	c.Error(fmt.Errorf("%s - %v", code, err))
	c.JSON(http.StatusInternalServerError, gin.H{"error": code})
}

func getApiKey(c *gin.Context) string {
	const apiKeyHeader = "API-KEY"
	return c.GetHeader(apiKeyHeader)
}

func (s *Server) setup(g *gin.Engine) {
	g.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept", "Authorization", "API-KEY"},
	}))

	gapi := g.Group("/api")
	gauth := g.Group("/auth")

	gapi.Use(s.authMiddleware)
	s.setupLicenseEndpoints(gapi)
	s.setupTrackerEndpoints(gapi)
	s.setupValidationEndpoints(gapi)
	s.setupAuthEndpoints(gauth, gapi)

	g.POST("/api/activate", func(ctx *gin.Context) {
		var sig licensify.Signature
		if err := ctx.ShouldBindJSON(&sig); err != nil {
			ctx.Status(http.StatusUnauthorized)
			return
		}

		var keyPair KeyPair
		s.db.First(&keyPair)
		pub, err := licensify.LoadPublicKeyBase64(keyPair.PublicKey)
		if err != nil {
			internalError(ctx, err)
			return
		}

		if err := licensify.NewVerifier(pub).Verify(&sig); err != nil {
			ctx.Status(http.StatusUnauthorized)
			return
		}

		trackerId := sig.License["tracker"]
		if trackerId == "" {
			ctx.String(http.StatusBadRequest, "No tracker in signature")
			return
		}

		var tracker Tracker
		if err := s.db.First(&tracker, "id = ?", trackerId).Error; err != nil {
			ctx.String(http.StatusInternalServerError, "Tracker not available")
			return
		}

		now := time.Now()
		tracker.ActivatedDate = &now
		s.db.Save(&tracker)
	})

	g.POST("/api/validate", func(ctx *gin.Context) {
		// Signature validity
		var sig licensify.Signature
		if err := ctx.ShouldBindJSON(&sig); err != nil {
			s.saveValidation(ctx, "", "", StatusSignatureInvalid, nil, err)
			ctx.Status(http.StatusUnauthorized)
			return
		}

		var keyPair KeyPair
		s.db.First(&keyPair)
		pub, err := licensify.LoadPublicKeyBase64(keyPair.PublicKey)
		if err != nil {
			internalError(ctx, err)
			return
		}

		err = licensify.NewVerifier(pub).Verify(&sig)
		if err != nil {
			ctx.String(http.StatusUnauthorized, "Invalid signature")
			s.saveValidation(ctx, "", "", StatusSignatureInvalid, &sig, err)
			return
		}

		// License validity
		licenseID, ok := sig.License["license-id"].(string)
		if !ok {
			ctx.String(http.StatusUnauthorized, "Invalid license ID")
			s.saveValidation(ctx, "", "", StatusSignatureInvalid, &sig, err)
			return
		}

		var license License
		if err := s.db.First(&license, "id = ?", licenseID).Error; err != nil {
			err := fmt.Errorf("License unavailable")
			ctx.String(http.StatusUnauthorized, err.Error())
			s.saveValidation(ctx, "", "", StatusLicenseUnavailable, &sig, err)
			return
		}

		// Tracker detection
		var tracker *Tracker
		trackerId := ""
		if sig.License["tracker"] != nil {
			var t Tracker
			if s.db.First(&t, "id = ?", sig.License["tracker"]).Error != nil {
				ctx.String(http.StatusUnauthorized, string(StatusTrackerUnavailable))
				s.saveValidation(ctx, licenseID, "", StatusTrackerUnavailable, &sig, err)
				return
			}
			tracker = &t
			trackerId = tracker.ID
		}

		// License active
		if !license.Active {
			err := fmt.Errorf("License Inactive")
			ctx.String(http.StatusUnauthorized, err.Error())
			s.saveValidation(ctx, licenseID, trackerId, StatusLicenseInactive, &sig, err)
			return
		}

		// Expiration in claims
		exp := sig.License["expiration"]
		if exp != nil {
			expNum := int64(0)
			switch val := exp.(type) {
			case string:
				expNum, err = strconv.ParseInt(val, 10, 64)
				if err != nil {
					ctx.String(http.StatusUnauthorized, "Invalid expiration value")
					s.saveValidation(ctx, licenseID, trackerId, StatusSignatureInvalid, &sig, err)
					return
				}
			case float64:
				expNum = int64(val)
			default:
				ctx.String(http.StatusUnauthorized, "Invalid expiration value")
				s.saveValidation(ctx, licenseID, trackerId, StatusSignatureInvalid, &sig, err)
				return
			}

			expTime := time.Unix(expNum, 0)
			if expTime.Before(time.Now()) {
				ctx.String(http.StatusUnauthorized, "Signature Expired")
				s.saveValidation(ctx, licenseID, trackerId, StatusSignatureExpired, &sig, err)
				return
			}
		}

		// Tracker checks
		if tracker != nil {
			// Enabled
			if !tracker.Enabled {
				ctx.String(http.StatusUnauthorized, "Tracker Disabled")
				s.saveValidation(ctx, licenseID, trackerId, StatusTrackerDisabled, &sig, err)
				return
			}

			// Activation
			if tracker.ActivatedDate == nil {
				ctx.String(http.StatusUnauthorized, "Tracker Not Activated")
				s.saveValidation(ctx, licenseID, trackerId, StatusTrackerNotActivated, &sig, err)
				return
			}

			// Expiration
			if tracker.Expiration != nil && tracker.Expiration.Before(time.Now()) {
				ctx.String(http.StatusUnauthorized, "Tracker Expired")
				s.saveValidation(ctx, licenseID, trackerId, StatusTrackerExpired, &sig, err)
				return
			}
		}

		s.saveValidation(ctx, licenseID, trackerId, StatusAccepted, &sig, nil)
		ctx.Status(http.StatusOK)
	})

	gapi.POST("/client", func(ctx *gin.Context) {
		var client Client
		if s.db.First(&client).Error != nil {
			client = Client{}
			client.ID = uuid.NewString()
		}

		bytes := make([]byte, 32)
		if _, err := cyrptrand.Read(bytes); err != nil {
			internalError(ctx, err)
			return
		}
		client.ApiKey = base64.URLEncoding.EncodeToString(bytes)
		s.db.Save(&client)
		ctx.JSON(http.StatusOK, client)
	})

	gapi.GET("/client", func(ctx *gin.Context) {
		var client Client
		if s.db.First(&client).Error == nil {
			ctx.JSON(http.StatusOK, client)
		} else {
			ctx.JSON(http.StatusOK, gin.H{})
		}
	})

	gapi.GET("/keys", func(ctx *gin.Context) {
		var kp KeyPair
		if err := s.db.First(&kp).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &kp)
	})

	gapi.POST("/keys", func(ctx *gin.Context) {
		pub, err := ctx.FormFile("publicKey")
		priv, err2 := ctx.FormFile("privateKey")
		if err != nil || err2 != nil {
			ctx.String(http.StatusBadRequest, "Invalid keys")
			return
		}

		pubFile, err := pub.Open()
		if err != nil {
			ctx.String(http.StatusBadRequest, "Invalid pub file")
			return
		}

		privFile, err := priv.Open()
		if err != nil {
			ctx.String(http.StatusBadRequest, "Invalid priv file")
			return
		}

		pubStr, _ := io.ReadAll(pubFile)
		privStr, _ := io.ReadAll(privFile)

		pub64 := base64.StdEncoding.EncodeToString(pubStr)
		priv64 := base64.StdEncoding.EncodeToString(privStr)

		var kp KeyPair
		if err := s.db.First(&kp).Error; err != nil {
			internalError(ctx, err)
			return
		}

		kp.PublicKey = pub64
		kp.PrivateKey = priv64

		if err := s.db.Save(&kp).Error; err != nil {
			internalError(ctx, err)
			return
		}
	})

	g.NoRoute(func(ctx *gin.Context) {
		log.Println(ctx.Request.URL.Path)
		dir := http.Dir("client/out")
		_, err := os.Stat(filepath.Join("client", "out", ctx.Request.URL.Path+".html"))
		if err == nil {
			ctx.Request.URL.Path = ctx.Request.URL.Path + ".html"
		}
		http.FileServer(dir).ServeHTTP(ctx.Writer, ctx.Request)
	})
}
