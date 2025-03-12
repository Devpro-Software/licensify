package examples

import (
	"fmt"
	"log"

	"github.com/Devpro-Software/licensify/licensify"
)

func verify() {
	pk, err := licensify.LoadPublicKey("public.pem")
	if err != nil {
		log.Fatal(err)
	}

	sig, err := licensify.LoadSignature("license.json")
	if err != nil {
		log.Fatal(err)
	}

	verifier := licensify.NewVerifier(pk)
	err = verifier.Verify(sig)
	fmt.Println(err)
}
