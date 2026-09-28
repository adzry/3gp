#!/usr/bin/env node
/**
 * Convert an .srt file into @remotion/captions `Caption[]` JSON.
 *
 *   npm run captions:srt -- input.srt public/projects/001-x/captions.json
 *
 * Use with CaptionedShort `captionsFile: "projects/001-x/captions.json"`.
 * SRT gives cue-level (not word-level) timing; for word-level timing use a
 * Whisper transcript (see tools/captions/README.md).
 */
import { parseSrt } from "@remotion/captions";
import fs from "node:fs";
import path from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: npm run captions:srt -- <input.srt> <output.json>");
  process.exit(1);
}
const parsed = parseSrt({ input: fs.readFileSync(input, "utf8") }).captions;
// @remotion/captions expects each token to carry its leading whitespace
// (Whisper output does); SRT cues don't, so add it or cues run together.
const captions = parsed.map((c, i) => ({
  ...c,
  text: i === 0 || /^\s/.test(c.text) ? c.text : ` ${c.text}`,
}));
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(captions, null, 2) + "\n");
console.log(`✓ ${captions.length} captions → ${output}`);
