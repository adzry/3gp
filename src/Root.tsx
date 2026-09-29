import React from "react";
import { Composition, Folder } from "remotion";
import { PROJECTS } from "../projects";
import { PlaceholderFootage } from "./fixtures/PlaceholderFootage";
import { SAMPLES } from "./templates/samples";
import { SceneVideo, calculateVideoMetadata } from "./video/SceneVideo";
import {
  expandProject,
  projectFileSchema,
  videoSchema,
  type VideoProps,
} from "./video/schema";

const VideoComposition: React.FC<{ video: VideoProps }> = ({ video }) => (
  <Composition
    id={video.id}
    component={SceneVideo}
    schema={videoSchema}
    defaultProps={video}
    calculateMetadata={calculateVideoMetadata}
    // Real values come from calculateMetadata; these are placeholders.
    durationInFrames={1}
    fps={30}
    width={1920}
    height={1080}
  />
);

// Footage's sample needs the generated fixture clip; keep the galleries self-contained.
const GALLERY = SAMPLES.filter((s) => s.template !== "Footage");

export const RemotionRoot: React.FC = () => {
  const projects = PROJECTS.flatMap((file) =>
    expandProject(projectFileSchema.parse(file)),
  );
  return (
    <>
      <Folder name="projects">
        {projects.map((video) => (
          <VideoComposition key={video.id} video={video} />
        ))}
      </Folder>
      <Folder name="templates">
        {SAMPLES.map((scene) => (
          <VideoComposition
            key={scene.template}
            video={{
              id: `tpl-${scene.template}`,
              title: scene.template,
              theme: "studio",
              format:
                scene.template === "CaptionedShort" ? "vertical" : "landscape",
              scenes: [scene],
            }}
          />
        ))}
        <VideoComposition
          video={{
            id: "gallery-studio",
            title: "All templates",
            theme: "studio",
            scenes: GALLERY,
          }}
        />
        <VideoComposition
          video={{
            id: "gallery-vox-editorial",
            title: "All templates",
            theme: "vox-editorial",
            scenes: GALLERY,
          }}
        />
      </Folder>
      <Folder name="fixtures">
        {/* Test pattern for the Footage template — `npm run fixtures` renders it to public/fixtures/. */}
        <Composition
          id="fixture-footage"
          component={PlaceholderFootage}
          durationInFrames={360}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
