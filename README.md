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

Vite will print the local URL, usually `http://localhost:5173`.

## Environment
If `.env` already exists, update it. Otherwise copy `.env.example` to `.env` and set the keys you need:
```bash
VITE_GOOGLE_STREET_VIEW_API_KEY=...
VITE_GOOGLE_CLIENT_ID=...
```

`VITE_GOOGLE_STREET_VIEW_API_KEY` enables Street View metadata + panorama loading.

`VITE_GOOGLE_CLIENT_ID` enables the client-side Google sign-in UI now wired into the home screen, solo lobby, profile screen, and in-run menu.

Important: this repo is still frontend-only. Google sign-in currently attaches a local device profile to a Google identity in the browser, but there is no backend token exchange or database persistence yet.

## Desktop via Capacitor

Once `npm install` has been run (the new Capacitor dependencies require network access), you can bootstrap the native shell and copy the web build into it:

1. `npm run cap:sync` (runs the Vite build and syncs `dist/` into the native workspace)
2. `npx cap add macos`/`npx cap add windows` (run once to graft the native projects)
3. `npm run cap:open:macos` or `npm run cap:open:windows` to open the platform workspace in Xcode or Visual Studio

`cap:sync` must be rerun whenever the web app changes before rebuilding the native binary.

## Current game model
- 20 rounds per session
- 9s per round
- Hourly deck difficulty target: **65% hard / 35% easy**
- Hard rounds use look-alike country pairs
- Easy rounds use obvious contrast pairs

## Database schema
The repo includes a Postgres schema in `schema/001_initial.sql` for future backend work. It defines:
- `players`
- `sessions`
- `round_outcomes`
- `elo_history`
- `daily_rumbles`
- `daily_rumble_entries`
- `leaderboard_snapshots`
- `country_stats`

That schema is not connected to the shipped app yet.

See [`GEOSWIPE_PLAN.md`](./GEOSWIPE_PLAN.md) for full product/system roadmap.
