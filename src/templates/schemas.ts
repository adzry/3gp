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

export const lineChartSchema = z.object({
  title: z.string(),
  unit: z.string().default(""),
  /** Points in order (x labels, e.g. years). 2–24 points. */
  data: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .min(2)
    .max(24),
  /** Index of the point to call out (circle + note). */
  highlight: z.number().int().min(0).optional(),
  annotation: z
    .string()
    .optional()
    .describe("Hand-written note at the highlighted point."),
  /** Start the y-axis at zero (honest default) or fit to the data range. */
  zeroBased: z.boolean().default(true),
  source: z.string().optional(),
});

const comparisonSide = z.object({
  label: z.string().describe('Small header, e.g. "Before", "Plan A".'),
  title: z.string(),
  points: z.array(z.string()).max(5).default([]),
  /** Optional image/video in public/ shown at the top of the panel. */
  media: z.string().optional(),
});

export const comparisonSchema = z.object({
  title: z.string().optional(),
  left: comparisonSide,
  right: comparisonSide,
  /** Which side is the answer: gets the accent. "none" = neutral comparison. */
  winner: z.enum(["left", "right", "none"]).default("right"),
});

export const endCardSchema = z.object({
  headline: z.string().describe("Call to action or closing line."),
  subline: z.string().optional().describe("URL, handle, or next step."),
  /** Credits / attributions, one per line (e.g. required by stock licences). */
  credits: z.array(z.string()).max(12).default([]),
});

export const mapRouteSchema = z.object({
  title: z.string().optional(),
  /** 2–8 stops in travel order. Coordinates in decimal degrees (WGS84). */
  stops: z
    .array(
      z.object({
        name: z.string(),
        lon: z.number().min(-180).max(180),
        lat: z.number().min(-85).max(85),
      }),
    )
    .min(2)
    .max(8),
  /** arc = great-circle path (flights, shipping); line = straight on the map. */
  path: z.enum(["arc", "line"]).default("arc"),
  /** Country names to tint (Natural Earth names, e.g. "Malaysia", "United Kingdom"). */
  highlight: z.array(z.string()).default([]),
  /** Show the computed great-circle distance of the route. */
  showDistance: z.boolean().default(true),
  /** Extra room around the stops (fraction of the route's size). */
  padding: z.number().min(0).max(2).default(0.35),
  source: z.string().optional(),
});
