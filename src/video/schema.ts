/**
 * The 3gp video format: a project is a list of scenes, each naming a template
 * and its props. This is the machine-readable "edit decision list" that both
 * Claude and the tools read and write (projects/<n>/video.json).
 *
 * Pure zod with explicit .ts imports so Node tools can import it directly.
 */
import { z } from "zod";
import { zThemeName } from "../styles/names.ts";
import * as T from "../templates/schemas.ts";
import { transcriptSchema } from "./transcript.ts";

const wordIndex = z.number().int().min(0);

/**
 * Voice-driven timing: where a scene starts (and, for the last scene, ends)
 * on the narration. Alternative to `seconds`. See src/video/timeline.ts.
 */
export const sceneTimingSchema = z.union([
  /** Inclusive word indices into the transcript (`npm run transcript -- <n>` lists them). */
  z.strictObject({ words: z.tuple([wordIndex, wordIndex]) }),
  /** Inclusive transcript segment indices. */
  z.strictObject({ segments: z.tuple([wordIndex, wordIndex]) }),
  /**
   * Start where these words are spoken (first match after the previous scene).
   * Survives re-recording better than indices. `through` optionally marks the last words.
   */
  z.strictObject({
    phrase: z.string().min(1),
    through: z.string().min(1).optional(),
  }),
  /** Explicit seconds on the video timeline. */
  z.strictObject({ from: z.number().min(0), to: z.number().positive() }),
]);

export type SceneTiming = z.infer<typeof sceneTimingSchema>;

const scene = <Name extends string, P extends z.ZodType>(
  template: Name,
  props: P,
) =>
  z.object({
    template: z.literal(template),
    /** Scene length in seconds (use this OR `timing`). */
    seconds: z.number().positive().optional(),
    /** Voice-driven timing (use this OR `seconds`). */
    timing: sceneTimingSchema.optional(),
    /** Show the video-level captions during this scene (default true). */
    captions: z.boolean().optional(),
    /** Label shown in Studio's timeline. */
    name: z.string().optional(),
    /** Override the video's theme for this scene only. */
    theme: zThemeName.optional(),
    props,
  });

export const sceneSchema = z.discriminatedUnion("template", [
  scene("TitleCard", T.titleCardSchema),
  scene("KineticText", T.kineticTextSchema),
  scene("LowerThird", T.lowerThirdSchema),
  scene("QuoteCard", T.quoteCardSchema),
  scene("MetricCard", T.metricCardSchema),
  scene("BarChart", T.barChartSchema),
  scene("CaptionedShort", T.captionedShortSchema),
  scene("LogoReveal", T.logoRevealSchema),
  scene("Footage", T.footageSchema),
]);

export type Scene = z.input<typeof sceneSchema>;
export type TemplateName = Scene["template"];

export const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

const compositionId = z
  .string()
  .regex(
    /^[a-zA-Z0-9-]+$/,
    "Only letters, numbers and hyphens (Remotion composition id rules)",
  );

export const videoSchema = z.object({
  id: compositionId,
  title: z.string(),
  fps: z.number().int().positive().default(30),
  format: z.enum(["landscape", "vertical", "square"]).default("landscape"),
  theme: zThemeName.default("studio"),
  /** Music bed (or any single audio track) for the whole video (path in public/). */
  audio: z
    .object({ src: z.string(), volume: z.number().min(0).max(1).default(1) })
    .optional(),
  /** Recorded narration + its transcript. Enables `timing` and `captions`. */
  voiceover: z
    .object({
      /** Audio file in public/, e.g. "projects/002-x/voiceover.wav". */
      src: z.string(),
      /** Transcript JSON in public/ (written by `npm run transcribe`). */
      transcript: z.string(),
      volume: z.number().min(0).max(1).default(1),
      /** Seconds into the video where the narration starts (room for an intro). */
      offset: z.number().min(0).default(0),
      /** Seconds the last voice-timed scene holds after the final word. */
      tail: z.number().min(0).default(1),
      /** Render without playing the narration (previews with a draft transcript). */
      mute: z.boolean().default(false),
    })
    .optional(),
  /** Word-by-word captions from the voice-over transcript, over every scene. */
  captions: z
    .object({
      enabled: z.boolean().default(true),
      position: z.enum(["bottom", "center"]).default("bottom"),
      /** Font size in 1080-px units. */
      size: z.number().positive().default(54),
      /** Words spoken within this window share a caption page. */
      combineMs: z.number().positive().default(1400),
    })
    .optional(),
  scenes: z.array(sceneSchema).min(1),
  /** Filled in at render time from `voiceover.transcript` — don't write by hand. */
  transcriptData: transcriptSchema.optional(),
});

export type VideoProps = z.input<typeof videoSchema>;

/** What a projects/<n>/video.json file contains. */
export const projectFileSchema = videoSchema.extend({
  $schema: z.string().optional(),
  /** Same content, different format/theme — rendered as extra compositions. */
  variants: z
    .array(
      z.object({
        id: compositionId,
        format: z.enum(["landscape", "vertical", "square"]).optional(),
        theme: zThemeName.optional(),
      }),
    )
    .default([]),
});

export type ProjectFile = z.input<typeof projectFileSchema>;

/** Expand a project file into the list of compositions it defines. */
export const expandProject = (file: ProjectFile): VideoProps[] => {
  const base: VideoProps & Partial<ProjectFile> = { ...file };
  const variants = file.variants ?? [];
  delete base.variants;
  delete base.$schema;
  return [base, ...variants.map((v) => ({ ...base, ...v }))];
};

export const sceneFrames = (seconds: number, fps: number) =>
  Math.round(seconds * fps);
