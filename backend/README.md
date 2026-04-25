# WarChild Case Management — Backend API

A Laravel REST API that serves as the central server for the WarChild child protection case management system.

## How the system works

This backend is **not** the primary data entry point. Caseworkers operate entirely offline in the field, filling in forms on their mobile devices. Data stays on the device until the caseworker returns to camp and syncs with a supervisor's device (app-to-app, no server involved). The supervisor reviews and validates all submissions, then sends the approved data to this backend.

```
Caseworker (offline)
    │  fills in forms locally
    ▼
Sync to supervisor device (app-to-app, no server)
    │  supervisor validates
    ▼
POST to this backend
    │
    ▼
Central database (this server)
```

**Only supervisors** interact with this API. Caseworkers never call it directly.

---

## Tech stack

| Component | Version |
|-----------|---------|
| PHP | 8.5 |
| Laravel | 13 |
| Auth | Laravel Sanctum 4 |
| Database | SQLite (dev) / configurable |
| Tests | Pest 4 |

---

## Setup

```bash
# Install dependencies
composer install

# Copy environment file and configure your database
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Seed demo users (optional)
php artisan db:seed
```

Demo accounts created by the seeder:

| Email | Password | Role |
|-------|----------|------|
| supervisor@team23.test | password | Supervisor |
| caseworker@team23.test | password | Caseworker |
| caseworker2@team23.test | password | Caseworker |

---

## Running tests

```bash
php artisan test --compact
```

---

## Architecture

### User roles

| Role | Value | Access |
|------|-------|--------|
| Supervisor | `supervisor` | Full read/write access to cases and forms |
| Caseworker | `case_worker` | Login only — cannot access case API |

### Data model

```
cases
 ├── form_1a_submissions    (Consent & Assent)
 ├── form_1b_submissions    (Registration & Rapid Assessment)
 │    ├── form_1b_household_members
 │    ├── form_1b_family_members
 │    └── form_1b_immediate_needs
 └── form_2_submissions     (Comprehensive Assessment)
```

Each case can have at most one submission per form type. Submitting a form twice returns `422`.

### API routes

All case and form routes require a supervisor token (`Authorization: Bearer <token>`).

```
POST   /api/auth/login
GET    /api/auth/me                          [auth]
POST   /api/auth/logout                      [auth]

GET    /api/cases                            [auth, supervisor]
POST   /api/cases                            [auth, supervisor]
GET    /api/cases/{case_id}                  [auth, supervisor]

GET    /api/cases/{case_id}/form-1a          [auth, supervisor]
POST   /api/cases/{case_id}/form-1a          [auth, supervisor]

GET    /api/cases/{case_id}/form-1b          [auth, supervisor]
POST   /api/cases/{case_id}/form-1b          [auth, supervisor]

GET    /api/cases/{case_id}/form-2           [auth, supervisor]
POST   /api/cases/{case_id}/form-2           [auth, supervisor]
```

### File structure

```
app/
├── Enums/UserType.php
├── Http/
│   ├── Controllers/
│   │   ├── Auth/               LoginController, LogoutController, MeController
│   │   └── Cases/              CaseController, Form1aController, Form1bController, Form2Controller
│   ├── Middleware/EnsureSupervisor.php
│   ├── Requests/Cases/         StoreCase*, StoreForm1a*, StoreForm1b*, StoreForm2*
│   └── Resources/              ChildCaseResource, Form*SubmissionResource
└── Models/
    ChildCase, Form1aSubmission, Form1bSubmission, Form2Submission,
    Form1bFamilyMember, Form1bHouseholdMember, Form1bImmediateNeed
```

---

## API reference

See [docs/api.md](docs/api.md) for the full endpoint reference with request/response examples.
