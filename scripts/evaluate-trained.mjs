// Re-evaluate using the application inference function. Reads local files only;
// published benchmark results are never overwritten by this verification tool.
import * as tf from "@tensorflow/tfjs";
import sharp from "sharp";
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

await build({
  entryPoints: ["src/lib/wasteClassifier.ts", "src/lib/wastePolicy.ts"],
  outdir: ".evaluation-cache/verification",
  bundle: true,
  platform: "node",
  format: "esm",
  outExtension: { ".js": ".mjs" },
  external: ["@tensorflow/tfjs"],
});
const { materialProbabilities } = await import(
  pathToFileURL(
    `${process.cwd()}/.evaluation-cache/verification/wasteClassifier.mjs`,
  ).href
);
const { assessWastePredictions } = await import(
  pathToFileURL(
    `${process.cwd()}/.evaluation-cache/verification/wastePolicy.mjs`,
  ).href
);
const metadata = JSON.parse(
  await readFile("public/models/waste-v1/metadata.json", "utf8"),
);
const modelJSON = JSON.parse(
  await readFile("public/models/waste-v1/base/model.json", "utf8"),
);
const baseBytes = await readFile("public/models/waste-v1/base/weights.bin"),
  headBytes = await readFile("public/models/waste-v1/head.bin");
assert.equal(
  createHash("sha256").update(baseBytes).digest("hex"),
  metadata.baseWeightsSha256,
);
assert.equal(
  createHash("sha256").update(headBytes).digest("hex"),
  metadata.headWeightsSha256,
);
await tf.setBackend("cpu");
await tf.ready();
const base = await tf.loadGraphModel(
  tf.io.fromMemory({
    modelTopology: modelJSON.modelTopology,
    weightSpecs: modelJSON.weightsManifest[0].weights,
    weightData: baseBytes.buffer.slice(
      baseBytes.byteOffset,
      baseBytes.byteOffset + baseBytes.byteLength,
    ),
  }),
);
const buffer = headBytes.buffer.slice(
  headBytes.byteOffset,
  headBytes.byteOffset + headBytes.byteLength,
);
let offset = 0;
const weights = metadata.headWeights.map((spec) => {
  const count = spec.shape.reduce((a, b) => a * b, 1),
    tensor = tf.tensor(new Float32Array(buffer, offset, count), spec.shape);
  offset += count * 4;
  return tensor;
});
const measured = JSON.parse(
  await readFile("src/data/evaluationReport.json", "utf8"),
).results;
const smoke = process.argv.includes("--smoke"),
  rows = smoke
    ? [measured[0], measured[Math.floor(measured.length / 2)], measured.at(-1)]
    : measured;
let worstError = 0;
const results = [];
try {
  for (const row of rows) {
    const { data, info } = await sharp(
      `public/evaluation/photos/${row.testImage}`,
    )
      .removeAlpha()
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });
    const input = tf.tensor3d(
      new Uint8Array(data),
      [info.height, info.width, 3],
      "int32",
    );
    const output = materialProbabilities(base, weights, input);
    const scores = Array.from(await output.data());
    output.dispose();
    input.dispose();
    const predictions = metadata.categories
        .map((className, index) => ({ className, probability: scores[index] }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3),
      decision = assessWastePredictions(predictions);
    for (const expected of row.predictions)
      worstError = Math.max(
        worstError,
        Math.abs(
          scores[metadata.categories.indexOf(expected.className)] -
            expected.probability,
        ),
      );
    assert.equal(
      predictions[0].className,
      row.top1Category,
      `Top-1 mismatch: ${row.testImage}`,
    );
    results.push({
      testImage: row.testImage,
      expectedCategory: row.expectedCategory,
      predictions,
      predictedCategory: decision.category,
    });
    console.log(
      `${results.length}/${rows.length}: ${row.testImage} -> ${predictions[0].className} (${(predictions[0].probability * 100).toFixed(1)}%); ${decision.category ?? "manual review"}`,
    );
  }
  assert.ok(
    worstError < 0.005,
    `Native/TF.js probability difference ${worstError} exceeds tolerance`,
  );
  const report = {
    modelVersion: metadata.version,
    baseWeightsSha256: metadata.baseWeightsSha256,
    headWeightsSha256: metadata.headWeightsSha256,
    measuredAt: new Date().toISOString(),
    backend: "TensorFlow.js 4.22.0 CPU / application inference",
    smokeOnly: smoke,
    total: rows.length,
    top1Correct: results.filter(
      (row) => row.predictions[0].className === row.expectedCategory,
    ).length,
    suggested: results.filter((row) => row.predictedCategory).length,
    correctSuggestions: results.filter(
      (row) => row.predictedCategory === row.expectedCategory,
    ).length,
    maxNativeScoreDifference: worstError,
    results,
  };
  await writeFile(
    ".evaluation-cache/tfjs-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  if (!smoke)
    await writeFile(
      "public/models/waste-v1/tfjs-verification.json",
      JSON.stringify(report, null, 2) + "\n",
    );
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
} finally {
  base.dispose();
  weights.forEach((weight) => weight.dispose());
}
