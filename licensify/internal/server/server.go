package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/Devpro-Software/licensify/licensify"
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
	s.setup()
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", s.port), nil))
}

func (s *Server) setup() {
	auth := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			apikey := r.Header.Get("API-KEY")
			if apikey != s.apiKey {
				http.Error(w, "", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}

	http.Handle("/licenses", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			var licenses []*License
			if err := s.db.Find(&licenses).Error; err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				log.Println(err)
				return
			}

			json.NewEncoder(w).Encode(&licenses)
		case "POST":
			var req struct {
				Product string         `json:"product"`
				Data    map[string]any `json:"data"`
				Active  bool           `json:"active"`
			}

			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid body", http.StatusBadRequest)
				return
			}
			defer r.Body.Close()

			license := License{}
			license.ID = uuid.New().String()
			license.Active = req.Active
			license.Product = req.Product
			license.Data = req.Data

			if err := s.db.Create(&license).Error; err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			json.NewEncoder(w).Encode(license)
		}
	})))

	http.Handle("/licenses/{id}", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		licenseID := r.PathValue("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(w, r)
			return
		}

		switch r.Method {
		case "GET":
			json.NewEncoder(w).Encode(&license)
		case "PUT":
			active := r.URL.Query().Get("active")
			switch active {
			case "true":
				license.Active = true
				s.db.Save(&license)
			case "false":
				license.Active = false
				s.db.Save(&license)
			}

			json.NewEncoder(w).Encode(&license)
		}
	})))

	http.Handle("/licenses/{id}/sign", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		licenseID := r.PathValue("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(w, r)
			return
		}

		switch r.Method {
		case "POST":
			sig, err := s.signer.Sign(licensify.NewLicense(map[string]string{
				"license-id": license.ID,
				"product":    license.Product,
			}))
			if err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				log.Println(err)
				return
			}

			json.NewEncoder(w).Encode(&sig)
		default:
			http.NotFound(w, r)

		}
	})))

	http.HandleFunc("/validate", func(w http.ResponseWriter, r *http.Request) {
		var sig licensify.Signature
		if err := json.NewDecoder(r.Body).Decode(&sig); err != nil {
			http.Error(w, "Invalid request body - expected a signature", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		err := s.verifier.Verify(&sig)
		if err != nil {
			http.Error(w, "Invalid signature", http.StatusUnauthorized)
			return
		}

		licenseID := sig.License.Get("license-id")
		var license License
		if err := s.db.First(&license, "id = ?", licenseID).Error; err != nil {
			http.Error(w, "Internal error", http.StatusInternalServerError)
			log.Println(err)
			return
		}

		w.WriteHeader(http.StatusOK)
	})
}
