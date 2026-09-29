import React from "react";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";
import { WordReveal } from "./WordReveal";

/** Display-type headline in the theme's voice, revealed word by word. */
export const Headline: React.FC<{
  text: string;
  size?: number;
  delay?: number;
  emphasis?: string[];
  align?: "left" | "center";
  maxWidth?: number;
}> = ({ text, size = 110, delay = 0, emphasis, align = "left", maxWidth }) => {
  const theme = useTheme();
  const { u } = useLayout();
  return (
    <WordReveal
      text={text}
      delay={delay}
      emphasis={emphasis}
      style={{
        fontFamily: theme.fonts.display,
        fontWeight: theme.display.weight,
        textTransform: theme.display.uppercase ? "uppercase" : "none",
        lineHeight: theme.display.lineHeight,
        letterSpacing: theme.display.letterSpacing,
        fontSize: u(size),
        textAlign: align,
        maxWidth: maxWidth ? u(maxWidth) : undefined,
        // Even line lengths — no single orphaned word on the last line.
        textWrap: "balance",
      }}
    />
  );
};
