package licensify

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
)

// LoadPrivateKey loads an RSA private key from a PEM file.
// The key must be of PKCS #8 form.
func LoadPrivateKey(pemfile string) (*rsa.PrivateKey, error) {
	keyBytes, err := os.ReadFile(pemfile)
	if err != nil {
		return nil, err
	}
	block, _ := pem.Decode(keyBytes)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block containing private key")
	}

	priv, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	pk, ok := priv.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("failed to load private key")
	}

	return pk, nil
}

// LoadPublicKey loads an RSA public key from a PEM file.
func LoadPublicKey(pemfile string) (*rsa.PublicKey, error) {
	keyBytes, err := os.ReadFile(pemfile)
	if err != nil {
		return nil, err
	}
	block, _ := pem.Decode(keyBytes)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block containing public key")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	pk, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("failed to load public key")
	}

	return pk, nil
}
