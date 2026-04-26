// BLE wire protocol: message types, chunking, reassembly, and
// per-message AES-GCM encryption using the organisation key.

import { toBase64, fromBase64 } from '../shared/cryptoCore';
import { getSubtle, getRandomBytes } from '../shared/cryptoProvider';
import { getOrgKey } from '../shared/keyManager';

// ---------------------------------------------------------------------------
// Shared domain types (implement replicationManager.ts / db.ts to satisfy)
// ---------------------------------------------------------------------------

export interface ManifestEntry {
  caseId:         string;
  version:        number;
  checksum:       string;
  createdBy:      string;
  lastModifiedBy: string;
}

export interface CaseDelta {
  caseId:  string;
  payload: object;
}

// ---------------------------------------------------------------------------
// Public error + result types
// ---------------------------------------------------------------------------

export type BluetoothErrorCode = 'TIMEOUT' | 'PIN_MISMATCH' | 'CHUNK_FAILED' | 'CONNECTION_LOST';

export class BluetoothError extends Error {
  constructor(public readonly code: BluetoothErrorCode, message: string) {
    super(message);
    this.name = 'BluetoothError';
  }
}

export interface SyncResult {
  transferred: number;
  received:    number;
  conflicts:   string[];
}

// ---------------------------------------------------------------------------
// Wire message types
// ---------------------------------------------------------------------------

export type WireMessage =
  | { type: 'HELLO';        role: 'supervisor' | 'caseworker'; initiator: boolean }
  | { type: 'PIN';          pin: string }
  | { type: 'PIN_CONFIRM' }
  | { type: 'PIN_CANCEL' }
  | { type: 'MANIFEST';     entries: ManifestEntry[] }
  | { type: 'REQUEST_CASES'; caseIds: string[] }
  | { type: 'CASE_DELTA';   delta: CaseDelta }
  | { type: 'CHUNK';        index: number; total: number; sessionId: string; data: string }
  | { type: 'RETRANSMIT';   sessionId: string; indices: number[] }
  | { type: 'SESSION_DONE'; sessionId: string };

// ---------------------------------------------------------------------------
// Chunk helpers
// ---------------------------------------------------------------------------

export interface Chunk {
  index:     number;
  total:     number;
  sessionId: string;
  data:      string; // base64 slice of encrypted bytes
}

export function chunkify(data: Uint8Array, sessionId: string, chunkSize: number): Chunk[] {
  const total  = Math.ceil(data.byteLength / chunkSize) || 1;
  const chunks: Chunk[] = [];
  for (let i = 0; i < total; i++) {
    chunks.push({
      index:     i,
      total,
      sessionId,
      data:      toBase64(data.slice(i * chunkSize, (i + 1) * chunkSize)),
    });
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Per-message encryption — wire layout: 12 (iv) + 16 (aad) + N (ciphertext)
// ---------------------------------------------------------------------------

export async function encryptMessage(msg: WireMessage): Promise<Uint8Array> {
  const key = await getOrgKey();
  if (!key) throw new BluetoothError('CONNECTION_LOST', 'Org key not available.');

  const subtle  = getSubtle();
  const iv      = getRandomBytes(12);
  const aad     = getRandomBytes(16);
  const plain   = new TextEncoder().encode(JSON.stringify(msg));
  const cipher  = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, plain);
  const cBytes  = new Uint8Array(cipher as ArrayBuffer);
  const out     = new Uint8Array(12 + 16 + cBytes.byteLength);
  out.set(iv,    0);
  out.set(aad,   12);
  out.set(cBytes, 28);
  return out;
}

export async function decryptMessage(data: Uint8Array): Promise<WireMessage> {
  const key = await getOrgKey();
  if (!key) throw new BluetoothError('CONNECTION_LOST', 'Org key not available.');

  const plain = await getSubtle().decrypt(
    { name: 'AES-GCM', iv: data.slice(0, 12), additionalData: data.slice(12, 28) },
    key,
    data.slice(28),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as WireMessage;
}

// ---------------------------------------------------------------------------
// Chunk buffer — reassembles a multi-chunk stream into encrypted bytes
// ---------------------------------------------------------------------------

export interface ChunkBuffer {
  total:           number;
  received:        Map<number, Uint8Array>;
  attempts:        number;
  retransmitTimer: ReturnType<typeof setTimeout> | null;
  resolve:         (data: Uint8Array) => void;
  reject:          (err: Error) => void;
}

export function assembleChunks(buf: ChunkBuffer): Uint8Array | null {
  if (buf.received.size < buf.total) return null;
  const parts  = Array.from({ length: buf.total }, (_, i) => buf.received.get(i)!);
  const total  = parts.reduce((n, p) => n + p.byteLength, 0);
  const out    = new Uint8Array(total);
  let offset   = 0;
  for (const p of parts) { out.set(p, offset); offset += p.byteLength; }
  return out;
}

// ---------------------------------------------------------------------------
// Message queue — lets async flows await specific message types
// ---------------------------------------------------------------------------

export type MessageHandler = (msg: WireMessage) => void;

export function expectMessage<T extends WireMessage['type']>(
  queue: MessageHandler[],
  type: T,
  timeoutMs = 30_000,
): Promise<Extract<WireMessage, { type: T }>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = queue.indexOf(handler);
      if (idx !== -1) queue.splice(idx, 1);
      reject(new BluetoothError('TIMEOUT', `Timed out waiting for ${type}.`));
    }, timeoutMs);

    const handler: MessageHandler = (msg) => {
      if (msg.type !== type) return;
      clearTimeout(timer);
      const idx = queue.indexOf(handler);
      if (idx !== -1) queue.splice(idx, 1);
      resolve(msg as Extract<WireMessage, { type: T }>);
    };

    queue.push(handler);
  });
}

export function deliverMessage(queue: MessageHandler[], msg: WireMessage): void {
  for (const handler of queue) handler(msg);
}
