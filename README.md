# Srijan

Every item gets a second route.

Srijan (called ReRoute in earlier briefs) is a responsive, browser-local circular-living demo built with Vite, React, and TypeScript. It helps people identify an item, confirm its material, choose a route, find an illustrative center, and track or share it.

## Run locally

Use Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173`. Vite selects another port if that port is occupied.

```sh
npm test          # Domain, store, evaluation, and guided-demo checks
npm run build    # Strict TypeScript check and production bundle
npm run preview  # Serve the production build locally
npm run format   # Format source and documentation
```

The first photo classification downloads MobileNet. Google Fonts and OpenStreetMap tiles also require network access. Camera and location features require permission and a secure context; localhost works. Production hosting must serve `index.html` for client-side routes. Large lazy TensorFlow chunks produce a Vite bundle-size advisory; the build still succeeds.

## Features

- Photo upload/camera with browser-side MobileNet v2 and TensorFlow.js, top-three labels, confidence scores, rule-based label mapping, mandatory category confirmation, and manual overrides.
- Manual search and category selection across a 42-item catalog, with Route Cards explaining the route, reason, handling tip, and estimated weight.
- A map and directory of 14 fictional Bengaluru-area centers, accepted-material/type/opening filters, distance sorting, optional geolocation, and validated collected drop-off logging.
- Persistent local activity tracking, status progression, and weekly timelines.
- Reuse Exchange with combined material/condition/availability/search filters, local listings and requests, confirmed handovers, and privacy-focused forms.
- Impact dashboard with count-up statistics, colored category-to-route Sankey, weekly stacked bars, category share donut, diversion goal, reuse counts, recent wins, and demo reset.
- Guided five-step phone journey plus a three-step lamp reuse branch, with real local actions, progress gates, refresh recovery, Exit demo, and lime pulses on changed Impact statistics.
- AI & Ethics page with a workflow diagram, method/data disclosure, evaluation interface, live local override rate, responsible-AI cards, SDG 11/12/13 alignment, and an explicit roadmap.
- Responsive sidebar/bottom navigation, keyboard focus, dialog focus containment, reduced-motion support, page transitions, route loading/error recovery, favicon, and per-page titles.

## Guided demo

1. Choose **Start demo** on Home. Classify opens with **old phone** prefilled in manual catalog search.
2. Choose **Next** to reveal its **E-waste / Special care** Route Card. This is a catalog example, not simulated photo inference.
3. Choose **Next** to select an illustrative center accepting e-waste.
4. Choose **Next** to open a prefilled 0.18 kg drop-off. Review the form and choose **Save drop-off**. Next is disabled until a matching collected activity exists.
5. Continue to Impact. The updated diversion percentage uses two decimals during the tour, the Sankey includes the new Special care flow, and changed metric cards pulse in lime.
6. Choose **Try reuse branch**, add a neighbourhood to the prefilled **working study lamp** listing, and publish it locally. Continue, request the highlighted lamp with a nickname, then confirm its handover. **See impact** returns to the updated reuse flow.

The tour resumes within the same browser tab after refresh using sessionStorage. Navigation away offers **Return to step**. **Exit demo** removes the banner and retains any actions you saved. Restarting a tour adds no data by itself and does not reset earlier records. Reset demo restores starter activities/listings while retaining classification logs; it does not create an isolated production/demo dataset.

## Architecture

```text
Photo -> MobileNet (in-browser) -> object label -> keyword/category rules
                                                      |
Manual category/catalog selection --------------------+
                                                      v
User confirmation -> exact catalog item -> Route Card
                                             |
                         Activity / center drop-off / Exchange handover
                                             |
                            persisted Zustand activities + listings
                                             |
                                  pure selectors -> Impact charts
```

- `src/data/types.ts`: fixed domain contract; unchanged by this continuation.
- `src/data/catalog.ts`, `centers.ts`, `seed.ts`: synthetic demo content.
- `src/pages/Classify.tsx`, `src/lib/imagenetMap.ts`: lazy photo inference and explicit mapping rules.
- `src/store/useStore.ts`: existing activity/listing actions, persisted under `srijan-store-v1`. A handover creates exactly one completed reuse activity.
- `src/store/selectors.ts`: pure totals, diversion, carbon estimates, weekly series, and chart transformations. All logged statuses contribute to impact estimates.
- `src/lib/demo.ts`, `src/components/GuidedDemo.tsx`: tour destinations, action gates, baseline metrics, and separate tab-local tour state.
- `src/data/evalResults.ts`, `src/lib/evaluation.ts`: measured benchmark results and zero-safe accuracy/override calculations.
- `src/lib/classificationLog.ts`, `useClassificationLog.ts`: validated browser-local photo confirmation logs and live update notifications.
- `src/components/ui`, `useModal.ts`, `PageBoundary.tsx`: shared theme primitives, modal keyboard handling, and page error recovery.

There is no backend, authentication, shared marketplace, or server-side photo processing.

## Evaluation: 99 real labelled photographs

99 unchanged, source-labelled RealWaste photos are bundled in `public/evaluation/photos` (~14 MB). Labels come from the dataset authors, not model predictions or our independent annotation. A fixed SHA-256 ordering of source paths selects 14 per represented category plus one plastic photo before inference; duplicate bytes are excluded. Seven categories are represented. **E-waste and hazardous waste are untested.** Paper combines paper/cardboard; organic combines food/vegetation.

AI & Ethics shows measured scores, failure reasons, a gallery of every photo with expected category and raw top-three labels, plus downloadable JSON results and attribution. The old invented 20-row fixture has been removed.

Reproduce from the repository root (Python 3 and Node 22):

```sh
python scripts/prepare-evaluation.py # Initial download ~657 MB, ignored cache
npm run evaluate                  # Official MobileNet weights; real inference on all 99
npm test
npm run build
```

The runner uses MobileNet v2 alpha 1.0 / 224 px, TensorFlow.js CPU and sharp RGB decoding. It writes `src/data/evaluationReport.json` and `public/evaluation/report.json`; the app reads these through `evalResults.ts`. The manifest records source paths, labels and SHA-256 hashes. Browser WebGL results may vary slightly. The frozen old mapper allows comparison on exactly the same raw outputs. This small public benchmark is diagnostic, not independent validation or proof of local accuracy. No thresholds were fitted to its results. See `public/evaluation/ATTRIBUTION.md` for citations, category mappings and the UCI/upstream licensing discrepancy.

Overall accuracy counts abstentions as unsuccessful. Suggestion accuracy excludes abstentions; coverage is the fraction receiving suggestions. Per-category bars include sample counts and mark untested categories. Scores below 45%, unmapped/ambiguous labels, or conflicting mapped categories within 15 percentage points require explicit manual selection with no preselected category. Generic bottle, water bottle, bucket, packet and mouse labels no longer assume material/type. These thresholds are fixed heuristics, not calibrated probabilities. Every suggestion still requires confirmation. No human corrections are counted as model successes.

Live override rate is separate: changed or unmapped predicted categories divided by confirmed photo runs in this browser's classificationLog. Manual catalog choices and guided-demo actions are excluded. An empty log displays an em dash, not 0% accuracy. The view updates for same-tab confirmations, cross-tab storage changes, and window focus. User confirmation is not independently verified ground truth.

We use pretrained MobileNet weights trained on ImageNet. We **did not train or fine-tune** a waste classifier, MobileNet, or a carbon model. Object appearance cannot establish material composition, toxicity, or a facility's acceptance rules.

## Measured results

Measured on 25 October 2026: the previous mapper made 15 correct and 16 wrong suggestions (31/99 coverage, 48.4% suggestion accuracy). The conservative policy made 2 correct and 6 wrong suggestions (8/99 coverage, 25% suggestion accuracy), requiring manual selection on 91 photos. Overall accuracy including abstentions is 2/99 (2.0%); 68/99 have low confidence. Fewer wrong guesses come from abstaining more, **not improved suggestion accuracy**. These results expose the pretrained object model's limitations on landfill waste.

Photo inference decodes at natural dimensions into an offscreen canvas, so responsive preview sizes do not alter the model input. The runner also uses original image dimensions before MobileNet's own resize.

## Implemented vs planned

| Implemented locally                            | Planned / not implemented                                     |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Browser classification and manual confirmation | Custom-trained waste model and independent local validation   |
| Catalog lookup and Route Cards                 | Verified municipal/facility data                              |
| Illustrative center directory and map          | Real pickup scheduling                                        |
| Activity and collected drop-off tracking       | User accounts, authentication, moderation, and shared records |
| Live Impact dashboard and local Reuse Exchange | Multilingual UI and broader accessibility validation          |
| Guided phone/drop-off and lamp/handover demo   | Production analytics and verified lifecycle/carbon accounting |

## Privacy and estimation boundaries

Photos never leave the device and are never persisted. Model weights, fonts, and map tiles make separate third-party network requests. Local activity, listing, and confirmation data can be cleared with browser storage; there is no backup or multi-device sync. Exchange forms have no photo upload, phone, or email fields. Requests and handovers do not contact other people.

All starter activities, listings, names, addresses and center locations are synthetic. Benchmark photos are real source-labelled images. Center distances are straight-line estimates; opening hours use Asia/Kolkata. Verify real facilities before travelling. Carbon factors are approximate educational values, not verified offsets; pending intentions count toward logged estimates. Reuse weights use the first catalog entry in the category times quantity, so the demo lamp's estimated handover weight is 0.18 kg.

SDG 11, 12, and 13 describe the project's intended alignment, not measured outcomes or UN endorsement. See `HANDOVER.md` for detailed contracts, acceptance checks, and remaining limitations.
