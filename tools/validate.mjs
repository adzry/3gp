#!/usr/bin/env node
// Validate every projects/*/video.json (schema, media, transcripts, timing)
// and regenerate schemas/video.schema.json + schemas/transcript.schema.json.
//   npm run validate            # pending recordings are reported, not fatal
//   npm run validate -- --strict   # pending recordings fail too
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  ROOT,
  checkProject,
  listProjects,
  loadSchema,
  parseArgs,
} from "./lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const { projectFileSchema } = await loadSchema();
const { transcriptSchema } = await import(
  path.join(ROOT, "src/video/transcript.ts")
);
const writeSchema = (name, schema) =>
  fs.writeFileSync(
    path.join(ROOT, "schemas", name),
    JSON.stringify(
      z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }),
      null,
      2,
    ) + "\n",
  );
writeSchema("video.schema.json", projectFileSchema);
writeSchema("transcript.schema.json", transcriptSchema);

let failed = false;
const ids = new Map();
for (const p of listProjects()) {
  const r = await checkProject(p.file);
  if (r.data) {
    for (const id of [r.data.id, ...r.data.variants.map((v) => v.id)]) {
      if (ids.has(id))
        r.errors.push(
          `duplicate composition id "${id}" (also in ${ids.get(id)})`,
        );
      ids.set(id, p.folder);
    }
  }
  if (r.errors.length) {
    failed = true;
    console.error(`✗ ${p.folder}/video.json`);
    for (const e of r.errors) console.error(`    ${e}`);
  } else {
    const main = r.compositions[0];
    const secs = main
      ? (main.timeline.durationInFrames / main.timeline.fps).toFixed(1) + "s"
      : "timing unchecked";
    const src = r.transcript ? `, transcript: ${r.transcript.engine.name}` : "";
    console.log(
      `✓ ${p.folder}  (${r.data.scenes.length} scenes, ${secs}, ${1 + r.data.variants.length} composition(s)${src})`,
    );
  }
  for (const w of r.warnings) console.log(`  ⚠ ${w}`);
  for (const pnd of r.pending) console.log(`  … pending: ${pnd}`);
  if (flags.strict && r.pending.length) failed = true;
}
if (failed) process.exit(1);
