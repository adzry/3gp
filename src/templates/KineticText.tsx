import React from "react";
import { Sequence } from "remotion";
import type { z } from "zod";
import { Headline } from "../components/Headline";
import { Stage } from "../components/Stage";
import { useSceneDuration } from "../video/scene-context";
import type { kineticTextSchema } from "./schemas";

/** One punchy line at a time, evenly spread across the scene. */
export const KineticText: React.FC<z.input<typeof kineticTextSchema>> = ({
  lines,
  emphasis = [],
  size = 150,
}) => {
  const duration = useSceneDuration();
  const per = Math.floor(duration / lines.length);
  return (
    <Stage align="center" dots>
      {lines.map((line, i) => (
        <Sequence
          key={i}
          from={i * per}
          durationInFrames={i === lines.length - 1 ? duration - i * per : per}
          layout="none"
        >
          <Headline
            text={line}
            emphasis={emphasis}
            size={size}
            align="center"
            maxWidth={1600}
          />
        </Sequence>
      ))}
    </Stage>
  );
};
