// Copyright (c) Devpro
// This software is licensed under the MIT License.
// See the LICENSE file in the root directory for more information.

package licensify

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
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
	return LoadPrivateKeyStr(string(keyBytes))
}

// LoadPublicKey loads an RSA public key from a PEM file.
func LoadPublicKey(pemfile string) (*rsa.PublicKey, error) {
	keyBytes, err := os.ReadFile(pemfile)
	if err != nil {
		return nil, err
	}
	return LoadPublicKeyStr(string(keyBytes))
}

// LoadPrivateKey loads an RSA private key from a base64 encoded value.
// The key must be of PKCS #8 form.
func LoadPrivateKeyBase64(value string) (*rsa.PrivateKey, error) {
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return nil, err
	}

	return LoadPrivateKeyStr(string(decoded))
}

// LoadPublicKey loads an RSA public key from a base64 encoded string.
func LoadPublicKeyBase64(value string) (*rsa.PublicKey, error) {
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return nil, err
	}
	return LoadPublicKeyStr(string(decoded))
}

// LoadPrivateKey loads an RSA private key from a value string.
// The key must be of PKCS #8 form.
func LoadPrivateKeyStr(value string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(value))
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

// LoadPublicKey loads an RSA public key from a value string.
func LoadPublicKeyStr(value string) (*rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(value))
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
