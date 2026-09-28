import React from "react";
import type { z } from "zod";
import { Reveal } from "../components/Reveal";
import { Stage } from "../components/Stage";
import { WordReveal } from "../components/WordReveal";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";
import type { quoteCardSchema } from "./schemas";

/** A quotation with attribution. Always attribute real quotes accurately. */
export const QuoteCard: React.FC<z.input<typeof quoteCardSchema>> = ({
  quote,
  author,
  source,
  emphasis = [],
}) => {
  const theme = useTheme();
  const { u } = useLayout();
  const words = quote.split(/\s+/).length;
  return (
    <Stage dots>
      <Reveal seed={3}>
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontSize: u(220),
            lineHeight: 0.6,
            height: u(110),
            color:
              theme.emphasis === "highlighter"
                ? theme.colors.text
                : theme.colors.accent,
          }}
        >
          “
        </div>
      </Reveal>
      <WordReveal
        text={quote}
        delay={8}
        stagger={3}
        emphasis={emphasis}
        style={{
          fontFamily: theme.fonts.body,
          fontWeight: 700,
          fontSize: u(words > 18 ? 60 : 76),
          lineHeight: 1.18,
          letterSpacing: "-0.01em",
          maxWidth: u(1500),
        }}
      />
      <Reveal delay={8 + words * 3 + 6} straight>
        <div
          style={{
            marginTop: u(44),
            fontSize: u(40),
            color: theme.colors.muted,
          }}
        >
          —{" "}
          <span style={{ color: theme.colors.text, fontWeight: 700 }}>
            {author}
          </span>
          {source ? `, ${source}` : ""}
        </div>
      </Reveal>
    </Stage>
  );
};
