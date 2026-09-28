import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Animated number. Formats with thousands separators. */
export const CountUp: React.FC<{
  value: number;
  from?: number;
  delay?: number;
  seconds?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}> = ({
  value,
  from = 0,
  delay = 0,
  seconds = 1.4,
  decimals = 0,
  prefix = "",
  suffix = "",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = interpolate(frame - delay, [0, seconds * fps], [from, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const text = v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};
