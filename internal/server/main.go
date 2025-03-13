package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal(err)
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("Environment variable `DATABASE_URL` is missing")
		return
	}

	pub := os.Getenv("PUBLIC_KEY")
	if dsn == "" {
		log.Fatal("Environment variable `PUBLIC_KEY` is missing")
		return
	}

	priv := os.Getenv("PRIVATE_KEY")
	if dsn == "" {
		log.Fatal("Environment variable `PRIVATE_KEY` is missing")
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
		os.Getenv("API_KEY"),
		pub,
		priv,
		os.Getenv("PRODUCTION") != "false",
	)

	server.Start()
}
