import { deflate, inflate } from 'pako';
import * as SecureStore from 'expo-secure-store';

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

const ORG_KEY_STORE = 'org_key';

interface TransferPayload {
  pbkdf2Salt: string;
  iv:         string;
  aad:        string;
  ciphertext: string;
  hmac:       string;
}

// Capture before any module-level name could shadow the global.
const _nativeCrypto = globalThis.crypto as Crypto;

function _getSubtle(): SubtleCrypto {
  if (!_nativeCrypto?.subtle) {
    throw new Error(
      'SubtleCrypto unavailable — ensure Hermes engine (React Native ≥ 0.71).',
    );
  }
  return _nativeCrypto.subtle;
}

// ---------------------------------------------------------------------------
// Platform implementations — pako + globalThis.crypto
// ---------------------------------------------------------------------------

const compress: CompressFn = async (plaintext) => deflate(plaintext);

const decompress: DecompressFn = async (compressed) => inflate(compressed);

const encrypt: EncryptFn = async (plaintext, key) => {
  const subtle = _getSubtle();
  const iv   = _nativeCrypto.getRandomValues(new Uint8Array(12));
  const salt = _nativeCrypto.getRandomValues(new Uint8Array(16));

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
  const subtle = _getSubtle();
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
// Singleton — import this, not dataUtils directly
// ---------------------------------------------------------------------------

export const cryptoModule = createCryptoModule({ compress, decompress, encrypt, decrypt });

// ---------------------------------------------------------------------------
// Key-management utilities
// ---------------------------------------------------------------------------

/**
 * Derive a 256-bit AES-GCM key from a PIN and random salt.
 * Returns an *extractable* key so it can be persisted via storeKey.
 */
export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = _getSubtle();
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,   // extractable — required for storeKey
    ['encrypt', 'decrypt'],
  );
}

/**
 * Persist a CryptoKey to device-secure storage (Keychain / Keystore).
 * Zeros the raw key bytes immediately after export to minimise heap exposure.
 */
export async function storeKey(key: CryptoKey, pin: string): Promise<void> {
  const subtle = _getSubtle();
  const raw = await subtle.exportKey('raw', key);
  const rawBytes = new Uint8Array(raw as ArrayBuffer);
  const b64 = toBase64(rawBytes);
  rawBytes.fill(0);
  await SecureStore.setItemAsync(`cpms_key_${pin}`, b64);
}

/**
 * Retrieve a previously stored CryptoKey.
 * Re-imports as non-extractable for all runtime encryption operations.
 * Returns null if no key exists for the given pin.
 */
export async function loadKey(pin: string): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(`cpms_key_${pin}`);
  if (!b64) return null;
  return _getSubtle().importKey(
    'raw',
    fromBase64(b64),
    { name: 'AES-GCM', length: 256 },
    false,  // non-extractable for runtime use
    ['encrypt', 'decrypt'],
  );
}

export const generateSessionKeypair = (): Promise<CryptoKeyPair> =>
  _generateSessionKeypair(_getSubtle());

export const deriveSessionKey = (
  ownPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<CryptoKey> => _deriveSessionKey(_getSubtle(), ownPrivateKey, theirPublicKey);

export const exportPublicKey = (key: CryptoKey): Promise<string> =>
  _exportPublicKey(_getSubtle(), key);

export const importPublicKey = (base64: string): Promise<CryptoKey> =>
  _importPublicKey(_getSubtle(), base64);

// ---------------------------------------------------------------------------
// Org-key onboarding — key generation and device-to-device transfer
// ---------------------------------------------------------------------------

/**
 * Derives an AES-GCM wrapping key and an HMAC-SHA256 signing key from
 * sharedSecret + pbkdf2Salt in a single 100k-iteration PBKDF2 pass.
 * First 256 bits → wrapKey, next 256 bits → macKey.
 */
async function _deriveTransferKeys(
  subtle: SubtleCrypto,
  sharedSecret: string,
  pbkdf2Salt: Uint8Array,
): Promise<{ wrapKey: CryptoKey; macKey: CryptoKey }> {
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(sharedSecret),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: pbkdf2Salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    512,
  );

  const b = new Uint8Array(bits);

  const [wrapKey, macKey] = await Promise.all([
    subtle.importKey(
      'raw',
      b.slice(0, 32),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    ),
    subtle.importKey(
      'raw',
      b.slice(32, 64),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    ),
  ]);

  return { wrapKey, macKey };
}

/**
 * Generate a new AES-256-GCM org key, persist it in secure storage, and
 * return the raw key as base64. Call once ever, from the supervisor's device
 * during initial setup.
 */
export async function generateOrgKey(): Promise<string> {
  const subtle = _getSubtle();

  const orgKey = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  ) as CryptoKey;

  const raw = await subtle.exportKey('raw', orgKey);
  const rawBytes = new Uint8Array(raw as ArrayBuffer);
  const b64 = toBase64(rawBytes);
  rawBytes.fill(0);

  await SecureStore.setItemAsync(ORG_KEY_STORE, b64);
  return b64;
}

/**
 * Load and return the org key from secure storage, or null if not yet received.
 * Imported as non-extractable for all runtime operations.
 */
export async function getOrgKey(): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(ORG_KEY_STORE);
  if (!b64) return null;
  return _getSubtle().importKey(
    'raw',
    fromBase64(b64),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt the org key for transfer to another device.
 *
 * Protocol:
 *   1. Derive wrapKey + macKey from sharedSecret via PBKDF2 (100k iterations).
 *   2. Encrypt raw org key bytes with wrapKey using AES-256-GCM.
 *   3. HMAC-SHA256 all transport fields to prevent tampering.
 *   4. Return JSON-encoded payload as base64 (safe for QR / Bluetooth).
 *
 * sharedSecret is used only in memory and never stored.
 */
export async function exportOrgKeyForTransfer(sharedSecret: string): Promise<string> {
  const subtle = _getSubtle();

  const orgKeyB64 = await SecureStore.getItemAsync(ORG_KEY_STORE);
  if (!orgKeyB64) throw new Error('No org key found — call generateOrgKey() first.');

  const pbkdf2Salt = _nativeCrypto.getRandomValues(new Uint8Array(16));
  const iv         = _nativeCrypto.getRandomValues(new Uint8Array(12));
  const aad        = _nativeCrypto.getRandomValues(new Uint8Array(16));

  const { wrapKey, macKey } = await _deriveTransferKeys(subtle, sharedSecret, pbkdf2Salt);

  const wrappedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    wrapKey,
    fromBase64(orgKeyB64),
  );

  const pbkdf2SaltB64 = toBase64(pbkdf2Salt);
  const ivB64         = toBase64(iv);
  const aadB64        = toBase64(aad);
  const ciphertextB64 = toBase64(new Uint8Array(wrappedBuffer as ArrayBuffer));

  const signInput = new TextEncoder().encode(
    `${pbkdf2SaltB64}:${ivB64}:${aadB64}:${ciphertextB64}`,
  );
  const hmacBuffer = await subtle.sign('HMAC', macKey, signInput);

  const payload: TransferPayload = {
    pbkdf2Salt: pbkdf2SaltB64,
    iv:         ivB64,
    aad:        aadB64,
    ciphertext: ciphertextB64,
    hmac:       toBase64(new Uint8Array(hmacBuffer as ArrayBuffer)),
  };

  return toBase64(new TextEncoder().encode(JSON.stringify(payload)));
}

/**
 * Receive and store an org key from another device.
 *
 * Throws if the HMAC verification fails — this catches both a wrong
 * sharedSecret and any payload tampering.
 *
 * sharedSecret is used only in memory and never stored.
 */
export async function importOrgKey(payload: string, sharedSecret: string): Promise<void> {
  const subtle = _getSubtle();

  let transfer: TransferPayload;
  try {
    transfer = JSON.parse(
      new TextDecoder().decode(fromBase64(payload)),
    ) as TransferPayload;
  } catch {
    throw new Error('Invalid transfer payload — cannot parse.');
  }

  const { pbkdf2Salt, iv, aad, ciphertext, hmac } = transfer;
  const { wrapKey, macKey } = await _deriveTransferKeys(
    subtle,
    sharedSecret,
    fromBase64(pbkdf2Salt),
  );

  const signInput = new TextEncoder().encode(
    `${pbkdf2Salt}:${iv}:${aad}:${ciphertext}`,
  );
  const valid = await subtle.verify('HMAC', macKey, fromBase64(hmac), signInput);
  if (!valid) {
    throw new Error(
      'Authentication failed — sharedSecret is incorrect or payload was tampered with.',
    );
  }

  const orgKeyBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv), additionalData: fromBase64(aad) },
    wrapKey,
    fromBase64(ciphertext),
  );

  const orgKeyBytes = new Uint8Array(orgKeyBuffer as ArrayBuffer);
  const b64 = toBase64(orgKeyBytes);
  orgKeyBytes.fill(0);

  await SecureStore.setItemAsync(ORG_KEY_STORE, b64);
}
