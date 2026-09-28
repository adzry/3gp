import React from "react";
import { interpolate, random } from "remotion";
import { useLayout } from "../lib/layout";
import { useEnter } from "../lib/motion";
import { useTheme } from "../styles";

/**
 * The default entrance for any element. Uses the theme's entrance:
 *  - rise: fade + small upward travel (clean, modern)
 *  - slap: paper slap-in — scale 1.15→1 and settle slightly crooked (editorial)
 */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  /** Seed for the crooked settle angle, so siblings don't all tilt alike. */
  seed?: number;
  /** Force an entrance regardless of theme. */
  variant?: "rise" | "slap" | "fade";
  /** Disable the resting tilt (e.g. for long body text). */
  straight?: boolean;
  style?: React.CSSProperties;
  as?: "div" | "span";
}> = ({
  children,
  delay = 0,
  seed = 0,
  variant,
  straight = false,
  style,
  as = "div",
}) => {
  const theme = useTheme();
  const { u } = useLayout();
  const p = useEnter(delay);
  const kind = variant ?? theme.entrance;

  const restTilt = straight
    ? 0
    : (random(`tilt-${seed}`) > 0.5 ? 1 : -1) * theme.tilt;
  let transform = "";
  if (kind === "rise") {
    transform = `translateY(${interpolate(p, [0, 1], [u(40), 0])}px)`;
  } else if (kind === "slap") {
    const scale = interpolate(p, [0, 1], [1.15, 1]);
    const rot = interpolate(p, [0, 1], [restTilt * 3, restTilt]);
    transform = `scale(${scale}) rotate(${rot}deg)`;
  }
  const Tag = as;
  return (
    <Tag
      style={{
        display: as === "span" ? "inline-block" : undefined,
        opacity: interpolate(p, [0, 0.6], [0, 1], {
          extrapolateRight: "clamp",
        }),
        transform,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};
