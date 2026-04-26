// High-level sync orchestration: device discovery, PIN pairing,
// role negotiation, and full bidirectional case replication.

import { Device, Subscription } from 'react-native-ble-plx';
import {
  type WireMessage,
  type MessageHandler,
  type ManifestEntry,
  type CaseDelta,
  type ChunkBuffer,
  type SyncResult,
  BluetoothError,
  expectMessage,
  deliverMessage,
} from './bleProtocol';
import {
  scanForDevices as _scan,
  connectDevice,
  sendMessage,
  startListening,
  getManager,
} from './bleConnection';

// ---------------------------------------------------------------------------
// Replication hooks — wire in from replicationManager.ts before first sync
// ---------------------------------------------------------------------------

let _getLocalManifest:  () => Promise<ManifestEntry[]>             = async () => [];
let _diffManifests: (
  local: ManifestEntry[], remote: ManifestEntry[],
) => { toSend: string[]; toRequest: string[]; conflicts: string[] } = () => ({ toSend: [], toRequest: [], conflicts: [] });
let _getCaseForSync:    (id: string) => Promise<CaseDelta>         = async (id) => ({ caseId: id, payload: {} });
let _applyIncomingCase: (delta: CaseDelta) => Promise<void>        = async () => {};
let _flagConflict:      (caseId: string) => Promise<void>          = async () => {};

export function configureReplication(fns: {
  getLocalManifest:  () => Promise<ManifestEntry[]>;
  diffManifests:     (local: ManifestEntry[], remote: ManifestEntry[]) => { toSend: string[]; toRequest: string[]; conflicts: string[] };
  getCaseForSync:    (id: string) => Promise<CaseDelta>;
  applyIncomingCase: (delta: CaseDelta) => Promise<void>;
  flagConflict:      (caseId: string) => Promise<void>;
}): void {
  _getLocalManifest  = fns.getLocalManifest;
  _diffManifests     = fns.diffManifests;
  _getCaseForSync    = fns.getCaseForSync;
  _applyIncomingCase = fns.applyIncomingCase;
  _flagConflict      = fns.flagConflict;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

interface State {
  phase:       'idle' | 'scanning' | 'connecting' | 'pairing' | 'negotiating' | 'syncing';
  device:      Device | null;
  chunkSize:   number;
  myRole:      'supervisor' | 'caseworker';
  isCentral:   boolean;
  pin:         string | null;
  pinResolver: ((confirmed: boolean) => void) | null;
  subscription: Subscription | null;
  sessionTimer: ReturnType<typeof setTimeout> | null;
  chunkBuffers: Map<string, ChunkBuffer>;
  msgQueue:    MessageHandler[];
}

const state: State = {
  phase:        'idle',
  device:       null,
  chunkSize:    20,
  myRole:       'caseworker',
  isCentral:    false,
  pin:          null,
  pinResolver:  null,
  subscription: null,
  sessionTimer: null,
  chunkBuffers: new Map(),
  msgQueue:     [],
};

// ---------------------------------------------------------------------------
// Callbacks
// ---------------------------------------------------------------------------

let _onPINGenerated: ((pin: string) => void) | null   = null;
let _onSyncComplete: ((r: SyncResult) => void) | null = null;
let _onError:        ((e: BluetoothError) => void) | null = null;

function emitError(err: BluetoothError): void { _onError?.(err); }

// ---------------------------------------------------------------------------
// Session timer — 30 s inactivity kills the session
// ---------------------------------------------------------------------------

function resetSessionTimer(): void {
  if (state.sessionTimer) clearTimeout(state.sessionTimer);
  state.sessionTimer = setTimeout(() => {
    emitError(new BluetoothError('TIMEOUT', 'Session timed out after 30 seconds.'));
    cleanup();
  }, 30_000);
}

function cleanup(): void {
  if (state.sessionTimer) clearTimeout(state.sessionTimer);
  state.subscription?.remove();
  state.device?.cancelConnection().catch(() => {});
  for (const buf of state.chunkBuffers.values()) {
    if (buf.retransmitTimer) clearTimeout(buf.retransmitTimer);
    buf.reject(new BluetoothError('CONNECTION_LOST', 'Session terminated.'));
  }
  Object.assign(state, {
    phase: 'idle', device: null, pin: null, pinResolver: null,
    subscription: null, sessionTimer: null,
    chunkBuffers: new Map(), msgQueue: [],
  });
}

// ---------------------------------------------------------------------------
// Pairing — central generates PIN, both display it, user verbally confirms
// ---------------------------------------------------------------------------

async function runPairing(device: Device): Promise<void> {
  state.phase = 'pairing';

  if (state.isCentral) {
    const pin = Math.floor(Math.random() * 10_000).toString().padStart(4, '0');
    state.pin = pin;
    _onPINGenerated?.(pin);
    const msg: WireMessage = { type: 'PIN', pin };
    await sendMessage(device, msg, 'pairing', state.chunkSize);
  } else {
    const pinMsg = await expectMessage(state.msgQueue, 'PIN');
    state.pin = pinMsg.pin;
    _onPINGenerated?.(pinMsg.pin);
  }

  // Suspend until UI calls confirmPairing() or cancelPairing()
  const confirmed = await new Promise<boolean>((resolve) => {
    state.pinResolver = resolve;
  });

  const reply: WireMessage = confirmed ? { type: 'PIN_CONFIRM' } : { type: 'PIN_CANCEL' };
  await sendMessage(device, reply, 'pairing-reply', state.chunkSize);

  if (!confirmed) throw new BluetoothError('PIN_MISMATCH', 'User cancelled pairing.');

  const peer = await expectMessage(state.msgQueue, 'PIN_CONFIRM');
  void peer;
}

// ---------------------------------------------------------------------------
// Role negotiation — supervisor always central; between caseworkers, initiator wins
// ---------------------------------------------------------------------------

async function negotiateRole(device: Device): Promise<void> {
  state.phase = 'negotiating';

  const hello: WireMessage = { type: 'HELLO', role: state.myRole, initiator: state.isCentral };
  await sendMessage(device, hello, 'hello', state.chunkSize);

  const peer = await expectMessage(state.msgQueue, 'HELLO');
  const actAsCentral =
    state.myRole === 'supervisor' ||
    (state.myRole === 'caseworker' && peer.role === 'caseworker' && state.isCentral);

  // Re-assign central flag based on negotiated roles
  state.isCentral = actAsCentral;
}

// ---------------------------------------------------------------------------
// Replication — manifest exchange → diff → delta transfer in both directions
// ---------------------------------------------------------------------------

async function runReplication(device: Device): Promise<SyncResult> {
  state.phase = 'syncing';
  const session = `sync-${Date.now()}`;
  const result: SyncResult = { transferred: 0, received: 0, conflicts: [] };

  // Exchange manifests
  const local = await _getLocalManifest();
  await sendMessage(device, { type: 'MANIFEST', entries: local }, `${session}-mout`, state.chunkSize);
  const remoteMsg = await expectMessage(state.msgQueue, 'MANIFEST');
  const { toSend, toRequest, conflicts } = _diffManifests(local, remoteMsg.entries);

  result.conflicts = conflicts;
  for (const id of conflicts) await _flagConflict(id);

  // Send cases the remote is missing
  for (let i = 0; i < toSend.length; i++) {
    const delta = await _getCaseForSync(toSend[i]);
    await sendMessage(device, { type: 'CASE_DELTA', delta }, `${session}-cout-${i}`, state.chunkSize);
    result.transferred += 1;
  }

  // Receive cases we are missing
  for (let i = 0; i < toRequest.length; i++) {
    const incoming = await expectMessage(state.msgQueue, 'CASE_DELTA');
    await _applyIncomingCase(incoming.delta);
    result.received += 1;
  }

  // Handshake done
  await sendMessage(device, { type: 'SESSION_DONE', sessionId: session }, `${session}-done`, state.chunkSize);
  await expectMessage(state.msgQueue, 'SESSION_DONE');

  return result;
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

async function run(deviceId: string): Promise<void> {
  state.phase     = 'connecting';
  state.isCentral = true;

  const { device, chunkSize } = await connectDevice(deviceId);
  state.device    = device;
  state.chunkSize = chunkSize;

  state.subscription = startListening(
    device,
    state.chunkBuffers,
    state.msgQueue,
    emitError,
    resetSessionTimer,
  );
  resetSessionTimer();

  await runPairing(device);
  await negotiateRole(device);
  const result = await runReplication(device);

  _onSyncComplete?.(result);
  cleanup();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Scan for nearby devices advertising the CPMS sync service. */
export function scanForDevices(): Promise<{ deviceId: string; deviceName: string }[]> {
  if (state.phase !== 'idle') return Promise.resolve([]);
  state.phase = 'scanning';
  return _scan().finally(() => { if (state.phase === 'scanning') state.phase = 'idle'; });
}

/**
 * Connect to a discovered device and run the full pairing + replication flow.
 * Call onPINGenerated first to set up the display callback.
 * After the PIN appears, call confirmPairing() or cancelPairing() from the UI.
 */
export async function connectAndSync(deviceId: string): Promise<void> {
  if (state.phase !== 'idle') {
    throw new BluetoothError('CONNECTION_LOST', 'Already in a sync session.');
  }
  try {
    await run(deviceId);
  } catch (err) {
    const e = err instanceof BluetoothError
      ? err
      : new BluetoothError('CONNECTION_LOST', String(err));
    emitError(e);
    cleanup();
    throw e;
  }
}

/** Stop scanning or disconnect an active session. Safe to call at any time. */
export function stopBluetooth(): void {
  getManager().stopDeviceScan();
  cleanup();
}

/** Set the local device's user role. Must be called before connectAndSync. */
export function setRole(role: 'supervisor' | 'caseworker'): void {
  state.myRole = role;
}

/** Call from UI after the user has verbally confirmed the PIN matches. */
export function confirmPairing(): void {
  state.pinResolver?.(true);
  state.pinResolver = null;
}

/** Call from UI if the user reports a PIN mismatch or wants to cancel. */
export function cancelPairing(): void {
  state.pinResolver?.(false);
  state.pinResolver = null;
}

export function onPINGenerated(cb: (pin: string) => void): void    { _onPINGenerated = cb; }
export function onSyncComplete(cb: (r: SyncResult) => void): void  { _onSyncComplete = cb; }
export function onError(cb: (e: BluetoothError) => void): void     { _onError = cb; }
