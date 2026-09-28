import React, { createContext, useContext } from "react";
import type { ThemeName } from "./names";
import { studio } from "./studio/tokens";
import type { Theme } from "./types";
import { voxEditorial } from "./vox-editorial/tokens";

export type { Theme } from "./types";
export { THEME_NAMES, zThemeName, type ThemeName } from "./names";

/** Register new style packs here and in ./names.ts. */
export const THEMES: Record<ThemeName, Theme> = {
  studio,
  "vox-editorial": voxEditorial,
};

const ThemeContext = createContext<Theme>(studio);

export const ThemeProvider: React.FC<{
  name: ThemeName;
  children: React.ReactNode;
}> = ({ name, children }) => (
  <ThemeContext.Provider value={THEMES[name] ?? studio}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
