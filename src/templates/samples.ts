import type { Scene } from "../video/schema";

/** Timed words for the captions sample: [word, startMs, endMs]. */
const words: [string, number, number][] = [
  ["Every", 200, 520],
  [" reusable", 520, 1000],
  [" animation", 1000, 1600],
  [" becomes", 1700, 2100],
  [" a", 2100, 2250],
  [" component.", 2250, 3000],
  [" Every", 3300, 3600],
  [" workflow", 3600, 4100],
  [" becomes", 4100, 4500],
  [" a", 4500, 4600],
  [" recipe.", 4600, 5400],
];

/**
 * One example scene per template. These drive the Studio gallery
 * (Templates folder) and double as copy-paste examples for video.json.
 */
export const SAMPLES: Scene[] = [
  {
    template: "TitleCard",
    seconds: 4,
    props: {
      kicker: "Explainer",
      title: "Why small screens changed video",
      subtitle: "A two-minute history of the pixel budget.",
      emphasis: ["small screens"],
    },
  },
  {
    template: "KineticText",
    seconds: 4.5,
    props: {
      lines: ["Less footage.", "More meaning.", "Every frame on purpose."],
      emphasis: ["on purpose"],
    },
  },
  {
    template: "LowerThird",
    seconds: 4,
    props: { name: "Ada Example", role: "Motion designer, 3gp lab" },
  },
  {
    template: "QuoteCard",
    seconds: 5,
    props: {
      quote: "Every reusable animation should become a component.",
      author: "3gp",
      source: "production principle",
      emphasis: ["component"],
    },
  },
  {
    template: "MetricCard",
    seconds: 4,
    props: {
      label: "Pixels in a 1080p frame",
      value: 2073600,
      context: "1920 × 1080 — about 82 times a 176 × 144 QCIF frame.",
      annotate: true,
    },
  },
  {
    template: "BarChart",
    seconds: 5,
    props: {
      title: "Pixels per frame",
      data: [
        { label: "QCIF", value: 25344 },
        { label: "480p", value: 409920 },
        { label: "720p", value: 921600 },
        { label: "1080p", value: 2073600, highlight: true },
      ],
      annotation: "≈82× QCIF",
      source: "width × height of each resolution",
    },
  },
  {
    template: "CaptionedShort",
    seconds: 6,
    props: {
      headline: "3gp principles",
      captions: words.map(([text, startMs, endMs]) => ({
        text,
        startMs,
        endMs,
        timestampMs: null,
        confidence: null,
      })),
    },
  },
  {
    // Needs `npm run fixtures` (placeholder clip) — or point src at a real clip.
    template: "Footage",
    seconds: 5,
    props: {
      src: "fixtures/placeholder-footage.mp4",
      trimStart: 2,
      focus: { x: 0.5, y: 0.5 },
      zoom: { from: 1, to: 1.15 },
      pan: { x: -0.03, y: 0 },
      label: "Footage",
      credit: "Placeholder test pattern (3gp)",
    },
  },
  {
    template: "LogoReveal",
    seconds: 3.5,
    props: { wordmark: "3gp", tagline: "Idea → 3gp → Claude → video" },
  },
];
