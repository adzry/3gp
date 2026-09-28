// Shared helpers for 3gp tools. Node >= 22 (imports the zod schemas directly
// from src/ via Node's built-in TypeScript type stripping).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const PROJECTS_DIR = path.join(ROOT, "projects");

export const loadSchema = () => import(path.join(ROOT, "src/video/schema.ts"));

/** All project folders (NNN-slug) that contain a video.json. */
export const listProjects = () =>
  fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .filter((d) => fs.existsSync(path.join(PROJECTS_DIR, d.name, "video.json")))
    .map((d) => ({
      folder: d.name,
      dir: path.join(PROJECTS_DIR, d.name),
      file: path.join(PROJECTS_DIR, d.name, "video.json"),
    }));

/** Find a project by folder name, number prefix ("001") or composition id. */
export const findProject = (query) => {
  const all = listProjects();
  return (
    all.find((p) => p.folder === query) ??
    all.find((p) => p.folder.startsWith(`${query}-`)) ??
    all.find((p) => {
      const json = JSON.parse(fs.readFileSync(p.file, "utf8"));
      return (
        json.id === query || (json.variants ?? []).some((v) => v.id === query)
      );
    })
  );
};

/** Parse + validate a project file. Returns { ok, data, errors }. */
export const validateProject = async (file) => {
  const { projectFileSchema } = await loadSchema();
  let json;
  try {
    json = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${e.message}`] };
  }
  const result = projectFileSchema.safeParse(json);
  if (result.success) return { ok: true, data: result.data, errors: [] };
  return {
    ok: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
    ),
  };
};

/**
 * Chromium for rendering. Respects REMOTION_BROWSER_EXECUTABLE; otherwise uses
 * a Playwright-installed headless shell if present; otherwise Remotion
 * downloads its own on first render.
 */
export const browserEnv = () => {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) return {};
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !fs.existsSync(base)) return {};
  for (const dir of fs
    .readdirSync(base)
    .filter((d) => d.startsWith("chromium_headless_shell"))) {
    for (const sub of fs.readdirSync(path.join(base, dir))) {
      const exe = path.join(base, dir, sub, "headless_shell");
      if (fs.existsSync(exe)) return { REMOTION_BROWSER_EXECUTABLE: exe };
    }
  }
  return {};
};

/** Run the Remotion CLI; exits the process on failure. */
export const remotion = (args) => {
  console.log(`\n$ npx remotion ${args.join(" ")}`);
  const r = spawnSync("npx", ["remotion", ...args], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...browserEnv() },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

/** Flags that take a value (`--flag value` or `--flag=value`); all others are boolean. */
const VALUE_FLAGS = new Set([
  "only",
  "frames",
  "recipe",
  "format",
  "theme",
  "id",
  "width",
  "fps",
]);

export const parseArgs = (argv) => {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      flags._passthrough = argv.slice(i + 1);
      break;
    }
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) flags[k] = v;
      else if (VALUE_FLAGS.has(k) && argv[i + 1] !== undefined)
        flags[k] = argv[++i];
      else flags[k] = true;
    } else positional.push(a);
  }
  return { flags, positional };
};
