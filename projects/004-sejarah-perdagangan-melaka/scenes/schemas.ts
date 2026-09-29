/**
 * Props of this project's bespoke scenes. Pure zod (Node's `npm run validate`
 * imports it): every custom scene used in video.json is declared here.
 */
import { z } from "zod";

export const SCENE_SCHEMAS = {
  /** Tomé Pires' line, staged as the geography it describes. */
  ThroatOfVenice: z
    .object({
      kicker: z.string(),
      quote: z.string(),
      /** The phrase the highlighter lands on (must be in `quote`). */
      emphasis: z.string(),
      attribution: z.string(),
      labels: z.object({
        strait: z.string(),
        melaka: z.string(),
        venice: z.string(),
        maluku: z.string(),
      }),
      source: z.string(),
      /** Narration phrases the beats land on, when there is a voice-over. */
      cues: z
        .object({ quote: z.string(), grip: z.string() })
        .default({ quote: "sesiapa", grip: "mencengkam leher Venice" }),
    })
    .refine((p) => p.quote.toLowerCase().includes(p.emphasis.toLowerCase()), {
      message: "emphasis must appear in quote",
      path: ["emphasis"],
    }),
};
