import React from "react";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";
import { Reveal } from "./Reveal";

/** Small section label. Editorial styles print it as an inverted ink tag. */
export const Kicker: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const theme = useTheme();
  const { u } = useLayout();
  const inverted = theme.texture === "paper";
  return (
    <Reveal delay={delay} seed={7}>
      <div
        style={{
          display: "inline-block",
          fontFamily: theme.fonts.body,
          fontWeight: 700,
          fontSize: u(34),
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: inverted ? theme.colors.background : theme.colors.accent,
          background: inverted ? theme.colors.text : "transparent",
          padding: inverted ? `${u(8)}px ${u(18)}px` : 0,
          marginBottom: u(36),
        }}
      >
        {text}
      </div>
    </Reveal>
  );
};
