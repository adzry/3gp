/**
 * Text that templates print on their own (not from props), per video language.
 * Set `"lang"` in video.json. Pure — Node tools import this via the schema.
 * Adding a language: add its code to LANGS and a full entry to STRINGS.
 */
import { z } from "zod";

export const LANGS = ["en", "ms"] as const;
export type Lang = (typeof LANGS)[number];
export const zLang = z.enum(LANGS);

export const STRINGS: Record<Lang, { source: string; distanceNote: string }> = {
  en: {
    source: "Source",
    distanceNote: "distance = great-circle, computed from coordinates",
  },
  ms: {
    source: "Sumber",
    distanceNote: "jarak = bulatan besar, dikira daripada koordinat",
  },
};
