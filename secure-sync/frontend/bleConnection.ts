// BLE hardware layer: scan, connect, MTU negotiation, characteristic
// write/monitor, and chunk reassembly with retransmission.

import { BleManager, Device, BleError, Subscription } from 'react-native-ble-plx';
import { toBase64, fromBase64 } from '../shared/cryptoCore';
import {
  type Chunk,
  type ChunkBuffer,
  type WireMessage,
  type MessageHandler,
  BluetoothError,
  chunkify,
  encryptMessage,
  decryptMessage,
  assembleChunks,
  deliverMessage,
} from './bleProtocol';

export const SERVICE_UUID     = '0000AA00-0000-1000-8000-00805F9B34FB';
export const WRITE_CHAR_UUID  = '0000AA01-0000-1000-8000-00805F9B34FB';
export const NOTIFY_CHAR_UUID = '0000AA02-0000-1000-8000-00805F9B34FB';

const RETRANSMIT_TIMEOUT_MS   = 5_000;
const MAX_RETRANSMIT_ATTEMPTS = 3;
const DEFAULT_CHUNK_SIZE      = 20; // MTU 23 − 3-byte ATT header

// ---------------------------------------------------------------------------
// BleManager singleton
// ---------------------------------------------------------------------------

let _manager: BleManager | null = null;

export function getManager(): BleManager {
  if (!_manager) _manager = new BleManager();
  return _manager;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

export function scanForDevices(
  timeoutMs = 10_000,
): Promise<{ deviceId: string; deviceName: string }[]> {
  return new Promise((resolve, reject) => {
    const found  = new Map<string, { deviceId: string; deviceName: string }>();
    const mgr    = getManager();
    const timer  = setTimeout(() => {
      mgr.stopDeviceScan();
      resolve([...found.values()]);
    }, timeoutMs);

    mgr.startDeviceScan(
      [SERVICE_UUID],
      { allowDuplicates: false },
      (error: BleError | null, device: Device | null) => {
        if (error) {
          clearTimeout(timer);
          mgr.stopDeviceScan();
          reject(new BluetoothError('CONNECTION_LOST', error.message));
          return;
        }
        if (device && !found.has(device.id)) {
          found.set(device.id, {
            deviceId:   device.id,
            deviceName: device.name ?? device.localName ?? device.id,
          });
        }
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Connect + MTU negotiation
// ---------------------------------------------------------------------------

export async function connectDevice(deviceId: string): Promise<{ device: Device; chunkSize: number }> {
  let device: Device;
  try {
    device = await getManager().connectToDevice(deviceId, { autoConnect: false });
  } catch (err) {
    throw new BluetoothError('CONNECTION_LOST', `Failed to connect: ${String(err)}`);
  }

  const withMtu    = await device.requestMTU(512).catch(() => device);
  const mtu: number = (withMtu as Device & { mtu?: number }).mtu ?? 23;
  await (withMtu as Device).discoverAllServicesAndCharacteristics();

  return { device: withMtu as Device, chunkSize: mtu - 3 };
}

// ---------------------------------------------------------------------------
// Write a raw base64 value to the write characteristic
// ---------------------------------------------------------------------------

export async function writeRaw(device: Device, value: string): Promise<void> {
  await device.writeCharacteristicWithResponseForService(
    SERVICE_UUID,
    WRITE_CHAR_UUID,
    value,
  );
}

// ---------------------------------------------------------------------------
// Send a WireMessage — encrypts, chunks, and writes each chunk
// ---------------------------------------------------------------------------

// Cache of sent chunks per session for retransmission
const _sentCache = new Map<string, Chunk[]>();

export async function sendMessage(
  device: Device,
  msg: WireMessage,
  sessionId: string,
  chunkSize: number,
): Promise<void> {
  const encrypted = await encryptMessage(msg);
  const chunks    = chunkify(encrypted, sessionId, chunkSize);
  _sentCache.set(sessionId, chunks);

  for (const chunk of chunks) {
    await writeRaw(device, toBase64(new TextEncoder().encode(JSON.stringify(chunk))));
  }
}

// ---------------------------------------------------------------------------
// Monitor incoming notifications — reassembles chunks, dispatches messages
// ---------------------------------------------------------------------------

export function startListening(
  device: Device,
  chunkBuffers: Map<string, ChunkBuffer>,
  msgQueue: MessageHandler[],
  onError: (err: BluetoothError) => void,
  onActivity: () => void,
): Subscription {
  return device.monitorCharacteristicForService(
    SERVICE_UUID,
    NOTIFY_CHAR_UUID,
    async (error, characteristic) => {
      if (error) {
        onError(new BluetoothError('CONNECTION_LOST', error.message));
        return;
      }
      if (!characteristic?.value) return;

      onActivity();

      try {
        const raw      = new TextDecoder().decode(fromBase64(characteristic.value));
        const envelope = JSON.parse(raw) as Chunk | WireMessage;

        if ('index' in envelope && 'total' in envelope && 'sessionId' in envelope) {
          await handleIncomingChunk(
            envelope as Chunk,
            device,
            chunkBuffers,
            msgQueue,
          );
        } else if ((envelope as WireMessage).type === 'RETRANSMIT') {
          await handleRetransmit(
            envelope as Extract<WireMessage, { type: 'RETRANSMIT' }>,
            device,
          );
        } else {
          deliverMessage(msgQueue, envelope as WireMessage);
        }
      } catch (err) {
        onError(new BluetoothError('CHUNK_FAILED', String(err)));
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Chunk reassembly
// ---------------------------------------------------------------------------

async function handleIncomingChunk(
  chunk: Chunk,
  device: Device,
  chunkBuffers: Map<string, ChunkBuffer>,
  msgQueue: MessageHandler[],
): Promise<void> {
  const { sessionId, index, total, data } = chunk;

  let buf = chunkBuffers.get(sessionId);
  if (!buf) {
    let resolveFn!: (data: Uint8Array) => void;
    let rejectFn!:  (err: Error) => void;

    buf = {
      total,
      received:        new Map(),
      attempts:        0,
      retransmitTimer: null,
      resolve:         (d) => resolveFn(d),
      reject:          (e) => rejectFn(e),
    };
    chunkBuffers.set(sessionId, buf);

    new Promise<Uint8Array>((res, rej) => { resolveFn = res; rejectFn = rej; })
      .then(async (assembled) => {
        const msg = await decryptMessage(assembled);
        deliverMessage(msgQueue, msg);
      })
      .catch(() =>
        deliverMessage(msgQueue, { type: 'SESSION_DONE', sessionId } as WireMessage),
      );
  }

  buf.total = total;
  buf.received.set(index, fromBase64(data));
  if (buf.retransmitTimer) clearTimeout(buf.retransmitTimer);

  const assembled = assembleChunks(buf);
  if (assembled) {
    chunkBuffers.delete(sessionId);
    buf.resolve(assembled);
    return;
  }

  buf.retransmitTimer = setTimeout(async () => {
    buf!.attempts += 1;
    if (buf!.attempts > MAX_RETRANSMIT_ATTEMPTS) {
      buf!.reject(new BluetoothError('CHUNK_FAILED', `Session ${sessionId} exceeded retransmit limit.`));
      chunkBuffers.delete(sessionId);
      return;
    }
    const missing: number[] = [];
    for (let i = 0; i < buf!.total; i++) {
      if (!buf!.received.has(i)) missing.push(i);
    }
    if (missing.length === 0) return;
    const retransmit: WireMessage = { type: 'RETRANSMIT', sessionId, indices: missing };
    await writeRaw(device, toBase64(new TextEncoder().encode(JSON.stringify(retransmit)))).catch(() => {});
  }, RETRANSMIT_TIMEOUT_MS);
}

// ---------------------------------------------------------------------------
// Retransmit — re-send chunks the peer reported missing
// ---------------------------------------------------------------------------

async function handleRetransmit(
  msg: Extract<WireMessage, { type: 'RETRANSMIT' }>,
  device: Device,
): Promise<void> {
  const cache = _sentCache.get(msg.sessionId);
  if (!cache) return;
  for (const idx of msg.indices) {
    const chunk = cache[idx];
    if (chunk) {
      await writeRaw(device, toBase64(new TextEncoder().encode(JSON.stringify(chunk)))).catch(() => {});
    }
  }
}
