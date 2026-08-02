import type { SignalSprintPlayer } from "@party-game/shared";
import { describe, expect, it } from "vitest";
import {
  getStationProgressState,
  getStationTypeForPlayerNumber,
  getVenueStationSystems,
  STATION_METADATA,
} from "./station-presentation";

const player = (
  playerNumber: number,
  score: number,
): SignalSprintPlayer => ({
  playerId: `player-${playerNumber}`,
  playerNumber,
  displayName: `Crew ${playerNumber}`,
  accent: "violet",
  connectionState: "connected",
  target: "primary",
  score,
  mistakes: 0,
  stunnedUntil: null,
  lastOutcome: null,
});

describe("Signal Sprint station presentation", () => {
  it("maps stable player slots to the four production stations", () => {
    expect([1, 2, 3, 4].map(getStationTypeForPlayerNumber)).toEqual([
      "lighting",
      "sound",
      "decorations",
      "machinery",
    ]);
    expect(() => getStationTypeForPlayerNumber(5)).toThrow(RangeError);
  });

  it("uses identical progress thresholds for every station", () => {
    expect(getStationProgressState(0, 15)).toBe("broken");
    expect(getStationProgressState(1, 15)).toBe("partial");
    expect(getStationProgressState(9, 15)).toBe("partial");
    expect(getStationProgressState(10, 15)).toBe("nearlyOperational");
    expect(getStationProgressState(14, 15)).toBe("nearlyOperational");
    expect(getStationProgressState(15, 15)).toBe("complete");
    expect(getStationProgressState(20, 15)).toBe("complete");
    expect(getStationProgressState(1, 0)).toBe("broken");
  });

  it("keeps every occupied station tied to its own player progress", () => {
    const systems = getVenueStationSystems(
      [player(1, 15), player(2, 0), player(3, 10), player(4, 1)],
      15,
    );

    expect(
      systems.map(({ station, state }) => [station.type, state]),
    ).toEqual([
      ["lighting", "complete"],
      ["sound", "broken"],
      ["decorations", "nearlyOperational"],
      ["machinery", "partial"],
    ]);
  });

  it("can complete a result winner without completing another station", () => {
    const systems = getVenueStationSystems(
      [player(1, 7), player(2, 7)],
      15,
      ["player-2"],
    );

    expect(systems.map(({ state }) => state)).toEqual([
      "partial",
      "complete",
    ]);
  });

  it("keeps station identity separate from player colour identity", () => {
    expect(STATION_METADATA.sound).not.toHaveProperty("colour");
    expect(STATION_METADATA.decorations.label).toBe(
      "Decorations / event setup",
    );
  });
});
