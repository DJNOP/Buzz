import type { RobotPresentationState } from "./robot-presentation";

const PIXELLAB_ASSET_ROOT = "/assets/pixellab";

export interface RobotSpriteAsset {
  animationUrl: string;
  posterUrl: string;
  sheetUrl: string;
  frameCount: number;
  frameDurationsMs: readonly number[];
}

const robotAsset = (
  name: string,
  posterFrame: number,
  frameDurationsMs: readonly number[],
): RobotSpriteAsset => ({
  animationUrl: `${PIXELLAB_ASSET_ROOT}/robot/${name}/${name}.png`,
  posterUrl: `${PIXELLAB_ASSET_ROOT}/robot/${name}/frames/${name}-frame-${String(posterFrame).padStart(2, "0")}.png`,
  sheetUrl: `${PIXELLAB_ASSET_ROOT}/robot/${name}/${name}-sprite-sheet.png`,
  frameCount: frameDurationsMs.length,
  frameDurationsMs,
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

export type LightRigProgressState =
  | "broken"
  | "partial"
  | "nearlyOperational"
  | "complete";

export const LIGHT_RIG_SPRITE_ASSETS: Record<
  LightRigProgressState,
  string
> = {
  broken: `${PIXELLAB_ASSET_ROOT}/light-rig/broken.png`,
  partial: `${PIXELLAB_ASSET_ROOT}/light-rig/partial.png`,
  nearlyOperational: `${PIXELLAB_ASSET_ROOT}/light-rig/nearly-operational.png`,
  complete: `${PIXELLAB_ASSET_ROOT}/light-rig/complete.png`,
};

export const getLightRigProgressState = (
  score: number,
  scoreToWin: number,
): LightRigProgressState => {
  if (scoreToWin <= 0 || score <= 0) {
    return "broken";
  }

  const progress = score / scoreToWin;
  if (progress >= 1) {
    return "complete";
  }
  if (progress >= 2 / 3) {
    return "nearlyOperational";
  }
  return "partial";
};

export const isPixellabSpritePresentationEnabled = (
  configuredValue: string | undefined,
) => configuredValue?.toLowerCase() !== "false";

export const PIXELLAB_SPRITE_PRESENTATION_ENABLED =
  isPixellabSpritePresentationEnabled(
    import.meta.env.VITE_SIGNAL_SPRINT_PIXELLAB_SPRITES,
  );

