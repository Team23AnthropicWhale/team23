// All key lifecycle operations: PBKDF2 derivation, ECDH session keys,
// secure device storage, and org-key onboarding transfer protocol.

import * as SecureStore from 'expo-secure-store';
import { toBase64, fromBase64 } from './cryptoCore';
import { getSubtle, getRandomBytes } from './cryptoProvider';

const ORG_KEY_STORE = 'org_key';

// ---------------------------------------------------------------------------
// PBKDF2 key derivation
// ---------------------------------------------------------------------------

/**
 * Derive a 256-bit AES-GCM key from a PIN + random salt (100k iterations).
 * Returns an extractable key so it can be persisted via storeKey.
 */
export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle      = getSubtle();
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
    true,
    ['encrypt', 'decrypt'],
  );
}

// ---------------------------------------------------------------------------
// Key persistence — Keychain (iOS) / Keystore (Android) via expo-secure-store
// ---------------------------------------------------------------------------

/** Export and store a CryptoKey. Zeros the raw bytes after export. */
export async function storeKey(key: CryptoKey, pin: string): Promise<void> {
  const subtle   = getSubtle();
  const raw      = await subtle.exportKey('raw', key);
  const rawBytes = new Uint8Array(raw as ArrayBuffer);
  const b64      = toBase64(rawBytes);
  rawBytes.fill(0);
  await SecureStore.setItemAsync(`cpms_key_${pin}`, b64);
}

/** Load a stored key. Re-imports as non-extractable. Returns null if absent. */
export async function loadKey(pin: string): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(`cpms_key_${pin}`);
  if (!b64) return null;
  return getSubtle().importKey(
    'raw',
    fromBase64(b64),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------------------------------------------------------------------------
// ECDH session keys — for device-to-device encrypted channels
// ---------------------------------------------------------------------------

export async function generateSessionKeypair(): Promise<CryptoKeyPair> {
  return getSubtle().generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey'],
  ) as Promise<CryptoKeyPair>;
}

export async function deriveSessionKey(
  ownPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<CryptoKey> {
  return getSubtle().deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    ownPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const spki = await getSubtle().exportKey('spki', key);
  return toBase64(new Uint8Array(spki as ArrayBuffer));
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  return getSubtle().importKey(
    'spki',
    fromBase64(base64),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );
}

// ---------------------------------------------------------------------------
// Org key — shared AES key for all devices in the organisation
// ---------------------------------------------------------------------------

/**
 * Generate a new org key, store it, and return it as base64.
 * Call once ever from the supervisor's device during initial setup.
 */
export async function generateOrgKey(): Promise<string> {
  const subtle = getSubtle();
  const key    = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]) as CryptoKey;

  const raw      = await subtle.exportKey('raw', key);
  const rawBytes = new Uint8Array(raw as ArrayBuffer);
  const b64      = toBase64(rawBytes);
  rawBytes.fill(0);

  await SecureStore.setItemAsync(ORG_KEY_STORE, b64);
  return b64;
}

/** Load the org key as a non-extractable CryptoKey, or null if not yet received. */
export async function getOrgKey(): Promise<CryptoKey | null> {
  const b64 = await SecureStore.getItemAsync(ORG_KEY_STORE);
  if (!b64) return null;
  return getSubtle().importKey(
    'raw',
    fromBase64(b64),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------------------------------------------------------------------------
// Org key transfer — encrypted with a shared password, HMAC-authenticated
// ---------------------------------------------------------------------------

interface TransferPayload {
  pbkdf2Salt: string;
  iv:         string;
  aad:        string;
  ciphertext: string;
  hmac:       string;
}

/**
 * Derive AES-GCM wrap key + HMAC key from sharedSecret in a single
 * 100k-iteration PBKDF2 pass (512 bits → first 256 = wrap, next 256 = mac).
 */
async function deriveTransferKeys(
  sharedSecret: string,
  pbkdf2Salt: Uint8Array,
): Promise<{ wrapKey: CryptoKey; macKey: CryptoKey }> {
  const subtle      = getSubtle();
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
    subtle.importKey('raw', b.slice(0, 32), { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']),
    subtle.importKey('raw', b.slice(32, 64), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']),
  ]);

  return { wrapKey, macKey };
}

/**
 * Encrypt the org key for transfer to another device.
 * Returns a base64 payload safe for QR display or Bluetooth.
 * sharedSecret is used only in memory and never stored.
 */
export async function exportOrgKeyForTransfer(sharedSecret: string): Promise<string> {
  const subtle     = getSubtle();
  const orgKeyB64  = await SecureStore.getItemAsync(ORG_KEY_STORE);
  if (!orgKeyB64) throw new Error('No org key — call generateOrgKey() first.');

  const pbkdf2Salt = getRandomBytes(16);
  const iv         = getRandomBytes(12);
  const aad        = getRandomBytes(16);

  const { wrapKey, macKey } = await deriveTransferKeys(sharedSecret, pbkdf2Salt);

  const wrapped = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    wrapKey,
    fromBase64(orgKeyB64),
  );

  const p1 = toBase64(pbkdf2Salt);
  const p2 = toBase64(iv);
  const p3 = toBase64(aad);
  const p4 = toBase64(new Uint8Array(wrapped as ArrayBuffer));

  const hmacBuf = await subtle.sign(
    'HMAC',
    macKey,
    new TextEncoder().encode(`${p1}:${p2}:${p3}:${p4}`),
  );

  const payload: TransferPayload = {
    pbkdf2Salt: p1,
    iv:         p2,
    aad:        p3,
    ciphertext: p4,
    hmac:       toBase64(new Uint8Array(hmacBuf as ArrayBuffer)),
  };

  return toBase64(new TextEncoder().encode(JSON.stringify(payload)));
}

/**
 * Receive and store an org key from another device.
 * Throws if HMAC verification fails (wrong sharedSecret or tampered payload).
 * sharedSecret is used only in memory and never stored.
 */
export async function importOrgKey(payload: string, sharedSecret: string): Promise<void> {
  const subtle = getSubtle();

  let transfer: TransferPayload;
  try {
    transfer = JSON.parse(new TextDecoder().decode(fromBase64(payload))) as TransferPayload;
  } catch {
    throw new Error('Invalid transfer payload — cannot parse.');
  }

  const { pbkdf2Salt, iv, aad, ciphertext, hmac } = transfer;
  const { wrapKey, macKey } = await deriveTransferKeys(sharedSecret, fromBase64(pbkdf2Salt));

  const valid = await subtle.verify(
    'HMAC',
    macKey,
    fromBase64(hmac),
    new TextEncoder().encode(`${pbkdf2Salt}:${iv}:${aad}:${ciphertext}`),
  );
  if (!valid) {
    throw new Error('Authentication failed — wrong sharedSecret or tampered payload.');
  }

  const plain    = await subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv), additionalData: fromBase64(aad) },
    wrapKey,
    fromBase64(ciphertext),
  );
  const rawBytes = new Uint8Array(plain as ArrayBuffer);
  const b64      = toBase64(rawBytes);
  rawBytes.fill(0);

  await SecureStore.setItemAsync(ORG_KEY_STORE, b64);
}
