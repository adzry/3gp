import React from "react";
import { useCurrentFrame } from "remotion";
import { useTheme } from "../../../src/styles";
import { useScene } from "../../../src/video/scene-context";
import {
  BlueDot,
  EASE,
  Label,
  SERIF,
  Starfield,
  ramp,
  useFrameGeo,
  useSeconds,
} from "./art";

/**
 * The hold after the last word: the same single dot as the cold open, the
 * title, and every source — then dark.
 */
export const Credits: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = useSeconds();
  const { durationInFrames } = useScene();
  const { W, H, u, dot, landscape, isVertical } = useFrameGeo();

  const title = ramp(frame, s(0.9), s(0.8));
  const sources = ramp(frame, s(1.5), s(0.8));
  const out = ramp(frame, durationInFrames - s(1.1), s(1), EASE.in);
  return (
    <>
      <Starfield opacity={0.35 * (1 - out)} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
        <BlueDot x={dot.x} y={dot.y} r={u(15)} pulse={frame / s(1.6)} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: dot.y + u(110),
          textAlign: "center",
          padding: `0 ${u(80)}px`,
          opacity: 1 - out,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: u(landscape ? 76 : 70),
            color: theme.colors.text,
            opacity: title,
            transform: `translateY(${(1 - title) * u(14)}px)`,
          }}
        >
          Einstein <span style={{ fontStyle: "italic", color: theme.colors.accent }}>in your pocket</span>
        </div>
        <div style={{ opacity: sources, marginTop: u(isVertical ? 60 : 44), display: "grid", gap: u(10) }}>
          <Label size={17}>
            Sources · GPS.gov (Space Segment) · R. Pogge, Ohio State University · GPS World · NIST · IS-GPS interface specification
          </Label>
          <Label size={17}>
            Narration: synthetic scratch voice (RHVoice) · Map: Natural Earth · Music: generated · Diagrams schematic
          </Label>
        </div>
      </div>
    </>
  );
};
