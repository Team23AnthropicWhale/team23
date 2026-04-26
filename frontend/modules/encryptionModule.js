/**
 * encryptionModule.js
 *
 * Encryption and data pipeline for offline-first child protection case
 * management. Nothing touches storage without passing through this module.
 *
 * Write pipeline: raw form → compact keys → gzip compress → AES-256-GCM → base64
 * Read  pipeline: base64 → AES-256-GCM decrypt → decompress → expand keys → object
 *
 * Sensitive data never leaves this module in plaintext.
 * The derived key lives only in the device secure enclave via expo-secure-store.
 * Every encryption uses a fresh IV — ciphertexts are never reusable.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import pako from 'pako';
import NetInfo from '@react-native-community/netinfo';
import {
  FIELD_TO_SHORT, FIELD_TO_LONG,
  LEGITIMATE_BASIS, CONSENT_FROM, SEX, BIRTH_REG, NAT_STATUS, DISP_STATUS,
  DISABILITY, MARITAL_STATUS, CARE_ARRANGEMENT, AREA_LIVING, ALIVE_STATUS,
  CP_RISKS, RISK_LEVEL, URGENT_CAT, CONTACT_TYPE, WHO_PRESENT, EDU_STATUS,
  PERP_TYPE, INCIDENT_LOC, WHO_INVOLVED, WHO_REVIEW, ACTION_STATUS, SERVICES,
  FU_WITH, FU_HOW, REFERRAL_SOURCE, CLOSURE_REASON, CONSENT_YNA,
} from './formFieldReference.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const SECURE_KEY_ALIAS  = 'cpms_enc_key_v1';  // SecureStore slot name
const PBKDF2_ITERATIONS = 100_000;             // OWASP 2024 minimum for PBKDF2-SHA256
const IV_BYTES          = 12;                  // AES-GCM recommended nonce length
const KEY_BITS          = 256;
const MAX_SYNC_RETRIES  = 5;
const TIMEOUT_48H_SECS  = 172_800;            // 48 × 60 × 60

// ─── Section 3 registries (derived from formFieldReference imports) ───────────

// [verboseKey, lookupObject, isMultiSelect]
const ENUM_SPEC = [
  ['legitimateBasis',          LEGITIMATE_BASIS,   false],
  ['sex',                      SEX,                false],
  ['caregiverSex',             SEX,                false],
  ['birthRegistration',        BIRTH_REG,          false],
  ['nationalityStatus',        NAT_STATUS,         false],
  ['caregiverNatStatus',       NAT_STATUS,         false],
  ['motherNatStatus',          NAT_STATUS,         false],
  ['fatherNatStatus',          NAT_STATUS,         false],
  ['displacementStatus',       DISP_STATUS,        false],
  ['caregiverDispStatus',      DISP_STATUS,        false],
  ['motherDispStatus',         DISP_STATUS,        false],
  ['fatherDispStatus',         DISP_STATUS,        false],
  ['maritalStatus',            MARITAL_STATUS,     false],
  ['careArrangement',          CARE_ARRANGEMENT,   false],
  ['careAtClosure',            CARE_ARRANGEMENT,   false],
  ['areaOfLiving',             AREA_LIVING,        false],
  ['motherAlive',              ALIVE_STATUS,       false],
  ['fatherAlive',              ALIVE_STATUS,       false],
  ['contactType',              CONTACT_TYPE,       false],
  ['educationStatus',          EDU_STATUS,         false],
  ['referralSource',           REFERRAL_SOURCE,    false],
  ['riskLevel',                RISK_LEVEL,         false],
  ['riskAtClosure',            RISK_LEVEL,         false],
  ['closureReason',            CLOSURE_REASON,     false],
  ['childFeedbackConsent',     CONSENT_YNA,        false],
  ['caregiverFeedbackConsent', CONSENT_YNA,        false],
  ['consentFrom',              CONSENT_FROM,       true],
  ['assentFrom',               CONSENT_FROM,       true],
  ['disabilityStatus',         DISABILITY,         true],
  ['cpRisks',                  CP_RISKS,           true],
  ['whoPresent',               WHO_PRESENT,        true],
  ['perpetratorType',          PERP_TYPE,          true],
  ['incidentLocType',          INCIDENT_LOC,       true],
  ['whoCasePlan',              WHO_INVOLVED,       true],
  ['whoReview',                WHO_REVIEW,         true],
  ['servicesProvided',         SERVICES,           true],
];

// verboseKey → { fwd: lookup, multi }
const ENUM_FWD = new Map();
// shortKey   → { rev: reverseLookup, multi }
const ENUM_REV = new Map();
for (const [verbose, lookup, multi] of ENUM_SPEC) {
  const short = FIELD_TO_SHORT[verbose] ?? verbose;
  const rev   = Object.fromEntries(Object.entries(lookup).map(([k, v]) => [v, k]));
  ENUM_FWD.set(verbose, { fwd: lookup, multi });
  ENUM_REV.set(short,   { rev, multi });
}

// Boolean fields stored as 0/1 integers
const BOOL_FIELDS_VERBOSE = new Set([
  'permCaseMgmt', 'permCollectStore', 'permShareService', 'permShareReport',
  'permTracing', 'withholdInfo',
  'ageEstimated', 'childHasId',
  'caregiverAgeEstimated', 'caregiverHasId', 'caregiverDisabilities',
  'caregiverRelatedToChild', 'caregiverKnowsFamily', 'caregiverWilling',
  'caregiverLegalGuardian', 'caregiverUnder18',
  'motherDisabilities', 'motherChildContact', 'motherHasId', 'motherAgeEstimated',
  'fatherDisabilities', 'fatherChildContact', 'fatherHasId', 'fatherAgeEstimated',
  'urgentNeedsExist', 'familyTracingNeeded',
  'isReopenedCase', 'perpetratorKnown', 'incidentLocKnown', 'childSeenAlone',
  'bidRequired',
  'anotherAssessNeeded', 'planChangesNeeded', 'nextReviewNeeded',
  'closureDiscussedChild', 'closureDiscussedCaregiver',
  'childInfoProvided', 'caregiverInfoProvided',
]);
const BOOL_FIELDS_SHORT = new Set(
  [...BOOL_FIELDS_VERBOSE].map(v => FIELD_TO_SHORT[v] ?? v)
);

// Date fields stored as Unix seconds (fud/fnf are nested; handled in fu helpers)
const TIMESTAMP_FIELDS_VERBOSE = new Set([
  'dateFormCompleted', 'dateCaseIdentified', 'dateCaseRegistered', 'dateCaseReopened',
  'dateOfBirth', 'caregiverDob', 'caregiverArrangementStart',
  'motherDob', 'fatherDob', 'submittedAt',
  'authConsentPersonDate', 'authParentDate',
  'dateAssessmentStart', 'dateAssessmentEnd', 'previousClosureDate',
  'datePlanStart', 'dateReviewStart', 'nextReviewDate',
  'dateClosed', 'dateSupervisorMeeting', 'dateFamilyMeeting', 'finalFollowUpDate',
]);

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Iterates byte-by-byte so btoa never encounters a multi-byte char sequence.
function _uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function _base64ToUint8(b64) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// TextEncoder is available from Expo SDK 48 + (RN 0.71 / Hermes). The fallback
// covers older environments; it is ASCII-only so PINs must stay ASCII.
function _encodeStr(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  return Uint8Array.from([...str].map(c => c.charCodeAt(0)));
}

function _nowSecs() {
  return Math.floor(Date.now() / 1000);
}

// Guards every operation that requires Web Crypto, giving a clear error on
// environments where the Hermes engine is absent.
function _subtle() {
  if (typeof crypto === 'undefined' || !crypto?.subtle) {
    throw new Error(
      'crypto.subtle unavailable — requires React Native 0.71 + with Hermes.'
    );
  }
  return crypto.subtle;
}

// ─── 1. KEY DERIVATION ───────────────────────────────────────────────────────

/**
 * Derives a 256-bit AES-GCM key from userPin + deviceId and stores the raw
 * key bytes in the device secure enclave.  The key is never written to
 * AsyncStorage, config files, or source code.
 *
 * Primary path:  PBKDF2-SHA256, 100 000 iterations via Web Crypto (Hermes).
 * Fallback path: 10 000 × iterated SHA-256 via expo-crypto, used only when
 *                crypto.subtle.deriveKey is absent (pre-Hermes builds).
 *
 * deviceId acts as a per-device salt so the same PIN produces a different key
 * on every device, defeating cross-device rainbow-table attacks.
 */
export async function deriveKey(userPin, deviceId) {
  let keyBytes;

  if (typeof crypto !== 'undefined' && crypto?.subtle?.deriveKey) {
    const subtle = _subtle();
    const keyMaterial = await subtle.importKey(
      'raw',
      _encodeStr(userPin),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    const aesKey = await subtle.deriveKey(
      {
        name:       'PBKDF2',
        salt:       _encodeStr(deviceId),
        iterations: PBKDF2_ITERATIONS,
        hash:       'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: KEY_BITS },
      true,            // must be extractable so we can export it for secure storage
      ['encrypt', 'decrypt']
    );
    const exported = await subtle.exportKey('raw', aesKey);
    keyBytes = new Uint8Array(exported);
  } else {
    // Fallback: iterated SHA-256 via expo-crypto.
    // Each round mixes in the iteration index to prevent length-extension attacks.
    let hex = `${userPin}:${deviceId}`;
    for (let i = 0; i < 10_000; i++) {
      hex = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        hex + i,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    }
    keyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++)
      keyBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  await SecureStore.setItemAsync(SECURE_KEY_ALIAS, _uint8ToBase64(keyBytes));
  keyBytes.fill(0); // zero the working copy before GC can snapshot it
}

// Loads the persisted key bytes from SecureStore and re-imports as a
// non-extractable CryptoKey for the current operation.
async function _loadCryptoKey() {
  const stored = await SecureStore.getItemAsync(SECURE_KEY_ALIAS);
  if (!stored) {
    throw new Error('No encryption key found. Call deriveKey(pin, deviceId) first.');
  }
  return _subtle().importKey(
    'raw',
    _base64ToUint8(stored),
    { name: 'AES-GCM', length: KEY_BITS },
    false,           // non-extractable after import — key bytes never leave SecureStore
    ['encrypt', 'decrypt']
  );
}

// ─── 2. COMPRESSION ───────────────────────────────────────────────────────────

/**
 * Serialises a JS object to JSON and compresses it with pako deflate.
 * Compression runs BEFORE encryption because ciphertext is statistically
 * random and incompressible — compressing after would waste CPU for zero gain.
 */
export function compress(jsonObject) {
  return pako.deflate(JSON.stringify(jsonObject));
}

/**
 * Decompresses a Uint8Array produced by compress() back to a JS object.
 */
export function decompress(uint8array) {
  return JSON.parse(pako.inflate(uint8array, { to: 'string' }));
}

// ─── 3. COMPACT JSON ─────────────────────────────────────────────────────────

function _toUnixSecs(val) {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Math.floor(new Date(val).getTime() / 1000);
  return val;
}

// Precomputed reverse lookups for enum fields that appear only inside nested arrays.
const _URGENT_CAT_REV    = Object.fromEntries(Object.entries(URGENT_CAT).map(([k, v]) => [v, k]));
const _ACTION_STATUS_REV = Object.fromEntries(Object.entries(ACTION_STATUS).map(([k, v]) => [v, k]));
const _FU_WITH_REV       = Object.fromEntries(Object.entries(FU_WITH).map(([k, v]) => [v, k]));
const _FU_HOW_REV        = Object.fromEntries(Object.entries(FU_HOW).map(([k, v]) => [v, k]));

// ── Nested compact / expand helpers ───────────────────────────────────────────

function _compactHHMember(m) {
  return { nm: m.name, ag: m.age, rl: m.relationship };
}
function _expandHHMember(m) {
  return { name: m.nm, age: m.ag, relationship: m.rl };
}

function _compactIFMember(m) {
  return { nm: m.name, ag: m.age, rl: m.relationship, ad: m.address };
}
function _expandIFMember(m) {
  return { name: m.nm, age: m.ag, relationship: m.rl, address: m.ad };
}

function _compactUrgentItem(item) {
  return {
    ct: URGENT_CAT[item.category] ?? item.category,
    nd: item.needsDesc,
    rs: item.reasons,
    ac: item.actionTaken,
  };
}
function _expandUrgentItem(item) {
  return {
    category:    _URGENT_CAT_REV[item.ct] ?? item.ct,
    needsDesc:   item.nd,
    reasons:     item.rs,
    actionTaken: item.ac,
  };
}

function _compactActionItem(item) {
  return {
    ani: item.needIdentified,
    aat: item.actionsToTake,
    apr: item.responsible,
    apt: item.timeNeeded,
    aps: ACTION_STATUS[item.status] ?? item.status,
    apn: item.notes,
  };
}
function _expandActionItem(item) {
  return {
    needIdentified: item.ani,
    actionsToTake:  item.aat,
    responsible:    item.apr,
    timeNeeded:     item.apt,
    status:         _ACTION_STATUS_REV[item.aps] ?? item.aps,
    notes:          item.apn,
  };
}

function _compactFollowUp(fu) {
  return {
    fud: fu.date     != null ? _toUnixSecs(fu.date)    : undefined,
    fuw: Array.isArray(fu.followedWith)    ? fu.followedWith.map(v => FU_WITH[v] ?? v)   : fu.followedWith,
    fux: fu.followedWithOther,
    fut: Array.isArray(fu.followedThrough) ? fu.followedThrough.map(v => FU_HOW[v] ?? v) : fu.followedThrough,
    fua: fu.actionService,
    fuo: fu.observations,
    fun: fu.furtherNeeded ? 1 : 0,
    fnf: fu.nextDate != null ? _toUnixSecs(fu.nextDate) : undefined,
  };
}
function _expandFollowUp(fu) {
  return {
    date:              fu.fud,
    followedWith:      Array.isArray(fu.fuw) ? fu.fuw.map(n => _FU_WITH_REV[n] ?? n) : fu.fuw,
    followedWithOther: fu.fux,
    followedThrough:   Array.isArray(fu.fut) ? fu.fut.map(n => _FU_HOW_REV[n] ?? n)  : fu.fut,
    actionService:     fu.fua,
    observations:      fu.fuo,
    furtherNeeded:     fu.fun === 1,
    nextDate:          fu.fnf,
  };
}

/**
 * Converts a verbose form object to its minimal representation before compression.
 *
 *   Enum strings → integers via ENUM_FWD registry (single or array)
 *   Booleans     → 0 / 1
 *   Dates        → Unix seconds (ISO string or existing number both accepted)
 *   Nested arrays → compacted recursively by dedicated helpers
 *   Everything else → passed through unchanged
 *
 * Compacting typically halves the JSON payload before deflate even runs.
 * Timestamps are returned as numbers by decryptRecord; format with new Date(ts * 1000).
 */
export function toCompact(caseObject) {
  const out = {};
  for (const [verbose, val] of Object.entries(caseObject)) {
    if (val == null) continue;
    const short = FIELD_TO_SHORT[verbose] ?? verbose;

    if (ENUM_FWD.has(verbose)) {
      const { fwd, multi } = ENUM_FWD.get(verbose);
      out[short] = multi
        ? (Array.isArray(val) ? val.map(v => fwd[v] ?? v) : val)
        : (fwd[val] ?? val);
    } else if (BOOL_FIELDS_VERBOSE.has(verbose)) {
      out[short] = val ? 1 : 0;
    } else if (TIMESTAMP_FIELDS_VERBOSE.has(verbose)) {
      out[short] = _toUnixSecs(val);
    } else if (verbose === 'householdMembers') {
      out[short] = Array.isArray(val) ? val.map(_compactHHMember) : val;
    } else if (verbose === 'immediateFamilyMembers') {
      out[short] = Array.isArray(val) ? val.map(_compactIFMember) : val;
    } else if (verbose === 'urgentNeedsItems') {
      out[short] = Array.isArray(val) ? val.map(_compactUrgentItem) : val;
    } else if (verbose === 'actionPlan') {
      out[short] = Array.isArray(val) ? val.map(_compactActionItem) : val;
    } else if (verbose === 'followUpEntries') {
      out[short] = Array.isArray(val) ? val.map(_compactFollowUp) : val;
    } else {
      out[short] = val;
    }
  }
  return out;
}

/**
 * Reverses toCompact — expands short codes and integer values back to their
 * verbose equivalents. Timestamps remain as Unix seconds numbers.
 */
export function fromCompact(compactObject) {
  const out = {};
  for (const [short, val] of Object.entries(compactObject)) {
    if (val == null) continue;
    const verbose = FIELD_TO_LONG[short] ?? short;

    if (ENUM_REV.has(short)) {
      const { rev, multi } = ENUM_REV.get(short);
      out[verbose] = multi
        ? (Array.isArray(val) ? val.map(n => rev[n] ?? n) : val)
        : (rev[val] ?? val);
    } else if (BOOL_FIELDS_SHORT.has(short)) {
      out[verbose] = val === 1;
    } else if (short === 'hhm') {
      out[verbose] = Array.isArray(val) ? val.map(_expandHHMember) : val;
    } else if (short === 'ifm') {
      out[verbose] = Array.isArray(val) ? val.map(_expandIFMember) : val;
    } else if (short === 'uni') {
      out[verbose] = Array.isArray(val) ? val.map(_expandUrgentItem) : val;
    } else if (short === 'ap') {
      out[verbose] = Array.isArray(val) ? val.map(_expandActionItem) : val;
    } else if (short === 'fu') {
      out[verbose] = Array.isArray(val) ? val.map(_expandFollowUp) : val;
    } else {
      out[verbose] = val;
    }
  }
  return out;
}

// ─── 4. ENCRYPTION ───────────────────────────────────────────────────────────

/**
 * Full write pipeline: toCompact → compress → AES-256-GCM encrypt → base64.
 *
 * A fresh 12-byte IV is generated for every call via expo-crypto's CSPRNG.
 * Identical inputs therefore produce different ciphertexts — this prevents
 * traffic analysis even if an adversary obtains multiple encrypted copies of
 * the same case.
 *
 * Blob layout (before base64 encoding):
 *   [ IV (12 bytes) | ciphertext | GCM auth tag (16 bytes) ]
 * Web Crypto concatenates the auth tag to the ciphertext automatically.
 *
 * The returned base64 string is ready to hand to the DB teammate as-is.
 */
export async function encryptRecord(caseObject) {
  const subtle    = _subtle();
  const cryptoKey = await _loadCryptoKey();
  const iv        = await Crypto.getRandomBytesAsync(IV_BYTES);
  const plaintext = compress(toCompact(caseObject)); // Uint8Array

  // AES-GCM output = ciphertext ‖ 16-byte auth tag (appended by Web Crypto)
  const cipherBuf = await subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plaintext);
  const cipherArr = new Uint8Array(cipherBuf);

  const packed = new Uint8Array(IV_BYTES + cipherArr.length);
  packed.set(iv, 0);
  packed.set(cipherArr, IV_BYTES);

  return _uint8ToBase64(packed);
}

/**
 * Full read pipeline: base64 → split IV/ciphertext → AES-256-GCM decrypt
 *                    → decompress → fromCompact.
 *
 * Any key mismatch, flipped bit, or tampered byte causes GCM authentication
 * to fail and throws an error rather than returning corrupt plaintext.
 */
export async function decryptRecord(base64String) {
  const subtle    = _subtle();
  const cryptoKey = await _loadCryptoKey();
  const packed    = _base64ToUint8(base64String);

  const iv         = packed.slice(0, IV_BYTES);
  const ciphertext = packed.slice(IV_BYTES); // includes 16-byte auth tag at tail

  let plainBuf;
  try {
    plainBuf = await subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
  } catch {
    throw new Error('Decryption failed — wrong key, corrupted blob, or tampered data.');
  }

  return fromCompact(decompress(new Uint8Array(plainBuf)));
}

// ─── 5. AUDIT LOG ────────────────────────────────────────────────────────────

/**
 * Appends one audit entry per status change. workerId and deviceId are stored
 * as plaintext so security reviews can trace every action without decrypting
 * any case blob.
 */
async function _writeAuditLog(db, { timestamp, workerId, action, caseId, deviceId }) {
  await db.runAsync(
    `INSERT INTO audit_log (timestamp, worker_id, action, case_id, device_id)
     VALUES (?, ?, ?, ?, ?)`,
    [timestamp, workerId, action, caseId, deviceId]
  );
}

// ─── 6. CASE STATUS LIFECYCLE ────────────────────────────────────────────────

/**
 * Updates a case's status column and writes the corresponding audit entry.
 *
 * Valid transition graph (callers are responsible for enforcing it):
 *
 *   created → pending_supervisor → supervisor_approved  → synced_to_server
 *                               ↘ rejected_needs_revision  (loop back to pending)
 *                               ↘ eligible_for_direct_upload  (48-hour timeout)
 */
export async function updateCaseStatus(db, caseId, newStatus, workerId, deviceId) {
  const now = _nowSecs();
  await db.runAsync(
    'UPDATE cases SET status = ? WHERE case_id = ?',
    [newStatus, caseId]
  );
  await _writeAuditLog(db, {
    timestamp: now,
    workerId,
    action:   `status_changed_to_${newStatus}`,
    caseId,
    deviceId,
  });
}

/**
 * Run on every app open. Finds cases that have been awaiting supervisor
 * approval for more than 48 hours and promotes them to eligible_for_direct_upload
 * so the worker is never permanently blocked by an offline supervisor.
 *
 * Returns the array of promoted case_ids so the caller can surface an alert.
 */
export async function checkTimeouts(db, workerId, deviceId) {
  const cutoff = _nowSecs() - TIMEOUT_48H_SECS;
  const stale  = await db.getAllAsync(
    `SELECT case_id FROM cases
     WHERE status = 'pending_supervisor' AND submitted_at <= ?`,
    [cutoff]
  );

  for (const { case_id } of stale) {
    await updateCaseStatus(db, case_id, 'eligible_for_direct_upload', workerId, deviceId);
  }

  return stale.map(r => r.case_id);
}

// ─── 7. SYNC QUEUE ───────────────────────────────────────────────────────────

/**
 * Drains the sync queue when a network connection is available.
 * POSTs each encrypted blob to serverUrl; the server stores blobs as-is
 * (zero-knowledge — it never holds a decryption key).
 *
 * Eligibility: cases with status 'supervisor_approved' OR 'eligible_for_direct_upload'.
 * Each failed attempt increments attempt_count; after MAX_SYNC_RETRIES the row
 * is flagged needs_manual_review = 1 and excluded from future automatic retries.
 *
 * Returns { synced, failed } counts for UI feedback.
 *
 * This is the only function in the module that makes network calls.
 * All other exports work 100 % offline.
 */
export async function drainSyncQueue(db, serverUrl, workerId, deviceId) {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return { synced: 0, failed: 0 };

  const queue = await db.getAllAsync(
    `SELECT sq.case_id, sq.attempt_count,
            c.encrypted_blob, c.created_at, c.worker_id, c.risk_level
     FROM sync_queue sq
     JOIN cases c ON c.case_id = sq.case_id
     WHERE sq.attempt_count < ?
       AND sq.needs_manual_review = 0
       AND c.status IN ('supervisor_approved', 'eligible_for_direct_upload')
     ORDER BY sq.queued_at ASC`,
    [MAX_SYNC_RETRIES]
  );

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch(serverUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          case_id:        item.case_id,
          encrypted_blob: item.encrypted_blob,
          worker_id:      item.worker_id ?? workerId,
          created_at:     item.created_at,
          risk_level:     item.risk_level,
        }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      await db.runAsync(
        'UPDATE cases SET synced = 1, status = ? WHERE case_id = ?',
        ['synced_to_server', item.case_id]
      );
      await db.runAsync(
        'DELETE FROM sync_queue WHERE case_id = ?',
        [item.case_id]
      );
      await _writeAuditLog(db, {
        timestamp: _nowSecs(),
        workerId,
        action:   'synced_to_server',
        caseId:   item.case_id,
        deviceId,
      });
      synced++;
    } catch {
      const newCount    = item.attempt_count + 1;
      const needsReview = newCount >= MAX_SYNC_RETRIES ? 1 : 0;
      await db.runAsync(
        `UPDATE sync_queue
         SET attempt_count = ?, needs_manual_review = ?
         WHERE case_id = ?`,
        [newCount, needsReview, item.case_id]
      );
      failed++;
    }
  }

  return { synced, failed };
}

// ─── 8. PUBLIC INTERFACES ─────────────────────────────────────────────────────

/**
 * Called by the UX teammate when a worker submits a completed form.
 *
 * Encrypts the full case object through the write pipeline, then writes only
 * the encrypted blob plus the non-sensitive metadata columns to the DB.
 * No field that could identify the child (name, notes, location detail,
 * concern specifics) ever touches disk in plaintext.
 *
 * Also enqueues the case for sync and writes the creation audit entry.
 */
export async function saveCase(rawFormObject, db, workerId, deviceId) {
  const blob    = await encryptRecord(rawFormObject);
  const now     = _nowSecs();
  const riskNum = RISK_LEVEL[rawFormObject.riskLevel] ?? rawFormObject.riskLevel;
  const submitted = rawFormObject.submittedAt
    ? (typeof rawFormObject.submittedAt === 'string'
       ? Math.floor(new Date(rawFormObject.submittedAt).getTime() / 1000)
       : rawFormObject.submittedAt)
    : now;

  await db.runAsync(
    `INSERT INTO cases
       (case_id, encrypted_blob, created_at, worker_id,
        risk_level, status, synced, submitted_at)
     VALUES (?, ?, ?, ?, ?, 'created', 0, ?)`,
    [rawFormObject.caseId, blob, now, workerId, riskNum, submitted]
  );

  await db.runAsync(
    `INSERT INTO sync_queue
       (case_id, worker_id, queued_at, attempt_count, needs_manual_review)
     VALUES (?, ?, ?, 0, 0)`,
    [rawFormObject.caseId, workerId, now]
  );

  await _writeAuditLog(db, {
    timestamp: now,
    workerId,
    action:   'case_created',
    caseId:   rawFormObject.caseId,
    deviceId,
  });
}

/**
 * Called by the UX teammate to display a case.
 * Fetches the encrypted blob from the DB and runs the full read pipeline.
 */
export async function loadCase(caseId, db) {
  const row = await db.getFirstAsync(
    'SELECT encrypted_blob FROM cases WHERE case_id = ?',
    [caseId]
  );
  if (!row) throw new Error(`Case not found: ${caseId}`);
  return decryptRecord(row.encrypted_blob);
}

// ─── 9. ROUND-TRIP TESTS ──────────────────────────────────────────────────────

/**
 * Verifies the entire pipeline end-to-end with a representative case that
 * exercises every conversion category: single enum, multi enum, boolean,
 * timestamp, nested array (hhm/ifm/uni/ap/fu), and plain passthrough fields.
 *
 * Call after deriveKey() so the crypto key is available.
 * All assertions throw on failure so the first broken step surfaces immediately.
 */
export async function runTests() {
  const results = [];
  const assert  = (condition, label) => {
    results.push({ label, pass: !!condition });
    console.log(`  ${condition ? '✓' : '✗'} ${label}`);
    if (!condition) throw new Error(`Assertion failed: ${label}`);
  };
  const assertEq = (a, b, label) => assert(JSON.stringify(a) === JSON.stringify(b), label);

  const TS_SUBMITTED   = Math.floor(new Date('2025-01-15T10:30:00Z').getTime() / 1000);
  const TS_DFC         = Math.floor(new Date('2025-01-10T09:00:00Z').getTime() / 1000);
  const TS_DOB         = Math.floor(new Date('2015-06-15T00:00:00Z').getTime() / 1000);
  const TS_FU_DATE     = Math.floor(new Date('2025-02-01T10:00:00Z').getTime() / 1000);
  const TS_FU_NEXT     = Math.floor(new Date('2025-02-15T10:00:00Z').getTime() / 1000);

  const original = {
    // System / DB-plaintext
    caseId:   'CASE-2025-TEST-001',
    workerId: 'WORKER-042',
    status:   'created',

    // Single-select enums
    riskLevel:          'high',          // RISK_LEVEL.high   = 3
    legitimateBasis:    'consent',       // LEGITIMATE_BASIS  = 0
    sex:                'female',        // SEX.female        = 1
    birthRegistration:  'registered',    // BIRTH_REG         = 0
    nationalityStatus:  'national',      // NAT_STATUS        = 0
    displacementStatus: 'internally_displaced', // DISP_STATUS = 2
    maritalStatus:      'not_married',   // MARITAL_STATUS    = 0
    careArrangement:    'kinship',       // CARE_ARRANGEMENT  = 6
    areaOfLiving:       'camp_settlement', // AREA_LIVING     = 2
    motherAlive:        'unknown',       // ALIVE_STATUS      = 2
    fatherAlive:        'no',            // ALIVE_STATUS      = 0
    contactType:        'home_visit',    // CONTACT_TYPE      = 0
    educationStatus:    'none',          // EDU_STATUS        = 0
    referralSource:     'community_member', // REFERRAL_SOURCE = 2

    // Multi-select enums
    consentFrom:      ['child', 'one_parent_caregiver'],  // [0, 1]
    assentFrom:       ['child'],                          // [0]
    disabilityStatus: ['none'],                           // [0]
    cpRisks:          ['unaccompanied', 'neglect', 'psychological_distress'], // [9, 3, 12]
    whoPresent:       ['child', 'parent_caregiver'],      // [0, 1]
    servicesProvided: ['health', 'mhpss', 'family_tracing_reunification'],    // [0, 5, 6]
    whoCasePlan:      ['child', 'parents_caregivers'],    // [1, 0]
    whoReview:        ['child', 'supervisor'],            // [1, 2]

    // Booleans → 0/1
    permCaseMgmt:          true,
    permCollectStore:      true,
    permShareService:      false,
    ageEstimated:          false,
    childHasId:            true,
    urgentNeedsExist:      true,
    isReopenedCase:        false,
    childSeenAlone:        true,
    anotherAssessNeeded:   false,
    closureDiscussedChild: true,

    // Timestamps (ISO string → Unix seconds)
    submittedAt:         '2025-01-15T10:30:00Z',
    dateFormCompleted:   '2025-01-10T09:00:00Z',
    dateOfBirth:         '2015-06-15T00:00:00Z',

    // Plain passthrough (free text and integers)
    childFirstName:     'Amina',
    childLastName:      'Hassan',
    agency:             'UNHCR',
    childSituationDesc: 'Child found unaccompanied at checkpoint.',
    caseObjectives:     ['Locate mother', 'Enroll in school'],
    age:                9,
    householdAdults:    1,
    householdChildren:  2,

    // Nested: householdMembers (hhm)
    householdMembers: [
      { name: 'Fatima Hassan', age: 35, relationship: 'aunt' },
      { name: 'Omar Hassan',   age: 10, relationship: 'cousin' },
    ],

    // Nested: immediateFamilyMembers (ifm)
    immediateFamilyMembers: [
      { name: 'Hodan Hassan', age: 28, relationship: 'mother', address: 'Unknown - displaced' },
    ],

    // Nested: urgentNeedsItems (uni) — category is an enum
    urgentNeedsItems: [
      {
        category:    'health',   // URGENT_CAT.health = 0
        needsDesc:   'Medical assessment required',
        reasons:     'No medical history',
        actionTaken: 'Referred to camp clinic',
      },
    ],

    // Nested: actionPlan (ap) — status is an enum
    actionPlan: [
      {
        needIdentified: 'Family tracing',
        actionsToTake:  'Submit FTR request',
        responsible:    'Case worker',
        timeNeeded:     '2 weeks',
        status:         'pending',  // ACTION_STATUS.pending = 0
        notes:          'Priority',
      },
    ],

    // Nested: followUpEntries (fu) — followedWith/followedThrough are enums + date timestamps
    followUpEntries: [
      {
        date:              '2025-02-01T10:00:00Z',
        followedWith:      ['child', 'parents_caregivers'],  // [0, 1]
        followedWithOther: null,
        followedThrough:   ['home_visit', 'phone_call'],     // [0, 1]
        actionService:     'FTR request',
        observations:      'Child improving',
        furtherNeeded:     true,  // → 1
        nextDate:          '2025-02-15T10:00:00Z',
      },
    ],
  };

  console.log('\n── encryptionModule.runTests ──');

  // ── toCompact ─────────────────────────────────────────────────────────────
  const compact = toCompact(original);

  // System passthrough
  assert(compact.id === 'CASE-2025-TEST-001', 'toCompact: caseId → id');
  assert(compact.w  === 'WORKER-042',          'toCompact: workerId → w');
  assert(compact.st === 'created',             'toCompact: status → st');

  // Single-select enums
  assert(compact.r   === 3, 'toCompact: riskLevel high → 3');
  assert(compact.lb  === 0, 'toCompact: legitimateBasis consent → 0');
  assert(compact.sx  === 1, 'toCompact: sex female → 1');
  assert(compact.br  === 0, 'toCompact: birthRegistration registered → 0');
  assert(compact.ns  === 0, 'toCompact: nationalityStatus national → 0');
  assert(compact.dp  === 2, 'toCompact: displacementStatus internally_displaced → 2');
  assert(compact.ms  === 0, 'toCompact: maritalStatus not_married → 0');
  assert(compact.ca  === 6, 'toCompact: careArrangement kinship → 6');
  assert(compact.aol === 2, 'toCompact: areaOfLiving camp_settlement → 2');
  assert(compact.mal === 2, 'toCompact: motherAlive unknown → 2');
  assert(compact.fal === 0, 'toCompact: fatherAlive no → 0');
  assert(compact.tc  === 0, 'toCompact: contactType home_visit → 0');
  assert(compact.edu === 0, 'toCompact: educationStatus none → 0');
  assert(compact.rfs === 2, 'toCompact: referralSource community_member → 2');

  // Multi-select enums
  assertEq(compact.cf,  [0, 1],    'toCompact: consentFrom → [0,1]');
  assertEq(compact.af,  [0],       'toCompact: assentFrom → [0]');
  assertEq(compact.dis, [0],       'toCompact: disabilityStatus [none] → [0]');
  assertEq(compact.cpr, [9, 3, 12],'toCompact: cpRisks → [9,3,12]');
  assertEq(compact.wpa, [0, 1],    'toCompact: whoPresent → [0,1]');
  assertEq(compact.srv, [0, 5, 6], 'toCompact: servicesProvided → [0,5,6]');
  assertEq(compact.wcp, [1, 0],    'toCompact: whoCasePlan → [1,0]');
  assertEq(compact.wri, [1, 2],    'toCompact: whoReview → [1,2]');

  // Booleans
  assert(compact.pcp === 1, 'toCompact: permCaseMgmt true → 1');
  assert(compact.csp === 1, 'toCompact: permCollectStore true → 1');
  assert(compact.sps === 0, 'toCompact: permShareService false → 0');
  assert(compact.ae  === 0, 'toCompact: ageEstimated false → 0');
  assert(compact.cid === 1, 'toCompact: childHasId true → 1');
  assert(compact.ung === 1, 'toCompact: urgentNeedsExist true → 1');
  assert(compact.roc === 0, 'toCompact: isReopenedCase false → 0');
  assert(compact.csi === 1, 'toCompact: childSeenAlone true → 1');
  assert(compact.aan === 0, 'toCompact: anotherAssessNeeded false → 0');
  assert(compact.cdc === 1, 'toCompact: closureDiscussedChild true → 1');

  // Timestamps
  assert(compact.ts  === TS_SUBMITTED, 'toCompact: submittedAt → correct unix secs');
  assert(compact.dfc === TS_DFC,       'toCompact: dateFormCompleted → unix secs');
  assert(compact.dob === TS_DOB,       'toCompact: dateOfBirth → unix secs');

  // Plain passthrough
  assert(compact.fn  === 'Amina',                               'toCompact: childFirstName → fn');
  assert(compact.ln  === 'Hassan',                              'toCompact: childLastName → ln');
  assert(compact.ag  === 'UNHCR',                               'toCompact: agency → ag');
  assert(compact.cpd === 'Child found unaccompanied at checkpoint.', 'toCompact: childSituationDesc → cpd');
  assert(compact.a   === 9,                                     'toCompact: age → a integer');

  // Nested: hhm
  assert(compact.hhm.length   === 2,               'toCompact: hhm array length 2');
  assert(compact.hhm[0].nm    === 'Fatima Hassan', 'toCompact: hhm[0].name → nm');
  assert(compact.hhm[0].ag    === 35,              'toCompact: hhm[0].age → ag');
  assert(compact.hhm[0].rl    === 'aunt',          'toCompact: hhm[0].relationship → rl');

  // Nested: ifm
  assert(compact.ifm[0].ad === 'Unknown - displaced', 'toCompact: ifm[0].address → ad');

  // Nested: uni (enum in nested)
  assert(compact.uni[0].ct === 0,                          'toCompact: uni[0].category health → 0');
  assert(compact.uni[0].nd === 'Medical assessment required', 'toCompact: uni[0].needsDesc → nd');

  // Nested: ap (enum in nested)
  assert(compact.ap[0].aps === 0,                'toCompact: ap[0].status pending → 0');
  assert(compact.ap[0].ani === 'Family tracing', 'toCompact: ap[0].needIdentified → ani');

  // Nested: fu (enum arrays + timestamps + boolean in nested)
  assert(compact.fu[0].fud === TS_FU_DATE,   'toCompact: fu[0].date → fud unix secs');
  assert(compact.fu[0].fnf === TS_FU_NEXT,   'toCompact: fu[0].nextDate → fnf unix secs');
  assert(compact.fu[0].fun === 1,             'toCompact: fu[0].furtherNeeded true → 1');
  assertEq(compact.fu[0].fuw, [0, 1],         'toCompact: fu[0].followedWith → [0,1]');
  assertEq(compact.fu[0].fut, [0, 1],         'toCompact: fu[0].followedThrough → [0,1]');

  // ── fromCompact ───────────────────────────────────────────────────────────
  const expanded = fromCompact(compact);

  // System passthrough
  assert(expanded.caseId   === 'CASE-2025-TEST-001', 'fromCompact: id → caseId');
  assert(expanded.workerId  === 'WORKER-042',          'fromCompact: w → workerId');

  // Single-select enums
  assert(expanded.riskLevel          === 'high',                 'fromCompact: 3 → riskLevel high');
  assert(expanded.sex                === 'female',               'fromCompact: 1 → sex female');
  assert(expanded.motherAlive        === 'unknown',              'fromCompact: 2 → motherAlive unknown');
  assert(expanded.fatherAlive        === 'no',                   'fromCompact: 0 → fatherAlive no');
  assert(expanded.displacementStatus === 'internally_displaced', 'fromCompact: 2 → displacementStatus');
  assert(expanded.careArrangement    === 'kinship',              'fromCompact: 6 → careArrangement');
  assert(expanded.educationStatus    === 'none',                 'fromCompact: 0 → educationStatus');

  // Multi-select enums
  assertEq(expanded.consentFrom,      ['child', 'one_parent_caregiver'],            'fromCompact: cf → consentFrom');
  assertEq(expanded.cpRisks,          ['unaccompanied', 'neglect', 'psychological_distress'], 'fromCompact: cpr → cpRisks');
  assertEq(expanded.servicesProvided, ['health', 'mhpss', 'family_tracing_reunification'],    'fromCompact: srv → servicesProvided');
  assertEq(expanded.whoCasePlan,      ['child', 'parents_caregivers'],              'fromCompact: wcp → whoCasePlan');
  assertEq(expanded.whoReview,        ['child', 'supervisor'],                      'fromCompact: wri → whoReview');

  // Booleans
  assert(expanded.permCaseMgmt   === true,  'fromCompact: 1 → permCaseMgmt true');
  assert(expanded.permShareService === false, 'fromCompact: 0 → permShareService false');
  assert(expanded.childSeenAlone === true,   'fromCompact: 1 → childSeenAlone true');
  assert(expanded.isReopenedCase === false,  'fromCompact: 0 → isReopenedCase false');

  // Timestamps remain as unix seconds numbers
  assert(typeof expanded.submittedAt === 'number', 'fromCompact: ts stays as unix secs number');
  assert(expanded.submittedAt === TS_SUBMITTED,    'fromCompact: ts correct value');

  // Nested: hhm
  assert(expanded.householdMembers.length       === 2,               'fromCompact: hhm → length 2');
  assert(expanded.householdMembers[0].name      === 'Fatima Hassan', 'fromCompact: nm → name');
  assert(expanded.householdMembers[0].age       === 35,              'fromCompact: ag → age');
  assert(expanded.householdMembers[0].relationship === 'aunt',       'fromCompact: rl → relationship');

  // Nested: ifm
  assert(expanded.immediateFamilyMembers[0].address === 'Unknown - displaced', 'fromCompact: ad → address');

  // Nested: uni
  assert(expanded.urgentNeedsItems[0].category    === 'health',                    'fromCompact: ct 0 → category health');
  assert(expanded.urgentNeedsItems[0].needsDesc   === 'Medical assessment required', 'fromCompact: nd → needsDesc');
  assert(expanded.urgentNeedsItems[0].actionTaken === 'Referred to camp clinic',    'fromCompact: ac → actionTaken');

  // Nested: ap
  assert(expanded.actionPlan[0].status         === 'pending',       'fromCompact: aps 0 → status pending');
  assert(expanded.actionPlan[0].needIdentified === 'Family tracing', 'fromCompact: ani → needIdentified');

  // Nested: fu
  assert(expanded.followUpEntries[0].furtherNeeded === true,        'fromCompact: fun 1 → furtherNeeded true');
  assert(expanded.followUpEntries[0].date          === TS_FU_DATE,  'fromCompact: fud → date unix secs');
  assertEq(expanded.followUpEntries[0].followedWith,    ['child', 'parents_caregivers'], 'fromCompact: fuw → followedWith');
  assertEq(expanded.followUpEntries[0].followedThrough, ['home_visit', 'phone_call'],    'fromCompact: fut → followedThrough');

  // ── compress / decompress ─────────────────────────────────────────────────
  const compressed = compress(compact);
  assert(compressed instanceof Uint8Array, 'compress: returns Uint8Array');
  assert(compressed.length > 0,           'compress: non-empty');
  assertEq(decompress(compressed), compact, 'decompress: exact round-trip match');

  // ── encryptRecord ─────────────────────────────────────────────────────────
  const blob1 = await encryptRecord(original);
  assert(typeof blob1 === 'string', 'encryptRecord: returns string');
  assert(blob1.length > 0,         'encryptRecord: non-empty blob');

  const blob2 = await encryptRecord(original);
  assert(blob1 !== blob2, 'encryptRecord: fresh IV → unique ciphertext per call');

  // ── decryptRecord — full round-trip ───────────────────────────────────────
  const recovered = await decryptRecord(blob1);

  assert(recovered.caseId            === 'CASE-2025-TEST-001', 'decryptRecord: caseId');
  assert(recovered.riskLevel         === 'high',               'decryptRecord: riskLevel');
  assert(recovered.sex               === 'female',             'decryptRecord: sex');
  assert(recovered.permCaseMgmt      === true,                 'decryptRecord: permCaseMgmt');
  assert(recovered.permShareService  === false,                'decryptRecord: permShareService');
  assert(recovered.submittedAt       === TS_SUBMITTED,         'decryptRecord: submittedAt unix secs');
  assert(recovered.age               === 9,                    'decryptRecord: age');
  assertEq(recovered.cpRisks,         ['unaccompanied', 'neglect', 'psychological_distress'], 'decryptRecord: cpRisks');
  assertEq(recovered.servicesProvided, ['health', 'mhpss', 'family_tracing_reunification'],   'decryptRecord: servicesProvided');
  assert(recovered.householdMembers.length         === 2,               'decryptRecord: hhm length');
  assert(recovered.householdMembers[0].name        === 'Fatima Hassan', 'decryptRecord: hhm[0].name');
  assert(recovered.urgentNeedsItems[0].category    === 'health',        'decryptRecord: uni[0].category');
  assert(recovered.actionPlan[0].status            === 'pending',       'decryptRecord: ap[0].status');
  assert(recovered.followUpEntries[0].furtherNeeded === true,           'decryptRecord: fu[0].furtherNeeded');

  // ── GCM tamper detection ──────────────────────────────────────────────────
  let tamperRejected = false;
  try {
    const bytes = _base64ToUint8(blob1);
    bytes[IV_BYTES + 4] ^= 0xff;
    await decryptRecord(_uint8ToBase64(bytes));
  } catch { tamperRejected = true; }
  assert(tamperRejected, 'GCM: modified ciphertext is rejected');

  // ── Wrong key detection ───────────────────────────────────────────────────
  let wrongKeyRejected = false;
  try {
    const fakeKey = await Crypto.getRandomBytesAsync(32);
    const saved   = await SecureStore.getItemAsync(SECURE_KEY_ALIAS);
    await SecureStore.setItemAsync(SECURE_KEY_ALIAS, _uint8ToBase64(fakeKey));
    try { await decryptRecord(blob1); }
    finally { await SecureStore.setItemAsync(SECURE_KEY_ALIAS, saved); }
  } catch { wrongKeyRejected = true; }
  assert(wrongKeyRejected, 'Wrong key: decryption attempt is rejected');

  console.log(`\n  All ${results.length} assertions passed.\n`);
  return results;
}
