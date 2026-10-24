# Srijan

Every item gets a second route.

A responsive Vite + React + TypeScript app for identifying everyday items, choosing responsible material routes, finding illustrative centers, logging actions, and sharing reusable items.

## Run

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Features

- Browser-side TensorFlow.js / MobileNet photo classification, top-three predictions, confidence thresholds, mandatory category confirmation, and manual overrides.
- Searchable 42-item catalog and ticket-style item route cards.
- Leaflet map with 14 clearly fictional Bengaluru-area centers, category filtering, distance sorting, and optional geolocation.
- Persistent Zustand activity and exchange state; reuse handovers create completed activity records.
- Recharts weekly, route, category, and material-flow charts.
- Local classification evaluation logs and transparent AI/privacy explanations.
- Responsive desktop sidebar and mobile bottom navigation.

## Demo and estimation boundaries

All initial activities, listings, centers, names, and addresses are synthetic. Exchange actions work locally and do not contact other people. CITY_CENTER in `src/data/constants.ts` is a Bengaluru placeholder. Center acceptance and catalog guidance must be verified against actual local facilities. Carbon factors are indicative educational approximations; all logged statuses are included in dashboard estimates. Reuse handover weights use the category's first catalog item's average weight times quantity.

Photo inference runs on the device; the first inference downloads the model from the network. Fonts and OpenStreetMap tiles also require network access. Photos are never persisted or uploaded. Activity, listings, and confirmed classification logs live in localStorage. Reset demo restores only activities and listings, retaining classification logs.

## Data contract

The fixed domain types are in `src/data/types.ts`. Selectors are pure functions in `src/store/selectors.ts`. The site name is **Srijan** throughout; earlier briefs used an obsolete name.

## Validation

`npm test` checks synthetic seed diversity, category mapping and keyword precedence, impact calculations, local persistence, activity updates, exchange state transitions, duplicate handover protection, and classification logging. TensorFlow.js is loaded only when a photo is selected; its sizeable inference chunks do not block the homepage.
