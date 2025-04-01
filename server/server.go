package main

import (
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
	s.db.AutoMigrate(&User{})
	s.db.AutoMigrate(&Session{})
	g := gin.Default()
	s.setup(g)
	g.Run(fmt.Sprintf(":%s", s.port))
}

func generateErrorCode() string {
	return fmt.Sprintf("ERR-%d-%d", time.Now().UnixNano(), rand.Intn(1000))
}

func (s *Server) saveValidation(c *gin.Context, licenseID string, err error) {
	v := &Validation{}
	v.ID = uuid.New().String()
	if err != nil {
		v.Error = err.Error()
		v.Succeeded = false
	} else {
		v.Succeeded = true
	}

	v.UserAgent = c.Request.UserAgent()
	v.LicenseID = licenseID
	v.IP = c.ClientIP()

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

func (s *Server) securityFilter(c *gin.Context) {
	apiKey := getApiKey(c)
	if apiKey == "" {
		c.Status(http.StatusUnauthorized)
		c.Abort()
		return
	}

	if s.apiKey != apiKey {
		c.Status(http.StatusUnauthorized)
		c.Abort()
		return
	}
	c.Next()
}

func (s *Server) setup(g *gin.Engine) {
	g.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept", "Authorization", "API-KEY"},
	}))

	gr := g.Group("/api")
	gauth := g.Group("/auth")
	gr.Use(s.authMiddleware)
	s.setupLicenseEndpoints(gr)
	s.setupValidationEndpoints(gr)
	s.setupUserEndpoints(gauth)

	g.POST("/api/validate", func(ctx *gin.Context) {
		var sig licensify.Signature
		if err := json.NewDecoder(ctx.Request.Body).Decode(&sig); err != nil {
			internalError(ctx, err)
			return
		}
		defer ctx.Request.Body.Close()

		err := s.verifier.Verify(&sig)
		if err != nil {
			http.Error(ctx.Writer, "Invalid signature", http.StatusUnauthorized)
			s.saveValidation(ctx, "", err)
			return
		}

		licenseID := sig.License["license-id"]
		var license License
		if err := s.db.First(&license, "id = ?", licenseID).Error; err != nil {
			internalError(ctx, err)
			s.saveValidation(ctx, "", err)
			return
		}

		if !license.Active {
			err := fmt.Errorf("License Inactive")
			http.Error(ctx.Writer, err.Error(), http.StatusUnauthorized)
			s.saveValidation(ctx, licenseID, err)
			return
		}

		s.saveValidation(ctx, licenseID, nil)
		ctx.Status(http.StatusOK)
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
