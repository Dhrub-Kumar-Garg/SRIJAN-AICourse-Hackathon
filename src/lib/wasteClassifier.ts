import * as tf from "@tensorflow/tfjs";
import metadata from "../data/wasteModelMetadata.json";
import type { Prediction } from "./predictionPolicy";

type ReadyClassifier = {
  classify: (pixels: tf.Tensor3D) => Promise<Prediction[]>;
};
let pending: Promise<ReadyClassifier> | undefined;

export function materialProbabilities(
  base: tf.GraphModel,
  weights: tf.Tensor[],
  pixels: tf.Tensor3D,
): tf.Tensor2D {
  return tf.tidy(() => {
    const [kernel1, bias1, kernel2, bias2] = weights;
    const normalized = tf.div(tf.cast(pixels, "float32"), 255) as tf.Tensor3D;
    const resized = tf.image.resizeBilinear(normalized, [224, 224], true);
    const pooled = base.execute(
      resized.expandDims(0),
      metadata.embeddingNode,
    ) as tf.Tensor4D;
    const features = pooled.squeeze([1, 2]) as tf.Tensor2D;
    const hidden = tf.relu(
      tf.add(tf.matMul(features, kernel1 as tf.Tensor2D), bias1),
    );
    const logits = tf.add(tf.matMul(hidden, kernel2 as tf.Tensor2D), bias2);
    return tf.softmax(
      tf.div(logits, metadata.policy.temperature),
    ) as tf.Tensor2D;
  });
}

export function loadWasteClassifier(): Promise<ReadyClassifier> {
  pending ??= load().catch((error) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

async function load(): Promise<ReadyClassifier> {
  await tf.ready();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let base: tf.GraphModel | undefined;
  const tensors: tf.Tensor[] = [];
  try {
    // The same pretrained graph is used for native training and browser inference.
    base = await tf.loadGraphModel("/models/waste-v1/base/model.json", {
      requestInit: { signal: controller.signal },
    });
    const response = await fetch(
      `/models/waste-v1/head.bin?v=${metadata.headWeightsSha256}`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error("Material model weights unavailable");
    const buffer = await response.arrayBuffer();
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    if (digest !== metadata.headWeightsSha256)
      throw new Error("Material model version mismatch");
    let offset = 0;
    for (const spec of metadata.headWeights) {
      const count = spec.shape.reduce((product, size) => product * size, 1);
      tensors.push(
        tf.tensor(new Float32Array(buffer, offset, count), spec.shape),
      );
      offset += count * 4;
    }
    if (offset !== buffer.byteLength || tensors.length !== 4)
      throw new Error("Invalid material model dimensions");
    const model = base;
    return {
      async classify(pixels) {
        const probabilities = materialProbabilities(model, tensors, pixels);
        try {
          const scores = await probabilities.data();
          return metadata.categories
            .map((className, index) => ({
              className,
              probability: scores[index],
            }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3);
        } finally {
          probabilities.dispose();
        }
      },
    };
  } catch (error) {
    tensors.forEach((tensor) => tensor.dispose());
    base?.dispose();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
