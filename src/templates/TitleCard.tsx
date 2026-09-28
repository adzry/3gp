import React from "react";
import type { z } from "zod";
import { Headline } from "../components/Headline";
import { Kicker } from "../components/Kicker";
import { Reveal } from "../components/Reveal";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";
import type { titleCardSchema } from "./schemas";

export const TitleCard: React.FC<z.input<typeof titleCardSchema>> = ({
  kicker,
  title,
  subtitle,
  emphasis = [],
  align = "left",
}) => {
  const theme = useTheme();
  const { u } = useLayout();
  return (
    <Stage align={align === "center" ? "center" : "start"} dots>
      {kicker ? <Kicker text={kicker} /> : null}
      <Headline
        text={title}
        delay={6}
        emphasis={emphasis}
        size={120}
        align={align}
        maxWidth={1500}
      />
      {subtitle ? (
        <Reveal delay={24} straight>
          <div
            style={{
              marginTop: u(40),
              fontSize: u(46),
              lineHeight: 1.3,
              color: theme.colors.muted,
              maxWidth: u(1200),
              textAlign: align,
            }}
          >
            {subtitle}
          </div>
        </Reveal>
      ) : null}
    </Stage>
  );
};
