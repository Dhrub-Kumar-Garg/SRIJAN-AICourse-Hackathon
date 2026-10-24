import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = await mkdtemp(join(tmpdir(), "srijan-tests-"));
try {
  await build({
    entryPoints: ["tests/domain.test.ts"],
    outfile: join(dir, "domain.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "silent",
  });
  await import(join(dir, "domain.mjs"));
} finally {
  await rm(dir, { recursive: true, force: true });
}
