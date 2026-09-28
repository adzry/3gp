#!/usr/bin/env node
/**
 * Scaffold a new video project from a recipe.
 *
 *   npm run new -- "Why 3G phones mattered" --recipe explainer
 *   npm run new -- "Launch teaser" --recipe product-launch --format vertical --theme studio
 *
 * Creates projects/NNN-slug/ (brief, storyboard, script, video.json),
 * public/projects/NNN-slug/ for assets, and registers it in projects/index.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { PROJECTS_DIR, ROOT, parseArgs } from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const title = positional.join(" ").trim();
const recipe = flags.recipe ?? "explainer";
const starterFile = path.join(ROOT, "recipes/starters", `${recipe}.json`);

if (!title) {
  console.error(
    'Usage: npm run new -- "Video title" [--recipe name] [--format landscape|vertical|square] [--theme name]',
  );
  process.exit(1);
}
if (!fs.existsSync(starterFile)) {
  const available = fs
    .readdirSync(path.join(ROOT, "recipes/starters"))
    .map((f) => f.replace(".json", ""));
  console.error(
    `Unknown recipe "${recipe}". Available: ${available.join(", ")}`,
  );
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 40)
  .replace(/-$/, "");
const nums = fs
  .readdirSync(PROJECTS_DIR)
  .map((d) => parseInt(d.slice(0, 3), 10))
  .filter((n) => !Number.isNaN(n));
const num = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
const folder = `${num}-${slug}`;
const dir = path.join(PROJECTS_DIR, folder);
const id = flags.id ?? `p${num}-${slug}`.slice(0, 50).replace(/-$/, "");

const starter = JSON.parse(fs.readFileSync(starterFile, "utf8"));
const video = {
  $schema: "../../schemas/video.schema.json",
  id,
  title,
  fps: 30,
  format: flags.format ?? starter.format ?? "landscape",
  theme: flags.theme ?? starter.theme ?? "studio",
  scenes: starter.scenes,
  variants: [],
};

fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(path.join(ROOT, "public/projects", folder), { recursive: true });
fs.writeFileSync(path.join(ROOT, "public/projects", folder, ".gitkeep"), "");
fs.writeFileSync(
  path.join(dir, "video.json"),
  JSON.stringify(video, null, 2) + "\n",
);

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(dir, "brief.md"),
  `# ${title}

- **Created:** ${today}
- **Recipe:** [${recipe}](../../recipes/${recipe}.md)
- **Format / style:** ${video.format} · ${video.theme}
- **Composition id:** \`${id}\`

## Goal
<!-- What should the viewer think, feel or do after watching? One sentence. -->

## Audience & channel
<!-- Who is watching, where (YouTube, Reels, a talk, a landing page)? -->

## Key message
<!-- If they remember one line, it is this. -->

## Constraints
<!-- Length, deadline, brand rules, must-include facts, assets available. -->

## Sources & facts
<!-- Every number shown on screen must be listed here with its source. -->
`,
);
fs.writeFileSync(
  path.join(dir, "storyboard.md"),
  `# Storyboard — ${title}

One row per scene. Keep this in sync with video.json (same order).

| # | Beat (${recipe}) | Template | Seconds | On screen | Notes |
|---|---|---|---|---|---|
${starter.scenes
  .map(
    (s, i) =>
      `| ${i + 1} | ${s.name ?? ""} | ${s.template} | ${s.seconds} | | |`,
  )
  .join("\n")}
`,
);
fs.writeFileSync(
  path.join(dir, "script.md"),
  `# Script — ${title}

Voice-over / on-screen copy per scene. Write VO first, then time scenes to it.

${starter.scenes.map((s, i) => `## ${i + 1}. ${s.name ?? s.template}\n\nVO: \n`).join("\n")}`,
);

// Register in projects/index.ts
const indexFile = path.join(PROJECTS_DIR, "index.ts");
let index = fs.readFileSync(indexFile, "utf8");
const varName = `p${num}`;
if (
  !index.includes("// <3gp:imports>") ||
  !index.includes("// <3gp:projects>")
) {
  console.error(
    "projects/index.ts is missing its <3gp:imports>/<3gp:projects> markers; register the project by hand.",
  );
  process.exit(1);
}
index = index.replace(
  "// <3gp:imports>",
  `import ${varName} from "./${folder}/video.json";\n// <3gp:imports>`,
);
index = index.replace(
  "  // <3gp:projects>",
  `  ${varName},\n  // <3gp:projects>`,
);
fs.writeFileSync(indexFile, index);

console.log(`✓ Created projects/${folder}/
    brief.md  storyboard.md  script.md  video.json
  Assets go in public/projects/${folder}/ (reference as "projects/${folder}/file.png")
  Composition id: ${id}

Next:
  1. Fill brief.md, then storyboard.md and script.md
  2. Edit video.json (scenes → templates + props)
  3. npm run validate && npm run stills -- ${num}
  4. npm run render -- ${num}`);
