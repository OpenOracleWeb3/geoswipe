# GeoSwipe

Mobile-first swipe game inspired by GeoGuesser mechanics:
- One place photo
- Two country/location options
- Swipe left or right to choose

## Why this folder exists
This is a standalone app scaffold extracted from the existing mobile swipe patterns in `PolyPoll-FrontEnd`, then adapted for geography gameplay.

Reused/adapted UI patterns:
- Thin top loading bar pattern
- Swipe card interaction pattern
- Mobile bottom-nav layout pattern
- Bottom-sheet onboarding pattern

## Run
```bash
cd /Users/samsavage/geo/geoswipe
npm install
npm run dev
```

`npm run dev` starts both services:
- API server: `http://127.0.0.1:3001`
- Vite app: `http://127.0.0.1:4175`

## Environment
If `.env` already exists, update it. Otherwise copy `.env.example` to `.env` and set the keys you need:
```bash
DATABASE_URL=...
SESSION_SECRET=...
CORS_ALLOWED_ORIGINS=...
GOOGLE_CLIENT_ID=...
VITE_GOOGLE_STREET_VIEW_API_KEY=...
VITE_GOOGLE_CLIENT_ID=...
VITE_API_BASE_URL=
```

`DATABASE_URL` points to your Render Postgres database.

`SESSION_SECRET` signs the HTTP-only session cookie used by the Node API.

`CORS_ALLOWED_ORIGINS` is a comma-separated allowlist for native/mobile callers such as `capacitor://localhost`.

`GOOGLE_CLIENT_ID` is the server-side audience the backend verifies against. For a web-only build it can match `VITE_GOOGLE_CLIENT_ID`. For a native iOS Google flow later, set this to the backend/server client ID used by the native SDK.

`VITE_GOOGLE_STREET_VIEW_API_KEY` enables Street View metadata + panorama loading.

`VITE_GOOGLE_CLIENT_ID` enables the web Google sign-in button.

`VITE_API_BASE_URL` is blank for same-origin web deploys. For bundled Capacitor builds it should point at the live backend, for example `https://geoswipe-app.onrender.com`.

On backend boot, GeoSwipe applies every SQL file in [`schema`](./schema) in order and records them in `schema_migrations`.

## Desktop via Capacitor

Once `npm install` has been run (the new Capacitor dependencies require network access), you can bootstrap the native shell and copy the web build into it:

1. `npm run cap:sync` (runs the Vite build and syncs `dist/` into the native workspace)
2. `npx cap add ios`/`npx cap add macos`/`npx cap add windows` (run once per platform)
3. `npm run cap:open:ios`, `npm run cap:open:macos`, or `npm run cap:open:windows`

`cap:sync` must be rerun whenever the web app changes before rebuilding the native binary.

## iOS notes

The repo now includes an `ios/` Capacitor project scaffold. That gets the native workspace created, but it is not the same thing as being App Store ready.

Current state:
- the game/session data now persists to Postgres through the Node API
- guest accounts are preserved server-side and are merged into a linked Google account when the user signs in later
- the schema supports multiple linked identities through `player_identities`, which is needed before Apple sign-in can coexist with Google

Still required before App Store submission:
- replace the web-only Google Identity button with a native iOS sign-in flow
- add Sign in with Apple if Google sign-in remains a primary login option
- configure native bundle IDs, app icons, launch assets, privacy strings, and App Store metadata
- test the live Render API from the Capacitor shell using `VITE_API_BASE_URL` and `CORS_ALLOWED_ORIGINS`

## Render
This repo now includes [render.yaml](./render.yaml) for deploying GeoSwipe as a Node web service with a managed Render Postgres database.

Expected Render environment variables:
- `DATABASE_URL` from the managed `geoswipe-db`
- `SESSION_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_STREET_VIEW_API_KEY`
- `VITE_GOOGLE_CLIENT_ID`

The Blueprint now provisions:
- `geoswipe-app` as the Node web service
- `geoswipe-db` as the managed Postgres instance on Render's current `basic_256mb` entry plan

The Google/CORS env vars remain `sync: false`, so set their real values in the Render dashboard before deploying.

## Current game model
- 20 rounds per session
- 9s per round
- Hourly deck difficulty target: **65% hard / 35% easy**
- Hard rounds use look-alike country pairs
- Easy rounds use obvious contrast pairs

## Database schema
The repo uses the Postgres schema in `schema/001_initial.sql` and `schema/002_player_identities.sql`. It defines:
- `players`
- `player_identities`
- `sessions`
- `round_outcomes`
- `elo_history`
- `daily_rumbles`
- `daily_rumble_entries`
- `leaderboard_snapshots`
- `country_stats`

The active app now writes players, linked identities, completed sessions, round outcomes, ELO history, and country performance into Postgres through the Node API.

Data preservation rules:
- guest progress is written to Postgres immediately
- when a guest later links Google, session history/ELO/country stats merge into that permanent account
- the frontend stores only a portable session token locally; scores and profile state are loaded from the backend snapshot

See [`GEOSWIPE_PLAN.md`](./GEOSWIPE_PLAN.md) for full product/system roadmap.
