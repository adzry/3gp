import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Captions } from "../components/Captions";
import { SceneShell } from "../components/SceneShell";
import { resolveSrc } from "../components/Media";
import { loadFonts } from "../lib/fonts";
import { LangProvider } from "../lib/strings";
import { THEMES, ThemeProvider } from "../styles";
import { TEMPLATES } from "../templates";
import { SceneDurationContext } from "./scene-context";
import { musicEnvelope } from "./music";
import { FORMATS, type VideoProps } from "./schema";
import { resolveTimelineOrThrow, type Timeline } from "./timeline";
import { parseTranscript, transcriptToCaptions } from "./transcript";

loadFonts();

/**
 * Renders any 3gp video definition: scenes in sequence (fixed or
 * voice-timed), themed, with music, narration and transcript captions.
 */
export const SceneVideo: React.FC<VideoProps> = (video) => {
  const {
    theme = "studio",
    scenes,
    audio,
    voiceover,
    captions,
    transcriptData,
  } = video;
  // calculateMetadata already validated the timing; this re-derives the same
  // (pure) result so the component needs nothing but its props.
  const timeline = useMemo(
    () => resolveTimelineOrThrow(video, transcriptData),
    [video, transcriptData],
  );
  const musicVolume = useMemo(
    () => musicEnvelope(video, timeline, transcriptData),
    [video, timeline, transcriptData],
  );
  const captionData = useMemo(
    () =>
      transcriptData
        ? transcriptToCaptions(transcriptData, voiceover?.offset ?? 0)
        : [],
    [transcriptData, voiceover?.offset],
  );

  return (
    <LangProvider lang={video.lang ?? "en"}>
      <ThemeProvider name={theme}>
        <AbsoluteFill
          style={{ backgroundColor: THEMES[theme].colors.background }}
        >
          {scenes.map((scene, i) => {
            const { startFrame, durationInFrames } = timeline.scenes[i];
            const Template = TEMPLATES[scene.template] as React.FC<
              typeof scene.props
            >;
            return (
              <Sequence
                key={i}
                from={startFrame}
                durationInFrames={durationInFrames}
                name={scene.name ?? `${i + 1}. ${scene.template}`}
              >
                <ThemeProvider name={scene.theme ?? theme}>
                  <SceneDurationContext.Provider value={durationInFrames}>
                    <SceneShell
                      durationInFrames={durationInFrames}
                      isFirst={i === 0}
                      isLast={i === scenes.length - 1}
                    >
                      <Template {...scene.props} />
                    </SceneShell>
                  </SceneDurationContext.Provider>
                </ThemeProvider>
              </Sequence>
            );
          })}
          {captions && captions.enabled !== false && captionData.length ? (
            <SceneCaptionsGate video={video} timeline={timeline}>
              <Captions
                captions={captionData}
                position={captions.position}
                size={captions.size}
                combineMs={captions.combineMs}
                plate
              />
            </SceneCaptionsGate>
          ) : null}
          {audio ? (
            <Audio
              src={resolveSrc(audio.src)}
              name="Music"
              loop={audio.loop ?? true}
              trimBefore={Math.round((audio.trimStart ?? 0) * timeline.fps)}
              volume={(f) => musicVolume(f)}
            />
          ) : null}
          {voiceover && !voiceover.mute ? (
            <Sequence
              from={Math.round((voiceover.offset ?? 0) * timeline.fps)}
              name="Voice-over"
              layout="none"
            >
              <Audio
                src={resolveSrc(voiceover.src)}
                volume={() => voiceover.volume ?? 1}
              />
            </Sequence>
          ) : null}
        </AbsoluteFill>
      </ThemeProvider>
    </LangProvider>
  );
};

/** Hides the caption overlay during scenes with `captions: false`. */
const SceneCaptionsGate: React.FC<{
  video: VideoProps;
  timeline: Timeline;
  children: React.ReactNode;
}> = ({ video, timeline, children }) => {
  const frame = useCurrentFrame();
  const current = timeline.scenes.find(
    (s) => frame >= s.startFrame && frame < s.startFrame + s.durationInFrames,
  );
  const hidden = current
    ? video.scenes[current.index].captions === false
    : false;
  return hidden ? null : <AbsoluteFill>{children}</AbsoluteFill>;
};

/**
 * Size and duration come from the data. For voice-first videos this loads the
 * transcript (once) and passes it to the component as `transcriptData`.
 */
export const calculateVideoMetadata: CalculateMetadataFunction<
  VideoProps
> = async ({ props, abortSignal }) => {
  const fps = props.fps ?? 30;
  const { width, height } = FORMATS[props.format ?? "landscape"];
  let transcriptData = props.transcriptData;
  let voiceover = props.voiceover;
  if (!transcriptData && voiceover) {
    const load = async (p: string) => {
      const url = /^https?:\/\//.test(p) ? p : staticFile(p);
      const res = await fetch(url, { signal: abortSignal });
      return res.ok ? parseTranscript(await res.json()) : null;
    };
    transcriptData = (await load(voiceover.transcript)) ?? undefined;
    if (!transcriptData) {
      // Not recorded/transcribed yet: fall back to the DRAFT transcript (timing
      // estimated from the script) so Studio can preview and listing works.
      // The narration is muted — there is nothing real to play. `npm run
      // render` refuses this state unless --draft is given.
      const draftPath = voiceover.transcript
        .replace(/(\.json)?$/, ".draft.json")
        .replace(".json.draft.json", ".draft.json");
      transcriptData = (await load(draftPath)) ?? undefined;
      if (!transcriptData) {
        throw new Error(
          `Transcript not found: public/${voiceover.transcript}. Run \`npm run transcribe -- <project>\` (or \`npm run transcript -- draft <project>\` for a draft to preview with).`,
        );
      }
      console.warn(
        `[3gp] ${props.id}: using DRAFT transcript ${draftPath} — voice-over muted until recorded and transcribed.`,
      );
      voiceover = { ...voiceover, mute: true };
    }
  }
  const timeline = resolveTimelineOrThrow({ ...props, fps }, transcriptData);
  return {
    fps,
    width,
    height,
    durationInFrames: Math.max(1, timeline.durationInFrames),
    props: { ...props, voiceover, transcriptData },
  };
};
