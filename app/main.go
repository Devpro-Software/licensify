package main

import (
	"log"
	"os"

	"github.com/Devpro-Software/licensify/licensify"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err == nil {
		log.Println("Using .env")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("Environment variable `DATABASE_URL` is missing")
		return
	}

	pubBase64 := os.Getenv("PUBLIC_KEY")
	privBase64 := os.Getenv("PRIVATE_KEY")

	_, err := licensify.LoadPublicKeyBase64(pubBase64)
	if err != nil {
		log.Fatal("Environment variable `PUBLIC_KEY` is missing or invalid")
		return
	}

	_, err = licensify.LoadPrivateKeyBase64(privBase64)
	if err != nil {
		log.Fatal("Environment variable `PRIVATE_KEY` is missing or invalid")
		return
	}

	port := os.Getenv("PORT")
	if port == "" {
		log.Println("Using default port 8080")
		port = "8080"
	}

	server := newServer(
		port,
		dsn,
		pubBase64,
		privBase64,
		os.Getenv("PRODUCTION") != "false",
	)

	server.Start()
}
