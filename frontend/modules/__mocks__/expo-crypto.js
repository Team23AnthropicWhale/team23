// Counter-based deterministic IV generation so tests are reproducible.
// Each call to getRandomBytesAsync produces a different sequence, which is
// sufficient to prove that IV uniqueness holds without requiring real CSPRNG.
let _counter = 0;

const Crypto = {
  getRandomBytesAsync: jest.fn(n => {
    // Encode counter into every 4-byte group: unique up to 2^32 calls, no modular wrap issues.
    const buf = new Uint8Array(n);
    for (let i = 0; i < n; i++) buf[i] = (_counter >> ((i % 4) * 8)) & 0xff;
    _counter++;
    return Promise.resolve(buf);
  }),
  // Lightweight deterministic stand-in for SHA-256 used in the PBKDF2 fallback.
  // Real PBKDF2 is handled by crypto.subtle, so this is only exercised on the
  // non-Hermes fallback path. Produces a consistent 64-char hex string.
  digestStringAsync: jest.fn(async (_algo, data) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < data.length; i++) {
      h ^= data.charCodeAt(i) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(64, '0');
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding:        { HEX: 'hex' },
  // Test helpers
  _reset:           () => { _counter = 0; },
  _getCounter:      () => _counter,
};

module.exports = Crypto;
