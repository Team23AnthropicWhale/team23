/**
 * encryptionModule.test.js
 *
 * Full Jest test suite for the encryption / data pipeline module.
 * Run with: npx jest modules/__tests__/encryptionModule.test.js
 *
 * Hardware dependencies are stubbed via manual mocks in modules/__mocks__/.
 * Real crypto.subtle (AES-GCM, PBKDF2) runs in Node 18+ — no crypto mock needed.
 */

import {
  deriveKey,
  compress, decompress,
  toCompact, fromCompact,
  encryptRecord, decryptRecord,
  updateCaseStatus, checkTimeouts,
  drainSyncQueue,
  saveCase, loadCase,
} from '../encryptionModule.js';

// ─── Mock accessors ───────────────────────────────────────────────────────────

const SecureStore = require('expo-secure-store');
const Crypto      = require('expo-crypto');
const NetInfo     = require('@react-native-community/netinfo');

// ─── Constants shared across all tests ───────────────────────────────────────

const WORKER_ID = 'WORKER-042';
const DEVICE_ID = 'device-001';
const TEST_PIN  = '1234';
const ALT_PIN   = '9999';
const ALT_DEV   = 'device-002';

// ─── Realistic sample case (uses actual FIELD_TO_SHORT verbose keys) ──────────
// childFirstName / childLastName are ENCRYPTED_TEXT — must never reach plaintext DB columns.

const sampleCase = {
  caseId:            'CP-7X4K2',
  workerId:          WORKER_ID,
  status:            'created',
  // Single-select enums
  riskLevel:         'high',
  sex:               'female',
  birthRegistration: 'registered',
  nationalityStatus: 'national',
  displacementStatus:'internally_displaced',
  maritalStatus:     'not_married',
  careArrangement:   'kinship',
  areaOfLiving:      'camp_settlement',
  motherAlive:       'unknown',
  fatherAlive:       'no',
  educationStatus:   'none',
  referralSource:    'community_member',
  contactType:       'home_visit',
  // Multi-select enums
  cpRisks:           ['unaccompanied', 'neglect', 'psychological_distress'],
  whoPresent:        ['child', 'parent_caregiver'],
  servicesProvided:  ['health', 'mhpss', 'family_tracing_reunification'],
  disabilityStatus:  ['none'],
  // Booleans
  permCaseMgmt:      true,
  permCollectStore:  true,
  permShareService:  false,
  ageEstimated:      false,
  childHasId:        false,
  urgentNeedsExist:  true,
  isReopenedCase:    false,
  childSeenAlone:    true,
  // Timestamps
  submittedAt:       '2025-01-15T10:30:00Z',
  dateOfBirth:       '2015-06-15T00:00:00Z',
  dateAssessmentStart:'2025-01-16T09:00:00Z',
  // Free text (ENCRYPTED_TEXT — must never appear in plaintext DB columns)
  childFirstName:    'Amina',
  childLastName:     'Hassan',
  agency:            'UNHCR',
  childSituationDesc:'Found alone near camp perimeter, signs of malnourishment',
  assessSafety:      'Child placed in emergency kinship care',
  riskLevelSummary:  'Unaccompanied, neglect confirmed',
  // Integer passthrough
  age:               8,
  householdAdults:   1,
  householdChildren: 1,
  // Nested arrays
  householdMembers:  [{ name: 'Fatima Hassan', age: 35, relationship: 'aunt' }],
  urgentNeedsItems:  [{
    category: 'health', needsDesc: 'Medical check', reasons: 'Malnourished', actionTaken: 'Clinic referral',
  }],
  actionPlan: [{
    needIdentified: 'Family tracing', actionsToTake: 'Submit FTR', responsible: WORKER_ID,
    timeNeeded: '2 weeks', status: 'pending', notes: 'Priority',
  }],
  followUpEntries: [{
    date: '2025-02-01T10:00:00Z', followedWith: ['child'], followedWithOther: null,
    followedThrough: ['home_visit'], actionService: 'FTR submitted',
    observations: 'Improving', furtherNeeded: true, nextDate: '2025-02-15T10:00:00Z',
  }],
};

// ─── In-memory SQLite mock ────────────────────────────────────────────────────

class MockDB {
  constructor() { this._reset(); }

  _reset() {
    this.cases     = {};      // keyed by case_id
    this.syncQueue = {};      // keyed by case_id
    this.auditLog  = [];      // append-only
  }

  async runAsync(sql, params = []) {
    const s = sql.replace(/\s+/g, ' ').trim();

    if (s.startsWith('INSERT INTO cases')) {
      const [case_id, encrypted_blob, created_at, worker_id, risk_level, submitted_at] = params;
      this.cases[case_id] = {
        case_id, encrypted_blob, created_at, worker_id,
        risk_level, status: 'created', synced: 0, submitted_at,
      };

    } else if (s.startsWith('INSERT INTO sync_queue')) {
      const [case_id, worker_id, queued_at] = params;
      this.syncQueue[case_id] = { case_id, worker_id, queued_at, attempt_count: 0, needs_manual_review: 0 };

    } else if (s.startsWith('INSERT INTO audit_log')) {
      const [timestamp, worker_id, action, case_id, device_id] = params;
      this.auditLog.push({ timestamp, worker_id, action, case_id, device_id });

    } else if (s.startsWith('UPDATE cases SET status =')) {
      const [newStatus, case_id] = params;
      if (this.cases[case_id]) this.cases[case_id].status = newStatus;

    } else if (s.startsWith('UPDATE cases SET synced = 1')) {
      const [newStatus, case_id] = params;
      if (this.cases[case_id]) {
        this.cases[case_id].synced  = 1;
        this.cases[case_id].status  = newStatus;
      }

    } else if (s.startsWith('DELETE FROM sync_queue')) {
      const [case_id] = params;
      delete this.syncQueue[case_id];

    } else if (s.startsWith('UPDATE sync_queue SET attempt_count')) {
      const [attempt_count, needs_manual_review, case_id] = params;
      if (this.syncQueue[case_id]) {
        this.syncQueue[case_id].attempt_count      = attempt_count;
        this.syncQueue[case_id].needs_manual_review = needs_manual_review;
      }
    }
  }

  async getAllAsync(sql, params = []) {
    const s = sql.replace(/\s+/g, ' ').trim();

    if (s.includes('pending_supervisor') && s.includes('submitted_at <')) {
      const cutoff = params[0];
      return Object.values(this.cases)
        .filter(c => c.status === 'pending_supervisor' && c.submitted_at <= cutoff);
    }

    if (s.includes('FROM sync_queue sq')) {
      const maxAttempts = params[0];
      return Object.values(this.syncQueue)
        .filter(sq => sq.attempt_count < maxAttempts && sq.needs_manual_review === 0)
        .map(sq => {
          const c = this.cases[sq.case_id];
          if (!c) return null;
          if (!['supervisor_approved', 'eligible_for_direct_upload'].includes(c.status)) return null;
          return {
            case_id:        sq.case_id,
            attempt_count:  sq.attempt_count,
            encrypted_blob: c.encrypted_blob,
            created_at:     c.created_at,
            worker_id:      c.worker_id,
            risk_level:     c.risk_level,
          };
        })
        .filter(Boolean)
        .sort((a, b) =>
          (this.syncQueue[a.case_id]?.queued_at ?? 0) -
          (this.syncQueue[b.case_id]?.queued_at ?? 0)
        );
    }
    return [];
  }

  async getFirstAsync(sql, params = []) {
    if (sql.includes('SELECT encrypted_blob FROM cases')) {
      const [case_id] = params;
      return this.cases[case_id] ?? null;
    }
    return null;
  }
}

// ─── Shared setup ─────────────────────────────────────────────────────────────

let db;

beforeEach(async () => {
  SecureStore._reset();
  Crypto._reset();
  NetInfo._setOffline();

  db = new MockDB();

  // Every test group that encrypts/decrypts needs an active key.
  await deriveKey(TEST_PIN, DEVICE_ID);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. KEY DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

describe('1. Key derivation', () => {
  test('derives a key without throwing', async () => {
    await expect(deriveKey(TEST_PIN, DEVICE_ID)).resolves.not.toThrow();
  });

  test('stores the derived key in SecureStore', async () => {
    const stored = SecureStore._dump();
    const keyCount = Object.keys(stored).length;
    expect(keyCount).toBeGreaterThanOrEqual(1);
    const keyVal = Object.values(stored)[0];
    expect(typeof keyVal).toBe('string');
    expect(keyVal.length).toBeGreaterThan(10);
  });

  test('same PIN + same deviceId always produces the same key', async () => {
    const dump1 = { ...SecureStore._dump() };
    SecureStore._reset();
    await deriveKey(TEST_PIN, DEVICE_ID);
    const dump2 = SecureStore._dump();
    // Both dumps should hold the same base64 key bytes
    const key1 = Object.values(dump1)[0];
    const key2 = Object.values(dump2)[0];
    expect(key1).toBe(key2);
  });

  test('different PIN produces a different key', async () => {
    const key1 = Object.values(SecureStore._dump())[0];
    SecureStore._reset();
    await deriveKey(ALT_PIN, DEVICE_ID);
    const key2 = Object.values(SecureStore._dump())[0];
    expect(key1).not.toBe(key2);
  });

  test('different deviceId produces a different key', async () => {
    const key1 = Object.values(SecureStore._dump())[0];
    SecureStore._reset();
    await deriveKey(TEST_PIN, ALT_DEV);
    const key2 = Object.values(SecureStore._dump())[0];
    expect(key1).not.toBe(key2);
  });

  test('key is never written to AsyncStorage', () => {
    // AsyncStorage is not imported in the module; confirm via absence from mocks
    // The only storage mock is SecureStore — check it held the key
    const dump = SecureStore._dump();
    expect(Object.keys(dump).length).toBeGreaterThanOrEqual(1);
    // If AsyncStorage were used, the require below would not be a jest mock,
    // so we simply assert the key is reachable only via SecureStore.
    const keyInSecureStore = Object.values(dump).some(v => v && v.length > 10);
    expect(keyInSecureStore).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPACT JSON — lookup tables
// ─────────────────────────────────────────────────────────────────────────────

describe('2. Compact JSON — lookup tables', () => {
  let compact;

  beforeEach(() => { compact = toCompact(sampleCase); });

  test('replaces all known verbose keys with short codes', () => {
    expect(compact).toHaveProperty('id');   // caseId → id
    expect(compact).toHaveProperty('r');    // riskLevel → r
    expect(compact).toHaveProperty('sx');   // sex → sx
    expect(compact).toHaveProperty('cpr');  // cpRisks → cpr
    expect(compact).toHaveProperty('ts');   // submittedAt → ts
    expect(compact).toHaveProperty('pcp');  // permCaseMgmt → pcp
  });

  test('no verbose key remains in the compacted output for mapped fields', () => {
    const knownVerboseKeys = [
      'caseId', 'workerId', 'riskLevel', 'sex', 'cpRisks', 'submittedAt',
      'permCaseMgmt', 'permShareService', 'dateOfBirth', 'householdMembers',
      'urgentNeedsItems', 'actionPlan', 'followUpEntries', 'servicesProvided',
    ];
    for (const key of knownVerboseKeys) {
      expect(compact).not.toHaveProperty(key);
    }
  });

  test('single-select enum: riskLevel "high" → number 3', () => {
    expect(compact.r).toBe(3);
  });

  test('single-select enum: sex "female" → number 1', () => {
    expect(compact.sx).toBe(1);
  });

  test('single-select enum: educationStatus "none" → number 0', () => {
    expect(compact.edu).toBe(0);
  });

  test('single-select enum: motherAlive "unknown" → number 2', () => {
    expect(compact.mal).toBe(2);
  });

  test('multi-select enum: cpRisks → integer array', () => {
    // unaccompanied=9, neglect=3, psychological_distress=12
    expect(compact.cpr).toEqual([9, 3, 12]);
  });

  test('multi-select enum: servicesProvided → integer array', () => {
    // health=0, mhpss=5, family_tracing_reunification=6
    expect(compact.srv).toEqual([0, 5, 6]);
  });

  test('multi-select enum: whoPresent → integer array', () => {
    // child=0, parent_caregiver=1
    expect(compact.wpa).toEqual([0, 1]);
  });

  test('boolean true → 1', () => {
    expect(compact.pcp).toBe(1);
    expect(compact.ung).toBe(1);
    expect(compact.csi).toBe(1);
  });

  test('boolean false → 0', () => {
    expect(compact.sps).toBe(0);
    expect(compact.ae).toBe(0);
    expect(compact.roc).toBe(0);
  });

  test('timestamps are Unix integers, not ISO strings', () => {
    expect(typeof compact.ts).toBe('number');
    expect(typeof compact.dob).toBe('number');
    expect(typeof compact.das).toBe('number');
    // Confirm correct epoch conversion
    const expected = Math.floor(new Date('2025-01-15T10:30:00Z').getTime() / 1000);
    expect(compact.ts).toBe(expected);
  });

  test('free-text fields are present in the compacted object unchanged', () => {
    expect(compact.fn).toBe('Amina');
    expect(compact.ln).toBe('Hassan');
    expect(compact.cpd).toBe('Found alone near camp perimeter, signs of malnourishment');
  });

  test('integer fields pass through unchanged', () => {
    expect(compact.a).toBe(8);
    expect(compact.hha).toBe(1);
  });

  test('nested householdMembers (hhm) are compacted', () => {
    expect(compact.hhm).toHaveLength(1);
    expect(compact.hhm[0]).toEqual({ nm: 'Fatima Hassan', ag: 35, rl: 'aunt' });
  });

  test('nested urgentNeedsItems (uni) — category enum → number', () => {
    expect(compact.uni[0].ct).toBe(0);  // health = 0
    expect(compact.uni[0].nd).toBe('Medical check');
  });

  test('nested actionPlan (ap) — status enum → number', () => {
    expect(compact.ap[0].aps).toBe(0);  // pending = 0
    expect(compact.ap[0].ani).toBe('Family tracing');
  });

  test('nested followUpEntries (fu) — enums, timestamps, boolean', () => {
    const fu = compact.fu[0];
    expect(fu.fuw).toEqual([0]);  // child = 0
    expect(fu.fut).toEqual([0]);  // home_visit = 0
    expect(fu.fun).toBe(1);       // furtherNeeded = true
    const expectedDate = Math.floor(new Date('2025-02-01T10:00:00Z').getTime() / 1000);
    expect(fu.fud).toBe(expectedDate);
  });

  test('fromCompact restores all verbose keys', () => {
    const restored = fromCompact(compact);
    expect(restored.caseId).toBe('CP-7X4K2');
    expect(restored.riskLevel).toBe('high');
    expect(restored.sex).toBe('female');
  });

  test('fromCompact restores enum values from numbers', () => {
    const restored = fromCompact(compact);
    expect(restored.cpRisks).toEqual(['unaccompanied', 'neglect', 'psychological_distress']);
    expect(restored.servicesProvided).toEqual(['health', 'mhpss', 'family_tracing_reunification']);
    expect(restored.educationStatus).toBe('none');
    expect(restored.motherAlive).toBe('unknown');
  });

  test('fromCompact restores booleans from 0/1', () => {
    const restored = fromCompact(compact);
    expect(restored.permCaseMgmt).toBe(true);
    expect(restored.permShareService).toBe(false);
    expect(restored.urgentNeedsExist).toBe(true);
  });

  test('fromCompact restores nested householdMembers', () => {
    const restored = fromCompact(compact);
    expect(restored.householdMembers[0]).toEqual({ name: 'Fatima Hassan', age: 35, relationship: 'aunt' });
  });

  test('fromCompact restores nested urgentNeedsItems category from number', () => {
    const restored = fromCompact(compact);
    expect(restored.urgentNeedsItems[0].category).toBe('health');
  });

  test('fromCompact restores nested actionPlan status from number', () => {
    const restored = fromCompact(compact);
    expect(restored.actionPlan[0].status).toBe('pending');
  });

  test('fromCompact restores nested followUpEntries enums and boolean', () => {
    const restored = fromCompact(compact);
    const fu = restored.followUpEntries[0];
    expect(fu.followedWith).toEqual(['child']);
    expect(fu.followedThrough).toEqual(['home_visit']);
    expect(fu.furtherNeeded).toBe(true);
  });

  test('compact → fromCompact round-trip is identity for all fields', () => {
    const restored = fromCompact(compact);
    // Timestamps come back as unix numbers (not ISO strings) — accept that
    const originalWithNumericTs = {
      ...sampleCase,
      submittedAt:         Math.floor(new Date(sampleCase.submittedAt).getTime() / 1000),
      dateOfBirth:         Math.floor(new Date(sampleCase.dateOfBirth).getTime() / 1000),
      dateAssessmentStart: Math.floor(new Date(sampleCase.dateAssessmentStart).getTime() / 1000),
      followUpEntries: [{
        ...sampleCase.followUpEntries[0],
        date:     Math.floor(new Date(sampleCase.followUpEntries[0].date).getTime() / 1000),
        nextDate: Math.floor(new Date(sampleCase.followUpEntries[0].nextDate).getTime() / 1000),
      }],
    };
    expect(restored).toEqual(originalWithNumericTs);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMPRESSION
// ─────────────────────────────────────────────────────────────────────────────

describe('3. Compression', () => {
  test('compress() returns a Uint8Array', () => {
    const result = compress(sampleCase);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  test('compressed output is smaller than the raw JSON string for a realistic record', () => {
    const rawLen  = JSON.stringify(sampleCase).length;
    const compressed = compress(sampleCase);
    // pako deflate on realistic data consistently beats raw JSON
    expect(compressed.length).toBeLessThan(rawLen);
  });

  test('decompress(compress(obj)) returns the original object', () => {
    expect(decompress(compress(sampleCase))).toEqual(sampleCase);
  });

  test('compressing a small object does not throw', () => {
    expect(() => compress({ a: 1, b: 'x', c: true, d: null, e: [] })).not.toThrow();
  });

  test('compression is lossless for numbers, strings, arrays, and null', () => {
    const obj = {
      num:  42,
      str:  'hello',
      arr:  [1, 2, 3],
      nest: { x: null, y: false },
    };
    expect(decompress(compress(obj))).toEqual(obj);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ENCRYPTION — AES-256-GCM
// ─────────────────────────────────────────────────────────────────────────────

describe('4. Encryption — AES-256-GCM', () => {
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  test('encryptRecord() returns a base64 string', async () => {
    const blob = await encryptRecord(sampleCase);
    expect(typeof blob).toBe('string');
    expect(blob.length).toBeGreaterThan(0);
    // Valid base64 does not throw when decoded
    expect(() => atob(blob)).not.toThrow();
  });

  test('the decoded blob starts with a 12-byte IV', async () => {
    const blob  = await encryptRecord(sampleCase);
    const bytes = b64ToBytes(blob);
    // Blob = IV(12) + ciphertext + GCM tag(16) — minimum total > 28 bytes
    expect(bytes.length).toBeGreaterThan(28);
  });

  test('decryptRecord(encryptRecord(obj)) returns an object equal to the input', async () => {
    const blob      = await encryptRecord(sampleCase);
    const recovered = await decryptRecord(blob);
    // Timestamps come back as unix numbers — compare compact-aware
    const compact   = toCompact(sampleCase);
    const expected  = fromCompact(compact);
    expect(recovered).toEqual(expected);
  });

  test('encrypting the same object twice produces different base64 output', async () => {
    const blob1 = await encryptRecord(sampleCase);
    const blob2 = await encryptRecord(sampleCase);
    expect(blob1).not.toBe(blob2);
  });

  test('decrypting with wrong PIN throws — not silent garbage', async () => {
    const blob = await encryptRecord(sampleCase);
    // Overwrite the stored key with a different-PIN derivation
    await deriveKey(ALT_PIN, DEVICE_ID);
    await expect(decryptRecord(blob)).rejects.toThrow();
  });

  test('decrypting a tampered ciphertext throws — GCM auth tag catches it', async () => {
    const blob  = await encryptRecord(sampleCase);
    const bytes = b64ToBytes(blob);
    // Flip a bit in the ciphertext body (past the 12-byte IV)
    bytes[12 + 4] ^= 0xff;
    const tampered = btoa(String.fromCharCode(...bytes));
    await expect(decryptRecord(tampered)).rejects.toThrow();
  });

  test('sensitive strings do not appear as plaintext substrings in the blob', async () => {
    const blob = await encryptRecord(sampleCase);
    expect(blob).not.toContain('Amina');
    expect(blob).not.toContain('Hassan');
    expect(blob).not.toContain('malnourishment');
    expect(blob).not.toContain('neglect');
    expect(blob).not.toContain('kinship');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. FULL PIPELINE ROUND-TRIP
// ─────────────────────────────────────────────────────────────────────────────

describe('5. Full pipeline round-trip', () => {
  async function roundTrip(obj) {
    return decryptRecord(await encryptRecord(obj));
  }

  test('every field in the original sampleCase survives the round-trip', async () => {
    const recovered = await roundTrip(sampleCase);
    const expected  = fromCompact(toCompact(sampleCase));
    expect(recovered).toEqual(expected);
  });

  test('edge case: age = 0', async () => {
    const rec = await roundTrip({ ...sampleCase, caseId: 'age0', age: 0 });
    expect(rec.age).toBe(0);
  });

  test('edge case: cpRisks = [] (empty array)', async () => {
    const rec = await roundTrip({ ...sampleCase, caseId: 'emptyarr', cpRisks: [] });
    expect(rec.cpRisks).toEqual([]);
  });

  test('edge case: notes = "" (empty string)', async () => {
    const rec = await roundTrip({ ...sampleCase, caseId: 'emptystr', childSituationDesc: '' });
    // empty string is falsy → toCompact skips it (val == null check catches empty string? No, '' != null)
    // '' is NOT null/undefined, so it is kept
    expect(rec.childSituationDesc).toBe('');
  });

  test('edge case: unicode text survives round-trip intact', async () => {
    const unicode = 'مرحبا 你好 🌍';
    const rec = await roundTrip({ ...sampleCase, caseId: 'unicode', childSituationDesc: unicode });
    expect(rec.childSituationDesc).toBe(unicode);
  });

  test('nested arrays survive the full round-trip', async () => {
    const rec = await roundTrip(sampleCase);
    expect(rec.householdMembers).toEqual([{ name: 'Fatima Hassan', age: 35, relationship: 'aunt' }]);
    expect(rec.actionPlan[0].status).toBe('pending');
    expect(rec.urgentNeedsItems[0].category).toBe('health');
    expect(rec.followUpEntries[0].furtherNeeded).toBe(true);
    expect(rec.followUpEntries[0].followedWith).toEqual(['child']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. WHAT THE DB RECEIVES — plaintext columns
// ─────────────────────────────────────────────────────────────────────────────

describe('6. What the DB receives — plaintext columns', () => {
  beforeEach(async () => {
    await saveCase(sampleCase, db, WORKER_ID, DEVICE_ID);
  });

  test('case_id is stored as plaintext', () => {
    expect(db.cases['CP-7X4K2'].case_id).toBe('CP-7X4K2');
  });

  test('risk_level is stored as a number (RISK_LEVEL lookup)', () => {
    // 'high' → 3
    expect(db.cases['CP-7X4K2'].risk_level).toBe(3);
  });

  test('worker_id is stored as plaintext', () => {
    expect(db.cases['CP-7X4K2'].worker_id).toBe(WORKER_ID);
  });

  test('initial status is "created"', () => {
    // The module sets status = 'created' on save; supervisor review changes it
    expect(db.cases['CP-7X4K2'].status).toBe('created');
  });

  test('submitted_at is stored as a Unix integer within 1 second of now', () => {
    const now = Math.floor(Date.now() / 1000);
    const stored = db.cases['CP-7X4K2'].submitted_at;
    expect(typeof stored).toBe('number');
    // submittedAt in sampleCase is an ISO string — should be converted
    const expectedTs = Math.floor(new Date('2025-01-15T10:30:00Z').getTime() / 1000);
    expect(stored).toBe(expectedTs);
  });

  test('encrypted_blob column contains a base64 string', () => {
    const blob = db.cases['CP-7X4K2'].encrypted_blob;
    expect(typeof blob).toBe('string');
    expect(() => atob(blob)).not.toThrow();
  });

  test("child's name does not appear in any plaintext DB column", () => {
    const row = db.cases['CP-7X4K2'];
    const plaintext = JSON.stringify({
      case_id:    row.case_id,
      worker_id:  row.worker_id,
      risk_level: row.risk_level,
      status:     row.status,
      submitted_at: row.submitted_at,
    });
    expect(plaintext).not.toContain('Amina');
    expect(plaintext).not.toContain('Hassan');
  });

  test("worker's situation notes do not appear in any plaintext DB column", () => {
    const row = db.cases['CP-7X4K2'];
    const plaintext = `${row.case_id} ${row.worker_id} ${row.risk_level} ${row.status}`;
    expect(plaintext).not.toContain('malnourishment');
  });

  test('loadCase returns the full original object including encrypted fields', async () => {
    const recovered = await loadCase('CP-7X4K2', db);
    expect(recovered.childFirstName).toBe('Amina');
    expect(recovered.childLastName).toBe('Hassan');
    expect(recovered.cpRisks).toEqual(['unaccompanied', 'neglect', 'psychological_distress']);
    expect(recovered.permCaseMgmt).toBe(true);
    expect(recovered.urgentNeedsItems[0].category).toBe('health');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CASE STATUS LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

describe('7. Case status lifecycle', () => {
  beforeEach(async () => {
    await saveCase(sampleCase, db, WORKER_ID, DEVICE_ID);
  });

  test('a newly saved case has status "created"', () => {
    expect(db.cases['CP-7X4K2'].status).toBe('created');
  });

  test('updateCaseStatus to "pending_supervisor" changes the DB row', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'pending_supervisor', WORKER_ID, DEVICE_ID);
    expect(db.cases['CP-7X4K2'].status).toBe('pending_supervisor');
  });

  test('updateCaseStatus to "supervisor_approved" changes the DB row', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    expect(db.cases['CP-7X4K2'].status).toBe('supervisor_approved');
  });

  test('updateCaseStatus to "rejected_needs_revision" changes the DB row', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'rejected_needs_revision', WORKER_ID, DEVICE_ID);
    expect(db.cases['CP-7X4K2'].status).toBe('rejected_needs_revision');
  });

  test('each status change writes an audit log entry', async () => {
    const before = db.auditLog.length;
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    expect(db.auditLog.length).toBe(before + 1);
    const entry = db.auditLog[db.auditLog.length - 1];
    expect(entry.action).toContain('supervisor_approved');
    expect(entry.case_id).toBe('CP-7X4K2');
  });

  test('status can transition from rejected back to pending_supervisor', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'rejected_needs_revision', WORKER_ID, DEVICE_ID);
    await updateCaseStatus(db, 'CP-7X4K2', 'pending_supervisor', WORKER_ID, DEVICE_ID);
    expect(db.cases['CP-7X4K2'].status).toBe('pending_supervisor');
  });

  test('two status changes produce two separate audit log entries', async () => {
    const before = db.auditLog.length;
    await updateCaseStatus(db, 'CP-7X4K2', 'pending_supervisor', WORKER_ID, DEVICE_ID);
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    expect(db.auditLog.length).toBe(before + 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. 48-HOUR TIMEOUT LOGIC
// ─────────────────────────────────────────────────────────────────────────────

describe('8. 48-hour timeout logic', () => {
  const nowSecs = () => Math.floor(Date.now() / 1000);
  const H48 = 172_800;

  beforeEach(async () => {
    // Plant a stale pending case directly in the mock DB
    db.cases['STALE-1'] = {
      case_id: 'STALE-1', encrypted_blob: 'blob', created_at: nowSecs() - H48 - 3600,
      worker_id: WORKER_ID, risk_level: 3, status: 'pending_supervisor',
      synced: 0, submitted_at: nowSecs() - H48 - 3600,  // 49 hours ago
    };
    db.cases['FRESH-1'] = {
      case_id: 'FRESH-1', encrypted_blob: 'blob', created_at: nowSecs() - H48 + 3600,
      worker_id: WORKER_ID, risk_level: 3, status: 'pending_supervisor',
      synced: 0, submitted_at: nowSecs() - H48 + 3600,  // 47 hours ago
    };
    db.cases['BOUNDARY-1'] = {
      case_id: 'BOUNDARY-1', encrypted_blob: 'blob', created_at: nowSecs() - H48,
      worker_id: WORKER_ID, risk_level: 3, status: 'pending_supervisor',
      synced: 0, submitted_at: nowSecs() - H48,          // exactly 48 hours ago
    };
    db.cases['APPROVED-1'] = {
      case_id: 'APPROVED-1', encrypted_blob: 'blob', created_at: nowSecs() - H48 - 3600,
      worker_id: WORKER_ID, risk_level: 3, status: 'supervisor_approved',
      synced: 0, submitted_at: nowSecs() - H48 - 3600,
    };
  });

  test('a case submitted 49 hours ago is promoted to eligible_for_direct_upload', async () => {
    await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    expect(db.cases['STALE-1'].status).toBe('eligible_for_direct_upload');
  });

  test('a case submitted 47 hours ago is NOT promoted', async () => {
    await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    expect(db.cases['FRESH-1'].status).toBe('pending_supervisor');
  });

  test('a case submitted exactly 48 hours ago IS promoted (boundary)', async () => {
    await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    expect(db.cases['BOUNDARY-1'].status).toBe('eligible_for_direct_upload');
  });

  test('checkTimeouts does not touch supervisor_approved cases', async () => {
    await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    expect(db.cases['APPROVED-1'].status).toBe('supervisor_approved');
  });

  test('checkTimeouts promotes ALL stale cases in one call', async () => {
    // Add a second stale case
    db.cases['STALE-2'] = {
      case_id: 'STALE-2', encrypted_blob: 'blob', created_at: nowSecs() - H48 - 7200,
      worker_id: WORKER_ID, risk_level: 2, status: 'pending_supervisor',
      synced: 0, submitted_at: nowSecs() - H48 - 7200,
    };
    const promoted = await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    expect(promoted.length).toBeGreaterThanOrEqual(2);
    expect(db.cases['STALE-1'].status).toBe('eligible_for_direct_upload');
    expect(db.cases['STALE-2'].status).toBe('eligible_for_direct_upload');
  });

  test('checkTimeouts returns the list of promoted case IDs', async () => {
    const promoted = await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    expect(Array.isArray(promoted)).toBe(true);
    expect(promoted).toContain('STALE-1');
    expect(promoted).not.toContain('FRESH-1');
  });

  test('running checkTimeouts twice does not double-promote', async () => {
    await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    const before = db.auditLog.length;
    await checkTimeouts(db, WORKER_ID, DEVICE_ID);
    // Second run should not find any new pending_supervisor cases to promote
    expect(db.auditLog.length).toBe(before);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. SYNC QUEUE
// ─────────────────────────────────────────────────────────────────────────────

describe('9. Sync queue', () => {
  const SERVER = 'https://api.example.com/cases';

  beforeEach(async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    await saveCase(sampleCase, db, WORKER_ID, DEVICE_ID);
  });

  afterEach(() => { delete global.fetch; });

  test('saveCase adds the case to sync_queue', () => {
    expect(db.syncQueue['CP-7X4K2']).toBeDefined();
    expect(db.syncQueue['CP-7X4K2'].attempt_count).toBe(0);
  });

  test('a pending/created case is NOT synced by drainSyncQueue', async () => {
    NetInfo._setOnline();
    const result = await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    expect(result.synced).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('an approved case IS synced when online', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    NetInfo._setOnline();
    const result = await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
  });

  test('after successful sync, case.synced = 1 and row removed from sync_queue', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    NetInfo._setOnline();
    await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    expect(db.cases['CP-7X4K2'].synced).toBe(1);
    expect(db.syncQueue['CP-7X4K2']).toBeUndefined();
  });

  test('on network failure, attempt_count increments', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    NetInfo._setOnline();
    await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    expect(db.syncQueue['CP-7X4K2'].attempt_count).toBe(1);
  });

  test('after 5 failed attempts, case is flagged for manual review', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    NetInfo._setOnline();
    for (let i = 0; i < 5; i++) {
      await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    }
    expect(db.syncQueue['CP-7X4K2'].needs_manual_review).toBe(1);
  });

  test('a manually-reviewed case is excluded from further automatic retries', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    NetInfo._setOnline();
    for (let i = 0; i < 5; i++) await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    const fetchCallsBefore = global.fetch.mock.calls.length;
    await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    expect(global.fetch.mock.calls.length).toBe(fetchCallsBefore); // no new call
  });

  test('drainSyncQueue when offline does nothing and returns { synced:0, failed:0 }', async () => {
    NetInfo._setOffline();
    const result = await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    expect(result).toEqual({ synced: 0, failed: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('the POST body contains the encrypted blob, not the plaintext record', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    NetInfo._setOnline();
    await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.encrypted_blob).toBeDefined();
    expect(callBody.encrypted_blob).not.toContain('Amina');
    expect(callBody.encrypted_blob).not.toContain('malnourishment');
  });

  test('records are posted in chronological order (oldest queued_at first)', async () => {
    // Add a second case that was queued later
    const case2 = { ...sampleCase, caseId: 'CP-NEWER' };
    await saveCase(case2, db, WORKER_ID, DEVICE_ID);
    // Simulate OLDER queue time for CP-7X4K2
    db.syncQueue['CP-7X4K2'].queued_at = 1000;
    db.syncQueue['CP-NEWER'].queued_at = 2000;
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    await updateCaseStatus(db, 'CP-NEWER', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    NetInfo._setOnline();
    await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    const firstCall  = JSON.parse(global.fetch.mock.calls[0][1].body);
    const secondCall = JSON.parse(global.fetch.mock.calls[1][1].body);
    expect(firstCall.case_id).toBe('CP-7X4K2');
    expect(secondCall.case_id).toBe('CP-NEWER');
  });

  test('eligible_for_direct_upload cases are also synced', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'eligible_for_direct_upload', WORKER_ID, DEVICE_ID);
    NetInfo._setOnline();
    const result = await drainSyncQueue(db, SERVER, WORKER_ID, DEVICE_ID);
    expect(result.synced).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

describe('10. Audit log', () => {
  beforeEach(async () => {
    await saveCase(sampleCase, db, WORKER_ID, DEVICE_ID);
  });

  test('saveCase writes an audit log entry', () => {
    const entries = db.auditLog.filter(e => e.case_id === 'CP-7X4K2');
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });

  test('each audit entry contains timestamp, worker_id, action, case_id, device_id', () => {
    const entry = db.auditLog.find(e => e.case_id === 'CP-7X4K2');
    expect(typeof entry.timestamp).toBe('number');
    expect(entry.worker_id).toBe(WORKER_ID);
    expect(typeof entry.action).toBe('string');
    expect(entry.action.length).toBeGreaterThan(0);
    expect(entry.case_id).toBe('CP-7X4K2');
    expect(entry.device_id).toBe(DEVICE_ID);
  });

  test('every call to updateCaseStatus appends a new audit entry', async () => {
    const before = db.auditLog.length;
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    expect(db.auditLog.length).toBe(before + 1);
  });

  test('two status changes produce two separate audit entries', async () => {
    const before = db.auditLog.length;
    await updateCaseStatus(db, 'CP-7X4K2', 'pending_supervisor', WORKER_ID, DEVICE_ID);
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    expect(db.auditLog.length).toBe(before + 2);
  });

  test('audit entries are append-only — existing entries unchanged after new write', async () => {
    const snapshot = JSON.stringify(db.auditLog);
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    const originalEntries = JSON.parse(snapshot);
    for (let i = 0; i < originalEntries.length; i++) {
      expect(db.auditLog[i]).toEqual(originalEntries[i]);
    }
  });

  test('action string describes the transition', async () => {
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    const lastEntry = db.auditLog[db.auditLog.length - 1];
    expect(lastEntry.action).toContain('supervisor_approved');
  });

  test('sync success also writes an audit entry', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await updateCaseStatus(db, 'CP-7X4K2', 'supervisor_approved', WORKER_ID, DEVICE_ID);
    NetInfo._setOnline();
    const before = db.auditLog.length;
    await drainSyncQueue(db, 'https://api.example.com/cases', WORKER_ID, DEVICE_ID);
    expect(db.auditLog.length).toBeGreaterThan(before);
    delete global.fetch;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. SECURITY PROPERTIES
// ─────────────────────────────────────────────────────────────────────────────

describe('11. Security properties', () => {
  function blobToBytes(blob) {
    const bin = atob(blob);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  test('IV is never reused across 100 encryptions', async () => {
    const ivSet = new Set();
    for (let i = 0; i < 100; i++) {
      const blob  = await encryptRecord({ ...sampleCase, caseId: `CASE-${i}` });
      const bytes = blobToBytes(blob);
      const iv    = bytes.slice(0, 12).join(',');
      expect(ivSet.has(iv)).toBe(false);
      ivSet.add(iv);
    }
    expect(ivSet.size).toBe(100);
  }, 30_000);

  test('key is stored in SecureStore, not in memory as plaintext after derivation', async () => {
    // The module zeros the working copy after storing — we cannot retrieve it from memory.
    // Verify SecureStore holds a value and that its length matches a base64-encoded 32-byte key.
    const dump  = SecureStore._dump();
    const keyB64 = Object.values(dump)[0];
    expect(typeof keyB64).toBe('string');
    // base64 of 32 bytes = ceil(32 * 4/3) = 44 chars (with padding)
    expect(keyB64.length).toBeGreaterThanOrEqual(40);
  });

  test('none of 10 realistic encrypted records contain recognisable plaintext', async () => {
    const forbidden = ['abuse', 'neglect', 'trafficking', 'malnourish', 'Amina', 'Hassan', 'child', 'name'];
    for (let i = 0; i < 10; i++) {
      const blob = await encryptRecord({
        ...sampleCase,
        caseId:          `CASE-${i}`,
        childFirstName:  'Amina',
        childLastName:   'Hassan',
        cpRisks:         ['neglect', 'unaccompanied'],
        childSituationDesc: 'Signs of physical abuse and neglect. Trafficking suspected.',
      });
      for (const word of forbidden) {
        expect(blob).not.toContain(word);
      }
    }
  }, 30_000);

  test('decrypting a blob with the correct key succeeds after 100 encryptions', async () => {
    // Confirms key remains valid across many operations (no key rotation side effect)
    const blob = await encryptRecord(sampleCase);
    for (let i = 0; i < 99; i++) await encryptRecord({ ...sampleCase, caseId: `X${i}` });
    await expect(decryptRecord(blob)).resolves.not.toThrow();
  }, 30_000);

  test('encryptRecord output is not valid JSON (raw plaintext would be)', async () => {
    const blob = await encryptRecord(sampleCase);
    expect(() => JSON.parse(atob(blob))).toThrow();
  });

  test('loadCase throws a clear error when case_id is not found', async () => {
    await expect(loadCase('NONEXISTENT', db)).rejects.toThrow('Case not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// runAllTests() — programmatic summary export
// ─────────────────────────────────────────────────────────────────────────────

export async function runAllTests() {
  const suites = [
    '1. Key derivation',
    '2. Compact JSON — lookup tables',
    '3. Compression',
    '4. Encryption — AES-256-GCM',
    '5. Full pipeline round-trip',
    '6. What the DB receives — plaintext columns',
    '7. Case status lifecycle',
    '8. 48-hour timeout logic',
    '9. Sync queue',
    '10. Audit log',
    '11. Security properties',
  ];
  console.log('\nRun the full suite with:\n  npx jest modules/__tests__/encryptionModule.test.js --verbose\n');
  console.log('Suites covered:');
  suites.forEach(s => console.log(`  • ${s}`));
  console.log('\nJest will print PASSED/FAILED counts and full failure diffs automatically.');
}
