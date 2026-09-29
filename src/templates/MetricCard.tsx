import React from "react";
import type { z } from "zod";
import { CountUp } from "../components/CountUp";
import { HandCircle } from "../components/HandCircle";
import { Kicker } from "../components/Kicker";
import { Reveal } from "../components/Reveal";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { useStrings } from "../lib/strings";
import { useTheme } from "../styles";
import type { metricCardSchema } from "./schemas";

/** One number, big, with the sentence that makes it mean something. */
export const MetricCard: React.FC<z.input<typeof metricCardSchema>> = ({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  context,
  source,
  annotate = false,
}) => {
  const theme = useTheme();
  const { u } = useLayout();
  const number = (
    <CountUp
      value={value}
      prefix={prefix}
      suffix={suffix}
      decimals={decimals}
      delay={8}
    />
  );
  return (
    <Stage dots>
      <Kicker text={label} />
      <Reveal delay={4} seed={11}>
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontWeight: theme.display.weight,
            letterSpacing: theme.display.letterSpacing,
            fontSize: u(260),
            lineHeight: 1,
          }}
        >
          {annotate ? <HandCircle delay={60}>{number}</HandCircle> : number}
        </div>
      </Reveal>
      {context ? (
        <Reveal delay={30} straight>
          <div
            style={{
              marginTop: u(36),
              fontSize: u(48),
              lineHeight: 1.3,
              maxWidth: u(1300),
              color: theme.colors.text,
            }}
          >
            {context}
          </div>
        </Reveal>
      ) : null}
      {source ? <SourceLine text={source} /> : null}
    </Stage>
  );
};

export const SourceLine: React.FC<{ text: string }> = ({ text }) => {
  const theme = useTheme();
  const t = useStrings();
  const { u, safe } = useLayout();
  return (
    <div
      style={{
        position: "absolute",
        left: safe.x,
        bottom: safe.y * 0.6,
        fontSize: u(26),
        color: theme.colors.muted,
        fontFamily: theme.fonts.body,
      }}
    >
      {t.source}: {text}
    </div>
  );
};
