package licensify

import (
	"crypto"
	"crypto/rsa"
	"encoding/json"
	"os"
)

// Verifier is responsible for verifying signatures using a public RSA key.
// Should be used in client code on untrusted devices or infrastructure.
type Verifier struct {
	publicKey *rsa.PublicKey
}

// NewVerifier creates a new Verifier with the given RSA public key.
func NewVerifier(publicKey *rsa.PublicKey) *Verifier {
	return &Verifier{
		publicKey: publicKey,
	}
}

// Verify checks the validity of a Signature against the stored public key.
// Main verification method.
func (v *Verifier) Verify(sig *Signature) error {
	decodedSig, err := sig.decoded()
	if err != nil {
		return err
	}

	err = rsa.VerifyPKCS1v15(v.publicKey, crypto.SHA256, sig.License.hash(), decodedSig)
	return err
}

// LoadSignature loads a Signature from a file at the specified path.
// Expects the same format as it was saved with `Signature.Save()`.
func LoadSignature(path string) (*Signature, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	var sig Signature
	if err := json.NewDecoder(file).Decode(&sig); err != nil {
		return nil, err
	}
	return &sig, nil
}
