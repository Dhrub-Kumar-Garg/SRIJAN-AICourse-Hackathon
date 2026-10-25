import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import * as tf from "@tensorflow/tfjs";
import mobilenet from "@tensorflow-models/mobilenet";

// npm install supplies sharp as a dev dependency. No photographs are uploaded.
const require = createRequire(import.meta.url);
const sharp = process.env.SRIJAN_SHARP_PATH
  ? require(process.env.SRIJAN_SHARP_PATH)
  : require("sharp");
await mkdir(".evaluation-cache", { recursive: true });
await build({
  entryPoints: ["src/lib/predictionPolicy.ts"],
  outfile: ".evaluation-cache/policy.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
await build({
  entryPoints: ["scripts/baseline-imagenet-map.ts"],
  outfile: ".evaluation-cache/baseline.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { assessPredictions } = await import(
  pathToFileURL(`${process.cwd()}/.evaluation-cache/policy.mjs`).href
);
const { mapImageNetLabel: baselineMap } = await import(
  pathToFileURL(`${process.cwd()}/.evaluation-cache/baseline.mjs`).href
);
const manifest = JSON.parse(
  await readFile("src/data/evaluationManifest.json", "utf8"),
);
await tf.setBackend("cpu");
await tf.ready();
console.log("Loading MobileNet v2 alpha 1.0 (224px), TensorFlow.js CPU…");
const model = await mobilenet.load({ version: 2, alpha: 1 });
const results = [];
for (const photo of manifest) {
  // Match browser RGB decoding; preserve original size and let MobileNet resize.
  const { data, info } = await sharp(
    `public/evaluation/photos/${photo.testImage}`,
  )
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const tensor = tf.tensor3d(
    new Uint8Array(data),
    [info.height, info.width, 3],
    "int32",
  );
  let predictions;
  try {
    predictions = await model.classify(tensor, 3);
  } finally {
    tensor.dispose();
  }
  const decision = assessPredictions(predictions);
  results.push({
    ...photo,
    predictedCategory: decision.category,
    confidence: predictions[0]?.probability ?? 0,
    predictions,
    baselineCategory: baselineMap(predictions[0]?.className ?? ""),
    ...(decision.category !== photo.expectedCategory
      ? {
          failureReason:
            decision.category === null
              ? decision.reason
              : `Object-label mapping suggested ${decision.category}; source label is ${photo.sourceLabel}. Material cannot reliably be inferred from this object label.`,
        }
      : {}),
  });
  if (results.length % 10 === 0)
    console.log(`${results.length}/${manifest.length} photos evaluated`);
}
const summary = (key) => {
  const suggested = results.filter((r) => r[key] !== null);
  const correct = results.filter((r) => r[key] === r.expectedCategory).length;
  return {
    correct,
    total: results.length,
    accuracy: correct / results.length,
    suggested: suggested.length,
    wrongSuggestions: suggested.length - correct,
    manualReview: results.length - suggested.length,
    suggestionAccuracy: suggested.length ? correct / suggested.length : null,
  };
};
const report = {
  version: 1,
  measuredAt: new Date().toISOString(),
  model:
    "@tensorflow-models/mobilenet 2.1.1 / MobileNet v2 alpha 1.0 / ImageNet 224",
  backend: "TensorFlow.js 4.22.0 CPU, sharp RGB decoding",
  selection:
    "SHA-256(srijan-eval-v1:sourcePath), 14 per represented category plus 1 plastic, deduplicated bytes; selected before inference",
  untestedCategories: ["ewaste", "hazardous"],
  baseline: summary("baselineCategory"),
  conservative: summary("predictedCategory"),
  results,
};
await writeFile(
  ".evaluation-cache/legacy-rerun.json",
  JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
  ".evaluation-cache/legacy-rerun-public.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { baseline: report.baseline, conservative: report.conservative },
    null,
    2,
  ),
);
