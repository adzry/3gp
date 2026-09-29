import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { activeTokenIndex, pageWindows } from "../lib/caption-timing";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";

/**
 * Word-timed captions in pages (TikTok style). Input is the standard
 * @remotion/captions `Caption[]` — from a voice-over transcript
 * (`transcriptToCaptions`), an SRT file, or inline data.
 * The word being spoken gets the theme's emphasis.
 */
export const Captions: React.FC<{
  captions: Caption[];
  /** Group words within this window onto one page. */
  combineMs?: number;
  position?: "bottom" | "center";
  size?: number;
  /** Draw a backing plate so captions read over footage. */
  plate?: boolean;
}> = ({
  captions,
  combineMs = 1200,
  position = "bottom",
  size = 64,
  plate = false,
}) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: combineMs,
      }).pages,
    [captions, combineMs],
  );
  const windows = useMemo(() => pageWindows(pages, fps), [pages, fps]);

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const { from, durationInFrames } = windows[i];
        if (durationInFrames <= 0) return null;
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={durationInFrames}
            layout="none"
          >
            <CaptionPage
              tokens={page.tokens}
              pageStartMs={page.startMs}
              position={position}
              size={size}
              plate={plate}
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
  plate: boolean;
}> = ({ tokens, pageStartMs, position, size, plate }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const { u, safe, isVertical, height } = useLayout();
  const nowMs = pageStartMs + (frame / fps) * 1000;
  const active = activeTokenIndex(tokens, nowMs);
  const highlighter = theme.emphasis === "highlighter";
  // Vertical: stay above the bottom ~22% where platform UI (buttons, handle) sits.
  const bottom = isVertical ? height * 0.22 : safe.y * 1.1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: position === "bottom" ? "flex-end" : "center",
        alignItems: "center",
        padding: `${safe.y}px ${safe.x}px ${position === "bottom" ? bottom : safe.y}px`,
      }}
    >
      <div
        style={{
          maxWidth: isVertical ? "100%" : u(1500),
          fontFamily: theme.fonts.display,
          fontWeight: theme.display.weight,
          textTransform: theme.display.uppercase ? "uppercase" : "none",
          fontSize: u(size),
          lineHeight: 1.25,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          color: theme.colors.text,
          background: plate ? theme.colors.background : undefined,
          padding: plate ? `${u(14)}px ${u(28)}px` : undefined,
          borderRadius: plate ? Math.min(theme.radius, u(12)) : undefined,
          boxShadow: plate ? theme.shadow : undefined,
          textShadow:
            plate || theme.texture === "paper"
              ? "none"
              : `0 ${u(4)}px ${u(18)}px rgba(0,0,0,0.55)`,
        }}
      >
        {tokens.map((t, i) => {
          const on = i === active;
          // Tokens carry their leading space (" word"); keep it outside the highlight.
          const lead = t.text.match(/^\s*/)?.[0] ?? "";
          return (
            <React.Fragment key={i}>
              {lead}
              <span
                style={{
                  color: on
                    ? highlighter
                      ? theme.colors.onAccent
                      : theme.colors.accent
                    : undefined,
                  background:
                    on && highlighter ? theme.colors.accent : undefined,
                  // box-shadow (not padding) so highlighting never reflows the line
                  boxShadow:
                    on && highlighter
                      ? `0 0 0 ${u(6)}px ${theme.colors.accent}`
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
