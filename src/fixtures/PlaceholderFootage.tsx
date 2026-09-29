import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Procedural stand-in "footage" for testing the Footage template before real
 * clips exist: drifting shapes, a burned-in timecode (verifies trimStart),
 * centre crosshair and corner labels (verify crop / focus / zoom).
 * Rendered to public/fixtures/placeholder-footage.mp4 by `npm run fixtures`.
 * Deliberately generic: it is a test pattern, not content.
 */
export const PlaceholderFootage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const blobs = [
    { c: "#3a6ea5", r: 520, x: 0.25, y: 0.35, sx: 0.07, sy: 0.05 },
    { c: "#c0504d", r: 380, x: 0.7, y: 0.6, sx: -0.05, sy: 0.06 },
    { c: "#9bbb59", r: 300, x: 0.55, y: 0.25, sx: 0.04, sy: -0.04 },
  ];
  const label: React.CSSProperties = {
    position: "absolute",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 34,
    color: "rgba(255,255,255,0.85)",
  };
  return (
    <AbsoluteFill style={{ background: "#1d2733", overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: "50%",
            background: b.c,
            opacity: 0.55,
            filter: "blur(40px)",
            left: (b.x + Math.sin(t * 0.6 + i) * b.sx) * width - b.r,
            top: (b.y + Math.cos(t * 0.5 + i) * b.sy) * height - b.r,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.08) 2px, transparent 2px)",
          backgroundSize: "120px 120px",
          backgroundPosition: `${-frame * 2}px 0`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width / 2 - 60,
          top: height / 2 - 1,
          width: 120,
          height: 2,
          background: "#fff",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width / 2 - 1,
          top: height / 2 - 60,
          width: 2,
          height: 120,
          background: "#fff",
        }}
      />
      <div style={{ ...label, left: 40, top: 30 }}>TOP-LEFT</div>
      <div style={{ ...label, right: 40, top: 30 }}>TOP-RIGHT</div>
      <div style={{ ...label, left: 40, bottom: 30 }}>BOTTOM-LEFT</div>
      <div style={{ ...label, right: 40, bottom: 30 }}>BOTTOM-RIGHT</div>
      <div
        style={{
          ...label,
          left: 0,
          right: 0,
          top: height / 2 + 90,
          textAlign: "center",
          fontSize: 64,
          color: "#fff",
        }}
      >
        {`src ${t.toFixed(2)}s · f${frame}`}
      </div>
      <div
        style={{
          ...label,
          left: 0,
          right: 0,
          top: height / 2 - 180,
          textAlign: "center",
          fontSize: 30,
        }}
      >
        PLACEHOLDER FOOTAGE — replace with a real clip
      </div>
    </AbsoluteFill>
  );
};
