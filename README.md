# Licensify: Digital License Signatures & Verification 🔐

Licensify is a powerful suite of tools that simplifies the process of creating, signing, and verifying digital licenses. It provides an easy-to-use interface for developers to manage licenses, ensuring secure distribution and verification across different platforms.

Whether you're building a commercial software product or a subscription-based service, Licensify offers an efficient solution for license management.

## Features ✨

- **Create Licenses** 📝: Generate licenses with customizable key-value data.
- **Sign Licenses** ✍️: Secure your licenses by signing them with your private key.
- **Verify Signatures** ✅: Easily verify license authenticity using public keys, ensuring trust even in untrusted environments.
- **Ready-to-Use Server** 🖥️: Includes a complete license management server with REST API for creating, managing, and validating licenses.
- **Full Support** 💪: Supports both client-side and server-side flow.

## Installation 📦

To integrate Licensify into your Go project, run the following command:

```bash
go get github.com/Devpro-Software/licensify
```

## Getting Started 🚀

To use Licensify, you'll need to generate a pair of RSA keys: a private key for signing licenses and a public key for verifying them. Here's how to generate these: [How to generate public and private keys](
https://github.com/Devpro-Software/licensify?tab=readme-ov-file#generating-rsa-public-and-private-keys-%EF%B8%8F).

### Overview of Key Concepts 🔑

Before diving into code, let's walk through some key concepts that Licensify relies on:

1. **License**: A license contains arbitrary key-value pairs. You can use it to store any information related to your product, such as user details, expiration dates, and features.
2. **Private Key**: The private key is used to sign the license, ensuring that only you (the developer) can generate valid licenses.
3. **Public Key**: The public key is used to verify the authenticity of the signed license. It's safe to distribute to client devices.
4. **Signature**: A cryptographic signature is generated from the license and private key. It ensures that the license hasn't been tampered with.

### Flow of License Management 🔄

The typical flow for using Licensify involves three main stages:

1. **Creating and Signing a License**: Generate a license, sign it, and distribute it.
2. **Saving the Signature**: Store the signed license securely on the client side.
3. **Verifying the License**: When the client uses the license, the server or client application verifies its authenticity.

### Example Usage 💡

Below are the steps to use Licensify Go library to create and verify a digital license.

You first need to generate RSA Keys. These keys help you sign and verify the license signatures. You can generate them by following the instructions here: [How to generate public and private keys](https://github.com/Devpro-Software/licensify?tab=readme-ov-file#generating-rsa-public-and-private-keys-%EF%B8%8F)

#### 1. Signing a License (Server Side / Backend)

To start, you'll need to generate a signed license using your private key. The license can then be distributed to your clients.

```go
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

    // craft a license with your client information
    license := licensify.NewLicense(map[string]string{
        "expiry":  time.Now().Add(time.Hour * 24 * 365).String(),
        "license-id":      licenseID,
        "product": "Pro Version",
    })

    // sign the license
    sig, err := signer.Sign(license)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Sig:", sig.Sig)

    // you can save some server side information to further control the license.
    // this works great in combination with a server side verification of the license
    // db.Save(...)

    // optionally save it to a file or continue with your business logic
    // this file can be sent to your client
    sig.Save("license.json")
    return sig
}
```

#### 2. Verifying a License (Client/Server/Anywhere)

On the client side or untrusted infrastructure, you can verify the license signature using the public key.
This gives the client the ability to make decisions based on the license.

```go
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
```

Validating a license on the client ensures authenticity but does not provide full control over its usage. Since the license signature is tamper-proof, any expiry details must be determined at the time of signing. To maintain greater control, your application can store licenses and track their status on a server, allowing for actions such as revocation or real-time enforcement of license conditions.

#### Server Side Verification Example

```go
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
    // this license-id must have been set when the license was created
    // this works because we know the signature has not been tampered with because it was signed with our private key
    licenseID := sig.License.Get("license-id")
    fmt.Println("Recieved valid request from license:", licenseID)

    // db.Find(licenseID) ...

    // you can do what you need for your business logic
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(&sig)
}

```

See the full list of examples here: [examples](examples)

## License Management Server 🌐

Licensify includes a ready-to-use server implementation for managing licenses. This server provides a complete REST API for creating, managing, and validating licenses.

### Server Setup

The server requires the following environment variables:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
PUBLIC_KEY=path/to/public.pem
PRIVATE_KEY=path/to/private.pem
API_KEY=your-secure-api-key   # Auto-generated in development mode
PORT=8080                     # Optional: Defaults to 8080
PRODUCTION=false               # Optional: Defaults to true development mode
```

#### Installation

```bash
# Clone Licensify
git clone https://github.com/Devpro-Software/licensify && cd licensify

# Build server
go build -o main ./licensify/internal/server/*

# Run
./main
```

### API Endpoints

All endpoints except `/validate` require an `API-KEY` header for authentication.

#### License Management

- `GET /licenses` - List all licenses
- `POST /licenses` - Create a new license

  ```json
  {
    "product": "Pro Version",
    "data": {
      "customField": "value"
    },
    "active": true
  }
  ```

- `GET /licenses/{id}` - Get a specific license
- `PUT /licenses/{id}?active=true|false` - Update license status

#### License Signing

- `POST /licenses/{id}/sign` - Generate a signed license
  - Returns a signature object compatible with the Licensify client

#### License Validation

- `POST /validate` - Verify a license signature
  - Accepts a signature object
  - Verifies both cryptographic signature and license status

---

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

### 1. UI Portal for License Server 🖥️

Adding a Portal, allowing easy management of licenses and signatures.

### 2. Encrypted Private Key Support 🔒

Support for encrypted private keys, allowing secure loading with a passphrase.

### 3. Alternative Key Types 🔄

Adding support for key types like **ECDSA** and **Ed25519** for more flexibility.

### 4. Seamless License Expiry and Revocation ⏰

Introducing support for setting expiration dates and revoking licenses, allowing greater control over license validity and management. You can do this manually now by adding your own expiry.

## License ⚖️

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing 🤝

We welcome contributions! If you'd like to contribute to Licensify, feel free to open an issue or submit a pull request. Your improvements are highly appreciated.

## Contact 📬

For questions or support, please reach out to [gpiccirillo@devprodigital.com].
