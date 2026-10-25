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

The first photo classification downloads the static model artifacts from the app’s own host; prediction runs locally. Google Fonts and OpenStreetMap tiles also require network access. Camera and location features require permission and a secure context; localhost works. Production hosting must serve `index.html` for client-side routes. Large lazy TensorFlow chunks produce a Vite bundle-size advisory; the build still succeeds.

## Features

- Photo upload/camera with a trained nine-material head on frozen MobileNet v2 features, optional crop/zoom/position controls, validation-selected review thresholds, mandatory confirmation, and manual overrides. Inference stays in the browser.
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
Photo -> frozen MobileNet features -> trained material head -> review policy
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
- `src/pages/Classify.tsx`, `src/lib/wasteClassifier.ts`, `src/lib/wastePolicy.ts`: lazy trained inference and validation-selected review policy. The old ImageNet mapper remains for historical comparisons.
- `src/store/useStore.ts`: existing activity/listing actions, persisted under `srijan-store-v1`. A handover creates exactly one completed reuse activity.
- `src/store/selectors.ts`: pure totals, diversion, carbon estimates, weekly series, and chart transformations. All logged statuses contribute to impact estimates.
- `src/lib/demo.ts`, `src/components/GuidedDemo.tsx`: tour destinations, action gates, baseline metrics, and separate tab-local tour state.
- `src/data/evalResults.ts`, `src/lib/evaluation.ts`: measured benchmark results and zero-safe accuracy/override calculations.
- `src/lib/classificationLog.ts`, `useClassificationLog.ts`: validated browser-local photo confirmation logs and live update notifications.
- `src/components/ui`, `useModal.ts`, `PageBoundary.tsx`: shared theme primitives, modal keyboard handling, and page error recovery.

There is no backend, authentication, shared marketplace, or server-side photo processing.

## Trained photo model and measured evaluation

`waste-v1` uses the **unchanged MobileNet v2 alpha 1.0 / 224 pretrained feature extractor** plus a new trained head: 1280 → Dense 128/ReLU → training-only dropout 0.3 → Dense 9. We trained the head, not the backbone or a carbon model. All nine existing app categories are supported. Hazardous examples cover batteries only; other hazards are not validated.

Sources are RealWaste (UCI, DOI 10.24432/C5SS4G) and the Custom Bangladeshi E-Waste dataset (Mendeley Data V1, DOI 10.17632/77383kmdnw.1). The latter archive has source-authored augmentation variants and YOLO segmentation labels. We retain single-source-class images, map their labels to app categories, and omit mixed-class, Medical_Waste and Light_Bulb images. Full citations, label mappings, licences and limitations are in `public/models/waste-v1/README.md`. The UCI/upstream RealWaste licensing discrepancy remains disclosed in the existing attribution file.

The fixed split contains **4,031 training images, 674 validation images, 818 held-out test images and 99 separately reserved benchmark photos**. Training counts include source-authored augmentation variants. Grouping uses byte hashes, original augmentation filenames and perceptual dHash distance ≤4. Related images stay in one split; conflicting labels are excluded. E-waste source partitions are preserved; RealWaste uses deterministic SHA-256 group buckets. Validation/test contain one representative per group. Physical-object identity metadata is unavailable, so heuristic grouping cannot rule out every leak.

Training uses class-balanced loss, Adam 0.0005, batch 64, training-only horizontal flips, L2 regularization and dropout. Early stopping selects the best validation-loss epoch. Validation alone chooses temperature and review thresholds; the test set and original 99 photos do not choose model weights or policy. Auditable manifests, held-out predictions, confusion matrices, optimization history and artifact hashes ship alongside the model.

| Measured set                               | Top-1 material accuracy | Accepted-suggestion accuracy | Suggestion coverage |
| ------------------------------------------ | ----------------------- | ---------------------------- | ------------------- |
| 818-image held-out test, all nine classes  | 691/818 **84.5%**       | 689/810 **85.1%**            | 810/818 **99.0%**   |
| Original 99-photo benchmark, seven classes | 86/99 **86.9%**         | 86/99 **86.9%**              | 99/99 **100%**      |

Top-1 accuracy measures the highest-scoring class before review. Accepted-suggestion accuracy excludes abstentions; coverage records how often a suggestion is offered. The validation-selected policy is score ≥35%, no additional margin cutoff, temperature 1.7. Every suggestion still needs human confirmation. Scores do not establish composition, toxicity, contamination or disposal eligibility. These are **same-source public dataset results, not independent local/field accuracy**; the hazardous holdout contains just 17 battery photos. The old 99-photo rule-based results are archived in `public/evaluation/legacy-report.json`.

All 99 photos were also evaluated using the exact application inference function in TensorFlow.js CPU: 86/99 correct, with all 99 top-1 predictions matching native TensorFlow and maximum score difference 0.000022. Browser WebGL/decoding can vary slightly. The AI & Ethics page shows the fresh holdout, per-class precision/recall, original benchmark failures, photo gallery and separate live local override rate. Existing confirmation logs can include earlier model versions; user agreement is not ground truth.

### Reproduce training

Use Node 22 and Python 3.12. The regular app needs only `npm ci`; Python/TensorFlow are training dependencies. Example PowerShell commands from the repository root:

```powershell
py -3.12 -m venv .evaluation-cache/train-env
.\.evaluation-cache\train-env\Scripts\python.exe -m pip install -r scripts/requirements-training.txt
.\.evaluation-cache\train-env\Scripts\python.exe scripts/download-training-data.py
npm run train:prepare-model
.\.evaluation-cache\train-env\Scripts\python.exe scripts/prepare-training.py
.\.evaluation-cache\train-env\Scripts\python.exe scripts/train-waste.py
npm run evaluate
npm test
npm run build
```

On macOS/Linux, use Python 3.12's `venv` and substitute `.evaluation-cache/train-env/bin/python`. Dataset archives initially download ~730 MB; feature extraction/training runs on the CPU and uses an ignored cache. The original MobileNet graph is downloaded during preparation, then hosted with the app. Training exports the head as four float32 tensors plus metadata for TensorFlow.js. Native features use the same graph/weights and RGB → [0,1] → bilinear resize with `alignCorners=true`; natural image dimensions prevent responsive layouts from changing inputs. CPU/platform differences can prevent bit-for-bit training reproducibility.

`npm run evaluate` independently re-runs the deployed model on all 99 photos and checks native/JS agreement; it saves a full-run verification report beside the model and in the ignored cache. A smoke subset writes only to the cache. `npm run evaluate:legacy` checks the former ImageNet mapper without overwriting published current reports. Training scripts regenerate reports and model metadata; do not hand-edit scores. No hosted prediction API, API key or production training server is required.

## Implemented vs planned

| Implemented locally                            | Planned / not implemented                                     |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Browser classification and manual confirmation | Broader local training and independent field validation       |
| Catalog lookup and Route Cards                 | Verified municipal/facility data                              |
| Illustrative center directory and map          | Real pickup scheduling                                        |
| Activity and collected drop-off tracking       | User accounts, authentication, moderation, and shared records |
| Live Impact dashboard and local Reuse Exchange | Multilingual UI and broader accessibility validation          |
| Guided phone/drop-off and lamp/handover demo   | Production analytics and verified lifecycle/carbon accounting |

## Privacy and estimation boundaries

Photos never leave the device and are never persisted. Model artifacts load from the app’s own host; fonts and map tiles make separate third-party requests. Local activity, listing, and confirmation data can be cleared with browser storage; there is no backup or multi-device sync. Exchange forms have no photo upload, phone, or email fields. Requests and handovers do not contact other people.

All starter activities, listings, names, addresses and center locations are synthetic. Benchmark photos are real source-labelled images. Center distances are straight-line estimates; opening hours use Asia/Kolkata. Verify real facilities before travelling. Carbon factors are approximate educational values, not verified offsets; pending intentions count toward logged estimates. Reuse weights use the first catalog entry in the category times quantity, so the demo lamp's estimated handover weight is 0.18 kg.

SDG 11, 12, and 13 describe the project's intended alignment, not measured outcomes or UN endorsement. See `HANDOVER.md` for detailed contracts, acceptance checks, and remaining limitations.
