# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo Structure

Monorepo with two independent apps:
- `backend/` — Laravel 13 REST API (PHP 8.4, SQLite in dev, Docker)
- `frontend/` — Expo + React Native app (TypeScript, Expo Router, local-first)

Each directory has its own dependencies and its own CLAUDE.md. The backend one is detailed — read it before touching any PHP.

## Commands

### Full stack (from repo root)
```bash
make up        # build and start backend in Docker
make down      # stop containers
make logs      # tail container logs
make test      # run backend tests inside Docker
make backend   # open shell in backend container
make db-fresh  # migrate:fresh --seed
```

### Backend (from `backend/`)
```bash
composer install
php artisan migrate --seed
php artisan serve               # dev server on :8000
php artisan test --compact      # run all tests
php artisan test --compact --filter=TestName   # single test
vendor/bin/pint --dirty --format agent         # format changed PHP files
```

### Frontend (from `frontend/`)
```bash
npm install
npx expo start         # interactive dev server (choose platform)
npx expo start --ios
npx expo start --android
npx expo start --web
npm run lint
```

The frontend has no test suite yet. To add Jest, install `jest-expo` and `@types/jest`, then add to `package.json`:
```json
"jest": { "preset": "jest-expo" },
"scripts": { "test": "jest", "test:watch": "jest --watch" }
```
Services in `services/` (pure logic, no React) can be unit tested without any React Native mocking.

## Architecture

### Offline-first data model
Caseworkers operate entirely offline. All form data is stored locally on the device using AsyncStorage (case metadata) and `expo-file-system` CSV files (form content via `services/csvService.ts`). No backend calls are made by caseworkers.

Supervisors receive data from caseworkers via **app-to-app sync** (not through the backend). Once a supervisor validates and approves data locally, they push it to the backend API.

### Role split
Two roles: `user` (caseworker) and `supervisor`. The `home/index.tsx` screen branches on `user.role` to show either view. The backend API is entirely gated behind `auth` + a `supervisor` middleware — caseworkers have no backend access at all.

### Form system
Three forms are defined in `frontend/data/forms.ts` as `FormDefinition` objects: `1A` (Consent), `1B` (Registration & Rapid Assessment), `2` (Comprehensive Assessment). Each has sections → fields with typed field definitions (`string`, `date`, `boolean`, `enum`, `multiselect`, `integer`, `signature`, `array`). The `FormWizard` component renders these schema-driven forms step-by-step. The same three forms exist as separate Eloquent models on the backend (`Form1aSubmission`, `Form1bSubmission`, `Form2Submission`).

### Backend API shape
All routes live under `/api/` and require Sanctum token auth. Case-related routes are nested: `GET|POST /api/cases/{case_id}/form-1a`, etc. The frontend connects to `http://localhost:8000` in dev (see `frontend/constants/configs.ts`).

### Frontend navigation
Expo Router file-based routing. Two route groups: `(auth)` (login) and `(tabs)` (main app). The tab layout (`app/(tabs)/_layout.tsx`) gates access and conditionally shows the Upload tab for supervisors only. The form entry flow uses `app/modal.tsx` as the entry point → `FormWizard` → `FormFieldInput`.

### Styling
Frontend uses a centralized `DashboardColors` palette (`constants/dashboard-colors.ts`) — no Tailwind. All components import from it directly. There is no global stylesheet.
