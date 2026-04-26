// Platform-agnostic crypto module factory.
// Accepts compression and AES-GCM implementations at runtime so the same
// business logic runs on any JS engine without platform imports here.

import { applyLookup, reverseLookup } from './lookup';

// ---------------------------------------------------------------------------
// Base64 helpers — no platform dependency
// ---------------------------------------------------------------------------

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Dependency interfaces
// ---------------------------------------------------------------------------

export interface CompressFn   { (plaintext: Uint8Array): Promise<Uint8Array>; }
export interface DecompressFn { (compressed: Uint8Array): Promise<Uint8Array>; }

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  /** Random bytes used as AES-GCM AAD — must be stored alongside ciphertext. */
  salt: string;
}

export interface EncryptFn { (plaintext: Uint8Array, key: CryptoKey): Promise<EncryptedPayload>; }
export interface DecryptFn { (payload: EncryptedPayload, key: CryptoKey): Promise<Uint8Array>; }

export interface CryptoModuleDeps {
  compress:   CompressFn;
  decompress: DecompressFn;
  encrypt:    EncryptFn;
  decrypt:    DecryptFn;
}

// ---------------------------------------------------------------------------
// Module interface
// ---------------------------------------------------------------------------

export interface CryptoModule {
  applyLookup(data: unknown): Promise<unknown>;
  reverseLookup(data: unknown): Promise<unknown>;
  /** applyLookup → JSON.stringify → compress */
  compress(data: object): Promise<Uint8Array>;
  /** decompress → JSON.parse → reverseLookup */
  decompress(data: Uint8Array): Promise<object>;
  /** compress → encrypt */
  encrypt(data: object, key: CryptoKey): Promise<EncryptedPayload>;
  /** decrypt → decompress */
  decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<object>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCryptoModule(deps: CryptoModuleDeps): CryptoModule {
  async function compress(data: object): Promise<Uint8Array> {
    const reduced = await applyLookup(data);
    return deps.compress(new TextEncoder().encode(JSON.stringify(reduced)));
  }

  async function decompress(data: Uint8Array): Promise<object> {
    const inflated = await deps.decompress(data);
    const parsed   = JSON.parse(new TextDecoder().decode(inflated));
    return reverseLookup(parsed) as Promise<object>;
  }

  async function encrypt(data: object, key: CryptoKey): Promise<EncryptedPayload> {
    return deps.encrypt(await compress(data), key);
  }

  async function decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<object> {
    return decompress(await deps.decrypt(payload, key));
  }

  return { applyLookup, reverseLookup, compress, decompress, encrypt, decrypt };
}
