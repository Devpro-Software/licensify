package examples

import (
	"fmt"
	"log"
	"time"

	"github.com/Devpro-Software/licensify/licensify"
	"github.com/google/uuid"
)

// Example function to sign a license.
// Generates a signature that can be distributed.
// Your application can store any meta data, and therefore can implement any feature around this.
func sign() *licensify.Signature {
	// load the private key (can be kept in memory as well)
	priv, err := licensify.LoadPrivateKey("private.pem")
	if err != nil {
		log.Fatal(err)
	}

	// build a signer with this key
	signer := licensify.NewSigner(priv)

	// get license id from your backend (or anything you want)
	licenseID := uuid.New().String()

	// craft a license withn your client information
	license := licensify.NewLicense(map[string]string{
		"expiry":  time.Now().Add(time.Hour * 24 * 365).String(),
		"id":      licenseID,
		"product": "Pro Version",
	})

	// sign the license
	sig, err := signer.Sign(license)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Sig:", sig.Sig)

	// optionally save it to a file or continue with your business logic
	// this file can be sent to your client
	sig.Save("license.json")
	return sig
}
