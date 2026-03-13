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
cd frontend/geoswipe
npm install
npm run dev
```

App starts on `http://localhost:4175`.

## Optional Google Street View
Set this env var if you want Google Street View images:
```bash
VITE_GOOGLE_STREET_VIEW_API_KEY=...
```

Without a key, the app falls back to Wikimedia Commons search + Unsplash source URLs.

## Current game model
- 20 rounds per session
- 9s per round
- Hourly deck difficulty target: **65% hard / 35% easy**
- Hard rounds use look-alike country pairs
- Easy rounds use obvious contrast pairs

See [`GEOSWIPE_PLAN.md`](./GEOSWIPE_PLAN.md) for full product/system roadmap.
