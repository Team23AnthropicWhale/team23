// Platform crypto implementations: pako compression + Web Crypto AES-GCM.
// Instantiates the crypto module singleton used by all app code.

import { deflate, inflate } from 'pako';
import { createCryptoModule, toBase64, fromBase64, type CompressFn, type DecompressFn, type EncryptFn, type DecryptFn } from './cryptoCore';

// Captured before any export name can shadow the global.
const _native = globalThis.crypto as Crypto;

export function getSubtle(): SubtleCrypto {
  if (!_native?.subtle) {
    throw new Error('SubtleCrypto unavailable — ensure Hermes engine (React Native ≥ 0.71) or Node.js ≥ 15.');
  }
  return _native.subtle;
}

export function getRandomBytes(length: number): Uint8Array {
  return _native.getRandomValues(new Uint8Array(length));
}

// ---------------------------------------------------------------------------
// Compression — pako (synchronous, wrapped in Promise for interface compat)
// ---------------------------------------------------------------------------

const compress: CompressFn = async (plaintext) => deflate(plaintext);

const decompress: DecompressFn = async (compressed) => inflate(compressed);

// ---------------------------------------------------------------------------
// Encryption — AES-256-GCM, random IV + salt (used as AAD)
// ---------------------------------------------------------------------------

const encrypt: EncryptFn = async (plaintext, key) => {
  const subtle = getSubtle();
  const iv     = getRandomBytes(12);
  const salt   = getRandomBytes(16);

  const cipherBuf = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: salt },
    key,
    plaintext,
  );

  return {
    iv:         toBase64(iv),
    ciphertext: toBase64(new Uint8Array(cipherBuf as ArrayBuffer)),
    salt:       toBase64(salt),
  };
};

const decrypt: DecryptFn = async (payload, key) => {
  const subtle = getSubtle();
  const plain  = await subtle.decrypt(
    {
      name:           'AES-GCM',
      iv:             fromBase64(payload.iv),
      additionalData: fromBase64(payload.salt),
    },
    key,
    fromBase64(payload.ciphertext),
  );
  return new Uint8Array(plain as ArrayBuffer);
};

// ---------------------------------------------------------------------------
// Singleton — import this, not cryptoCore, from app code
// ---------------------------------------------------------------------------

export const cryptoModule = createCryptoModule({ compress, decompress, encrypt, decrypt });
