/**
 * Remotion CLI config (studio + render). Node APIs ignore this file.
 * All options: https://remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Use a preinstalled Chromium if one is provided (CI, cloud containers).
// Otherwise Remotion downloads its own Chrome Headless Shell on first render.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
