/**
 * Patches @opennextjs/cloudflare to inline prefetch-hints.json.
 *
 * Next.js 16 added /.next/server/prefetch-hints.json, but OpenNext 1.17.x
 * only inlines manifests matching **\/{*-manifest,required-server-files}.json.
 * At runtime the patched loadManifest() throws for any unknown manifest path.
 *
 * Fix: extend the glob pattern to also match prefetch-hints.json.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const file = resolve(
  "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
);

const src = await readFile(file, "utf-8");
const OLD = "**/{*-manifest,required-server-files}.json";
const NEW = "**/{*-manifest,required-server-files,prefetch-hints}.json";

if (src.includes(NEW)) {
  console.log("patch-opennext: already applied, skipping.");
} else if (!src.includes(OLD)) {
  console.error("patch-opennext: expected pattern not found — OpenNext may have changed. Skipping.");
} else {
  await writeFile(file, src.replace(OLD, NEW), "utf-8");
  console.log("patch-opennext: patched load-manifest.js to include prefetch-hints.json");
}
