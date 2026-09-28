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

const scene = <Name extends string, P extends z.ZodType>(
  template: Name,
  props: P,
) =>
  z.object({
    template: z.literal(template),
    /** Scene length in seconds. */
    seconds: z.number().positive(),
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
  /** Music bed or voice-over for the whole video (path in public/). */
  audio: z
    .object({ src: z.string(), volume: z.number().min(0).max(1).default(1) })
    .optional(),
  scenes: z.array(sceneSchema).min(1),
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

export const totalFrames = (video: VideoProps) =>
  video.scenes.reduce(
    (sum, s) => sum + sceneFrames(s.seconds, video.fps ?? 30),
    0,
  );
