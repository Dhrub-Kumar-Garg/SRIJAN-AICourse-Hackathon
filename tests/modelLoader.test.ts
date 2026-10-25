import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as tf from "@tensorflow/tfjs";
import { loadWasteClassifier } from "../src/lib/wasteClassifier";

// Local mocked asset responses exercise the browser loader without networking
// or browser permissions: corrupt-head rejection, cleanup, retry and caching.
const originalFetch = globalThis.fetch;
const platform = tf.env().platform,
  originalPlatformFetch = platform.fetch;
let corrupt = true,
  requests = 0;
globalThis.fetch = async (input) => {
  const url = String(input).split("?")[0];
  requests++;
  assert.ok(
    [
      "/models/waste-v1/base/model.json",
      "/models/waste-v1/base/weights.bin",
      "/models/waste-v1/head.bin",
    ].includes(url),
    `Unexpected model request: ${url}`,
  );
  const bytes = Buffer.from(readFileSync(`public${url}`));
  if (corrupt && url.endsWith("/head.bin")) bytes[0] ^= 1;
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": url.endsWith(".json")
        ? "application/json"
        : "application/octet-stream",
    },
  });
};
platform.fetch = (url, init) => globalThis.fetch(url, init);
try {
  await tf.setBackend("cpu");
  await tf.ready();
  const count = tf.memory().numTensors;
  await assert.rejects(loadWasteClassifier(), /version mismatch/);
  assert.equal(
    tf.memory().numTensors,
    count,
    "Failed model load leaked tensors",
  );
  corrupt = false;
  const model = await loadWasteClassifier(),
    loadedRequests = requests;
  assert.strictEqual(await loadWasteClassifier(), model);
  assert.equal(
    requests,
    loadedRequests,
    "Cached model loaded its assets again",
  );
  const pixels = tf.zeros([224, 224, 3], "int32") as tf.Tensor3D;
  try {
    const predictions = await model.classify(pixels);
    assert.equal(predictions.length, 3);
    assert.ok(
      predictions.every(
        (row) =>
          Number.isFinite(row.probability) &&
          row.probability >= 0 &&
          row.probability <= 1,
      ),
    );
    assert.ok(predictions[0].probability >= predictions[1].probability);
  } finally {
    pixels.dispose();
  }
  console.log(
    "Passed: trained model asset loading, integrity failure cleanup, retry, cache and inference.",
  );
} finally {
  globalThis.fetch = originalFetch;
  platform.fetch = originalPlatformFetch;
}
