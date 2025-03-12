package examples

import (
	"fmt"
	"log"

	"github.com/Devpro-Software/licensify/licensify"
)

func sign() {
	priv, err := licensify.LoadPrivateKey("private.pem")
	if err != nil {
		log.Fatal(err)
	}

	license := licensify.NewLicense(map[string]string{
		"date": "2025-03-11",
		"id":   "44c4e2c6-c54e-46d9-be58-c174289b84b8",
	})

	signer := licensify.NewSigner(priv)
	sig, err := signer.Sign(license)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Sig:", sig.Sig)
	sig.Save("license.json")
}
