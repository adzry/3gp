// Shared helpers for 3gp tools. Node >= 22 (imports the zod schemas directly
// from src/ via Node's built-in TypeScript type stripping).
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const PROJECTS_DIR = path.join(ROOT, "projects");
export const PUBLIC_DIR = path.join(ROOT, "public");

/** Absolute path of a public/-relative media path. */
export const publicPath = (p) => path.join(PUBLIC_DIR, p);

/** "projects/x/transcript.json" → "projects/x/transcript.draft.json" */
export const draftPathFor = (p) =>
  p
    .replace(/(\.json)?$/, ".draft.json")
    .replace(".json.draft.json", ".draft.json");

/** Common short names → Natural Earth names, for validation hints. */
const COUNTRY_ALIASES = {
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  us: "United States of America",
  usa: "United States of America",
  "united states": "United States of America",
  uae: "United Arab Emirates",
  drc: "Dem. Rep. Congo",
  "south korea": "South Korea",
  "north korea": "North Korea",
};

/** Natural Earth country names (as used by MapRoute `highlight`). */
let _countries = null;
export const countryNames = () => {
  if (!_countries) {
    const topo = JSON.parse(
      // 1:50m is a superset of 1:110m (includes small countries like Singapore).
      fs.readFileSync(
        path.join(ROOT, "node_modules/world-atlas/countries-50m.json"),
        "utf8",
      ),
    );
    _countries = topo.objects.countries.geometries
      .map((g) => g.properties.name)
      .sort();
  }
  return _countries;
};

export const sha256File = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

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
 * Full check of a project: schema, media paths/existence, transcript validity
 * and staleness, and the resolved timeline of every composition.
 *
 * A voice-over whose audio file doesn't exist yet is PENDING (needs a
 * recording from the user), not broken: its timing is checked against the
 * draft transcript if there is one.
 *
 * @param {string} file  path to video.json
 * @param {{ transcript?: string }} [opts]  override transcript (public/-relative or absolute)
 */
export const checkProject = async (file, opts = {}) => {
  const v = await validateProject(file);
  const out = {
    ok: false,
    data: null,
    errors: [],
    warnings: [],
    pending: [],
    compositions: [],
    transcript: null,
    transcriptPath: null,
  };
  if (!v.ok) return { ...out, errors: v.errors };
  out.data = v.data;
  const { expandProject } = await loadSchema();
  const { collectMediaRefs, checkMediaPath, isRemote } = await import(
    path.join(ROOT, "src/video/media.ts")
  );
  const { parseTranscript } = await import(
    path.join(ROOT, "src/video/transcript.ts")
  );
  const { resolveTimeline } = await import(
    path.join(ROOT, "src/video/timeline.ts")
  );
  const videos = expandProject(v.data);
  const vo = v.data.voiceover;

  // Media: path shape + existence.
  for (const ref of collectMediaRefs(videos[0])) {
    const problem = checkMediaPath(ref);
    if (problem) out.errors.push(problem);
    else if (!isRemote(ref.path) && !fs.existsSync(publicPath(ref.path))) {
      if (vo && (ref.path === vo.src || ref.path === vo.transcript)) continue; // handled below
      if (/\.generated\.wav$/.test(ref.path)) {
        out.pending.push(
          `${ref.where}: generated music missing — run \`npm run music -- generate ${path.basename(path.dirname(file))}\``,
        );
        continue;
      }
      if (ref.path.startsWith("fixtures/")) {
        out.pending.push(
          `${ref.where}: generated fixture missing — run \`npm run fixtures\``,
        );
        continue;
      }
      out.errors.push(`${ref.where}: file not found: public/${ref.path}`);
    }
  }

  // Transcript.
  let transcriptFile = null;
  if (opts.transcript) {
    transcriptFile = path.isAbsolute(opts.transcript)
      ? opts.transcript
      : publicPath(opts.transcript);
    if (!fs.existsSync(transcriptFile))
      out.errors.push(`transcript override not found: ${opts.transcript}`);
  } else if (vo) {
    const audioExists = fs.existsSync(publicPath(vo.src));
    const tFile = publicPath(vo.transcript);
    const draft = publicPath(draftPathFor(vo.transcript));
    if (!audioExists) {
      out.pending.push(
        `voice-over not recorded yet: add public/${vo.src}, then run \`npm run transcribe -- ${path.basename(path.dirname(file))}\``,
      );
      if (fs.existsSync(draft)) transcriptFile = draft;
      else
        out.pending.push(
          `no draft transcript to check timing against (\`npm run transcript -- draft ${path.basename(path.dirname(file))}\`)`,
        );
    } else if (!fs.existsSync(tFile)) {
      out.errors.push(
        `voiceover.transcript: public/${vo.transcript} is missing — run \`npm run transcribe -- ${path.basename(path.dirname(file))}\``,
      );
    } else {
      transcriptFile = tFile;
    }
  }
  if (transcriptFile && fs.existsSync(transcriptFile)) {
    try {
      out.transcript = parseTranscript(
        JSON.parse(fs.readFileSync(transcriptFile, "utf8")),
      );
      out.transcriptPath = transcriptFile;
      if (
        vo &&
        out.transcript.engine.name !== "draft" &&
        fs.existsSync(publicPath(vo.src)) &&
        out.transcript.sourceSha256
      ) {
        if (sha256File(publicPath(vo.src)) !== out.transcript.sourceSha256) {
          out.errors.push(
            `transcript is stale: public/${vo.src} changed since it was transcribed — run \`npm run transcribe -- ${path.basename(path.dirname(file))} --force\``,
          );
        }
      }
    } catch (e) {
      out.errors.push(`${path.relative(ROOT, transcriptFile)}: ${e.message}`);
    }
  }

  // MapRoute: country names must exist in the Natural Earth data.
  const mapScenes = v.data.scenes
    .map((s, i) => [s, i])
    .filter(([s]) => s.template === "MapRoute" && s.props.highlight?.length);
  if (mapScenes.length) {
    const names = new Set(countryNames().map((n) => n.toLowerCase()));
    for (const [s, i] of mapScenes) {
      for (const h of s.props.highlight) {
        if (!names.has(h.toLowerCase())) {
          const alias = COUNTRY_ALIASES[h.toLowerCase().replace(/\./g, "")];
          const near = alias
            ? [alias]
            : countryNames().filter((n) =>
                n.toLowerCase().includes(h.toLowerCase().slice(0, 4)),
              );
          out.errors.push(
            `scenes.${i}.props.highlight: unknown country "${h}"${
              near.length
                ? ` — did you mean ${near
                    .slice(0, 3)
                    .map((n) => `"${n}"`)
                    .join(", ")}?`
                : ""
            }`,
          );
        }
      }
    }
  }

  // Timeline per composition (only meaningful if a transcript is available when needed).
  const needsTranscript = v.data.scenes.some(
    (s) => s.timing && !("from" in s.timing),
  );
  if (!needsTranscript || out.transcript) {
    for (const video of videos) {
      const t = resolveTimeline(video, out.transcript);
      out.compositions.push({ video, timeline: t });
      for (const e of t.errors) if (!out.errors.includes(e)) out.errors.push(e);
      for (const w of t.warnings)
        if (!out.warnings.includes(w)) out.warnings.push(w);
    }
  } else if (!vo) {
    out.errors.push(
      'scenes use voice timing (words/segments/phrase) but the video has no "voiceover" — add one, or time those scenes with seconds/from–to',
    );
  }
  out.ok = out.errors.length === 0;
  return out;
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
  "transcript",
  "model",
  "language",
  "from-json",
  "out",
  "mood",
  "seconds",
  "seed",
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
