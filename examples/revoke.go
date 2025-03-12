package examples

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/Devpro-Software/licensify/licensify"
)

// Endpoint to validate and check if license has been revoked.
// A server side check like this one, provides full control over your license.
func revoke(w http.ResponseWriter, r *http.Request) {
	// load the signature from the request
	var sig licensify.Signature
	if err := json.NewDecoder(r.Body).Decode(&sig); err != nil {
		http.Error(w, "Invalid request body - expected a signature", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// load public key, or store in memory as you like
	// can also be fetched from your authority server
	pub, err := licensify.LoadPublicKey("public.pem")
	if err != nil {
		log.Fatal(err)
	}

	// verify the signature
	verifier := licensify.NewVerifier(pub)
	err = verifier.Verify(&sig)
	if err != nil {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	// retrieve client specific information from the signature
	// this works because we know the signature has not been tampered with because it was signed with our private key
	licenseID := sig.License.Get("license-id")
	fmt.Println("Recieved valid request from license:", licenseID)

	// db.Find(licenseID) ...

	// you can do what you need for your business logic
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(&sig)
}
