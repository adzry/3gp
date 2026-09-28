import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Series,
  useVideoConfig,
} from "remotion";
import { SceneShell } from "../components/SceneShell";
import { resolveSrc } from "../components/Media";
import { loadFonts } from "../lib/fonts";
import { THEMES, ThemeProvider } from "../styles";
import { TEMPLATES } from "../templates";
import { SceneDurationContext } from "./scene-context";
import { FORMATS, sceneFrames, totalFrames, type VideoProps } from "./schema";

loadFonts();

/** Renders any 3gp video definition: scenes in sequence, themed, with audio. */
export const SceneVideo: React.FC<VideoProps> = ({
  theme = "studio",
  scenes,
  audio,
}) => {
  const { fps } = useVideoConfig();
  return (
    <ThemeProvider name={theme}>
      <AbsoluteFill
        style={{ backgroundColor: THEMES[theme].colors.background }}
      >
        <Series>
          {scenes.map((scene, i) => {
            const frames = sceneFrames(scene.seconds, fps);
            const Template = TEMPLATES[scene.template] as React.FC<
              typeof scene.props
            >;
            return (
              <Series.Sequence
                key={i}
                name={scene.name ?? `${i + 1}. ${scene.template}`}
                durationInFrames={frames}
              >
                <ThemeProvider name={scene.theme ?? theme}>
                  <SceneDurationContext.Provider value={frames}>
                    <SceneShell
                      durationInFrames={frames}
                      isFirst={i === 0}
                      isLast={i === scenes.length - 1}
                    >
                      <Template {...scene.props} />
                    </SceneShell>
                  </SceneDurationContext.Provider>
                </ThemeProvider>
              </Series.Sequence>
            );
          })}
        </Series>
        {audio ? (
          <Audio src={resolveSrc(audio.src)} volume={() => audio.volume ?? 1} />
        ) : null}
      </AbsoluteFill>
    </ThemeProvider>
  );
};

/** Duration and size come from the data, never hard-coded. */
export const calculateVideoMetadata: CalculateMetadataFunction<VideoProps> = ({
  props,
}) => {
  const fps = props.fps ?? 30;
  const { width, height } = FORMATS[props.format ?? "landscape"];
  return {
    fps,
    width,
    height,
    durationInFrames: Math.max(1, totalFrames({ ...props, fps })),
  };
};
