import type { RobotPresentationState } from "./robot-presentation";
import {
  getStationProgressState,
  type StationProgressState,
  type StationType,
} from "./station-presentation";

const PIXELLAB_ASSET_ROOT = "/assets/pixellab";

export interface RobotSpriteAsset {
  name: string;
  animationUrl: string;
  posterUrl: string;
  sheetUrl: string;
  frameCount: number;
  frameDurationsMs: readonly number[];
  anchors: RobotSpriteAnchors;
}

export interface RobotSpriteAnchors {
  head: readonly [xPercent: number, yPercent: number];
  torso: readonly [xPercent: number, yPercent: number];
  workingHand: readonly [xPercent: number, yPercent: number];
  feet: readonly [xPercent: number, yPercent: number];
}

const DEFAULT_ROBOT_ANCHORS: RobotSpriteAnchors = {
  head: [50, 38],
  torso: [50, 64],
  workingHand: [72, 66],
  feet: [50, 82],
};

const robotAsset = (
  name: string,
  posterFrame: number,
  frameDurationsMs: readonly number[],
  directory = `robot/${name}`,
  anchors: RobotSpriteAnchors = DEFAULT_ROBOT_ANCHORS,
): RobotSpriteAsset => ({
  name,
  animationUrl: `${PIXELLAB_ASSET_ROOT}/${directory}/${name}.png`,
  posterUrl: `${PIXELLAB_ASSET_ROOT}/${directory}/frames/${name}-frame-${String(posterFrame).padStart(2, "0")}.png`,
  sheetUrl: `${PIXELLAB_ASSET_ROOT}/${directory}/${name}-sprite-sheet.png`,
  frameCount: frameDurationsMs.length,
  frameDurationsMs,
  anchors,
});

export const ROBOT_SPRITE_ASSETS: Partial<
  Record<RobotPresentationState, RobotSpriteAsset>
> = {
  idle: robotAsset("idle", 0, [260, 160, 180, 260]),
  inputAcknowledgement: robotAsset(
    "input-acknowledgement",
    2,
    [240, 150, 170, 300],
  ),
  correct: robotAsset("correct", 2, [220, 150, 180, 270]),
  wrong: robotAsset("wrong", 2, [220, 160, 190, 280]),
  stunned: robotAsset("stunned", 2, [220, 190, 190, 300]),
  winning: robotAsset("winning", 3, [190, 130, 140, 180, 140, 280]),
};

const LIGHTING_ROBOT_ANCHORS: RobotSpriteAnchors = {
  head: [52, 41],
  torso: [52, 67],
  workingHand: [81, 63],
  feet: [52, 88],
};

const lightingRobotAsset = (
  name: string,
  posterFrame: number,
  frameDurationsMs: readonly number[],
): RobotSpriteAsset =>
  robotAsset(
    name,
    posterFrame,
    frameDurationsMs,
    `robot-lighting/${name}`,
    LIGHTING_ROBOT_ANCHORS,
  );

export const LIGHTING_ROBOT_SPRITE_ASSETS: Partial<
  Record<RobotPresentationState, RobotSpriteAsset>
> = {
  idle: lightingRobotAsset("work-idle", 2, [260, 220, 240, 280]),
  working: lightingRobotAsset("work-idle", 2, [260, 220, 240, 280]),
  inputAcknowledgement: lightingRobotAsset(
    "reach-contact",
    1,
    [90, 110, 150, 210],
  ),
  correct: lightingRobotAsset("reach-contact", 1, [90, 110, 150, 210]),
  wrong: lightingRobotAsset("wrong-recoil", 2, [90, 110, 140, 180]),
  stunned: lightingRobotAsset("stunned-hold", 2, [130, 150, 170, 210]),
  winning: ROBOT_SPRITE_ASSETS.winning!,
};

export type LightRigProgressState = StationProgressState;

const progressAssetFamily = (directory: string) => ({
  broken: `${PIXELLAB_ASSET_ROOT}/${directory}/broken.png`,
  partial: `${PIXELLAB_ASSET_ROOT}/${directory}/partial.png`,
  nearlyOperational: `${PIXELLAB_ASSET_ROOT}/${directory}/nearly-operational.png`,
  complete: `${PIXELLAB_ASSET_ROOT}/${directory}/complete.png`,
});

export const STATION_SPRITE_ASSETS: Record<
  StationType,
  Record<StationProgressState, string>
> = {
  lighting: progressAssetFamily("light-rig"),
  sound: progressAssetFamily("stations/sound"),
  decorations: progressAssetFamily("stations/decorations"),
  machinery: progressAssetFamily("stations/machinery"),
};

export const LIGHT_RIG_SPRITE_ASSETS = STATION_SPRITE_ASSETS.lighting;

export const getLightRigProgressState = (
  score: number,
  scoreToWin: number,
): LightRigProgressState => getStationProgressState(score, scoreToWin);

export const isPixellabSpritePresentationEnabled = (
  configuredValue: string | undefined,
) => configuredValue?.toLowerCase() !== "false";

export const PIXELLAB_SPRITE_PRESENTATION_ENABLED =
  isPixellabSpritePresentationEnabled(
    import.meta.env.VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES,
  );

