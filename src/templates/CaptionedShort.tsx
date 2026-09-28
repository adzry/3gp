import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, useDelayRender } from "remotion";
import type { z } from "zod";
import { Captions } from "../components/Captions";
import { Kicker } from "../components/Kicker";
import { BackgroundMedia, resolveSrc } from "../components/Media";
import { Stage } from "../components/Stage";
import type { captionedShortSchema } from "./schemas";

/**
 * Vertical short: background media + optional VO + word-timed captions.
 * Captions come inline or from a JSON file made by tools/captions.
 */
export const CaptionedShort: React.FC<z.input<typeof captionedShortSchema>> = ({
  headline,
  background,
  captions = [],
  captionsFile,
  audio,
}) => {
  const loaded = useCaptionsFile(captionsFile);
  const all = captionsFile ? (loaded ?? []) : captions;
  return (
    <AbsoluteFill>
      {background ? <BackgroundMedia src={background} dim={0.35} /> : null}
      <Stage justify="start" dots transparent={Boolean(background)}>
        {headline ? <Kicker text={headline} /> : null}
      </Stage>
      {audio ? <Audio src={resolveSrc(audio)} /> : null}
      <Captions
        captions={all}
        position={background ? "bottom" : "center"}
        size={78}
      />
    </AbsoluteFill>
  );
};

const useCaptionsFile = (file?: string) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() =>
    file ? delayRender(`captions ${file}`) : null,
  );
  useEffect(() => {
    if (!file || handle === null) return;
    fetch(resolveSrc(file))
      .then((r) => r.json())
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [file, handle, continueRender, cancelRender]);
  return captions;
};
