import React, { createContext, useContext } from "react";
import { STRINGS, type Lang } from "./lang";

const LangContext = createContext<Lang>("en");

export const LangProvider: React.FC<{
  lang: Lang;
  children: React.ReactNode;
}> = ({ lang, children }) => (
  <LangContext.Provider value={lang}>{children}</LangContext.Provider>
);

/** UI strings in the video's language (see src/lib/lang.ts). */
export const useStrings = () => STRINGS[useContext(LangContext)] ?? STRINGS.en;
