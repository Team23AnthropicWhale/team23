# secure-sync usage

## Setup (once at app launch)

```ts
import { setRole }             from './syncOrchestrator';
import { deriveKey, storeKey, loadKey } from './keyManager';

// Tell the sync module what role this user has
setRole(user.role); // 'supervisor' | 'caseworker'
```

---

## Encrypting and decrypting case data

Import the singleton. All operations go through it.

```ts
import { cryptoModule } from './cryptoProvider';
import { loadKey }      from './keyManager';

const key = await loadKey(userPin); // retrieve stored key

// Encrypt a case record before writing to SQLite
const encrypted = await cryptoModule.encrypt(caseRecord, key);
// encrypted → { iv: string, ciphertext: string, salt: string }
// Store this object as-is (JSON column or three separate fields)

// Decrypt when reading back
const record = await cryptoModule.decrypt(encrypted, key);
```

`cryptoModule.encrypt` runs: **applyLookup → compress → AES-256-GCM**.  
`cryptoModule.decrypt` runs the reverse.

---

## Key lifecycle

### First login on a device

```ts
import { deriveKey, storeKey } from './keyManager';
import { getRandomBytes }      from './cryptoProvider';

const salt = getRandomBytes(16);          // generate once, store in SQLite (not secret)
const key  = await deriveKey(pin, salt);  // PBKDF2, 100k iterations
await storeKey(key, pin);                 // saves to Keychain / Keystore
```

### Subsequent logins

```ts
import { loadKey } from './keyManager';

const key = await loadKey(pin); // null if not found (wrong PIN or first time)
```

---

## Org key — shared across all devices

The org key encrypts BLE transfer payloads. A supervisor creates it once and transfers it to every caseworker device.

### Supervisor — initial setup

```ts
import { generateOrgKey } from './keyManager';

const b64 = await generateOrgKey(); // stored in Keychain, also returned as base64
```

### Transfer to a new device (QR or Bluetooth)

```ts
// On the supervisor's device — enter the shared password on both screens
import { exportOrgKeyForTransfer } from './keyManager';

const payload = await exportOrgKeyForTransfer(sharedPassword);
// Display payload as a QR code or send over Bluetooth

// On the caseworker's device — scan the QR / receive the string
import { importOrgKey } from './keyManager';

await importOrgKey(payload, sharedPassword); // throws if wrong password or tampered
```

---

## Bluetooth sync

### Register callbacks first

```ts
import {
  onPINGenerated,
  onSyncComplete,
  onError,
} from './syncOrchestrator';

onPINGenerated((pin) => showPINOnScreen(pin));

onSyncComplete(({ transferred, received, conflicts }) => {
  console.log(`↑${transferred} ↓${received} conflicts:`, conflicts);
});

onError((err) => {
  // err.code: 'TIMEOUT' | 'PIN_MISMATCH' | 'CHUNK_FAILED' | 'CONNECTION_LOST'
  showErrorBanner(err.message);
});
```

### Scan and connect

```ts
import {
  scanForDevices,
  connectAndSync,
  confirmPairing,
  cancelPairing,
  stopBluetooth,
} from './syncOrchestrator';

// 1. Discover nearby devices (10 s scan)
const devices = await scanForDevices();
// devices → [{ deviceId: string, deviceName: string }, ...]

// 2. User picks one — start pairing + sync
await connectAndSync(devices[0].deviceId);
// onPINGenerated fires here — show the PIN to the user

// 3. After user verbally confirms both screens show the same PIN:
confirmPairing(); // proceeds to replication
// — or —
cancelPairing();  // disconnects

// Stop at any time
stopBluetooth();
```

Roles are negotiated automatically. The supervisor's device always initiates; between two caseworkers, whoever called `connectAndSync` leads.

---

## Wire up replication logic

`syncOrchestrator` calls five functions from `replicationManager.ts`. Provide them before the first sync:

```ts
import { configureReplication } from './syncOrchestrator';
import * as rm from '../replicationManager';

configureReplication({
  getLocalManifest:  rm.getLocalManifest,
  diffManifests:     rm.diffManifests,
  getCaseForSync:    rm.getCaseForSync,
  applyIncomingCase: rm.applyIncomingCase,
  flagConflict:      rm.flagConflict,
});
```

---

## Server sync

Server transfer is not implemented in `secure-sync/` — it uses the standard HTTP API in `backend/`. Decrypt locally, POST to the API, re-encrypt on receipt. The `cryptoModule` handles the crypto side; the HTTP layer is separate.

```ts
// Rough sketch — HTTP layer is your responsibility
const plainRecord = await cryptoModule.decrypt(storedEncrypted, key);
await api.post('/cases', plainRecord);

const incoming = await api.get(`/cases/${id}`);
const stored   = await cryptoModule.encrypt(incoming, key);
db.save(stored);
```

---

## File map

| File | What to import from it |
|---|---|
| `cryptoProvider.ts` | `cryptoModule` |
| `keyManager.ts` | `deriveKey`, `storeKey`, `loadKey`, `generateOrgKey`, `getOrgKey`, `exportOrgKeyForTransfer`, `importOrgKey` |
| `syncOrchestrator.ts` | `scanForDevices`, `connectAndSync`, `stopBluetooth`, `setRole`, `confirmPairing`, `cancelPairing`, `onPINGenerated`, `onSyncComplete`, `onError`, `configureReplication` |
| `bleProtocol.ts` | `BluetoothError`, `SyncResult`, `ManifestEntry`, `CaseDelta` (types only) |
| `lookup.ts` | `LOOKUP_TABLE` (rarely needed directly) |
| `cryptoCore.ts` | Interfaces only — needed if building an alternative platform provider |
