import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkProject } from "../tools/lib.mjs";

test("checkProject: voice timing without a voiceover is an error", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "3gp-check-"));
  const file = path.join(dir, "video.json");
  fs.writeFileSync(
    file,
    JSON.stringify({
      id: "voice-timing-no-vo",
      title: "Voice timing without a voiceover",
      scenes: [
        {
          template: "TitleCard",
          timing: { words: [0, 1] },
          props: { title: "Hi" },
        },
      ],
    }),
  );
  const check = await checkProject(file);
  assert.equal(check.ok, false);
  assert.match(check.errors.join("\n"), /no "voiceover"/);
  fs.rmSync(dir, { recursive: true });
});
