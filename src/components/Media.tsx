import { Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

const isVideo = (src: string) => /\.(mp4|webm|mov|mkv)$/i.test(src);
const resolve = (src: string) =>
  /^https?:\/\//.test(src) ? src : staticFile(src);

/** Full-bleed background image or (muted) video from public/ or a URL. */
export const BackgroundMedia: React.FC<{ src: string; dim?: number }> = ({
  src,
  dim = 0,
}) => (
  <AbsoluteFill>
    {isVideo(src) ? (
      <Video
        src={resolve(src)}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    ) : (
      <Img
        src={resolve(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    )}
    {dim > 0 ? (
      <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />
    ) : null}
  </AbsoluteFill>
);

export const resolveSrc = resolve;

/** Image or (muted, looping) video that fills its box — for panels and cards. */
export const InlineMedia: React.FC<{
  src: string;
  style?: React.CSSProperties;
}> = ({ src, style }) =>
  isVideo(src) ? (
    <div style={{ overflow: "hidden", ...style }}>
      <Video
        src={resolve(src)}
        muted
        loop
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  ) : (
    <Img src={resolve(src)} style={{ objectFit: "cover", ...style }} />
  );
