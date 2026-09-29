import { Video } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { z } from "zod";
import { Kicker } from "../components/Kicker";
import { resolveSrc } from "../components/Media";
import { Stage } from "../components/Stage";
import { useLayout } from "../lib/layout";
import { useTheme } from "../styles";
import { useSceneDuration } from "../video/scene-context";
import type { footageSchema } from "./schemas";

const isVideo = (src: string) => /\.(mp4|webm|mov|mkv|m4v)$/i.test(src);

/**
 * A clip (or still) filling the frame: trim, crop by focus point, fit to any
 * aspect ratio, optional slow zoom and pan. Its length comes from the scene
 * (seconds or voice timing); scene transitions come from the theme.
 */
export const Footage: React.FC<z.input<typeof footageSchema>> = ({
  src,
  trimStart = 0,
  fit = "cover",
  focus = { x: 0.5, y: 0.5 },
  zoom = { from: 1, to: 1 },
  pan = { x: 0, y: 0 },
  volume = 0,
  playbackRate = 1,
  loop = false,
  dim = 0,
  label,
  credit,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = useSceneDuration();
  const theme = useTheme();
  const { u, safe } = useLayout();

  // Camera move over the whole scene; gentle ease so it never "snaps".
  const p = interpolate(frame, [0, Math.max(1, duration - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const scale = zoom.from + (zoom.to - zoom.from) * p;
  const media: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectPosition: `${focus.x * 100}% ${focus.y * 100}%`,
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: fit === "contain" ? "#000" : theme.colors.background,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          transform: `translate(${pan.x * p * 100}%, ${pan.y * p * 100}%) scale(${scale})`,
          // Zoom toward the focus point, so "crop" = focus + zoom.
          transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
        }}
      >
        {isVideo(src) ? (
          <Video
            src={resolveSrc(src)}
            objectFit={fit}
            style={media}
            trimBefore={Math.round(trimStart * fps)}
            playbackRate={playbackRate}
            loop={loop}
            muted={volume === 0}
            volume={() => volume}
          />
        ) : (
          <Img src={resolveSrc(src)} style={{ ...media, objectFit: fit }} />
        )}
      </AbsoluteFill>
      {dim > 0 ? (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />
      ) : null}
      {label ? (
        <Stage transparent justify="start">
          <Kicker text={label} />
        </Stage>
      ) : null}
      {credit ? (
        <div
          style={{
            position: "absolute",
            left: safe.x,
            bottom: safe.y * 0.5,
            fontFamily: theme.fonts.body,
            fontSize: u(24),
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          {credit}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
