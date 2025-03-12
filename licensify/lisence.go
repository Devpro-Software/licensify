package licensify

import (
	"crypto/sha256"
	"fmt"
	"sort"
	"strings"
)

// License represents an arbitrary set of key-value pairs for license data.
// Can be passed to a Signer to generate a distributable signature.
type License map[string]string

// NewLicense creates a new License from the given data map.
func NewLicense(data map[string]string) License {
	return License(data)
}

// Set adds or updates a key-value pair in the License.
func (l License) Set(key, val string) {
	l[key] = val
}

// hash returns a SHA-256 hash of the License data.
// orders the keys to ensure a consitent signature.
func (l License) hash() []byte {
	els := make([]string, len(l))
	for k, v := range l {
		els = append(els, fmt.Sprintf("%s:%s", k, v))
	}

	sort.Strings(els)
	data := strings.Join(els, ",")
	b := sha256.Sum256([]byte(data))
	return b[:]
}
