import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getLightRigProgressState,
  isPixellabSpritePresentationEnabled,
  ROBOT_SPRITE_ASSETS,
  STATION_SPRITE_ASSETS,
} from "./sprite-assets";

describe("sprite asset presentation metadata", () => {
  it("maps only the approved PixelLab robot animation states", () => {
    expect(Object.keys(ROBOT_SPRITE_ASSETS).sort()).toEqual([
      "correct",
      "idle",
      "inputAcknowledgement",
      "stunned",
      "winning",
      "wrong",
    ]);
    expect(ROBOT_SPRITE_ASSETS.working).toBeUndefined();
    expect(ROBOT_SPRITE_ASSETS.losing).toBeUndefined();
  });

  it("maps score progress to the four light-rig proof states", () => {
    expect(getLightRigProgressState(0, 15)).toBe("broken");
    expect(getLightRigProgressState(1, 15)).toBe("partial");
    expect(getLightRigProgressState(9, 15)).toBe("partial");
    expect(getLightRigProgressState(10, 15)).toBe("nearlyOperational");
    expect(getLightRigProgressState(14, 15)).toBe("nearlyOperational");
    expect(getLightRigProgressState(15, 15)).toBe("complete");
    expect(getLightRigProgressState(20, 15)).toBe("complete");
    expect(getLightRigProgressState(1, 0)).toBe("broken");
  });

  it("maps all four station types to every progress-state runtime path", () => {
    expect(Object.keys(STATION_SPRITE_ASSETS)).toEqual([
      "lighting",
      "sound",
      "decorations",
      "machinery",
    ]);
    for (const assets of Object.values(STATION_SPRITE_ASSETS)) {
      expect(Object.keys(assets)).toEqual([
        "broken",
        "partial",
        "nearlyOperational",
        "complete",
      ]);
      for (const path of Object.values(assets)) {
        expect(path).toMatch(/^\/assets\/pixellab\/.+\.png$/);
        expect(
          existsSync(new URL(`../public${path}`, import.meta.url)),
          `Missing runtime station asset: ${path}`,
        ).toBe(true);
      }
    }
  });

  it("keeps the reversible fallback enabled unless explicitly disabled", () => {
    expect(isPixellabSpritePresentationEnabled(undefined)).toBe(true);
    expect(isPixellabSpritePresentationEnabled("true")).toBe(true);
    expect(isPixellabSpritePresentationEnabled("FALSE")).toBe(false);
  });
});

