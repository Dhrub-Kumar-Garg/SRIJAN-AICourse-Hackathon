# Srijan — developer handover

Srijan is the current name. Earlier prompts used “ReRoute”; keep **Srijan** in product copy, metadata, package naming, and future changes.

## Run locally

Requires Node.js 22 (tested with 22.20.0) and npm.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. The default is `http://localhost:5173`; Vite chooses the next port if it is occupied.

```sh
npm test          # Domain and store integration checks
npm run build    # Strict TypeScript check and production bundle
npm run preview  # Serve the production build for a smoke test
npm run format   # Format tracked source/configuration with Prettier
```

Fonts, OpenStreetMap tiles, and the first MobileNet model download require a network connection. Geolocation and camera access require permission and a secure context (localhost works). Route navigation uses browser history; production hosting must serve `index.html` for application routes.

## Folder structure

```text
src/
  App.tsx                    Application shell, navigation, routes, lazy loading
  main.tsx                   React entry point, global and Leaflet CSS
  styles.css                 Theme and responsive page/component styles
  components/
    ui/index.tsx             Shared UI primitives and toast context
    RouteCard.tsx            Item routing ticket and handoff into Centers
    CenterMap.tsx            OSM map, custom markers, popup and pan synchronization
    ActivityModal.tsx        Shared validated activity/drop-off form
    GuidedDemo.tsx           Tab-persisted guided phone and lamp journeys
    PageBoundary.tsx         Route loading/render error recovery
  data/
    types.ts                 Fixed domain contract (unchanged by this continuation)
    constants.ts             Category/route metadata, indicative CO₂e factors, city
    catalog.ts               42 synthetic catalog entries
    centers.ts               14 fictional Bengaluru-area facilities
    seed.ts                  35 activities and 8 exchange listings
    evalResults.ts           20 explicitly invented evaluation fixtures
  lib/
    centers.ts               Type metadata, haversine distance, opening hours, directions
    activity.ts              Monday-based weekly activity grouping
    imagenetMap.ts           ImageNet keyword-to-category mapping
    classificationLog.ts     Local classification runs and confirmations
    useModal.ts              Dialog focus containment, Escape, and focus restoration
    demo.ts                  Tour destinations, record matching, action gates
    evaluation.ts            Accuracy, low-confidence, and override calculations
    useClassificationLog.ts  Live confirmation-log subscription
  pages/                     Seven route pages
  store/
    useStore.ts              Persisted Zustand state and actions
    selectors.ts             Pure activity metrics and chart transforms
  vite-env.d.ts              Vite asset import declarations
scripts/test.mjs             Bundles and executes the TypeScript domain test suite
tests/domain.test.ts        Domain/store integration assertions
```

## Finished pages and routes

| Route        | Page           | Implemented behavior                                                                                                                                                                                                                                                                       |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`          | Home           | Responsive hero, live counters, three-step introduction, CTAs, and Start demo entry.                                                                                                                                                                                                       |
| `/classify`  | Classify       | Photo upload/camera, lazy MobileNet, top-three predictions, confidence notice, category confirmation/override, catalog search, item route ticket.                                                                                                                                          |
| `/centers`   | Find Centers   | Category chips and URL preselection, type and Open now filters, distance sorting, geolocation fallback, synchronized list/map, colored Lucide markers, selected lime ring, Google Maps directions, collected drop-off logging. Mobile puts the map above the list with a show/hide toggle. |
| `/activity`  | My Activity    | Items logged/diverted kg/pending counts, status chips, route filter, weekly timeline, center attribution, status progression, validated manual logging, empty-state CTA.                                                                                                                   |
| `/exchange`  | Reuse Exchange | Live journey counts, category/condition/availability/search filters, synthetic names, relative times, validated URL-prefilled listing and display-name request dialogs, handover confirmation and weight toast, completed-card ribbon.                                                     |
| `/dashboard` | Impact         | Four animated lime-highlighted metrics, full-width colored and labeled category-to-route Sankey, eight-week stacked bars, category share donut, 70% diversion goal, reuse count/link, five recent completed wins, and demo reset.                                                          |
| `/about`     | AI & Ethics    | Styled workflow diagram, method/data and no-training disclosure, placeholder evaluation metrics/category bars/failures, live override rate, six responsible-AI cards, SDG alignment, implemented/planned roadmap, and demo-reset confirmation.                                             |

Impact and Reuse Exchange have now been extended from their existing prototypes. All pages remain browser-local demos; `/about` and seeded demo/reset behavior were already present.

## Guided demo, AI & Ethics, and polish — 24 October 2026

- The five-step tour starts from Home: manual catalog search prefilled with **old phone** → its **E-waste / Special care** Route Card → selected accepting fictional center → prefilled **0.18 kg** drop-off form → live Impact. No photo classification is simulated, and the tour does not add data until a form is actually submitted.
- The slim sticky top banner shows step numbers, instructions, Next, and Exit demo. Saving the real drop-off unlocks Next. Impact compares the actual diversion rate with the tour baseline, displays two decimals during the tour, and pulses only changed metric cards/numbers in lime. The ordinary selectors and Sankey consume the newly saved collected activity.
- The optional three-step branch prefills **working study lamp**, E-waste, good condition, and quantity 1 in Exchange. The user supplies the neighbourhood, publishes, requests the highlighted listing with a nickname, and confirms handover. Each stage is gated on the actual listing status. See impact returns to the dashboard; its completed reuse activity follows the existing category-based weight estimate (0.18 kg for this lamp).
- Tour state is separate from domain data, in sessionStorage under `srijan-guided-demo-v1`. It records start time, baseline metrics, and generated activity/listing IDs; malformed sessions are ignored. Refresh resumes the tour, navigation away offers Return to step, canceled forms offer Open drop-off/Open listing, and missing records offer Restart demo. Exit retains saved actions. Restart does not reset activities/listings; repeated runs can create further actions.
- Classify accepts `?q=` and `?item=` for catalog prefilling. Centers now accepts validated `itemId`, positive `weightKg`, accepting `centerId`, and `dropoff=1` query parameters while preserving the existing navigation-state handoff. Exchange accepts `?focus=<listingId>` to highlight and scroll to a listing. The `demo` query parameter identifies the active tour step.
- AI & Ethics now contains all six requested sections. Its architecture diagram uses styled, numbered boxes and arrows; manual input is explicitly described as bypassing the model/mapping stages. Method/data copy identifies pretrained MobileNet v2/ImageNet, our keyword rules, the 42-item catalog, synthetic records, and the fact that no custom model or fine-tuning was performed.
- `src/data/evalResults.ts` contains **20 invented fixtures**, not real photos or inference outputs. `EVALUATION_IS_PLACEHOLDER` remains true. Replace every row with independently labelled results before changing that flag. Current fixture-only metrics are 14/20 correct (70%), 7/20 below 45% confidence (35%), and six amber mismatch cards with reasons. Category bars group by expected category and show sample counts. Empty sample metrics use null/em dashes.
- Low-confidence share is labelled manual review, not successful intervention. Below 45% confidence and unmapped labels require category review; every photo prediction requires confirmation. The dataset has no confirmed-category field or override outcomes. Live override rate is calculated separately from confirmed photo logs: changed/unmapped prediction divided by total confirmed photo runs. User confirmation is not independently verified accuracy.
- Classification log reads now validate shape, categories, confidence, and timestamps. Corrupt/non-array storage is safe. Writes notify subscribers and return failure safely; Classify reports unavailable storage through a toast. The About view responds to same-tab confirmation events, cross-tab storage events, and window focus. Catalog/manual-without-inference choices and guided actions do not create new photo-log entries.
- Added route titles (`Page | Srijan`), a local SVG favicon, short page-entry transitions, labelled route-loading state, a route error boundary with reload/home recovery, stronger secondary-text contrast, keyboard arrow/Home/End navigation for classification tabs, and associated tab panels. Motion still respects reduced-motion settings. Existing empty/error/form states remain available throughout the app.
- Rewrote README with setup, features, guided-demo instructions, architecture, evaluation replacement guidance, implemented/planned scope, and privacy/estimate limitations. The fixed `src/data/types.ts`, domain store, and selectors remain unchanged.

### Verification for this continuation

- `npm test`: passed, including fixture accuracy/category/low-confidence calculations, zero-sample behavior, override rates, corrupt-log handling, tour query parameters, action gates, valid-center matching, session validation, and the existing domain/store tests.
- `npm run build`: passed strict TypeScript and production bundling; only the existing large lazy TensorFlow bundle advisory remains.
- Browser-tested the full five-step phone tour and three-step lamp branch with real local form submissions. Phone diversion changed 98.59% → 98.60%, all four changed metrics acquired pulse classes, and the new drop-off appeared in Impact. The lamp handover created one 0.18 kg completed reuse activity, updated the dashboard, and appeared in Recent wins. Refresh during the branch retained its step and target listing; Exit removed the banner.
- Browser-tested live override updates using a temporary local fixture: two changed/unmapped predictions among three synthetic confirmation rows produced 67% live override rate. Malformed storage safely returned the empty-log state. The original classification log was restored and the fixture removed.
- All seven routes were checked at **375px and 1280px** with no horizontal overflow and correct page titles. Visual checks covered the desktop workflow diagram, mobile About/stepper, and mobile prefilled drop-off form. Classification keyboard tabs, dialog Shift+Tab containment/Escape, form reopening, and Exit passed. Browser logs contained no errors or warnings during these checks.

## Impact and Reuse Exchange continuation — 24 October 2026

- Preserved Srijan naming, forest/mint/lime theme, Fraunces/Inter typography, shared UI primitives, modal focus handling, Zustand store, selectors, and the fixed domain types. `src/data/types.ts`, store actions, and selector implementations are unchanged.
- Impact's four `StatNumber` cards show diversion rate, landfill avoided, indicative CO₂e saved, and items rerouted in that order. Lime-highlighted numbers count up over 650 ms, cancel animation on unmount, and respect reduced motion. Screen readers receive final numbers. The CO₂e info tooltip reads **estimated using approximate factors** and works on keyboard focus.
- The signature “Where our waste goes” Recharts Sankey consumes `sankeyData`. Node and flow colors come from category/route constants. Inline labels and native weight tooltips are supplemented by an expandable text list of every flow. The page compacts only disconnected presentation nodes and remaps links so sparse data renders correctly; the selector contract is unchanged.
- Supporting Impact cards use `weeklySeries` for the last eight weeks of stacked route kg and `categoryBreakdown` for a category share donut, alongside a mint/emerald 70% goal, `handoverCount` and Exchange link, and the five most recent completed activities. Handover-generated activities appear once in Recent wins. Footer ghost reset calls `resetDemo()` and shows a toast.
- Exchange's Journey strip counts listings currently available (Listed), requested, and handed over. Counts are global and do not change when board filters change. Category chips, condition, Available only, and case-insensitive item/area/note/category search combine; no-match results offer Clear filters.
- Listing cards show category and condition badges (mint, amber, grey), quantity, area, synthetic poster name, relative posting time, and `StatusPill`. Available cards open a display-name-only request dialog. Requested cards name the requester and offer Confirm handover. Completed cards are muted with a lime “Given a second life” ribbon.
- Listing dialogs open from the header or `?new=1&title=...&category=...`, including query changes while Exchange is mounted. Invalid categories fall back to Textile; long titles are capped at 100 characters. Closing consumes only the creation query parameters. Normal header opening starts a fresh form.
- Listing forms collect title, category, condition, integer quantity 1–999, neighbourhood, and optional note. Required text is trimmed and whitespace-only submissions are rejected. Poster identity is the synthetic **Asha (demo)**, so the listing form needs no identity fields. Requests also reject whitespace-only display names. Neither form collects photos, phone numbers, or email addresses. Both show: “Coordinate handover through the platform; never share personal contact details here.” There is still no messaging backend; requests/handovers stay local.
- Handover confirmations use the existing `markHandedOver` action. The toast reports the weight of its newly created completed activity (up to three decimals), keeping dashboard and toast estimates consistent without a second weight calculation.
- Seed poster/requester names are explicitly synthetic. Existing persisted listings keep their prior names until Reset demo data is used.
- Fixed the existing Windows test-runner ESM import by converting the temporary bundle path with `pathToFileURL`.

## Data contract summary

`src/data/types.ts` is the authoritative contract. Do not change it for later feature work.

- `Category`: plastic, paper, glass, metal, organic, ewaste, textile, hazardous, residual.
- `Route`: recycle, reuse, repair, compost, special, dispose.
- `CatalogItem`: id/name, category/route, why/tip, average weight in kg, keyword list.
- `Center`: id/name, coordinates/address, hours text, numeric opening interval, facility type, accepted categories.
- `Activity`: id/ISO date, item name, category/route, kg weight, pending/collected/completed status, optional centerId.
- `Listing`: id/title/category, condition, quantity, area, display name, optional note/requester, availability status, creation date.

No new domain fields were added. Route-card navigation carries `itemId` and `weightKg` in React Router navigation state; `?category=` remains the shareable category filter. A direct visit can log an item manually. A center drop-off records `status: 'collected'` and the selected center's ID. Generic activity logging starts pending.

## Store and persistence

`useStore` persists `{ activities, listings }` in localStorage under `srijan-store-v1`.

| Action                             | Description                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `addActivity(activity)`            | Adds an activity with generated ID and current ISO timestamp.                                             |
| `updateActivityStatus(id, status)` | Changes the matching activity's status; UI advances pending → collected → completed.                      |
| `addListing(listing)`              | Creates a locally available exchange listing with generated ID/date.                                      |
| `requestListing(id, name)`         | Requests an available listing and records a display name.                                                 |
| `markHandedOver(id)`               | Completes a requested handover and adds one completed reuse activity; repeated calls cannot duplicate it. |
| `resetDemo()`                      | Restores seeded activities/listings; retains classification logs.                                         |

Forms trim names, reject empty item names and nonpositive/nonfinite weights, and restrict optional centers to ones accepting the selected category. Drop-off categories are limited to that center's accepts list. Store actions remain unchanged and assume their caller supplies valid domain values.

## Available selectors

Every selector accepts `Activity[]` and lives in `src/store/selectors.ts`.

| Selector            | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `totals`            | Total logged item count and kg.                            |
| `diversionRate`     | Non-disposal kg divided by all logged kg, zero-safe.       |
| `landfillAvoidedKg` | Sum of logged kg whose route is not dispose.               |
| `co2eSavedKg`       | Non-disposal kg multiplied by indicative category factors. |
| `itemsRerouted`     | Number of activities with a non-disposal route.            |
| `handoverCount`     | Count of completed reuse activities.                       |
| `weeklySeries`      | Last eight Monday-based weeks, kg per route.               |
| `routeBreakdown`    | Route-level kg, labels, and colors.                        |
| `categoryBreakdown` | Category-level kg, labels, and colors.                     |
| `sankeyData`        | Category/route nodes and positive kg links.                |

All statuses, including pending, contribute to logged impact estimates. `groupActivitiesByWeek` in `src/lib/activity.ts` provides chronological Monday-based timeline groups without altering selectors. Opening hours are interpreted in the centers' Bengaluru timezone (`Asia/Kolkata`), refreshed each minute; opening is inclusive, closing exclusive. Overnight intervals are supported, and equal endpoints represent 24-hour opening. Geolocation failure resets distance origin to `CITY_CENTER`.

## Reusable UI

- `Button`: primary, secondary, accent, and disabled variants.
- `Card`: white bordered rounded surface.
- `Badge`: lime accent label.
- `StatNumber`: Fraunces numeral, optional unit/icon, descriptive label.
- `Highlight`: reusable lime heading underline.
- `PageHeader`: eyebrow, heading, description, optional action.
- `EmptyState`: icon/title/description; pages compose their own CTAs.
- `StatusPill`: status-dependent color and dot.
- `Toast` / `useToast`: accessible success notification provider/hook.
- `RouteCard`: ticket-style routing guidance, weight input, logging, center/exchange CTAs.
- `ActivityModal`: validated manual activity form or center drop-off form.
- `CenterMap`: typed facility markers, popups, selection focus, OSM attribution, bundled default marker asset fix.
- `useModal`: keyboard focus containment/restoration and Escape dismissal.

Theme remains forest/mint/lime with Fraunces headings and Inter body text. Desktop uses a fixed sidebar; mobile uses a bottom navigation bar.

## Manual acceptance checks

1. Open Classify → Pick an item → search PET bottle → select PET bottle.
2. Adjust weight, then Find nearest center. Verify `?category=plastic`, its banner, and the active Plastic chip.
3. Select a center card: map pans, popup opens, marker enlarges with a lime ring. Select a different marker: matching card highlights and scrolls into view. Reselect a card after closing the popup to reopen it.
4. Open Log a drop-off: item, category, route, and weight carry forward. Clear the name or use weight 0: submission must display a validation error and add no activity. Correct them and save.
5. Open My Activity → Collected: the new record appears in This week, with center name and selected weight. Refresh: it remains. Mark completed and verify the status/check and Completed filter.
6. Open Log activity: submit a new item with an optional accepting center; verify it starts pending. Advance it to collected, then completed. Combine status/route filters and clear them again.
7. In Centers, combine category/type/Open now filters. Residual has no seeded accepting facility and shows the Reuse Exchange empty state. Invalid category query strings fall back to All materials.
8. Test Use my location with permission allowed and denied. Check distances and fallback message. Opening status follows IST, regardless of browser timezone.
9. Test Directions link destinations without needing to navigate to fictional facilities.
10. At 390px width verify map above list, show/hide map, correct map repaint when reopened, timeline legibility, and bottom tabs. Use Tab/Shift+Tab and Escape in forms; check visible focus.
11. Open `/exchange?new=1&title=Cotton%20blankets&category=textile`: verify the listing dialog opens with title/category prefilled. Reject whitespace-only title/area and a zero/fractional quantity; publish with a valid neighbourhood and quantity. Verify the synthetic poster name and relative time.
12. Combine Textile, Good, Available only, and a title/area search. Request an available item with a nickname (reject spaces). Uncheck Available only to see its requested state and requester. Confirm handover: verify weight toast, journey count changes, muted card, and lime ribbon.
13. Compare Impact before and after the handover: avoided kg, CO₂e, items rerouted, category/weekly charts, reuse count, Recent wins, and category → Reuse Sankey weight must update. Refresh to verify persistence. The rounded diversion percentage may stay the same for a small handover.
14. At 390px and 320px, check both pages for horizontal overflow, readable flow labels, wrapped filters, single-column listing cards, and usable dialogs. Keyboard-focus the CO₂e tooltip; test Shift+Tab containment and Escape/focus restoration in both dialogs.
15. Use Impact's Reset demo data: verify the seeded totals and journey counts (5 listed, 2 requested, 1 handed over) return. Classification logs should remain.

Automated tests cover distance/opening-hour boundaries (including overnight), IST conversion, directions URL generation, weekly grouping/order, collected center-linked persistence, and status changes, plus the existing catalog/store/classification tests.

## Known limitations / TODOs

- All facilities, addresses, starter activities, and listings are fictional. Replace and verify city data before real use. No availability, holidays, capacity, or facility verification service exists.
- Directions intentionally open Google Maps coordinates. Distances are straight-line haversine distances, not driving distances or travel times.
- The `openHours` contract describes a daily interval only; weekly closures and holiday exceptions cannot be represented without an explicitly approved future contract change.
- Route suggestions and category acceptance are educational guidance. A center's acceptance of a material does not establish that every item or every processing route is supported.
- Impact includes pending intentions, and CO₂e factors are indicative approximations, not certified savings.
- Reuse handover weight is estimated from the first catalog entry in the category times quantity.
- No activity edit/delete, export, undo, deduplication between separately logged pending and collected records, or background pickup integration is implemented. Logging a route-card item and later independently logging a drop-off creates two activities; this continuation does not silently reconcile them.
- Browser-local storage can be cleared by the user; no account, backup, server validation, or multi-device synchronization exists.
- TensorFlow.js has large lazy-loaded chunks; Vite emits bundle-size advisories. First inference depends on network/model download. A 45-second model-load timeout offers retry/manual fallback. Model agreement is user-confirmation agreement, not independently measured accuracy.
- Map tiles and Google Fonts depend on third-party network access. OSM attribution is retained. No offline maps or tile cache is built.
- Timeline week boundaries use the browser's local timezone. Centers use explicit IST for opening times.

## What is NOT built yet

The requested `/dashboard`, `/exchange`, demo mode, and `/about` are **already present as local demo features**. Their production counterparts are not built:

| Area           | Still not built                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`   | Verified lifecycle/carbon accounting, server analytics, downloadable reports, historical account data.                                                            |
| `/exchange`    | Real shared marketplace, accounts, ownership enforcement, messages, notifications, moderation, server-backed requests/handovers.                                  |
| Demo mode      | Isolated production/demo datasets and server-side demo accounts. A guided browser-local phone/lamp tour, synthetic defaults, and Reset demo are now implemented.  |
| `/about`       | Independently labeled evaluation dataset, audited accuracy/bias reporting, centralized evaluation telemetry. Local confirmation statistics already exist.         |
| Across the app | Backend/API/database, authentication, real pickup scheduling, real facility directory, deployment/production hosting configuration, automated browser E2E runner. |

## Verification for Impact / Exchange continuation

- `npm test`: passed on Windows, including new store-to-selector handover integration assertions for kg, CO₂e, diversion, rerouted items, reuse count, Sankey link weight, category weight, and current-week reuse weight; existing duplicate protection and persistence checks still pass.
- `npm run build`: passed strict TypeScript and production bundling. Existing large lazy TensorFlow chunks still trigger Vite's bundle-size advisory.
- Browser-tested URL-prefilled creation, whitespace validation in both dialogs, combined category/condition/availability/search filters, no-match state, request → handover transitions, requester attribution, weight toast, ribbon, and journey updates.
- Browser end-to-end example: a two-item textile handover created one 0.4 kg completed reuse activity. Landfill avoided changed 28.0 → 28.4 kg, indicative CO₂e 54.8 → 56.3 kg, items rerouted 32 → 33, reuse count 2 → 3, and Textile → Reuse flow 2.44 → 2.84 kg. Recent wins showed the handover; refresh retained it.
- Browser-tested empty activities/listings and a single Glass → Reuse flow using temporary local fixtures. Zero metrics, chart empty states, zero journey counts, sparse Sankey labels, and reset all worked. Fixtures were removed and the browser was restored to seeded demo data.
- Visual checks at desktop, 390px, and 320px passed. Both pages had no horizontal overflow. Verified keyboard-focus tooltip, dialog Shift+Tab containment, Escape dismissal, and trigger focus restoration. Viewport overrides were cleared after testing.

## Verification for earlier Centers / Activity continuation

- `npm test`: passed, including new center/time/week/drop-off assertions.
- `npm run build`: passed; only the existing lazy TensorFlow bundle-size advisory remains.
- Browser flow passed: Classify → PET bottle route card → category-preselected Centers → prefilled drop-off → My Activity, with center/weight/status intact after refresh → completed.
- Browser checks passed for manual activity validation and pending-to-collected progression, combined status/route filters, category/type/Open now filtering, empty state, card-to-popup selection, marker-to-card selection (including Enter), mobile map show/hide, dialog Escape dismissal, and mobile horizontal-overflow checks.
- No browser console errors or warnings were captured during these checks. Geolocation permission outcomes and camera hardware are left in the manual acceptance checklist; neither was spoofed during this continuation.
