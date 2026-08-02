import { describe, expect, it } from "vitest";
import type { HostPlayerInputEvent, SignalSprintPlayer } from "@party-game/shared";
import {
  deriveRobotPresentation,
  recordRobotAcknowledgement,
  ROBOT_PRESENTATION_TIMING,
  ROBOT_STATE_INFORMATION,
} from "./robot-presentation";

const player = (overrides: Partial<SignalSprintPlayer> = {}): SignalSprintPlayer => ({
  playerId: "player-1",
  playerNumber: 1,
  displayName: "Alex",
  accent: "violet",
  connectionState: "connected",
  target: "primary",
  score: 0,
  mistakes: 0,
  stunnedUntil: null,
  lastOutcome: null,
  ...overrides,
});

const input = (overrides: Partial<HostPlayerInputEvent> = {}): HostPlayerInputEvent => ({
  roomCode: "TEST",
  playerId: "player-1",
  playerNumber: 1,
  button: "primary",
  phase: "down",
  clientTimestamp: 990,
  serverReceivedAt: 1_000,
  validInputCount: 3,
  ...overrides,
});

describe("robot presentation", () => {
  it("associates each trusted down acknowledgement with only its server player", () => {
    const next = recordRobotAcknowledgement({}, input({ playerId: "player-3", playerNumber: 3 }));
    expect(next).toEqual({ "player-3": { sequence: 3, occurredAt: 1_000 } });
    expect(next["player-1"]).toBeUndefined();
    expect(recordRobotAcknowledgement(next, input({ phase: "up" }))).toBe(next);
  });

  it("maps correct, wrong, stun, and result states only from authoritative game data", () => {
    const correct = player({
      lastOutcome: { sequence: 1, kind: "correct", button: "primary", occurredAt: 1_000 },
    });
    const wrong = player({
      lastOutcome: { sequence: 2, kind: "wrong", button: "secondary1", occurredAt: 1_000 },
    });

    expect(deriveRobotPresentation({ phase: "playing", player: correct, winnerPlayerIds: [], now: 1_050 }).state).toBe("correct");
    expect(deriveRobotPresentation({ phase: "playing", player: wrong, winnerPlayerIds: [], now: 1_050 }).state).toBe("wrong");
    expect(deriveRobotPresentation({ phase: "playing", player: player({
      stunnedUntil: 1_600,
      lastOutcome: { sequence: 2, kind: "wrong", button: "secondary1", occurredAt: 1_000 },
    }), winnerPlayerIds: [], now: 1_200 }).state).toBe("stunned");
    expect(deriveRobotPresentation({ phase: "playing", player: player({ stunnedUntil: 1_600 }), winnerPlayerIds: [], now: 1_050 }).state).toBe("stunned");
    expect(deriveRobotPresentation({ phase: "results", player: player(), winnerPlayerIds: ["player-1"], now: 2_000 }).state).toBe("winning");
    expect(deriveRobotPresentation({ phase: "results", player: player(), winnerPlayerIds: ["player-2"], now: 2_000 }).state).toBe("losing");
  });

  it("expires acknowledgements and outcomes so stale animations cannot stick", () => {
    const acknowledgement = { sequence: 7, occurredAt: 1_000 };
    const acknowledged = deriveRobotPresentation({ phase: "playing", player: player(), winnerPlayerIds: [], acknowledgement, now: 1_010 });
    const expired = deriveRobotPresentation({ phase: "playing", player: player({ score: 2, lastOutcome: { sequence: 3, kind: "correct", button: "primary", occurredAt: 1_000 } }), winnerPlayerIds: [], acknowledgement, now: 1_000 + Math.max(ROBOT_PRESENTATION_TIMING.acknowledgementMs, ROBOT_PRESENTATION_TIMING.outcomeMs) });

    expect(acknowledged.state).toBe("inputAcknowledgement");
    expect(acknowledged.showAcknowledgement).toBe(true);
    expect(expired).toMatchObject({ state: "working", showAcknowledgement: false, acknowledgementSequence: null });
  });

  it("keeps every state understandable without motion", () => {
    expect(
      Object.values(ROBOT_STATE_INFORMATION).every(
        ({ label, reliesOnMotion }) =>
          label.length > 0 && reliesOnMotion === false,
      ),
    ).toBe(true);
  });
});
