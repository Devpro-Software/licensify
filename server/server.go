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
	g := gin.Default()
	s.setup(g)
	g.Run(fmt.Sprintf(":%s", s.port))
}

func generateErrorCode() string {
	return fmt.Sprintf("ERR-%d-%d", time.Now().UnixNano(), rand.Intn(1000))
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
	gr := g.Group("/api")
	gr.Use(s.securityFilter)
	gr.GET("/licenses", func(ctx *gin.Context) {
		var licenses []*License
		if err := s.db.Find(&licenses).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &licenses)
	})

	gr.POST("/licenses", func(ctx *gin.Context) {
		var req struct {
			Product string         `json:"product"`
			Data    map[string]any `json:"data"`
			Active  bool           `json:"active"`
		}

		if err := json.NewDecoder(ctx.Request.Body).Decode(&req); err != nil {
			http.Error(ctx.Writer, "Invalid body", http.StatusBadRequest)
			return
		}
		defer ctx.Request.Body.Close()

		license := License{}
		license.ID = uuid.New().String()
		license.Active = req.Active
		license.Product = req.Product
		license.Data = req.Data

		if err := s.db.Create(&license).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, license)
	})

	gr.GET("/licenses/:id", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		ctx.JSON(http.StatusOK, &license)
	})

	gr.PUT("/licenses/:id", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		active := ctx.Request.URL.Query().Get("active")
		switch active {
		case "true":
			license.Active = true
			s.db.Save(&license)
		case "false":
			license.Active = false
			s.db.Save(&license)
		}

		ctx.JSON(http.StatusOK, &license)
	})

	gr.POST("/licenses/:id/sign", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}
		sig, err := s.signer.Sign(licensify.NewLicense(map[string]string{
			"license-id": license.ID,
			"product":    license.Product,
		}))
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &sig)
	})

	gr.POST("/validate", func(ctx *gin.Context) {
		var sig licensify.Signature
		if err := json.NewDecoder(ctx.Request.Body).Decode(&sig); err != nil {
			internalError(ctx, err)
			return
		}
		defer ctx.Request.Body.Close()

		err := s.verifier.Verify(&sig)
		if err != nil {
			http.Error(ctx.Writer, "Invalid signature", http.StatusUnauthorized)
			return
		}

		licenseID := sig.License["license-id"]
		var license License
		if err := s.db.First(&license, "id = ?", licenseID).Error; err != nil {
			internalError(ctx, err)
			return
		}

		if !license.Active {
			http.Error(ctx.Writer, "License Inactive", http.StatusUnauthorized)
			return
		}

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
