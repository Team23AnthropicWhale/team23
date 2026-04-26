// Lookup table: verbose form field value → compact 2-4 char code.
// Used to shrink case records before compression and encryption.

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
  ongoing:                    'ZN',
  action_completed:           'ZK',

  // Referral / identification source
  self_referral:              'SR',
  family_referral:            'FR',
  community_referral:         'CR',
  media_referral:             'MR',
  service_provider_referral:  'SP',
  un_ingo_ngo_referral:       'UN',

  // Humanitarian sectors
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

  // Nationality / displacement status
  national:                   'NT',
  other_nationality:          'ON',
  host_community:             'HY',
  internally_displaced_person:'ID',
  returnee:                   'RN',
  migrant:                    'MG',

  // Birth registration
  birth_registered:           'BR',
  birth_not_registered:       'BN',
  birth_registration_in_progress:'BI',

  // Disability
  no_disability:              'DIN',
  has_disability:             'DIY',
  disability_mental:          'DIM',
  disability_sensory:         'DIS',
  disability_physical:        'DIP',
  disability_intellectual:    'DIL',

  // Child marital status
  not_married:                'MN',
  planning_to_marry:          'ME',

  // Care arrangement
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

  // Area of living
  urban_non_camp:             'LU',
  rural_non_camp:             'LR',
  camp_settlement:            'LC',

  // Child protection risk categories
  economic_exploitation:      'VEP',
  harmful_labour:             'VHL',
  sexual_exploitation:        'VXE',
  child_conflict_law:         'VCL',
  recruitment_armed_forces:   'VAF',
  unaccompanied_child:        'VUA',
  separated_child:            'VSD',
  child_marriage:             'VCM',
  psychological_distress:     'VPD',

  // Justice system status
  no_justice_contact:         'JN',
  justice_contact:            'JC',
  victim_of_offence:          'JV',
  witness_of_offence:         'JW',
  in_conflict_with_law:       'JL',
  child_detained:             'JD',

  // Contact / follow-up method
  home_visit:                 'HV',
  meeting_other_location:     'ML',
  phone_call:                 'PC',
  face_to_face_at_provider:   'FFP',
  face_to_face_outside_home:  'FFO',
  email_sms_messaging:        'EM',

  // Education status
  not_in_education:           'EDX',
  formal_education:           'EDF',
  non_formal_education:       'EDN',

  // Perpetrator category
  perpetrator_family:         'PFL',
  perpetrator_intimate_partner:'PIL',
  perpetrator_peer:           'PPE',
  perpetrator_formal_authority:'PFA',
  perpetrator_employer:       'PEM',
  perpetrator_un_ngo_staff:   'PUN',
  perpetrator_armed_force:    'PAF',

  // Location of incident
  inside_home:                'LI',
  outside_home:               'LO',
  education_facility:         'LE',
  medical_facility:           'LM',
  residential_care_facility:  'LF',
  workplace:                  'LW',
  place_of_detention:         'LD',
  digital_space:              'LDG',

  // Services provided
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

  // Follow-up subjects
  child:                      'CH',
  parent_caregiver:           'PGA',
  service_provider_own:       'SPO',
  service_provider_external:  'SPE',

  // Case closure reasons
  goal_met:                   'CCG',
  child_relocated:            'CCR',
  lost_contact:               'CCL',
  no_longer_wants_support:    'CCN',
  child_death:                'CCD',
  case_error_duplicate:       'CCE',

  // Consent / legal basis
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

export async function applyLookup(data: unknown): Promise<unknown> {
  if (typeof data === 'string') return LOOKUP_TABLE[data] ?? data;
  if (Array.isArray(data))     return Promise.all(data.map(applyLookup));
  if (data !== null && typeof data === 'object') {
    const entries = await Promise.all(
      Object.entries(data as Record<string, unknown>).map(async ([k, v]) => [
        k,
        await applyLookup(v),
      ]),
    );
    return Object.fromEntries(entries);
  }
  return data;
}

export async function reverseLookup(data: unknown): Promise<unknown> {
  if (typeof data === 'string') return REVERSE_LOOKUP[data] ?? data;
  if (Array.isArray(data))     return Promise.all(data.map(reverseLookup));
  if (data !== null && typeof data === 'object') {
    const entries = await Promise.all(
      Object.entries(data as Record<string, unknown>).map(async ([k, v]) => [
        k,
        await reverseLookup(v),
      ]),
    );
    return Object.fromEntries(entries);
  }
  return data;
}
