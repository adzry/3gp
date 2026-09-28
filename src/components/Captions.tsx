import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";

/**
 * Word-timed captions in pages (TikTok style). Input is the standard
 * @remotion/captions `Caption[]` — produced by tools/captions or Whisper.
 * The active word gets the theme accent.
 */
export const Captions: React.FC<{
  captions: Caption[];
  /** Group words within this window onto one page. */
  combineMs?: number;
  position?: "bottom" | "center";
  size?: number;
}> = ({ captions, combineMs = 1200, position = "bottom", size = 64 }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: combineMs,
      }),
    [captions, combineMs],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const end = next
          ? Math.round((next.startMs / 1000) * fps)
          : Math.round(((page.startMs + page.durationMs) / 1000) * fps);
        if (end - from <= 0) return null;
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={end - from}
            layout="none"
          >
            <CaptionPage
              tokens={page.tokens}
              pageStartMs={page.startMs}
              position={position}
              size={size}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{
  tokens: { text: string; fromMs: number; toMs: number }[];
  pageStartMs: number;
  position: "bottom" | "center";
  size: number;
}> = ({ tokens, pageStartMs, position, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const { u, safe } = useLayout();
  const nowMs = pageStartMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        justifyContent: position === "bottom" ? "flex-end" : "center",
        alignItems: "center",
        padding: `${safe.y * 1.8}px ${safe.x}px`,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.display,
          fontWeight: theme.display.weight,
          textTransform: theme.display.uppercase ? "uppercase" : "none",
          fontSize: u(size),
          lineHeight: 1.15,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          color: theme.colors.text,
          textShadow:
            theme.texture === "paper"
              ? "none"
              : `0 ${u(4)}px ${u(18)}px rgba(0,0,0,0.55)`,
        }}
      >
        {tokens.map((t, i) => {
          const active = nowMs >= t.fromMs && nowMs < t.toMs;
          // Tokens carry their leading space (" word"); keep it outside the highlight.
          const lead = t.text.match(/^\s*/)?.[0] ?? "";
          return (
            <React.Fragment key={i}>
              {lead}
              <span
                style={{
                  color: active
                    ? theme.emphasis === "highlighter"
                      ? theme.colors.onAccent
                      : theme.colors.accent
                    : undefined,
                  background:
                    active && theme.emphasis === "highlighter"
                      ? theme.colors.accent
                      : undefined,
                  padding:
                    active && theme.emphasis === "highlighter"
                      ? `0 ${u(8)}px`
                      : undefined,
                }}
              >
                {t.text.slice(lead.length)}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
