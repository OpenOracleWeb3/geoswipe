# iOS Release Audit

## What is ready in code

- Node + Postgres backend is wired through Render-friendly env vars.
- Session data, ELO, round outcomes, and country stats are persisted in Postgres.
- Guest accounts can merge into a linked Google account without losing session history.
- Multiple auth identities are supported at the schema level through `player_identities`.
- Capacitor iOS workspace exists under `ios/`.

## What is not App Store ready yet

- Google auth is still using the web GIS button in the React UI.
- Sign in with Apple is not implemented yet.
- Native iOS app metadata is not complete: icons, launch assets, privacy strings, entitlement review.
- Native auth testing on physical iPhone hardware is still outstanding.
- Render/Google production env values still need to be populated for the live service and native build.

## Required production env

- `DATABASE_URL`
- `SESSION_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_STREET_VIEW_API_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_API_BASE_URL` for bundled native builds

## Native build notes

- Web deploys can keep `VITE_API_BASE_URL` blank and use same-origin `/api`.
- Capacitor builds must point `VITE_API_BASE_URL` at the live backend.
- Capacitor/mobile origins must be added to `CORS_ALLOWED_ORIGINS`.
- The next auth step should be native Google + Apple sign-in, not more browser-only auth work.
