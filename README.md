# Licensify: Digital License Signatures & Verification 🔐

Licensify is a powerful Go library that simplifies the process of creating, signing, and verifying digital licenses. It provides an easy-to-use interface for developers to manage licenses, ensuring secure distribution and verification across different platforms.

Whether you're building a commercial software product or a subscription-based service, Licensify offers an efficient solution for license management.

## Features ✨

- **Create Licenses** 📝: Generate licenses with customizable key-value data.
- **Sign Licenses** ✍️: Secure your licenses by signing them with your private key.
- **Verify Signatures** ✅: Easily verify license authenticity using public keys, ensuring trust even in untrusted environments.
- **Full Support** 💪: Supports both client-side and server-side flow.

## Installation 📦

To integrate Licensify into your Go project, run the following command:

```bash
go get github.com/Devpro-Software/licensify
```

## Getting Started 🚀

To use Licensify, you'll need to generate a pair of RSA keys: a private key for signing licenses and a public key for verifying them. Here's how to generate these keys using `openssl`.

### Overview of Key Concepts 🔑

Before diving into code, let’s walk through some key concepts that Licensify relies on:

1. **License**: A license contains arbitrary key-value pairs. You can use it to store any information related to your product, such as user details, expiration dates, and features.
2. **Private Key**: The private key is used to sign the license, ensuring that only you (the developer) can generate valid licenses.
3. **Public Key**: The public key is used to verify the authenticity of the signed license. It’s safe to distribute to client devices.
4. **Signature**: A cryptographic signature is generated from the license and private key. It ensures that the license hasn’t been tampered with.

### Flow of License Management 🔄

The typical flow for using Licensify involves three main stages:

1. **Creating and Signing a License**: Generate a license, sign it, and distribute it.
2. **Saving the Signature**: Store the signed license securely on the client side.
3. **Verifying the License**: When the client uses the license, the server or client application verifies its authenticity.

### Example Usage 💡

Below are the steps to use Licensify to create and verify a digital license.

Generate RSA Keys here: [How to generate public and private keys](#generating-rsa-public-and-private-keys)

#### 1. Signing a License (Server Side / Backend)

To start, you'll need to generate a signed license using your private key. The license can then be distributed to your clients.

```go
// Load your private key from a PEM file
priv, err := licensify.LoadPrivateKey("./private.pem")
if err != nil {
    log.Fatal("Error loading private key:", err)
}

// Create a signer with this private key
signer := licensify.NewSigner(priv)

// Create a new license with key-value pairs
license := licensify.NewLicense(map[string]string{
    "date": "2025-01-01",
    "product": "Pro Version",
    "user": "Alice",
})

// Sign the license with the private key
sig, err := signer.Sign(license)
if err != nil {
    log.Fatal("Error signing the license:", err)
}

// Save the signed license (signature) to a file
sig.Save("signed_license.json")
fmt.Println("License signed and saved successfully!")
```

#### 2. Verifying a License (Client Side)

On the client side or untrusted infrastructure, you will verify the license signature using the public key.

```go
// Load the public key to verify the signature
pk, err := licensify.LoadPublicKey("./public.pem")
if err != nil {
    log.Fatal("Error loading public key:", err)
}

// Load the saved signature (signed license)
sig, err := licensify.LoadSignature("./signed_license.json")
if err != nil {
    log.Fatal("Error loading signature:", err)
}

// Create a verifier to check the license validity
verifier := licensify.NewVerifier(pk)
err = verifier.Verify(sig)
if err != nil {
    log.Fatal("License verification failed:", err)
}

fmt.Println("License is valid!")
```

## Generating RSA Public and Private Keys 🛠️

### 1. Generate a Private Key

Run the following command to generate an RSA private key and save it to a file:

```bash
openssl genpkey -algorithm RSA -out private.pem
```

This will create a private key (`private.pem`)

### 2. Generate a Public Key

Once you have the private key, you can generate the corresponding public key using the following command:

```bash
openssl rsa -pubout -in private.pem -out public.pem
```

This will extract the public key from the private key and save it to `public.pem`.

### 3. Key Details

- **Private Key (`private.pem`)**: Used for signing the license. Keep this file secure and never share it with clients.
- **Public Key (`public.pem`)**: Used for verifying the license signature. This key can be safely shared with clients or included in your client-side application.

### Best Practices for License Management ⚡

- **Secure Private Key**: Your private key is critical. Keep it secure and never expose it in your client-side code or repository.
- **Regular Key Rotation**: Regularly rotate your private and public keys to minimize the risk of key exposure.
- **Offline Verification**: Licenses can be verified offline using public keys, making it ideal for environments where server access is limited.
- **Expiry and Revocation**: Design your license data to include expiration dates or revocation statuses for better control over license validity.

## Roadmap 🗺️

### 1. Encrypted Private Key Support 🔒

Support for encrypted private keys, allowing secure loading with a passphrase.

### 2. Alternative Key Types 🔄

Adding support for key types like **ECDSA** and **Ed25519** for more flexibility.

### 3. License Expiry and Revocation ⏰

Introducing support for setting expiration dates and revoking licenses, allowing greater control over license validity and management.

## License ⚖️

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing 🤝

We welcome contributions! If you'd like to contribute to Licensify, feel free to open an issue or submit a pull request. Your improvements are highly appreciated.

## Contact 📬

For questions or support, please reach out to [gpiccirillo@devprodigital.com].

---
