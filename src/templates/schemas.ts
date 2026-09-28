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
