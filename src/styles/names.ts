import { z } from "zod";

/** Keep in sync with THEMES in ./index.tsx (typecheck enforces it). */
export const THEME_NAMES = ["studio", "vox-editorial"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];
export const zThemeName = z.enum(THEME_NAMES);
