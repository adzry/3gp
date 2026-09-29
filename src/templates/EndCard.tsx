import React from "react";
import type { z } from "zod";
import { Emphasis } from "../components/Emphasis";
import { Headline } from "../components/Headline";
import { Reveal } from "../components/Reveal";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";
import type { endCardSchema } from "./schemas";

/**
 * Closing card: call to action + next step, with a credits block for
 * attributions (stock footage, music, fonts…) — many licences require one.
 */
export const EndCard: React.FC<z.input<typeof endCardSchema>> = ({
  headline,
  subline,
  credits = [],
}) => {
  const theme = useTheme();
  const { u, isVertical, safe } = useLayout();
  const words = headline.split(/\s+/).length;
  const subAt = 10 + words * 4;
  return (
    <Stage align="center" dots>
      <Headline
        text={headline}
        size={isVertical ? 100 : 116}
        align="center"
        maxWidth={1500}
      />
      {subline ? (
        <Reveal delay={subAt} straight>
          <div
            style={{
              marginTop: u(40),
              fontFamily: theme.fonts.mono,
              fontWeight: 500,
              fontSize: u(isVertical ? 44 : 50),
              color: theme.colors.text,
              textAlign: "center",
            }}
          >
            <Emphasis delay={subAt + 8}>{subline}</Emphasis>
          </div>
        </Reveal>
      ) : null}
      {credits.length ? (
        <Reveal
          delay={subAt + 16}
          straight
          variant="fade"
          style={{
            position: "absolute",
            left: safe.x,
            right: safe.x,
            bottom: safe.y * 0.7,
          }}
        >
          <div
            style={{
              columnCount: !isVertical && credits.length > 4 ? 2 : 1,
              columnGap: u(60),
              fontFamily: theme.fonts.body,
              fontSize: u(26),
              lineHeight: 1.45,
              color: theme.colors.muted,
              textAlign: isVertical || credits.length <= 4 ? "center" : "left",
            }}
          >
            {credits.map((c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
        </Reveal>
      ) : null}
    </Stage>
  );
};
