// Save the exact existing TF.js MobileNet graph for native CPU feature extraction
// and same-origin browser inference. No conversion or replacement of its weights.
import * as tf from "@tensorflow/tfjs";
import mobilenet from "@tensorflow-models/mobilenet";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

await tf.setBackend("cpu");
const model = await mobilenet.load({ version: 2, alpha: 1 });
const target = "public/models/waste-v1/base";
await mkdir(target, { recursive: true });
await model.model.save(
  tf.io.withSaveHandler(async (artifacts) => {
    const chunks = Array.isArray(artifacts.weightData)
      ? artifacts.weightData
      : [artifacts.weightData];
    const weights = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    const metadata = {
      format: "graph-model",
      generatedBy: "Original Google TF Hub MobileNet v2 / TensorFlow.js 4.22.0",
      convertedBy: null,
      modelTopology: artifacts.modelTopology,
      weightsManifest: [
        { paths: ["weights.bin"], weights: artifacts.weightSpecs },
      ],
      ...(artifacts.signature ? { signature: artifacts.signature } : {}),
    };
    await writeFile(`${target}/model.json`, JSON.stringify(metadata));
    await writeFile(`${target}/weights.bin`, weights);
    await writeFile(
      ".evaluation-cache/feature-model-sha256.txt",
      createHash("sha256").update(weights).digest("hex") + "\n",
    );
    console.log(`Saved original feature model: ${weights.length} weight bytes`);
    return {
      modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" },
    };
  }),
);
