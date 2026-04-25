import { deflate, inflate } from 'fflate';
import QuickCrypto from 'react-native-quick-crypto';

import {
  createCryptoModule,
  toBase64,
  fromBase64,
  deriveKey as _deriveKey,
  generateSessionKeypair as _generateSessionKeypair,
  deriveSessionKey as _deriveSessionKey,
  exportPublicKey as _exportPublicKey,
  importPublicKey as _importPublicKey,
  type CompressFn,
  type DecompressFn,
  type EncryptFn,
  type DecryptFn,
} from './dataUtils';

// ---------------------------------------------------------------------------
// Platform implementations
// ---------------------------------------------------------------------------

const subtle = QuickCrypto.subtle;

const compress: CompressFn = (plaintext) =>
  new Promise((resolve, reject) => {
    deflate(plaintext, (err, result) => (err ? reject(err) : resolve(result)));
  });

const decompress: DecompressFn = (compressed) =>
  new Promise((resolve, reject) => {
    inflate(compressed, (err, result) => (err ? reject(err) : resolve(result)));
  });

const encrypt: EncryptFn = async (plaintext, key) => {
  const iv   = QuickCrypto.getRandomValues(new Uint8Array(12));
  const salt = QuickCrypto.getRandomValues(new Uint8Array(16));

  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: salt },
    key,
    plaintext,
  );

  return {
    iv:         toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertextBuffer as ArrayBuffer)),
    salt:       toBase64(salt),
  };
};

const decrypt: DecryptFn = async (payload, key) => {
  const decryptedBuffer = await subtle.decrypt(
    {
      name:           'AES-GCM',
      iv:             fromBase64(payload.iv),
      additionalData: fromBase64(payload.salt),
    },
    key,
    fromBase64(payload.ciphertext),
  );

  return new Uint8Array(decryptedBuffer as ArrayBuffer);
};

// ---------------------------------------------------------------------------
// Singleton module — import this, not dataUtils directly
// ---------------------------------------------------------------------------

export const crypto = createCryptoModule({ compress, decompress, encrypt, decrypt });

// ---------------------------------------------------------------------------
// Key-management utilities with `subtle` pre-bound
// ---------------------------------------------------------------------------

export const deriveKey = (pin: string, salt: Uint8Array): Promise<CryptoKey> =>
  _deriveKey(subtle, pin, salt);

export const generateSessionKeypair = (): Promise<CryptoKeyPair> =>
  _generateSessionKeypair(subtle);

export const deriveSessionKey = (
  ownPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<CryptoKey> => _deriveSessionKey(subtle, ownPrivateKey, theirPublicKey);

export const exportPublicKey = (key: CryptoKey): Promise<string> =>
  _exportPublicKey(subtle, key);

export const importPublicKey = (base64: string): Promise<CryptoKey> =>
  _importPublicKey(subtle, base64);
