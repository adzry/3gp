/**
 * Every media file a video references, with path rules. Used by
 * `npm run validate` (which also checks the files exist in public/).
 * Pure, explicit .ts imports for Node.
 */
import type { VideoProps } from "./schema.ts";

export const MEDIA_EXTENSIONS = {
  audio: ["wav", "mp3", "m4a", "aac", "ogg", "flac"],
  video: ["mp4", "webm", "mov", "mkv", "m4v"],
  image: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
  json: ["json"],
} as const;

type Kind = keyof typeof MEDIA_EXTENSIONS | "visual";

export type MediaRef = { path: string; kind: Kind; where: string };

const allowed = (kind: Kind): readonly string[] =>
  kind === "visual"
    ? [...MEDIA_EXTENSIONS.video, ...MEDIA_EXTENSIONS.image]
    : MEDIA_EXTENSIONS[kind];

export const isRemote = (p: string) => /^https?:\/\//.test(p);

export const collectMediaRefs = (video: VideoProps): MediaRef[] => {
  const refs: MediaRef[] = [];
  const add = (path: string | undefined, kind: Kind, where: string) => {
    if (path) refs.push({ path, kind, where });
  };
  add(video.audio?.src, "audio", "audio.src");
  add(video.voiceover?.src, "audio", "voiceover.src");
  add(video.voiceover?.transcript, "json", "voiceover.transcript");
  video.scenes.forEach((scene, i) => {
    const at = `scenes.${i}.props`;
    switch (scene.template) {
      case "Footage":
        add(scene.props.src, "visual", `${at}.src`);
        break;
      case "LowerThird":
        add(scene.props.background, "visual", `${at}.background`);
        break;
      case "CaptionedShort":
        add(scene.props.background, "visual", `${at}.background`);
        add(scene.props.audio, "audio", `${at}.audio`);
        add(scene.props.captionsFile, "json", `${at}.captionsFile`);
        break;
      case "Comparison":
        add(scene.props.left.media, "visual", `${at}.left.media`);
        add(scene.props.right.media, "visual", `${at}.right.media`);
        break;
      case "LogoReveal":
        add(scene.props.logo, "image", `${at}.logo`);
        break;
      default:
        break;
    }
  });
  return refs;
};

/** Path-shape problems (existence is checked by the Node tool). */
export const checkMediaPath = (ref: MediaRef): string | null => {
  const p = ref.path;
  if (isRemote(p)) return null;
  if (p.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(p)) {
    return `${ref.where}: "${p}" is absolute — use a path relative to public/, e.g. "projects/002-x/clip.mp4"`;
  }
  if (p.startsWith("public/"))
    return `${ref.where}: "${p}" — drop the "public/" prefix`;
  if (p.split(/[\\/]/).includes(".."))
    return `${ref.where}: "${p}" must not contain ".."`;
  if (p.includes("\\")) return `${ref.where}: "${p}" — use forward slashes`;
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  if (!allowed(ref.kind).includes(ext)) {
    return `${ref.where}: ".${ext}" is not a supported ${ref.kind} format (${allowed(ref.kind).join(", ")})`;
  }
  return null;
};
