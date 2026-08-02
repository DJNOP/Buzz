import type { SignalSprintPlayer } from "@party-game/shared";

export type StationType =
  | "lighting"
  | "sound"
  | "decorations"
  | "machinery";

export type StationProgressState =
  | "broken"
  | "partial"
  | "nearlyOperational"
  | "complete";

export interface StationMetadata {
  type: StationType;
  label: string;
  shortLabel: string;
  responsibility: string;
  venueEffect: string;
}

export const STATION_METADATA: Record<StationType, StationMetadata> = {
  lighting: {
    type: "lighting",
    label: "Lighting control",
    shortLabel: "Lighting",
    responsibility: "Lighting system",
    venueEffect: "Stage illumination",
  },
  sound: {
    type: "sound",
    label: "Sound control",
    shortLabel: "Sound",
    responsibility: "Audio system",
    venueEffect: "Speaker signal",
  },
  decorations: {
    type: "decorations",
    label: "Decorations / event setup",
    shortLabel: "Event setup",
    responsibility: "Venue decorations",
    venueEffect: "Stage dressing",
  },
  machinery: {
    type: "machinery",
    label: "Stage machinery",
    shortLabel: "Machinery",
    responsibility: "Stage systems",
    venueEffect: "Curtain and platform",
  },
};

export const STATION_TYPE_BY_PLAYER_NUMBER = {
  1: "lighting",
  2: "sound",
  3: "decorations",
  4: "machinery",
} as const satisfies Record<1 | 2 | 3 | 4, StationType>;

export const STATION_PROGRESS_LABELS: Record<StationProgressState, string> = {
  broken: "broken",
  partial: "partially operational",
  nearlyOperational: "nearly operational",
  complete: "complete",
};

export const getStationTypeForPlayerNumber = (
  playerNumber: number,
): StationType => {
  const stationType =
    STATION_TYPE_BY_PLAYER_NUMBER[
      playerNumber as keyof typeof STATION_TYPE_BY_PLAYER_NUMBER
    ];
  if (!stationType) {
    throw new RangeError(`Unsupported player number: ${playerNumber}`);
  }
  return stationType;
};

export const getStationProgressState = (
  score: number,
  scoreToWin: number,
): StationProgressState => {
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

export interface VenueStationSystem {
  player: SignalSprintPlayer;
  station: StationMetadata;
  state: StationProgressState;
}

export const getVenueStationSystems = (
  players: readonly SignalSprintPlayer[],
  scoreToWin: number,
  completedPlayerIds: readonly string[] = [],
): VenueStationSystem[] => {
  const completed = new Set(completedPlayerIds);
  return players.map((player) => {
    const type = getStationTypeForPlayerNumber(player.playerNumber);
    return {
      player,
      station: STATION_METADATA[type],
      state: completed.has(player.playerId)
        ? "complete"
        : getStationProgressState(player.score, scoreToWin),
    };
  });
};

export const getStationSystemByType = (
  systems: readonly VenueStationSystem[],
  type: StationType,
) => systems.find((system) => system.station.type === type);
