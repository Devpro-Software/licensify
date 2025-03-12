// Copyright (c) Devpro
// This software is licensed under the MIT License.
// See the LICENSE file in the root directory for more information.

package licensify

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"os"
)

// Signer signs licenses using a private RSA key.
// Generates distributable signatures for client devices or untrusted infrastructure.
type Signer struct {
	privateKey *rsa.PrivateKey
}

// NewSigner creates a new Signer with the given RSA private key.
func NewSigner(privateKey *rsa.PrivateKey) *Signer {
	return &Signer{
		privateKey: privateKey,
	}
}

// Sign signs the given License and returns a Signature.
// The result Signature can be saved to a file and distributed.
func (s *Signer) Sign(license License) (*Signature, error) {
	sig, err := rsa.SignPKCS1v15(rand.Reader, s.privateKey, crypto.SHA256, license.hash())
	if err != nil {
		return nil, err
	}

	encoded := base64.StdEncoding.EncodeToString(sig)
	return &Signature{Sig: encoded, License: license}, nil
}

// Signature represents a license with its signature.
type Signature struct {
	Sig     string  `json:"sig"`
	License License `json:"license"`
}

// Save writes the Signature to a file at the specified path.
// Saves in json format.
func (s *Signature) Save(path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	return json.NewEncoder(file).Encode(s)
}

// decoded returns the decoded signature as a byte slice.
func (s *Signature) decoded() ([]byte, error) {
	return base64.StdEncoding.DecodeString(s.Sig)
}
