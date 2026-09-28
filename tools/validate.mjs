#!/usr/bin/env node
// Validate every projects/*/video.json and regenerate schemas/video.schema.json.
//   npm run validate
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ROOT, listProjects, loadSchema, validateProject } from "./lib.mjs";

const { projectFileSchema } = await loadSchema();
const jsonSchema = z.toJSONSchema(projectFileSchema, {
  io: "input",
  unrepresentable: "any",
});
fs.writeFileSync(
  path.join(ROOT, "schemas/video.schema.json"),
  JSON.stringify(jsonSchema, null, 2) + "\n",
);

let failed = false;
const ids = new Map();
for (const p of listProjects()) {
  const r = await validateProject(p.file);
  if (!r.ok) {
    failed = true;
    console.error(`✗ ${p.folder}/video.json`);
    for (const e of r.errors) console.error(`    ${e}`);
    continue;
  }
  for (const id of [r.data.id, ...r.data.variants.map((v) => v.id)]) {
    if (ids.has(id)) {
      failed = true;
      console.error(
        `✗ duplicate composition id "${id}" in ${p.folder} and ${ids.get(id)}`,
      );
    }
    ids.set(id, p.folder);
  }
  const secs = r.data.scenes.reduce((s, x) => s + x.seconds, 0);
  console.log(
    `✓ ${p.folder}  (${r.data.scenes.length} scenes, ${secs.toFixed(1)}s, ${1 + r.data.variants.length} composition(s))`,
  );
}
if (failed) process.exit(1);
