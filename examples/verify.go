package examples

import (
	"fmt"
	"log"

	"github.com/Devpro-Software/licensify/licensify"
)

// Example verify function.
// Verifies that a distributed signature is valid.
func verify() {
	// load public key
	pub, err := licensify.LoadPublicKey("public.pem")
	if err != nil {
		log.Fatal(err)
	}

	// load signature
	sig, err := licensify.LoadSignature("license.json")
	if err != nil {
		log.Fatal(err)
	}

	// build a verifier
	verifier := licensify.NewVerifier(pub)

	// verify the signature
	err = verifier.Verify(sig)

	// licenseID := sig.License.Get("ID")

	if err == nil {
		fmt.Println("✅ Valid signature")
	} else {
		fmt.Println("❌ Invalid signature")
	}
}
