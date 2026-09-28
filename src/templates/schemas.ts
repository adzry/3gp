/**
 * Props schemas for every template. Pure zod (no JSX) so Node tools can import
 * this file directly to validate project video.json files.
 *
 * Adding a template: add its schema here, its component in ./<Name>.tsx, and
 * register both in ./index.tsx.
 */
import { z } from "zod";

const emphasis = z
  .array(z.string())
  .default([])
  .describe(
    "Words/phrases that get the theme's emphasis device. One per scene is best.",
  );

export const titleCardSchema = z.object({
  kicker: z.string().optional().describe("Small label above the title."),
  title: z.string(),
  subtitle: z.string().optional(),
  emphasis,
  align: z.enum(["left", "center"]).default("left"),
});

export const kineticTextSchema = z.object({
  lines: z
    .array(z.string())
    .min(1)
    .describe("Shown one after another, evenly across the scene."),
  emphasis,
  size: z.number().default(150),
});

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  side: z.enum(["left", "right"]).default("left"),
  /** Optional still/video frame behind the lower third (path in public/). */
  background: z.string().optional(),
});

export const quoteCardSchema = z.object({
  quote: z.string(),
  author: z.string(),
  source: z.string().optional(),
  emphasis,
});

export const metricCardSchema = z.object({
  label: z.string(),
  value: z.number(),
  prefix: z.string().default(""),
  suffix: z.string().default(""),
  decimals: z.number().int().min(0).max(4).default(0),
  context: z.string().optional().describe("One line that explains the number."),
  source: z.string().optional(),
  annotate: z
    .boolean()
    .default(false)
    .describe("Draw a hand circle around the number."),
});

export const barChartSchema = z.object({
  title: z.string(),
  unit: z.string().default(""),
  data: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        highlight: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(8),
  annotation: z
    .string()
    .optional()
    .describe("Hand-written note on the highlighted bar."),
  source: z.string().optional(),
});

export const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

export const captionedShortSchema = z.object({
  headline: z.string().optional(),
  /** Background video or image in public/ (optional). */
  background: z.string().optional(),
  /** Inline captions... */
  captions: z.array(captionSchema).default([]),
  /** ...or a captions JSON file in public/ (from tools/captions). */
  captionsFile: z.string().optional(),
  /** Voice-over / audio file in public/. */
  audio: z.string().optional(),
});

export const logoRevealSchema = z.object({
  wordmark: z.string(),
  tagline: z.string().optional(),
  /** Optional logo image in public/. */
  logo: z.string().optional(),
});

const unit = z.number().min(0).max(1);

export const footageSchema = z.object({
  /** Video (or image) in public/, e.g. "projects/002-x/clip.mp4", or an https URL. */
  src: z.string(),
  /** Seconds to skip at the start of the source clip. */
  trimStart: z.number().min(0).default(0),
  /** cover = fill the frame and crop; contain = show everything (letterbox). */
  fit: z.enum(["cover", "contain"]).default("cover"),
  /**
   * The point of the source to keep in frame when cropping (0–1, 0.5 = centre).
   * This is how you crop: choose the focus, then zoom in.
   */
  focus: z.object({ x: unit, y: unit }).default({ x: 0.5, y: 0.5 }),
  /** Scale at scene start → end. 1 = no zoom; 1.0→1.12 = slow push-in (Ken Burns). */
  zoom: z
    .object({
      from: z.number().min(0.5).max(4),
      to: z.number().min(0.5).max(4),
    })
    .default({ from: 1, to: 1 }),
  /** Drift over the scene, as a fraction of the frame (x: -0.04 = 4% to the left). */
  pan: z
    .object({
      x: z.number().min(-0.5).max(0.5),
      y: z.number().min(-0.5).max(0.5),
    })
    .default({ x: 0, y: 0 }),
  /** Source audio level (0 = muted; narration usually carries the sound). */
  volume: z.number().min(0).max(1).default(0),
  playbackRate: z.number().min(0.25).max(4).default(1),
  /** Loop the clip if it is shorter than the scene. */
  loop: z.boolean().default(false),
  /** Darken the footage (0–0.8) so captions/overlays read. */
  dim: z.number().min(0).max(0.8).default(0),
  /** Optional label (kicker style), top-left. */
  label: z.string().optional(),
  /** Attribution / source credit, bottom-left. Required by many stock licences. */
  credit: z.string().optional(),
});
