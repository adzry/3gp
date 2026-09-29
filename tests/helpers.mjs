// Deterministic synthetic data for tests. Not real transcriptions.

/**
 * Build a transcript from segments of words; each word lasts 0.3s with 0.1s
 * gaps and 0.5s between segments, starting at `start`.
 */
export const makeTranscript = (segments, { start = 0.5, duration } = {}) => {
  let t = start;
  const segs = segments.map((words, si) => {
    if (si > 0) t += 0.5;
    const ws = words.map((word) => {
      const w = { word, start: round(t), end: round(t + 0.3) };
      t += 0.4;
      return w;
    });
    return {
      start: ws[0].start,
      end: ws[ws.length - 1].end,
      text: words.join(" "),
      words: ws,
    };
  });
  return {
    version: 1,
    source: "projects/test/voiceover.wav",
    duration: duration ?? round(t + 0.5),
    language: "en",
    engine: { name: "test-fixture" },
    segments: segs,
  };
};

const round = (s) => Math.round(s * 1000) / 1000;

/** Minimal video props with the given scenes. */
export const makeVideo = (scenes, extra = {}) => ({
  id: "test",
  title: "Test",
  fps: 30,
  scenes: scenes.map((s) => ({
    template: "TitleCard",
    props: { title: "x" },
    ...s,
  })),
  ...extra,
});
