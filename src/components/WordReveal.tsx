import React from "react";
import { STAGGER } from "../lib/motion";
import { Emphasis } from "./Emphasis";
import { Reveal } from "./Reveal";

/**
 * Reveals text word by word. Words (or phrases) listed in `emphasis` get the
 * theme's emphasis device once they land.
 */
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  emphasis?: string[];
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = STAGGER, emphasis = [], style }) => {
  const tokens = splitWithPhrases(text, emphasis);
  let wordIndex = 0;
  return (
    <div style={{ ...style }}>
      {tokens.map((t, i) => {
        const d = delay + wordIndex * stagger;
        wordIndex += t.text.split(" ").length;
        return (
          <React.Fragment key={i}>
            {i > 0 && !t.glue ? " " : null}
            <Reveal as="span" delay={d} seed={i} straight>
              {t.emphasized ? (
                <Emphasis delay={d + stagger * 3}>{t.text}</Emphasis>
              ) : (
                t.text
              )}
            </Reveal>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * Split into words, keeping multi-word emphasis phrases as one token.
 * `glue` marks a token that attaches to the previous one without a space
 * (e.g. the "." after an emphasised word).
 */
export const splitWithPhrases = (text: string, phrases: string[]) => {
  const out: { text: string; emphasized: boolean; glue: boolean }[] = [];
  const lower = text.toLowerCase();
  const sorted = [...phrases]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  let i = 0;
  let buffer = "";
  const flush = () => {
    const glued = buffer.length > 0 && !/^\s/.test(buffer) && out.length > 0;
    buffer
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w, n) =>
        out.push({ text: w, emphasized: false, glue: n === 0 && glued }),
      );
    buffer = "";
  };
  while (i < text.length) {
    const hit = sorted.find(
      (p) =>
        lower.startsWith(p.toLowerCase(), i) &&
        !isWordChar(text[i - 1]) &&
        !isWordChar(text[i + p.length]),
    );
    if (hit) {
      const glue = buffer.length > 0 && !/\s$/.test(buffer);
      flush();
      out.push({ text: text.slice(i, i + hit.length), emphasized: true, glue });
      i += hit.length;
    } else {
      buffer += text[i];
      i++;
    }
  }
  flush();
  return out;
};

const isWordChar = (ch: string | undefined) =>
  ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
