import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const dir = await mkdtemp(join(tmpdir(), "srijan-tests-"));
try {
  await build({
    entryPoints: ["tests/domain.test.ts", "tests/modelLoader.test.ts"],
    outdir: dir,
    entryNames: "[name]",
    outExtension: { ".js": ".mjs" },
    bundle: true,
    platform: "node",
    format: "esm",
    banner: {
      js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
    },
    logLevel: "silent",
  });
  await import(pathToFileURL(join(dir, "domain.test.mjs")).href);
  await import(pathToFileURL(join(dir, "modelLoader.test.mjs")).href);
} finally {
  await rm(dir, { recursive: true, force: true });
}
