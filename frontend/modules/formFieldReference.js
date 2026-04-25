/**
 * formFieldReference.js
 *
 * Complete field reference for all 6 CPMS forms, derived from the official
 * paper form set. Paste the constants at the bottom of encryptionModule.js
 * (they replace the existing simplified lookup tables).
 *
 * Forms covered:
 *   1A  Consent / Assent Form
 *   1B  Registration and Rapid Assessment Form
 *   2   Comprehensive Assessment Form
 *   3+4 Case Plan, Implementation and Follow-Up Form
 *   5   Review Form
 *   6   Case Closure Form
 *
 * ── STORAGE RULES ─────────────────────────────────────────────────────────────
 *   DB_PLAINTEXT   — stored as a column in `cases` table, never encrypted
 *   ENCRYPTED_TEXT — inside the encrypted blob only; never touches disk in plaintext
 *   UNIX_SECONDS   — stored as integer (not ISO string); convert for display
 *   SYSTEM_MANAGED — set by the app (workerId, timestamps) not by the form
 *
 * ── TOTALS ────────────────────────────────────────────────────────────────────
 *   262  total fields across all 6 forms (as written on paper)
 *   194  unique codes in the compact data model
 *    ~97  structured (dropdown / checkbox / yes-no / integer)
 *    ~97  ENCRYPTED_TEXT (free text narratives, names, IDs, contact info)
 *    ~37  date / timestamp (UNIX_SECONDS)
 *    ~25  system-managed or authorization signatures (not stored in blob)
 *
 * ── ESTIMATED BLOB SIZE ───────────────────────────────────────────────────────
 *   Minimal case  (Form 1B only, short notes)
 *     Verbose JSON  ≈  3 KB  |  Compact JSON  ≈  1.9 KB
 *     Compressed compact  ≈  0.9 KB  |  Encrypted base64  ≈  1.2 KB
 *
 *   Complete case  (all 6 forms, medium-length notes)
 *     Verbose JSON  ≈  14 KB  |  Compact JSON  ≈  8 KB
 *     Compressed compact  ≈  3 KB  |  Encrypted base64  ≈  4 KB
 *
 * ── FIELD INVENTORY BY FORM ───────────────────────────────────────────────────
 *
 * FORM 1A — Consent / Assent
 *  #   Exact label as on form                          Code  Type
 *  1   Date form completed                             dfc   UNIX_SECONDS
 *  2   Case ID number                                  id    DB_PLAINTEXT
 *  3   First name                                      fn    ENCRYPTED_TEXT
 *  4   (Optional) Middle name / Father's name          mn    ENCRYPTED_TEXT
 *  5   Last name / Family Name                         ln    ENCRYPTED_TEXT
 *  6   Other names or spelling the child is known by   on    ENCRYPTED_TEXT
 *  7   Legitimate basis for collecting information      lb    enum → LEGITIMATE_BASIS
 *  8   Consent obtained from (select all that apply)   cf    enum[] → CONSENT_FROM
 *  9   Consent from — other, specify relationship      cfo   ENCRYPTED_TEXT
 * 10   Assent obtained from (select all that apply)    af    enum[] → CONSENT_FROM
 * 11   Assent from — other, specify relationship       afo   ENCRYPTED_TEXT
 * 12   Participation in the case management process    pcp   0/1
 * 13   Collection and storing of personal information  csp   0/1
 * 14   Sharing of personal information (service prov.) sps   0/1
 * 15   Sharing of non-identifiable info for reporting  sir   0/1
 * 16   (Optional) Consent to disclose for tracing      cdt   0/1
 * 17   Any specific information to withhold?           whi   0/1
 * 18   Specify which information and/or agency         whd   ENCRYPTED_TEXT
 * 19   (Optional) Reason for withholding               whr   ENCRYPTED_TEXT
 * 20   Child name (Authorization)                      acn   ENCRYPTED_TEXT
 * 21   Child date (Authorization)                      acd   UNIX_SECONDS
 * 22   Parent/Caregiver name (Authorization)           apn   ENCRYPTED_TEXT
 * 23   Parent/Caregiver date (Authorization)           apd   UNIX_SECONDS
 * 24   Caseworker name (Authorization)                 —     SYSTEM_MANAGED
 * 25   Caseworker date (Authorization)                 —     SYSTEM_MANAGED (audit_log)
 *  *   Supervisor name / date (Authorization)          —     SYSTEM_MANAGED (workflow)
 *
 * FORM 1B — Registration and Rapid Assessment
 *  #   Exact label as on form                          Code  Type
 * 26   Date case was identified                        dci   UNIX_SECONDS
 * 27   Date case was registered                        dcr   UNIX_SECONDS
 * 28   Date case was re-opened                         dco   UNIX_SECONDS (optional)
 * 29   Case ID                                         id    DB_PLAINTEXT
 * 30   Caseworker ID                                   w     DB_PLAINTEXT
 * 31   Agency                                          ag    ENCRYPTED_TEXT
 * 32   How was the child identified                    rfs   enum → REFERRAL_SOURCE
 *       Other service provider — specify sector        rso   ENCRYPTED_TEXT
 * 33   First name                                      fn    (shared with 1A)
 * 34   (Optional) Middle name / Father's name          mn    (shared)
 * 35   Last name / Family name                         ln    (shared)
 * 36   Other names or spelling the child is known by   on    (shared)
 * 37   Date of birth (DOB)                             dob   UNIX_SECONDS
 * 38   Age                                             a     integer
 * 39   Is the age estimated?                           ae    0/1
 * 40   Sex                                             sx    enum → SEX
 * 41   Birth registration                              br    enum → BIRTH_REG
 * 42   Does the child have identification (ID card)?   cid   0/1
 * 43     If yes — ID type                              cit   ENCRYPTED_TEXT
 * 44     If yes — ID number                            cin   ENCRYPTED_TEXT
 * 45   Nationality status                              ns    enum → NAT_STATUS
 * 46   Displacement status                             dp    enum → DISP_STATUS
 *       Displacement status — other specify            dpo   ENCRYPTED_TEXT
 * 47   Nationality                                     nat   ENCRYPTED_TEXT
 * 48   Disability status (multi-select)                dis   enum[] → DISABILITY
 *       Disability other specify                       dix   ENCRYPTED_TEXT
 * 49   The child is [marital status]                   ms    enum → MARITAL_STATUS
 * 50   (Optional) Child's ethnic affiliation           eth   ENCRYPTED_TEXT
 * 51   (Optional) Child's religion                     rel   ENCRYPTED_TEXT
 * 52   Languages spoken by the child                   lng   ENCRYPTED_TEXT
 *
 * CARE ARRANGEMENT / LIVING ARRANGEMENTS
 * 53   Type of care arrangement                        ca    enum → CARE_ARRANGEMENT
 *       Care arrangement — other specify               cax   ENCRYPTED_TEXT
 * 54   Describe the child's current care arrangement   cad   ENCRYPTED_TEXT
 * 55   Current address                                 adr   ENCRYPTED_TEXT
 * 56   (Optional) Area of living                       aol   enum → AREA_LIVING
 * 57   How can the child be contacted?                 cct   ENCRYPTED_TEXT
 * 58   Phone number (WhatsApp, Viber, etc.)            phn   ENCRYPTED_TEXT (optional)
 *
 * CAREGIVER
 * 59   First name                                      cgfn  ENCRYPTED_TEXT
 * 60   Middle name / Father's name                     cgmn  ENCRYPTED_TEXT
 * 61   Last name / Family name                         cgln  ENCRYPTED_TEXT
 * 62   Date of birth (DOB) of the caregiver            cgdb  UNIX_SECONDS
 * 63   Age                                             cga   integer
 * 64   Is the age estimated?                           cgae  0/1
 * 65   Sex of the caregiver                            cgs   enum → SEX
 * 66   Does the caregiver have identification?         cghi  0/1
 * 67     If yes — ID type                              cgit  ENCRYPTED_TEXT
 * 68     If yes — ID number                            cgin  ENCRYPTED_TEXT
 * 69   Caregiver nationality status                    cgns  enum → NAT_STATUS
 * 70   Caregiver displacement status                   cgds  enum → DISP_STATUS
 *       Caregiver displacement — other specify         cgdx  ENCRYPTED_TEXT
 * 71   Does caregiver have disabilities/health issues? cgdi  0/1
 * 72     If yes, specify                               cgdd  ENCRYPTED_TEXT
 * 73   Is the caregiver related to the child?          cgrc  0/1
 * 74   Relationship to the child                       cgrn  ENCRYPTED_TEXT
 * 75   Does caregiver know the family? (if unrelated)  cgkf  0/1
 * 76   When did this care arrangement start?           cgsd  UNIX_SECONDS
 * 77   Is caregiver willing to continue taking care?   cgwc  0/1
 * 78     If not, why?                                  cgwr  ENCRYPTED_TEXT
 * 79   Is the caregiver also the legal guardian?       cglg  0/1
 * 80   Caregiver's phone / contact details             cgct  ENCRYPTED_TEXT
 *
 * HOUSEHOLD MEMBERS TABLE  (repeating row; store as array in `hhm`)
 * 81   Full name                                       nm    ENCRYPTED_TEXT  ┐ nested
 * 82   Age                                             ag    integer         │ in hhm[]
 * 83   Relationship to the child                       rl    ENCRYPTED_TEXT  ┘
 * 84   Size of household — number of adults            hha   integer
 * 85   Size of household — number of children          hhc   integer
 * 86   Is the age of the main caregiver under 18?      cgum  0/1
 *
 * CHILD PROTECTION RISKS
 * 87   Briefly describe the child's situation          cpd   ENCRYPTED_TEXT
 * 88-105 Protection risks (multi-select)              cpr   enum[] → CP_RISKS
 *        (17 individual checkboxes collapsed into one array)
 *
 * FAMILY — MOTHER
 * 106  First name                                      mfn   ENCRYPTED_TEXT
 * 107  Middle name / Father's name                     mmn   ENCRYPTED_TEXT
 * 108  Last name / Family name                         mln   ENCRYPTED_TEXT
 * 109  Is the mother alive?                            mal   enum → ALIVE_STATUS
 * 110  (Optional) If deceased — when and how           mdd   ENCRYPTED_TEXT
 * 111  Mother nationality status                       mns   enum → NAT_STATUS
 * 112  Mother displacement status                      mds   enum → DISP_STATUS
 *       Mother displacement — other specify            mdo   ENCRYPTED_TEXT
 * 113  Does mother have disabilities/health issues?    mdi   0/1
 * 114    If yes, specify                               mdx   ENCRYPTED_TEXT
 * 115  Is child in contact with mother?                mcc   0/1
 * 116  How can the mother be contacted?                mct   ENCRYPTED_TEXT
 * 117  Mother date of birth (DOB)                      mdb   UNIX_SECONDS
 * 118  Is mother's age estimated?                      mae   0/1
 * 119  Does mother have identification?                mhi   0/1
 * 120    If yes — ID type                              mit   ENCRYPTED_TEXT
 * 121    If yes — ID number                            min   ENCRYPTED_TEXT
 *
 * FAMILY — FATHER
 * 122  First name                                      ffn   ENCRYPTED_TEXT
 * 123  Middle name / Father's name                     fmn   ENCRYPTED_TEXT
 * 124  Last name / Family name                         fln   ENCRYPTED_TEXT
 * 125  Is the father alive?                            fal   enum → ALIVE_STATUS
 * 126  (Optional) If deceased — when and how           fdd   ENCRYPTED_TEXT
 * 127  Father nationality status                       fns   enum → NAT_STATUS
 * 128  Father displacement status                      fds   enum → DISP_STATUS
 *       Father displacement — other specify            fdo   ENCRYPTED_TEXT
 * 129  Does father have disabilities/health issues?    fdi   0/1
 * 130    If yes, specify                               fdx   ENCRYPTED_TEXT
 * 131  Is child in contact with father?                fcf   0/1
 * 132  How can the father be contacted?                fct   ENCRYPTED_TEXT
 * 133  Father date of birth (DOB)                      fdb   UNIX_SECONDS
 * 134  Is father's age estimated?                      fae   0/1
 * 135  Does father have identification?                fhi   0/1
 * 136    If yes — ID type                              fit   ENCRYPTED_TEXT
 * 137    If yes — ID number                            fin   ENCRYPTED_TEXT
 *
 * IMMEDIATE FAMILY MEMBERS TABLE  (repeating; store as array in `ifm`)
 * 138  Full name                                       nm    ENCRYPTED_TEXT  ┐ nested
 * 139  Age                                             ag    integer         │ in ifm[]
 * 140  Relationship to the child                       rl    ENCRYPTED_TEXT  │
 * 141  Address or current whereabouts                  ad    ENCRYPTED_TEXT  ┘
 *
 * URGENT NEEDS
 * 142  Are there any urgent needs?                     ung   0/1
 * 143  Does the child need Family Tracing?             ftr   0/1
 *      Urgent needs items (repeating; store as array in `uni`):
 * 144    Category                                      ct    enum → URGENT_CAT  ┐ nested
 * 145    Immediate needs description                   nd    ENCRYPTED_TEXT     │ in uni[]
 * 146    Summary reasons                               rs    ENCRYPTED_TEXT     │
 * 147    Immediate action taken                        ac    ENCRYPTED_TEXT     ┘
 *
 * RISK LEVEL
 * 148  Risk level                                      r     DB_PLAINTEXT (1-3)
 * 149  Summary of reasons for risk level               rls   ENCRYPTED_TEXT
 *  *   Caseworker name / date (Authorization)          —     SYSTEM_MANAGED
 *
 * FORM 2 — Comprehensive Assessment
 *  #   Exact label as on form                          Code  Type
 * 150  Date assessment started                         das   UNIX_SECONDS
 * 151  Date assessment completed                       dac   UNIX_SECONDS
 * 152  Type of contact                                 tc    enum → CONTACT_TYPE
 * 153  Who was there? (select all that apply)          wpa   enum[] → WHO_PRESENT
 *       Who was present — other specify                wpo   ENCRYPTED_TEXT
 * 154  Tick this box if this is a re-opened case       roc   0/1
 * 155    If yes — previous date of case closure        pcd   UNIX_SECONDS
 * 156  1. Safety [assessment narrative]                asa   ENCRYPTED_TEXT
 * 157  2. Family and other caregiving arrangements     afa   ENCRYPTED_TEXT
 * 158  3. Physical health                              apa   ENCRYPTED_TEXT
 * 159  4. Emotional wellbeing                          aea   ENCRYPTED_TEXT
 * 160  5. Education [status]                           edu   enum → EDU_STATUS
 * 161     Education details                            edd   ENCRYPTED_TEXT
 * 162  6. Friends and social network                   asn   ENCRYPTED_TEXT
 * 163  7. Work                                         awk   ENCRYPTED_TEXT
 * 164  8. Legal situation and documentation            ald   ENCRYPTED_TEXT
 *
 * PERPETRATOR (sensitive, optional)
 * 165  If perpetrator known — mark category            ppk   0/1
 * 166    Perpetrator type (multi-select)               ppt   enum[] → PERP_TYPE
 * 167    If other, specify                             ppo   ENCRYPTED_TEXT
 *
 * INCIDENT LOCATION (sensitive, optional)
 * 168  If location known — mark category               ilk   0/1
 * 169    Location type (multi-select)                  ilt   enum[] → INCIDENT_LOC
 * 170    If other, specify                             ilo   ENCRYPTED_TEXT
 *
 * VIEWS OF THE CHILD
 * 171  Views and wishes of the child                   vcw   ENCRYPTED_TEXT
 * 172  Was the child seen individually?                csi   0/1
 * 173  Views and wishes of parents/caregivers          vpc   ENCRYPTED_TEXT
 *
 * ANALYSIS OF SITUATION
 * 174  Risk factors, safety threats, vulnerabilities   arf   ENCRYPTED_TEXT
 * 175  Protective factors, strengths, support          apf   ENCRYPTED_TEXT
 * 176  Additional notes on the assessment              ann   ENCRYPTED_TEXT
 * 177  Is a formal BID required?                       bid   0/1
 *  *   Caseworker name / date                          —     SYSTEM_MANAGED
 *  *   Supervisor name / date                          —     SYSTEM_MANAGED
 * 178  Comments supervisor                             sc    ENCRYPTED_TEXT
 *
 * FORM 3+4 — Case Plan, Implementation and Follow-Up
 *  #   Exact label as on form                          Code  Type
 * 179  Date case planning started                      dps   UNIX_SECONDS
 * 180  Case ID number                                  id    DB_PLAINTEXT
 * 181  Who was involved in developing the case plan    wcp   enum[] → WHO_INVOLVED
 *       Others — specify                               wcx   ENCRYPTED_TEXT
 * 182  Objectives (SMART)                              obj   ENCRYPTED_TEXT[]
 *
 * ACTION PLAN TABLE  (repeating; store as array in `ap`)
 * 183  List needs for support identified               ani   ENCRYPTED_TEXT  ┐
 * 184  List of specific actions to be taken            aat   ENCRYPTED_TEXT  │
 * 185  Who is responsible for this action              apr   ENCRYPTED_TEXT  │ nested
 * 186  Time needed for completion                      apt   ENCRYPTED_TEXT  │ in ap[]
 * 187  Status of action                                aps   enum → ACTION_STATUS
 * 188  Additional notes / comments (mark if urgent)    apn   ENCRYPTED_TEXT  ┘
 *
 * SERVICES PROVIDED  (multi-select; store as integer array in `srv`)
 * 189-203  15 service checkboxes                       srv   enum[] → SERVICES
 *
 * FOLLOW-UP ENTRIES TABLE  (repeating; store as array in `fu`)
 * 204  Date of follow-up                               fud   UNIX_SECONDS    ┐
 * 205  Followed up with (multi-select)                 fuw   enum[] → FU_WITH │
 *       Followed up with — other specify               fux   ENCRYPTED_TEXT  │
 * 206  Followed up through (multi-select)              fut   enum[] → FU_HOW  │ nested
 * 207  Specify which action/service followed up on     fua   ENCRYPTED_TEXT  │ in fu[]
 * 208  Observations                                    fuo   ENCRYPTED_TEXT  │
 * 209  Is there a need for further follow-up?          fun   0/1             │
 * 210  Next follow-up date                             fnf   UNIX_SECONDS    ┘
 *  *   Caseworker name / date                          —     SYSTEM_MANAGED
 *  *   Supervisor name / date                          —     SYSTEM_MANAGED
 * 211  Comments supervisor                             sck   ENCRYPTED_TEXT
 *
 * FORM 5 — Review
 *  #   Exact label as on form                          Code  Type
 * 212  Date case planning started [review date]        drs   UNIX_SECONDS
 * 213  Case ID number                                  id    DB_PLAINTEXT
 * 214  Who was involved in reviewing the case plan     wri   enum[] → WHO_REVIEW
 *       Others, please specify                         wrx   ENCRYPTED_TEXT
 * 215  Overview of the child's current situation       cso   ENCRYPTED_TEXT
 * 216  Overview of actions taken and progress          atp   ENCRYPTED_TEXT
 * 217  Is another assessment needed?                   aan   0/1
 * 218    If yes, specify why                           aar   ENCRYPTED_TEXT
 * 219  Are changes to the case plan needed?            pnc   0/1
 * 220    If yes, specify why                           pnr   ENCRYPTED_TEXT
 * 221  Is there a need for a next review meeting?      nrn   0/1
 * 222    If yes, specify date                          nrd   UNIX_SECONDS
 * 223  Next steps                                      nst   ENCRYPTED_TEXT
 *  *   Caseworker name / date                          —     SYSTEM_MANAGED
 *  *   Supervisor name / date                          —     SYSTEM_MANAGED
 *
 * FORM 6 — Case Closure
 *  #   Exact label as on form                          Code  Type
 * 224  Date case closed                                dcc   UNIX_SECONDS
 * 225  Case ID number                                  id    DB_PLAINTEXT
 * 226  Risk Level at Case Closure                      rla   enum → RISK_LEVEL
 * 227  Care Arrangement at Case Closure                cca   enum → CARE_ARRANGEMENT
 *       Care arrangement — other specify               ccx   ENCRYPTED_TEXT
 * 228  Date of meeting with supervisor                 csm   UNIX_SECONDS
 * 229  Date of meeting with child / parents/caregivers ccm   UNIX_SECONDS
 * 230  Has case closure been discussed with child?     cdc   0/1
 * 231    If not, specify why                           cdcr  ENCRYPTED_TEXT
 * 232  Has case closure been discussed with caregivers?cdg   0/1
 * 233    If not, specify why                           cdgr  ENCRYPTED_TEXT
 * 234  Primary reason for closing the case             pcl   enum → CLOSURE_REASON
 *       Primary reason — other specify                 pcx   ENCRYPTED_TEXT
 * 235  (Optional) Further details on reasons           crd   ENCRYPTED_TEXT
 * 236  Date for final follow-up meeting in 3 months    ffd   UNIX_SECONDS
 * 237  How can the child be contacted?                 fcx   ENCRYPTED_TEXT
 * 238  Does the child provide consent for feedback?    cfb   enum → CONSENT_YNA
 * 239    If no, include why                            cfbr  ENCRYPTED_TEXT
 * 240  Does the parent/caregiver provide consent?      cgf   enum → CONSENT_YNA
 * 241  Child has been provided caseworker contact info cic   0/1
 * 242  Parent/caregiver has been provided contact info cgic  0/1
 *  *   Caseworker name / date                          —     SYSTEM_MANAGED
 *  *   Supervisor name / date                          —     SYSTEM_MANAGED
 */

// ─── PASTE BELOW INTO encryptionModule.js ─────────────────────────────────────
// Replace the existing FIELD_TO_SHORT, FIELD_TO_LONG, CONCERN_TO_NUM,
// NUM_TO_CONCERN, RISK_TO_NUM, NUM_TO_RISK blocks with everything below.
// ──────────────────────────────────────────────────────────────────────────────

// ─── Compact key map (verbose field name → 2-4 char code) ────────────────────

export const FIELD_TO_SHORT = {
  // CORE — DB_PLAINTEXT columns (never go inside the encrypted blob)
  caseId:                    'id',
  workerId:                  'w',
  riskLevel:                 'r',
  status:                    'st',
  submittedAt:               'ts',

  // FORM 1A — Consent
  dateFormCompleted:         'dfc',
  childFirstName:            'fn',
  childMiddleName:           'mn',
  childLastName:             'ln',
  childOtherNames:           'on',
  legitimateBasis:           'lb',
  consentFrom:               'cf',
  consentFromOther:          'cfo',
  assentFrom:                'af',
  assentFromOther:           'afo',
  permCaseMgmt:              'pcp',
  permCollectStore:          'csp',
  permShareService:          'sps',
  permShareReport:           'sir',
  permTracing:               'cdt',
  withholdInfo:              'whi',
  withholdInfoDetail:        'whd',
  withholdInfoReason:        'whr',
  authConsentPersonName:     'acn',
  authConsentPersonDate:     'acd',
  authParentName:            'apn',
  authParentDate:            'apd',

  // FORM 1B — Registration: Case Information
  dateCaseIdentified:        'dci',
  dateCaseRegistered:        'dcr',
  dateCaseReopened:          'dco',
  agency:                    'ag',
  referralSource:            'rfs',
  referralSourceOther:       'rso',

  // FORM 1B — Child Personal Details
  // (childFirstName/Middle/Last/OtherNames already above from 1A)
  dateOfBirth:               'dob',
  age:                       'a',
  ageEstimated:              'ae',
  sex:                       'sx',
  birthRegistration:         'br',
  childHasId:                'cid',
  childIdType:               'cit',
  childIdNumber:             'cin',
  nationalityStatus:         'ns',
  displacementStatus:        'dp',
  displacementOther:         'dpo',
  nationality:               'nat',
  disabilityStatus:          'dis',
  disabilityOther:           'dix',
  maritalStatus:             'ms',
  ethnicAffiliation:         'eth',
  religion:                  'rel',
  languagesSpoken:           'lng',

  // FORM 1B — Care Arrangement
  careArrangement:           'ca',
  careArrangementOther:      'cax',
  careArrangementDesc:       'cad',
  currentAddress:            'adr',
  areaOfLiving:              'aol',
  childContactInfo:          'cct',
  childPhone:                'phn',

  // FORM 1B — Caregiver
  caregiverFirstName:        'cgfn',
  caregiverMiddleName:       'cgmn',
  caregiverLastName:         'cgln',
  caregiverDob:              'cgdb',
  caregiverAge:              'cga',
  caregiverAgeEstimated:     'cgae',
  caregiverSex:              'cgs',
  caregiverHasId:            'cghi',
  caregiverIdType:           'cgit',
  caregiverIdNumber:         'cgin',
  caregiverNatStatus:        'cgns',
  caregiverDispStatus:       'cgds',
  caregiverDispOther:        'cgdx',
  caregiverDisabilities:     'cgdi',
  caregiverDisabDetail:      'cgdd',
  caregiverRelatedToChild:   'cgrc',
  caregiverRelationship:     'cgrn',
  caregiverKnowsFamily:      'cgkf',
  caregiverArrangementStart: 'cgsd',
  caregiverWilling:          'cgwc',
  caregiverNotWillingReason: 'cgwr',
  caregiverLegalGuardian:    'cglg',
  caregiverContact:          'cgct',

  // FORM 1B — Household
  householdMembers:          'hhm',
  householdAdults:           'hha',
  householdChildren:         'hhc',
  caregiverUnder18:          'cgum',

  // FORM 1B — Child Protection Risks
  childSituationDesc:        'cpd',
  cpRisks:                   'cpr',

  // FORM 1B — Mother
  motherFirstName:           'mfn',
  motherMiddleName:          'mmn',
  motherLastName:            'mln',
  motherAlive:               'mal',
  motherDeceasedDetail:      'mdd',
  motherNatStatus:           'mns',
  motherDispStatus:          'mds',
  motherDispOther:           'mdo',
  motherDisabilities:        'mdi',
  motherDisabDetail:         'mdx',
  motherChildContact:        'mcc',
  motherContact:             'mct',
  motherDob:                 'mdb',
  motherAgeEstimated:        'mae',
  motherHasId:               'mhi',
  motherIdType:              'mit',
  motherIdNumber:            'min',

  // FORM 1B — Father
  fatherFirstName:           'ffn',
  fatherMiddleName:          'fmn',
  fatherLastName:            'fln',
  fatherAlive:               'fal',
  fatherDeceasedDetail:      'fdd',
  fatherNatStatus:           'fns',
  fatherDispStatus:          'fds',
  fatherDispOther:           'fdo',
  fatherDisabilities:        'fdi',
  fatherDisabDetail:         'fdx',
  fatherChildContact:        'fcf',
  fatherContact:             'fct',
  fatherDob:                 'fdb',
  fatherAgeEstimated:        'fae',
  fatherHasId:               'fhi',
  fatherIdType:              'fit',
  fatherIdNumber:            'fin',

  // FORM 1B — Immediate Family Members (repeating table)
  immediateFamilyMembers:    'ifm',

  // FORM 1B — Urgent Needs
  urgentNeedsExist:          'ung',
  familyTracingNeeded:       'ftr',
  urgentNeedsItems:          'uni',
  riskLevelSummary:          'rls',

  // FORM 2 — Assessment: Case Information
  dateAssessmentStart:       'das',
  dateAssessmentEnd:         'dac',
  contactType:               'tc',
  whoPresent:                'wpa',
  whoPresentOther:           'wpo',
  isReopenedCase:            'roc',
  previousClosureDate:       'pcd',

  // FORM 2 — Assessment Narratives
  assessSafety:              'asa',
  assessFamily:              'afa',
  assessPhysicalHealth:      'apa',
  assessEmotionalWellbeing:  'aea',
  educationStatus:           'edu',
  educationDetails:          'edd',
  assessSocialNetwork:       'asn',
  assessWork:                'awk',
  assessLegalDocs:           'ald',

  // FORM 2 — Perpetrator (sensitive, optional)
  perpetratorKnown:          'ppk',
  perpetratorType:           'ppt',
  perpetratorOther:          'ppo',

  // FORM 2 — Incident Location (sensitive, optional)
  incidentLocKnown:          'ilk',
  incidentLocType:           'ilt',
  incidentLocOther:          'ilo',

  // FORM 2 — Views + Analysis
  childViews:                'vcw',
  childSeenAlone:            'csi',
  parentViews:               'vpc',
  riskFactors:               'arf',
  protectiveFactors:         'apf',
  assessmentNotes:           'ann',
  bidRequired:               'bid',
  supervisorCommentsAssess:  'sc',

  // FORM 3+4 — Case Plan
  datePlanStart:             'dps',
  whoCasePlan:               'wcp',
  whoCasePlanOther:          'wcx',
  caseObjectives:            'obj',
  actionPlan:                'ap',
  servicesProvided:          'srv',
  followUpEntries:           'fu',
  supervisorCommentsPlan:    'sck',

  // FORM 5 — Review
  dateReviewStart:           'drs',
  whoReview:                 'wri',
  whoReviewOther:            'wrx',
  currentSituationOverview:  'cso',
  actionsTakenProgress:      'atp',
  anotherAssessNeeded:       'aan',
  anotherAssessReason:       'aar',
  planChangesNeeded:         'pnc',
  planChangesReason:         'pnr',
  nextReviewNeeded:          'nrn',
  nextReviewDate:            'nrd',
  nextSteps:                 'nst',

  // FORM 6 — Closure
  dateClosed:                'dcc',
  riskAtClosure:             'rla',
  careAtClosure:             'cca',
  careAtClosureOther:        'ccx',
  dateSupervisorMeeting:     'csm',
  dateFamilyMeeting:         'ccm',
  closureDiscussedChild:     'cdc',
  closureChildReason:        'cdcr',
  closureDiscussedCaregiver: 'cdg',
  closureCaregiverReason:    'cdgr',
  closureReason:             'pcl',
  closureReasonOther:        'pcx',
  closureDetails:            'crd',
  finalFollowUpDate:         'ffd',
  finalContactInfo:          'fcx',
  childFeedbackConsent:      'cfb',
  childConsentReason:        'cfbr',
  caregiverFeedbackConsent:  'cgf',
  childInfoProvided:         'cic',
  caregiverInfoProvided:     'cgic',
};

export const FIELD_TO_LONG = Object.fromEntries(
  Object.entries(FIELD_TO_SHORT).map(([k, v]) => [v, k])
);

// ─── Enum lookups ─────────────────────────────────────────────────────────────
// Every fixed-option field: option string → integer stored in the blob.
// Store arrays for multi-select fields, single int for single-select.

export const LEGITIMATE_BASIS = { consent: 0, vital_interests: 1 };

export const CONSENT_FROM = {         // used for both `cf` and `af`
  child: 0, one_parent_caregiver: 1, both_parents_caregivers: 2, other: 3,
};

export const SEX = { male: 0, female: 1, non_binary: 2, other: 3 };

export const BIRTH_REG = {
  registered: 0, not_registered: 1, in_progress: 2,
};

export const NAT_STATUS = {
  national: 0, other_nationality: 1, stateless: 2, unknown: 3,
};

export const DISP_STATUS = {
  host_community: 0, asylum_seeker_refugee: 1, internally_displaced: 2,
  returnee: 3, migrant: 4, other: 5,
};

export const DISABILITY = {
  none: 0, mental: 1, sensory: 2, physical: 3, intellectual: 4, other: 5,
};

export const MARITAL_STATUS = {
  not_married: 0, planning_to_marry: 1, married: 2, divorced: 3, widowed: 4,
};

export const CARE_ARRANGEMENT = {
  parental: 0, no_care: 1, child_carer: 2, child_headed_hh: 3,
  institutional: 4, foster: 5, kinship: 6, other_family_based: 7,
  supported_independent: 8, other: 9,
};

export const AREA_LIVING = {
  urban_non_camp: 0, rural_non_camp: 1, camp_settlement: 2, other: 3,
};

export const ALIVE_STATUS = { no: 0, yes: 1, unknown: 2 };

// CP_RISKS — 17 individual checkboxes from Form 1B collapsed into one array.
// Store as an array of integers, e.g. cpRisks: [2, 9, 11]
export const CP_RISKS = {
  // Incidents
  physical_violence_abuse:     0,
  psychological_violence_abuse: 1,
  sexual_violence_abuse:       2,
  neglect:                     3,
  economic_exploitation:       4,
  harmful_hazardous_labour:    5,
  sexual_exploitation:         6,
  conflict_with_law_detained:  7,
  recruitment_armed_forces:    8,
  // Vulnerabilities
  unaccompanied:               9,
  separated:                   10,
  child_marriage:              11,
  psychological_distress:      12,
  // Justice system status
  no_justice_contact:          13,
  victim_of_offence:           14,
  witness_of_offence:          15,
  in_conflict_with_law:        16,
  detained:                    17,
};

export const CP_RISKS_REVERSE = Object.fromEntries(
  Object.entries(CP_RISKS).map(([k, v]) => [v, k])
);

// RISK_LEVEL — 1-indexed to match the DB plaintext column convention
export const RISK_LEVEL = { low: 1, medium: 2, high: 3 };
export const RISK_LEVEL_REVERSE = { 1: 'low', 2: 'medium', 3: 'high' };

export const URGENT_CAT = {
  health: 0, safety: 1, care: 2, other: 3, no_immediate_needs: 4,
};

export const CONTACT_TYPE = {
  home_visit: 0, meeting_at_other_location: 1, phone_call: 2, other: 3,
};

export const WHO_PRESENT = { child: 0, parent_caregiver: 1, other: 2 };

export const EDU_STATUS = {
  none: 0, formal_education: 1, other_learning_programmes: 2,
};

export const PERP_TYPE = {
  family_member: 0, intimate_partner: 1, peer: 2, formal_authority: 3,
  employer: 4, un_ngo_staff: 5, armed_forces: 6, other: 7,
};

export const INCIDENT_LOC = {
  inside_home: 0, outside_home: 1, education_vocational: 2,
  medical_facilities: 3, residential_care: 4, workplace: 5,
  detention: 6, digital_spaces: 7, other: 8,
};

export const WHO_INVOLVED = {           // used for both `wcp` and `wri`
  parents_caregivers: 0, child: 1, others: 2,
};

export const WHO_REVIEW = {
  parents_caregivers: 0, child: 1, supervisor: 2, others: 3,
};

export const ACTION_STATUS = { pending: 0, ongoing: 1, completed: 2 };

export const SERVICES = {
  health: 0, nutrition: 1, food_security: 2, livelihood: 3,
  cash_assistance: 4, mhpss: 5, family_tracing_reunification: 6,
  alternative_care: 7, gbv: 8, documentation_civil_reg: 9,
  legal_justice: 10, education: 11, shelter: 12, wash: 13,
  disability_services: 14,
};

export const FU_WITH = {
  child: 0, parents_caregivers: 1, service_provider_own: 2,
  service_provider_external: 3, other: 4,
};

export const FU_HOW = {
  home_visit: 0, phone_call: 1, face_to_face_at_provider: 2,
  face_to_face_outside: 3, email_sms_messaging: 4,
};

export const REFERRAL_SOURCE = {
  self_child: 0, family_member: 1, community_member: 2, media: 3,
  other_service_provider: 4, ngo_education: 5, ngo_food_security: 6,
  ngo_health: 7, ngo_livelihoods: 8, ngo_nutrition: 9, ngo_protection: 10,
  ngo_child_protection: 11, ngo_gbv: 12, ngo_shelter: 13,
  ngo_camp_mgmt: 14, ngo_wash: 15, ngo_other: 16,
};

export const CLOSURE_REASON = {
  goals_met_child_safe: 0, relocation: 1, lost_contact: 2,
  declined_support: 3, death_of_child: 4, case_error_duplication: 5,
  other: 6,
};

export const CONSENT_YNA = { no: 0, yes: 1, na: 2 };

// ─── Nested object field codes ────────────────────────────────────────────────
// Used inside arrays such as householdMembers (hhm), immediateFamilyMembers
// (ifm), urgentNeedsItems (uni), actionPlan (ap), followUpEntries (fu).
// These are compacted separately since they live inside arrays.

export const NESTED = {
  // hhm[] — household member rows
  hhm: { name: 'nm', age: 'ag', relationship: 'rl' },

  // ifm[] — immediate family member rows
  ifm: { name: 'nm', age: 'ag', relationship: 'rl', address: 'ad' },

  // uni[] — urgent needs items
  uni: { category: 'ct', needsDesc: 'nd', reasons: 'rs', actionTaken: 'ac' },

  // ap[] — action plan items
  ap: {
    needIdentified: 'ani', actionsToTake: 'aat', responsible: 'apr',
    timeNeeded: 'apt', status: 'aps', notes: 'apn',
  },

  // fu[] — follow-up entries
  fu: {
    date: 'fud', followedWith: 'fuw', followedWithOther: 'fux',
    followedThrough: 'fut', actionService: 'fua', observations: 'fuo',
    furtherNeeded: 'fun', nextDate: 'fnf',
  },
};

// ─── Fields stored as DB plaintext columns (never inside the blob) ────────────
export const DB_PLAINTEXT_FIELDS = new Set([
  'id', 'w', 'r', 'st', 'ts',
  // encrypted_blob, created_at, synced, submitted_at are DB columns too
  // but are not part of the compact case object
]);

// ─── Fields that are dates — must be stored as Unix seconds (integer) ─────────
export const UNIX_SECONDS_FIELDS = new Set([
  'dfc',          // date form completed
  'dci', 'dcr', 'dco',  // case identified / registered / re-opened
  'dob',          // child date of birth
  'cgdb',         // caregiver date of birth
  'cgsd',         // care arrangement start
  'mdb',          // mother date of birth
  'fdb',          // father date of birth
  'ts',           // submitted at
  'acd', 'apd',   // auth dates (1A)
  'das', 'dac',   // assessment start / end
  'pcd',          // previous case closure date
  'dps',          // case plan start
  'fud', 'fnf',   // follow-up date / next follow-up date
  'drs',          // review start date
  'nrd',          // next review date
  'dcc',          // case closed date
  'csm', 'ccm',   // supervisor / family meeting dates
  'ffd',          // final follow-up date
]);

// ─── Fields whose values are ENCRYPTED_TEXT ───────────────────────────────────
// (Anything not in DB_PLAINTEXT_FIELDS and not a pure enum/int/date
//  goes inside the encrypted blob as a string.)
// Key = short code. Listed here for documentation — not exhaustive.
export const ENCRYPTED_TEXT_FIELDS = new Set([
  // Names & identifiers
  'fn','mn','ln','on',                          // child names
  'cfo','afo','acn','apn',                      // consent auth names
  'ag',                                         // agency
  'rso',                                        // referral other
  'cit','cin',                                  // child ID
  'nat','eth','rel','lng',                      // nationality/religion/lang
  'cax','cad','adr','cct','phn',                // care + address
  'cgfn','cgmn','cgln','cgit','cgin',           // caregiver identity
  'cgdx','cgdd','cgrn','cgwr','cgct',           // caregiver details
  'dix','dpo',                                  // disability / displacement notes
  'cpd','rls',                                  // situation + risk summary
  'whd','whr',                                  // withhold details
  'mfn','mmn','mln','mdd','mdo','mdx','mct','mit','min',  // mother
  'ffn','fmn','fln','fdd','fdo','fdx','fct','fit','fin',  // father
  'wpo',                                        // who present other
  'edd','asa','afa','apa','aea','asn','awk','ald', // assessment narratives
  'ppo','ilo','vcw','vpc','arf','apf','ann','sc',  // assessment cont.
  'wcx','obj','sck',                            // case plan
  'wrx','cso','atp','aar','pnr','nst',          // review
  'cdcr','cdgr','pcx','crd','fcx','cfbr','ccx', // closure
]);
