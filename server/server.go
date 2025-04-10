package main

import (
	cyrptrand "crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
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

	prod   bool
	apiKey string

	signer   *licensify.Signer
	verifier *licensify.Verifier
}

func newServer(port, dsn, apiKey, pubPath, privPath string, prod bool) *Server {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	priv, err := licensify.LoadPrivateKey(privPath)
	if err != nil {
		log.Fatal(err)
	}

	signer := licensify.NewSigner(priv)

	pub, err := licensify.LoadPublicKey(pubPath)
	if err != nil {
		log.Fatal(err)
	}

	verifier := licensify.NewVerifier(pub)

	return &Server{
		port:     port,
		db:       db,
		prod:     prod,
		apiKey:   apiKey,
		signer:   signer,
		verifier: verifier,
	}
}

func (s *Server) Start() {
	if !s.prod {
		log.Println("Running in development mode")
		if s.apiKey == "" {
			s.apiKey = uuid.New().String()
		}
		log.Printf("API-KEY: %s", s.apiKey)
	}

	s.db.AutoMigrate(&License{})
	s.db.AutoMigrate(&Validation{})
	s.db.AutoMigrate(&Preset{})
	s.db.AutoMigrate(&Tracker{})
	s.db.AutoMigrate(&User{})
	s.db.AutoMigrate(&Session{})
	s.db.AutoMigrate(&Client{})

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

		if err := s.verifier.Verify(&sig); err != nil {
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
		var sig licensify.Signature
		if err := ctx.ShouldBindJSON(&sig); err != nil {
			s.saveValidation(ctx, "", "", StatusInvalidSignature, nil, err)
			ctx.Status(http.StatusUnauthorized)
			return
		}

		err := s.verifier.Verify(&sig)
		if err != nil {
			ctx.String(http.StatusUnauthorized, "Invalid signature")
			s.saveValidation(ctx, "", "", StatusInvalidSignature, &sig, err)
			return
		}

		licenseID := sig.License["license-id"]
		var license License
		if err := s.db.First(&license, "id = ?", licenseID).Error; err != nil {
			err := fmt.Errorf("License unavailable")
			ctx.String(http.StatusUnauthorized, err.Error())
			s.saveValidation(ctx, "", "", StatusLicenseUnavailable, &sig, err)
			return
		}

		var tracker *Tracker
		trackerId := ""
		if sig.License["tracker"] != "" {
			var t Tracker
			if s.db.First(&t, "id = ?", sig.License["tracker"]).Error != nil {
				ctx.String(http.StatusUnauthorized, string(StatusTrackerUnavailable))
				s.saveValidation(ctx, licenseID, "", StatusTrackerUnavailable, &sig, err)
				return
			}
			tracker = &t
			trackerId = tracker.ID
		}

		if !license.Active {
			err := fmt.Errorf("License Inactive")
			ctx.String(http.StatusUnauthorized, err.Error())
			s.saveValidation(ctx, licenseID, trackerId, StatusLicenseInactive, &sig, err)
			return
		}

		if tracker != nil {
			if !tracker.Enabled {
				ctx.String(http.StatusUnauthorized, "Tracker Disabled")
				s.saveValidation(ctx, licenseID, trackerId, StatusTrackerDisabled, &sig, err)
				return
			}

			if tracker.ActivatedDate == nil {
				ctx.String(http.StatusUnauthorized, "Tracker Not Activated")
				s.saveValidation(ctx, licenseID, trackerId, StatusTrackerNotActivated, &sig, err)
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

	gapi.POST("/keys", func(ctx *gin.Context) {
		pub, err := ctx.FormFile("publicKey")
		if err != nil {
			log.Println(err)
			return
		}

		priv, err := ctx.FormFile("privateKey")
		if err != nil {
			log.Println(err)
			return
		}

		// TODO:
		fmt.Println(pub.Filename)
		fmt.Println(priv.Filename)
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
