# API Reference

Base URL: `https://your-domain.com/api`

All requests and responses use `Content-Type: application/json`.

---

## Authentication

### Login

Authenticates a user and returns a Sanctum token. Both supervisors and caseworkers can log in, but only supervisors can access case endpoints.

```
POST /api/auth/login
```

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | User email address |
| `password` | string | yes | User password |
| `device_name` | string | yes | Label for this token (e.g. `"Sarah's iPad"`) |

```json
{
  "email": "supervisor@team23.test",
  "password": "password",
  "device_name": "Sarah's iPad"
}
```

**Response — 200 OK**

```json
{
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "name": "Sarah Supervisor",
    "email": "supervisor@team23.test",
    "user_type": "supervisor"
  }
}
```

**Error — 422 Unprocessable**

```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```

Store the returned token and send it on every subsequent request:

```
Authorization: Bearer 1|abc123...
```

---

### Get current user

Returns the authenticated user's profile.

```
GET /api/auth/me
```

**Response — 200 OK**

```json
{
  "data": {
    "id": 1,
    "name": "Sarah Supervisor",
    "email": "supervisor@team23.test",
    "user_type": "supervisor"
  }
}
```

---

### Logout

Revokes the current token.

```
POST /api/auth/logout
```

**Response — 200 OK**

```json
{
  "message": "Logged out successfully."
}
```

---

## Cases

All case endpoints require a supervisor token. Caseworker tokens receive `403 Forbidden`.

### List cases

Returns a paginated list of all cases with their form submission status.

```
GET /api/cases
```

**Response — 200 OK**

```json
{
  "data": [
    {
      "id": 1,
      "case_id": "WAR-2024-001",
      "created_at": "2024-01-15T09:00:00.000000Z",
      "updated_at": "2024-01-15T09:00:00.000000Z",
      "forms": {
        "form_1a": { "id": 1, "..." },
        "form_1b": null,
        "form_2": null
      }
    }
  ],
  "links": { "..." },
  "meta": { "current_page": 1, "last_page": 1, "total": 1 }
}
```

---

### Create a case

Creates a new case record. The `case_id` is a unique string identifier assigned by the field team.

```
POST /api/cases
```

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `case_id` | string | yes | Unique case identifier (e.g. `"WAR-2024-001"`) |

```json
{
  "case_id": "WAR-2024-001"
}
```

**Response — 201 Created**

```json
{
  "data": {
    "id": 1,
    "case_id": "WAR-2024-001",
    "created_at": "2024-01-15T09:00:00.000000Z",
    "updated_at": "2024-01-15T09:00:00.000000Z",
    "forms": {
      "form_1a": null,
      "form_1b": null,
      "form_2": null
    }
  }
}
```

**Error — 422** if `case_id` is already taken.

---

### Get a case

Returns a single case with all submitted form data.

```
GET /api/cases/{case_id}
```

**Response — 200 OK**

```json
{
  "data": {
    "id": 1,
    "case_id": "WAR-2024-001",
    "created_at": "2024-01-15T09:00:00.000000Z",
    "updated_at": "2024-01-15T09:00:00.000000Z",
    "forms": {
      "form_1a": { "..." },
      "form_1b": {
        "...",
        "household_members": [ { "..." } ],
        "immediate_family_members": [ { "..." } ],
        "immediate_needs": [ { "..." } ]
      },
      "form_2": { "..." }
    }
  }
}
```

Form keys are `null` when that form has not been submitted yet.

---

## Form 1A — Consent and Assent

### Submit Form 1A

```
POST /api/cases/{case_id}/form-1a
```

Returns `422` if Form 1A has already been submitted for this case.

**Request body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `date_completed` | date | yes | ISO 8601 date |
| `first_name` | string | yes | Child's first name |
| `middle_name` | string | no | |
| `last_name` | string | yes | Child's last name |
| `other_names` | string | no | Alternative spellings |
| `legal_basis` | enum | yes | `consent` or `vital_interests` |
| `vital_interests_override` | boolean | yes | Set to `true` when consent cannot be obtained |
| `consent_from` | array | conditional | Required when `vital_interests_override` is `false`. Values: `child`, `one_parent_caregiver`, `both_parents_caregivers`, `other` |
| `consent_other_relationship` | string | no | Free-text when `other` is in `consent_from` |
| `assent_from` | array | no | Same values as `consent_from` |
| `assent_other_relationship` | string | no | |
| `permission_participation` | boolean | yes | Consent to participate in case management |
| `permission_data_collection` | boolean | yes | Consent to collect and store personal data |
| `permission_data_sharing` | boolean | yes | Consent to share data for service provision |
| `permission_reporting` | boolean | yes | Consent to share anonymised data for reporting |
| `permission_tracing` | boolean | no | Consent to disclose information for tracing |
| `has_withheld_info` | boolean | yes | Whether any information should be withheld |
| `withheld_info_detail` | string | conditional | Required when `has_withheld_info` is `true` |
| `withheld_info_reason` | string | no | |
| `child_name_auth` | string | no | Child signature block |
| `child_date_auth` | date | no | |
| `child_signature` | string | no | Base64-encoded signature image |
| `caregiver_name_auth` | string | yes | Caregiver signature block |
| `caregiver_date_auth` | date | yes | |
| `caregiver_signature` | string | yes | Base64-encoded signature image |
| `caseworker_name_auth` | string | yes | Caseworker signature block |
| `caseworker_date_auth` | date | yes | |
| `caseworker_signature` | string | yes | Base64-encoded signature image |
| `supervisor_name_auth` | string | no | Supervisor signature block |
| `supervisor_date_auth` | date | no | |
| `supervisor_signature` | string | no | Base64-encoded signature image |

**Example request**

```json
{
  "date_completed": "2024-01-15",
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "legal_basis": "consent",
  "vital_interests_override": false,
  "consent_from": ["one_parent_caregiver"],
  "permission_participation": true,
  "permission_data_collection": true,
  "permission_data_sharing": true,
  "permission_reporting": true,
  "has_withheld_info": false,
  "caregiver_name_auth": "Fatima Hassan",
  "caregiver_date_auth": "2024-01-15",
  "caregiver_signature": "data:image/png;base64,...",
  "caseworker_name_auth": "Alice Worker",
  "caseworker_date_auth": "2024-01-15",
  "caseworker_signature": "data:image/png;base64,..."
}
```

**Response — 201 Created**

Returns the full Form 1A submission object.

---

### Get Form 1A

```
GET /api/cases/{case_id}/form-1a
```

Returns `404` if no Form 1A has been submitted for this case.

---

## Form 1B — Registration and Rapid Assessment

### Submit Form 1B

```
POST /api/cases/{case_id}/form-1b
```

Returns `422` if Form 1B has already been submitted for this case.

This is the most complex form. It includes nested arrays for household members, immediate family members, and immediate needs — all stored as related records.

**Request body — Case Information**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `date_identified` | date | yes | |
| `date_registered` | date | yes | |
| `date_reopened` | date | no | |
| `caseworker_id` | string | yes | |
| `agency` | string | yes | |
| `identification_source` | enum | yes | `self_referral`, `family_member`, `community_member`, `media`, `other_service_provider`, `un_ingo_ngo` |
| `identification_source_sector` | enum | no | `education`, `food_security`, `health`, `livelihoods`, `nutrition`, `protection`, `child_protection`, `gbv`, `shelter`, `camp_coordination`, `wash`, `other` |
| `identification_source_other` | string | no | |

**Request body — Child Personal Details**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `first_name` | string | yes | |
| `middle_name` | string | no | |
| `last_name` | string | yes | |
| `other_names` | string | no | |
| `dob` | date | yes | Date of birth |
| `age` | integer | yes | |
| `age_estimated` | boolean | yes | |
| `sex` | enum | yes | `male`, `female`, `non_binary`, `other` |
| `birth_registration` | enum | yes | `registered`, `not_registered`, `in_progress` |
| `has_id` | boolean | yes | |
| `id_type` | string | no | |
| `id_number` | string | no | |
| `nationality_status` | enum | yes | `national`, `other_nationality`, `stateless`, `unknown` |
| `displacement_status` | enum | yes | `host_community`, `asylum_seeker_refugee`, `idp`, `returnee`, `migrant`, `other` |
| `displacement_status_other` | string | no | |
| `nationality` | string | yes | |
| `disability_status` | enum | yes | `no_disabilities`, `mental_impairment`, `sensory_impairment`, `physical_impairment`, `intellectual_impairment`, `other` |
| `disability_other` | string | no | |
| `marital_status` | enum | yes | `not_married`, `planning_to_marry`, `married`, `divorced`, `widowed` |
| `ethnic_affiliation` | string | no | |
| `religion` | string | no | |
| `languages_spoken` | array of strings | yes | e.g. `["Arabic", "English"]` |

**Request body — Care / Living Arrangement**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `care_type` | enum | yes | `parental_care`, `no_care`, `child_carer`, `child_headed_household`, `institutional_care`, `foster_care`, `kinship_care`, `other_family_based`, `supported_independent`, `other` |
| `care_type_other` | string | no | |
| `care_description` | string | yes | Free-text description |
| `current_address` | string | yes | |
| `area_type` | enum | no | `urban_non_camp`, `rural_non_camp`, `camp_settlement`, `other` |
| `contact_method` | string | yes | How to reach the child |

**Request body — Caregiver Details** (all nullable — only fill when child is not in parental care)

| Field | Type | Notes |
|-------|------|-------|
| `caregiver_first_name` | string | |
| `caregiver_last_name` | string | |
| `caregiver_dob` | date | |
| `caregiver_age` | integer | |
| `caregiver_age_estimated` | boolean | |
| `caregiver_sex` | enum | `male`, `female`, `non_binary`, `other` |
| `caregiver_has_id` | boolean | |
| `caregiver_nationality_status` | enum | `national`, `other_nationality`, `stateless`, `unknown` |
| `caregiver_displacement_status` | enum | `host_community`, `asylum_seeker_refugee`, `idp`, `returnee`, `migrant`, `other` |
| `caregiver_has_disabilities` | boolean | |
| `caregiver_disabilities_detail` | string | |
| `caregiver_related_to_child` | boolean | |
| `caregiver_relationship` | string | |
| `caregiver_knows_family` | boolean | |
| `care_arrangement_start` | date | |
| `caregiver_willing_to_continue` | boolean | |
| `caregiver_unwilling_reason` | string | |
| `caregiver_is_legal_guardian` | boolean | |
| `caregiver_contact` | string | |

**Request body — Household**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `household_adults` | integer | yes | Number of adults |
| `household_children` | integer | yes | Number of children |
| `main_caregiver_under_18` | boolean | yes | |
| `household_members` | array | no | See nested object below |
| `household_members[].full_name` | string | yes | |
| `household_members[].age` | integer | yes | |
| `household_members[].relationship` | string | yes | Relationship to child |

**Request body — Protection Risks**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `situation_description` | string | yes | |
| `risks_identified` | array | yes | One or more of: `physical_violence`, `psychological_violence`, `sexual_violence`, `neglect`, `economic_exploitation`, `hazardous_labour`, `sexual_exploitation`, `conflict_with_law`, `recruitment_armed_forces`, `unaccompanied`, `separated`, `child_marriage`, `psychological_distress` |
| `justice_system_status` | enum | yes | `no_contact`, `victim`, `witness`, `in_conflict_with_law`, `detained` |

**Request body — Family Details**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `mother_first_name` | string | yes | |
| `mother_last_name` | string | yes | |
| `mother_alive` | enum | yes | `yes`, `no`, `unknown` |
| `mother_death_note` | string | no | |
| `mother_nationality_status` | enum | yes | |
| `mother_displacement_status` | enum | yes | |
| `mother_has_disabilities` | boolean | yes | |
| `mother_disabilities_detail` | string | no | |
| `mother_in_contact` | boolean | yes | |
| `mother_contact_method` | string | no | |
| `mother_dob` | date | yes | |
| `mother_age` | integer | yes | |
| `mother_age_estimated` | boolean | yes | |
| `mother_has_id` | boolean | yes | |
| `mother_id_type` | string | no | |
| `mother_id_number` | string | no | |
| `father_first_name` | string | yes | |
| `father_last_name` | string | yes | |
| `father_alive` | enum | yes | `yes`, `no`, `unknown` |
| `father_death_note` | string | no | |
| `father_nationality_status` | enum | yes | |
| `father_displacement_status` | enum | yes | |
| `father_has_disabilities` | boolean | yes | |
| `father_disabilities_detail` | string | no | |
| `father_in_contact` | boolean | yes | |
| `father_contact_method` | string | no | |
| `father_dob` | date | yes | |
| `father_age` | integer | yes | |
| `father_age_estimated` | boolean | yes | |
| `father_has_id` | boolean | yes | |
| `father_id_type` | string | no | |
| `father_id_number` | string | no | |
| `immediate_family_members` | array | no | See nested object below |
| `immediate_family_members[].full_name` | string | yes | |
| `immediate_family_members[].age` | integer | yes | |
| `immediate_family_members[].relationship` | string | yes | |
| `immediate_family_members[].address` | string | yes | Known address or whereabouts |

**Request body — Urgent Needs**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `has_urgent_needs` | boolean | yes | |
| `needs_family_tracing` | boolean | yes | |
| `immediate_needs` | array | no | See nested object below |
| `immediate_needs[].category` | enum | yes | `health`, `safety`, `care`, `other` |
| `immediate_needs[].category_other` | string | no | |
| `immediate_needs[].summary_reasons` | string | yes | |
| `immediate_needs[].action_taken` | string | yes | |

**Request body — Risk Level & Authorization**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `risk_level` | enum | yes | `high`, `medium`, `low` |
| `risk_summary` | string | yes | Reasons for the risk level |
| `caseworker_name` | string | yes | |
| `caseworker_date` | date | yes | |
| `caseworker_signature` | string | yes | Base64-encoded signature image |

**Example request (minimal)**

```json
{
  "date_identified": "2024-01-10",
  "date_registered": "2024-01-15",
  "caseworker_id": "CW-0042",
  "agency": "WarChild",
  "identification_source": "community_member",
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "dob": "2015-06-20",
  "age": 8,
  "age_estimated": false,
  "sex": "male",
  "birth_registration": "not_registered",
  "has_id": false,
  "nationality_status": "national",
  "displacement_status": "host_community",
  "nationality": "Syrian",
  "disability_status": "no_disabilities",
  "marital_status": "not_married",
  "languages_spoken": ["Arabic"],
  "care_type": "parental_care",
  "care_description": "Living with both parents.",
  "current_address": "Camp 4, Block B, Tent 12",
  "contact_method": "Via father: +963 XXX XXX",
  "household_adults": 2,
  "household_children": 3,
  "main_caregiver_under_18": false,
  "household_members": [
    { "full_name": "Fatima Hassan", "age": 35, "relationship": "mother" },
    { "full_name": "Omar Hassan", "age": 38, "relationship": "father" }
  ],
  "situation_description": "Child identified as at risk due to lack of documentation.",
  "risks_identified": ["neglect"],
  "justice_system_status": "no_contact",
  "mother_first_name": "Fatima",
  "mother_last_name": "Hassan",
  "mother_alive": "yes",
  "mother_nationality_status": "national",
  "mother_displacement_status": "host_community",
  "mother_has_disabilities": false,
  "mother_in_contact": true,
  "mother_dob": "1989-03-10",
  "mother_age": 35,
  "mother_age_estimated": false,
  "mother_has_id": false,
  "father_first_name": "Omar",
  "father_last_name": "Hassan",
  "father_alive": "yes",
  "father_nationality_status": "national",
  "father_displacement_status": "host_community",
  "father_has_disabilities": false,
  "father_in_contact": true,
  "father_dob": "1986-07-22",
  "father_age": 38,
  "father_age_estimated": false,
  "father_has_id": false,
  "has_urgent_needs": false,
  "needs_family_tracing": false,
  "risk_level": "medium",
  "risk_summary": "Medium risk due to lack of documentation and precarious housing.",
  "caseworker_name": "Alice Worker",
  "caseworker_date": "2024-01-15",
  "caseworker_signature": "data:image/png;base64,..."
}
```

**Response — 201 Created**

Returns the full Form 1B submission including nested members and needs.

---

### Get Form 1B

```
GET /api/cases/{case_id}/form-1b
```

Returns the Form 1B submission with all nested relations (`household_members`, `immediate_family_members`, `immediate_needs`). Returns `404` if not yet submitted.

---

## Form 2 — Comprehensive Assessment

### Submit Form 2

```
POST /api/cases/{case_id}/form-2
```

Returns `422` if Form 2 has already been submitted for this case.

**Request body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `date_started` | date | yes | |
| `date_completed` | date | no | |
| `contact_type` | enum | yes | `home_visit`, `meeting_other_location`, `phone_call`, `other` |
| `who_present` | array | yes | One or more of: `child`, `parent_caregiver`, `other` |
| `who_present_other` | string | no | Free-text when `other` in `who_present` |
| `is_reopened` | boolean | yes | Whether this is a reopened case |
| `previous_closure_date` | date | conditional | Required when `is_reopened` is `true` |
| `safety` | string | yes | Assessment of child's safety |
| `family_caregiving` | string | yes | Assessment of family and caregiving arrangements |
| `physical_health` | string | yes | Assessment of physical health |
| `emotional_wellbeing` | string | yes | Assessment of emotional wellbeing |
| `education_status` | enum | yes | `no_learning`, `formal_education`, `other_learning` |
| `education_detail` | string | no | |
| `friends_social` | string | yes | Assessment of social network |
| `work` | string | yes | Work situation |
| `legal_documentation` | string | yes | Legal status and documentation |
| `perpetrator_known` | boolean | no | Sensitive — incident details section |
| `perpetrator_type` | enum | no | `family_member`, `intimate_partner`, `peer`, `formal_authority`, `employer`, `un_ngo_staff`, `armed_force`, `other` |
| `perpetrator_other` | string | no | |
| `incident_location_known` | boolean | no | |
| `incident_location` | enum | no | `inside_home`, `outside_home`, `education_vocational`, `medical_facilities`, `residential_care`, `workplace`, `detention`, `digital`, `other` |
| `incident_location_other` | string | no | |
| `child_views_wishes` | string | yes | Views and wishes of the child |
| `child_seen_individually` | boolean | yes | Was child spoken to alone |
| `caregiver_views_wishes` | string | yes | Views and wishes of the caregiver |
| `risk_factors` | string | yes | |
| `protective_factors` | string | yes | |
| `additional_notes` | string | no | |
| `bid_required` | boolean | yes | Whether a formal Best Interests Determination is required |
| `caseworker_name` | string | yes | |
| `caseworker_date` | date | yes | |
| `caseworker_signature` | string | yes | Base64-encoded signature image |
| `supervisor_name` | string | yes | |
| `supervisor_date` | date | yes | |
| `supervisor_signature` | string | yes | Base64-encoded signature image |
| `supervisor_comments` | string | no | |

**Example request**

```json
{
  "date_started": "2024-02-05",
  "date_completed": "2024-02-05",
  "contact_type": "home_visit",
  "who_present": ["child", "parent_caregiver"],
  "is_reopened": false,
  "safety": "Child appears physically safe. No signs of abuse observed during the visit.",
  "family_caregiving": "Both parents present and engaged. Mother is the primary caregiver.",
  "physical_health": "Child appears well-nourished and healthy.",
  "emotional_wellbeing": "Child is shy but responsive. Shows some signs of anxiety.",
  "education_status": "formal_education",
  "friends_social": "Has a few friends within the camp.",
  "work": "Not working. Attends school regularly.",
  "legal_documentation": "No civil documentation. Family is pursuing birth certificate.",
  "child_views_wishes": "Wants to continue school and eventually return home.",
  "child_seen_individually": true,
  "caregiver_views_wishes": "Parents want stability and access to documentation for their children.",
  "risk_factors": "Lack of documentation, temporary housing, limited income.",
  "protective_factors": "Strong family bond, engaged parents, school attendance.",
  "bid_required": false,
  "caseworker_name": "Alice Worker",
  "caseworker_date": "2024-02-05",
  "caseworker_signature": "data:image/png;base64,...",
  "supervisor_name": "Sarah Supervisor",
  "supervisor_date": "2024-02-06",
  "supervisor_signature": "data:image/png;base64,..."
}
```

**Response — 201 Created**

Returns the full Form 2 submission object.

---

### Get Form 2

```
GET /api/cases/{case_id}/form-2
```

Returns `404` if not yet submitted.

---

## Error responses

### 401 Unauthorized

No token provided or token is invalid.

```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden

Token belongs to a caseworker (only supervisors can access case endpoints).

```json
{
  "message": "Only supervisors can access this resource."
}
```

### 404 Not Found

Case or form submission does not exist.

```json
{
  "message": "No query results for model [App\\Models\\ChildCase]."
}
```

### 422 Unprocessable Entity

Validation failed or form already submitted.

```json
{
  "message": "The first name field is required.",
  "errors": {
    "first_name": ["The first name field is required."]
  }
}
```

Or when resubmitting a form:

```json
{
  "message": "Form 1A has already been submitted for this case."
}
```
