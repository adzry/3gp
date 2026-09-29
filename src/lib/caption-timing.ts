/**
 * Pure caption timing helpers (unit-tested in tests/).
 * Pages come from @remotion/captions `createTikTokStyleCaptions`.
 */
type Token = { fromMs: number; toMs: number };
type Page = { startMs: number; durationMs: number; tokens: Token[] };

/**
 * Frame window for each caption page. A page shows from its first word until
 * the next page starts — but never lingers more than `holdMs` after its last
 * word, so captions clear during pauses in the narration.
 */
export const pageWindows = (pages: Page[], fps: number, holdMs = 600) =>
  pages.map((page, i) => {
    const next = pages[i + 1];
    const lastWordEnd = page.tokens.length
      ? page.tokens[page.tokens.length - 1].toMs
      : page.startMs + page.durationMs;
    const endMs = Math.min(
      next ? next.startMs : Infinity,
      lastWordEnd + holdMs,
    );
    const from = Math.round((page.startMs / 1000) * fps);
    const to = Math.round((endMs / 1000) * fps);
    return { from, durationInFrames: Math.max(0, to - from) };
  });

/**
 * The word to highlight at `nowMs`: the last word that has started, so the
 * highlight doesn't flicker off in the small gaps between words.
 * Returns -1 before the first word.
 */
export const activeTokenIndex = (tokens: Token[], nowMs: number) => {
  let active = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (nowMs >= tokens[i].fromMs) active = i;
    else break;
  }
  return active;
};
