package server

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	Port        string
	BypassAuth  bool
}

func LoadConfig() *Config {
	godotenv.Load()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("Environment variable `DATABASE_URL` is missing")
		return nil
	}

	port := os.Getenv("PORT")
	if port == "" {
		log.Println("Using default port 8080")
		port = "8080"
	}

	return &Config{
		DatabaseURL: dsn,
		Port:        port,
		BypassAuth:  os.Getenv("BYPASS_AUTH") == "true",
	}
}
