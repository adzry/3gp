import React from "react";
import { Composition, Folder } from "remotion";
import { PROJECTS } from "../projects";
import { PlaceholderFootage } from "./fixtures/PlaceholderFootage";
import { SAMPLES } from "./templates/samples";
import {
  CustomScenesContext,
  EMPTY_SCENES,
  type SceneRegistry,
} from "./video/custom-scenes";
import { SceneVideo, calculateVideoMetadata } from "./video/SceneVideo";
import {
  expandProject,
  projectFileSchema,
  videoSchema,
  type VideoProps,
} from "./video/schema";

// One SceneVideo per scene registry, so each project sees its own custom scenes.
const components = new Map<SceneRegistry, React.FC<VideoProps>>();
const componentFor = (scenes: SceneRegistry) => {
  let c = components.get(scenes);
  if (!c) {
    const WithScenes: React.FC<VideoProps> = (props) => (
      <CustomScenesContext.Provider value={scenes}>
        <SceneVideo {...props} />
      </CustomScenesContext.Provider>
    );
    c = WithScenes;
    components.set(scenes, c);
  }
  return c;
};

const VideoComposition: React.FC<{
  video: VideoProps;
  scenes?: SceneRegistry;
}> = ({ video, scenes = EMPTY_SCENES }) => (
  <Composition
    id={video.id}
    component={componentFor(scenes)}
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
  const projects = PROJECTS.flatMap(({ video, scenes }) =>
    expandProject(projectFileSchema.parse(video)).map((v) => ({
      video: v,
      scenes,
    })),
  );
  return (
    <>
      <Folder name="projects">
        {projects.map(({ video, scenes }) => (
          <VideoComposition key={video.id} video={video} scenes={scenes} />
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
