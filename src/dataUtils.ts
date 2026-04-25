// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

export const LOOKUP_TABLE: Record<string, string> = {
  // Immigration / residency status
  asylum_seeker_refugee:      'AR',
  undocumented:               'UC',
  temporary_protection:       'TP',
  permanent_resident:         'PR',
  citizen:                    'CI',
  visa_holder:                'VH',
  stateless:                  'SL',

  // Types of violence / abuse
  psychological_violence:     'PV',
  physical_violence:          'PH',
  sexual_violence:            'SX',
  economic_violence:          'EV',
  domestic_violence:          'DV',
  stalking:                   'SK',
  coercive_control:           'CV',
  forced_marriage:            'FM',
  female_genital_mutilation:  'FG',
  trafficking:                'TK',
  child_abuse:                'CA',
  elder_abuse:                'EA',
  hate_crime:                 'HC',
  neglect:                    'NL',
  online_abuse:               'OA',

  // Gender identity
  female:                     'GF',
  male:                       'GM',
  non_binary:                 'NB',
  transgender_female:         'TF',
  transgender_male:           'TM',
  gender_non_conforming:      'GN',
  intersex:                   'IX',
  prefer_not_to_say:          'PN',

  // Relationship to perpetrator
  partner:                    'RP',
  ex_partner:                 'RX',
  spouse:                     'RS',
  ex_spouse:                  'RE',
  parent:                     'RA',
  sibling:                    'RB',
  child_of_survivor:          'RC',
  other_family:               'RF',
  acquaintance:               'RQ',
  stranger:                   'RT',
  employer:                   'RM',
  authority_figure:           'RY',

  // Housing situation
  own_home:                   'HO',
  renting:                    'HR',
  living_with_perpetrator:    'HL',
  homeless:                   'HM',
  temporary_shelter:          'HS',
  friends_family_housing:     'HF',
  supported_accommodation:    'HA',
  refuge_shelter:             'HU',

  // Employment status
  employed_full_time:         'EF',
  employed_part_time:         'EP',
  unemployed:                 'EU',
  self_employed:              'ES',
  student:                    'ET',
  retired:                    'ER',
  unable_to_work:             'EW',
  carer:                      'EC',

  // Risk level
  high_risk:                  'KH',
  medium_risk:                'KM',
  low_risk:                   'KL',
  unknown_risk:               'KU',

  // Marital / relationship status
  single:                     'MS',
  married:                    'MM',
  divorced:                   'MD',
  separated:                  'MP',
  widowed:                    'MW',
  cohabiting:                 'MO',
  civil_partnership:          'MC',

  // Support needs
  legal_support:              'NJ',
  medical_support:            'NM',
  psychological_support:      'NY',
  housing_support:            'NH',
  financial_support:          'NF',
  childcare_support:          'ND',
  language_support:           'NG',
  employment_support:         'NE',
  safety_planning:            'NP',

  // Severity
  mild:                       'SM',
  moderate:                   'SO',
  severe:                     'SV',
  critical:                   'SC',

  // Frequency
  once:                       'FO',
  occasional:                 'FQ',
  frequent:                   'FF',
  daily:                      'FD',
  constant:                   'FC',

  // General / boolean
  yes:                        'Y',
  no:                         'N',
  unknown:                    'UK',
  not_applicable:             'NA',

  // Consent
  consent_given:              'CG',
  consent_withdrawn:          'CW',
  consent_pending:            'CP',

  // Case status
  open:                       'ZO',
  closed:                     'ZC',
  pending:                    'ZP',
  referred:                   'ZR',
  escalated:                  'ZE',

  // Action / task status (additions to case status)
  ongoing:                    'ZN',
  action_completed:           'ZK',

  // ── Values sourced from form dropdowns ─────────────────────────────────────

  // Referral / identification source  (form 1B §1)
  self_referral:              'SR',
  family_referral:            'FR',
  community_referral:         'CR',
  media_referral:             'MR',
  service_provider_referral:  'SP',
  un_ingo_ngo_referral:       'UN',

  // Humanitarian sectors (sub-options under UN/INGO/NGO referral)
  sector_education:           'XE',
  sector_food_security:       'XF',
  sector_health:              'XH',
  sector_livelihoods:         'XL',
  sector_nutrition:           'XN',
  sector_protection:          'XP',
  sector_child_protection:    'XC',
  sector_gbv:                 'XG',
  sector_shelter:             'XS',
  sector_camp_management:     'XM',
  sector_wash:                'XW',

  // Nationality status  (form 1B §2, §5)
  national:                   'NT',
  other_nationality:          'ON',

  // Displacement status  (form 1B §2, §5)
  host_community:             'HY',
  internally_displaced_person:'ID',
  returnee:                   'RN',
  migrant:                    'MG',

  // Birth registration  (form 1B §2)
  birth_registered:           'BR',
  birth_not_registered:       'BN',
  birth_registration_in_progress:'BI',

  // Disability  (form 1B §2)
  no_disability:              'DIN',
  has_disability:             'DIY',
  disability_mental:          'DIM',
  disability_sensory:         'DIS',
  disability_physical:        'DIP',
  disability_intellectual:    'DIL',

  // Child marital status additions  (form 1B §2)
  not_married:                'MN',
  planning_to_marry:          'ME',

  // Care arrangement  (form 1B §3, form 6 §1)
  parental_care:              'QP',
  no_care:                    'QN',
  child_is_carer:             'QC',
  child_headed_household:     'QH',
  institutional_care:         'QI',
  alternative_care:           'QA',
  foster_care:                'QF',
  kinship_care:               'QK',
  kafala_care:                'QB',
  independent_living:         'QG',

  // Area of living  (form 1B §3)
  urban_non_camp:             'LU',
  rural_non_camp:             'LR',
  camp_settlement:            'LC',

  // Child protection risk categories  (form 1B §4)
  economic_exploitation:      'VEP',
  harmful_labour:             'VHL',
  sexual_exploitation:        'VXE',
  child_conflict_law:         'VCL',
  recruitment_armed_forces:   'VAF',
  unaccompanied_child:        'VUA',
  separated_child:            'VSD',
  child_marriage:             'VCM',
  psychological_distress:     'VPD',

  // Justice system status  (form 1B §4)
  no_justice_contact:         'JN',
  justice_contact:            'JC',
  victim_of_offence:          'JV',
  witness_of_offence:         'JW',
  in_conflict_with_law:       'JL',
  child_detained:             'JD',

  // Type of contact / follow-up method  (form 2 §1, form 3+4 §4)
  home_visit:                 'HV',
  meeting_other_location:     'ML',
  phone_call:                 'PC',
  face_to_face_at_provider:   'FFP',
  face_to_face_outside_home:  'FFO',
  email_sms_messaging:        'EM',

  // Education status  (form 2 §2)
  not_in_education:           'EDX',
  formal_education:           'EDF',
  non_formal_education:       'EDN',

  // Perpetrator category – sensitive optional field  (form 2 §2)
  perpetrator_family:         'PFL',
  perpetrator_intimate_partner:'PIL',
  perpetrator_peer:           'PPE',
  perpetrator_formal_authority:'PFA',
  perpetrator_employer:       'PEM',
  perpetrator_un_ngo_staff:   'PUN',
  perpetrator_armed_force:    'PAF',

  // Location of incident – sensitive optional field  (form 2 §2)
  inside_home:                'LI',
  outside_home:               'LO',
  education_facility:         'LE',
  medical_facility:           'LM',
  residential_care_facility:  'LF',
  workplace:                  'LW',
  place_of_detention:         'LD',
  digital_space:              'LDG',

  // Services provided  (form 3+4 §3)
  health_services:            'WH',
  nutrition_services:         'WN',
  food_security_services:     'WF',
  livelihood_services:        'WL',
  cash_assistance_services:   'WC',
  mhpss_services:             'WM',
  family_tracing_services:    'WT',
  alternative_care_services:  'WA',
  gbv_services:               'WG',
  documentation_services:     'WD',
  legal_justice_services:     'WJ',
  education_services:         'WE',
  shelter_services:           'WS',
  wash_services:              'WW',
  disability_services:        'WB',

  // Follow-up subjects  (form 3+4 §4)
  child:                      'CH',
  parent_caregiver:           'PGA',
  service_provider_own:       'SPO',
  service_provider_external:  'SPE',

  // Case closure reasons  (form 6 §3)
  goal_met:                   'CCG',
  child_relocated:            'CCR',
  lost_contact:               'CCL',
  no_longer_wants_support:    'CCN',
  child_death:                'CCD',
  case_error_duplicate:       'CCE',

  // Consent / legal basis  (form 1A §3)
  consent:                    'CN',
  vital_interests:            'VI',
  both_parents_caregivers:    'BPC',

  // Miscellaneous
  supervisor:                 'SU',
  other:                      'OT',
};

const REVERSE_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(LOOKUP_TABLE).map(([k, v]) => [v, k]),
);

// ---------------------------------------------------------------------------
// Dependency interfaces
// ---------------------------------------------------------------------------

/** Raw byte compression (e.g. deflate). */
export interface CompressFn {
  (plaintext: Uint8Array): Promise<Uint8Array>;
}

/** Raw byte decompression (e.g. inflate). */
export interface DecompressFn {
  (compressed: Uint8Array): Promise<Uint8Array>;
}

/** Encrypted payload returned by EncryptFn and consumed by DecryptFn. */
export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  /** Random bytes used as AES-GCM Additional Authenticated Data (AAD).
   *  Must be stored alongside the ciphertext and supplied unchanged to decrypt. */
  salt: string;
}

/**
 * AES-GCM encryption of raw bytes.
 * The implementation is responsible for generating a fresh IV and salt (AAD),
 * performing the encrypt call, and returning all three fields as base64.
 */
export interface EncryptFn {
  (plaintext: Uint8Array, key: CryptoKey): Promise<EncryptedPayload>;
}

/**
 * AES-GCM decryption.
 * The implementation must verify the AAD (salt) and return the decrypted bytes.
 */
export interface DecryptFn {
  (payload: EncryptedPayload, key: CryptoKey): Promise<Uint8Array>;
}

export interface CryptoModuleDeps {
  compress: CompressFn;
  decompress: DecompressFn;
  encrypt: EncryptFn;
  decrypt: DecryptFn;
}

// ---------------------------------------------------------------------------
// Module interface
// ---------------------------------------------------------------------------

export interface CryptoModule {
  /** Recursively replace known string values with their short codes. */
  applyLookup(data: unknown): Promise<unknown>;
  /** Recursively restore original string values from short codes. */
  reverseLookup(data: unknown): Promise<unknown>;
  /** applyLookup → JSON.stringify → deps.compress */
  compress(data: object): Promise<Uint8Array>;
  /** deps.decompress → JSON.parse → reverseLookup */
  decompress(data: Uint8Array): Promise<object>;
  /** compress → deps.encrypt */
  encrypt(data: object, key: CryptoKey): Promise<EncryptedPayload>;
  /** deps.decrypt → decompress */
  decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<object>;
}

// ---------------------------------------------------------------------------
// Base64 helpers — no platform dependency, used by key-management utilities
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
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Lookup transforms — pure, no platform deps
// ---------------------------------------------------------------------------

async function applyLookupRecursive(data: unknown): Promise<unknown> {
  if (typeof data === 'string') return LOOKUP_TABLE[data] ?? data;
  if (Array.isArray(data)) return Promise.all(data.map(applyLookupRecursive));
  if (data !== null && typeof data === 'object') {
    const entries = await Promise.all(
      Object.entries(data as Record<string, unknown>).map(async ([k, v]) => [
        k,
        await applyLookupRecursive(v),
      ]),
    );
    return Object.fromEntries(entries);
  }
  return data;
}

async function reverseLookupRecursive(data: unknown): Promise<unknown> {
  if (typeof data === 'string') return REVERSE_LOOKUP[data] ?? data;
  if (Array.isArray(data)) return Promise.all(data.map(reverseLookupRecursive));
  if (data !== null && typeof data === 'object') {
    const entries = await Promise.all(
      Object.entries(data as Record<string, unknown>).map(async ([k, v]) => [
        k,
        await reverseLookupRecursive(v),
      ]),
    );
    return Object.fromEntries(entries);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCryptoModule(deps: CryptoModuleDeps): CryptoModule {
  async function applyLookup(data: unknown): Promise<unknown> {
    return applyLookupRecursive(data);
  }

  async function reverseLookup(data: unknown): Promise<unknown> {
    return reverseLookupRecursive(data);
  }

  async function compress(data: object): Promise<Uint8Array> {
    const reduced = await applyLookupRecursive(data);
    return deps.compress(new TextEncoder().encode(JSON.stringify(reduced)));
  }

  async function decompress(data: Uint8Array): Promise<object> {
    const inflated = await deps.decompress(data);
    const parsed = JSON.parse(new TextDecoder().decode(inflated));
    return reverseLookupRecursive(parsed) as Promise<object>;
  }

  async function encrypt(data: object, key: CryptoKey): Promise<EncryptedPayload> {
    return deps.encrypt(await compress(data), key);
  }

  async function decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<object> {
    return decompress(await deps.decrypt(payload, key));
  }

  return { applyLookup, reverseLookup, compress, decompress, encrypt, decrypt };
}

// ---------------------------------------------------------------------------
// Key-management utilities
// Pass in the SubtleCrypto instance from your platform adapter
// (e.g. `QuickCrypto.subtle` or `globalThis.crypto.subtle`).
// ---------------------------------------------------------------------------

export async function deriveKey(
  subtle: SubtleCrypto,
  pin: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
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
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function generateSessionKeypair(subtle: SubtleCrypto): Promise<CryptoKeyPair> {
  return subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey'],
  ) as Promise<CryptoKeyPair>;
}

export async function deriveSessionKey(
  subtle: SubtleCrypto,
  ownPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<CryptoKey> {
  return subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    ownPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function exportPublicKey(subtle: SubtleCrypto, key: CryptoKey): Promise<string> {
  const spki = await subtle.exportKey('spki', key);
  return toBase64(new Uint8Array(spki as ArrayBuffer));
}

export async function importPublicKey(subtle: SubtleCrypto, base64: string): Promise<CryptoKey> {
  return subtle.importKey(
    'spki',
    fromBase64(base64),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );
}
