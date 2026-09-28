/**
 * Fonts are bundled from @fontsource (SIL OFL 1.1) so renders are offline and
 * reproducible. loadFont() blocks rendering until each face is ready.
 * To add a family: `npm i @fontsource/<family>`, import the woff2 files here,
 * and record the license in research/licensing.md.
 */
import { loadFont } from "@remotion/fonts";
import archivoBlack400 from "@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2";
import caveat500 from "@fontsource/caveat/files/caveat-latin-500-normal.woff2";
import caveat700 from "@fontsource/caveat/files/caveat-latin-700-normal.woff2";
import inter400 from "@fontsource/inter/files/inter-latin-400-normal.woff2";
import inter500 from "@fontsource/inter/files/inter-latin-500-normal.woff2";
import inter700 from "@fontsource/inter/files/inter-latin-700-normal.woff2";
import inter800 from "@fontsource/inter/files/inter-latin-800-normal.woff2";
import mono500 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2";

const faces: [family: string, url: string, weight: string][] = [
  ["Inter", inter400, "400"],
  ["Inter", inter500, "500"],
  ["Inter", inter700, "700"],
  ["Inter", inter800, "800"],
  ["Archivo Black", archivoBlack400, "400"],
  ["Caveat", caveat500, "500"],
  ["Caveat", caveat700, "700"],
  ["JetBrains Mono", mono500, "500"],
];

let loaded = false;

export const loadFonts = () => {
  if (loaded) return;
  loaded = true;
  for (const [family, url, weight] of faces) {
    loadFont({ family, url, weight, format: "woff2" });
  }
};
