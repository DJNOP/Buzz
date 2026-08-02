import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ControllerButton,
  ControllerInputPayload,
  PublicPlayer,
} from "@party-game/shared";
import {
  SIGNAL_SPRINT_COUNTDOWN_MS,
  SIGNAL_SPRINT_ROUND_MS,
  SIGNAL_SPRINT_STUN_MS,
  SignalSprintGame,
  type SignalSprintGameOptions,
} from "../src/signal-sprint-game.js";

const player = (
  id: string,
  number: number,
  connectionState: PublicPlayer["connectionState"] = "connected",
): PublicPlayer => ({
  id,
  number,
  displayName: `Player ${number}`,
  accent: ["violet", "teal", "amber", "rose"][number - 1] as PublicPlayer["accent"],
  connectionState,
  validInputCount: 0,
  latestInput: null,
});

const input = (
  button: ControllerButton,
  phase: ControllerInputPayload["phase"] = "down",
): ControllerInputPayload => ({ button, phase, clientTimestamp: Date.now() });

const games: SignalSprintGame[] = [];

const createGame = (options: SignalSprintGameOptions = {}) => {
  const game = new SignalSprintGame("ABCD", {
    random: () => 0,
    ...options,
  });
  games.push(game);
  return game;
};

const startPlaying = (
  game: SignalSprintGame,
  players: PublicPlayer[] = [player("player-1", 1)],
) => {
  expect(game.start(players)).toMatchObject({ ok: true });
  vi.advanceTimersByTime(SIGNAL_SPRINT_COUNTDOWN_MS);
  expect(game.getState().phase).toBe("playing");
};

const wrongButton = (target: ControllerButton): ControllerButton =>
  target === "primary" ? "secondary1" : "primary";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(10_000);
});

afterEach(() => {
  for (const game of games.splice(0)) {
    game.dispose();
  }
  vi.useRealTimers();
});

describe("SignalSprintGame", () => {
  it("starts only from the lobby and rejects an empty connected roster", () => {
    const game = createGame();

    expect(game.start([])).toMatchObject({
      ok: false,
      error: { code: "no_connected_players" },
    });
    expect(game.start([player("player-1", 1)])).toMatchObject({ ok: true });
    expect(game.start([player("player-1", 1)])).toMatchObject({
      ok: false,
      error: { code: "invalid_phase" },
    });
  });

  it("captures only connected players as round participants", () => {
    const game = createGame();

    game.start([
      player("player-1", 1),
      player("player-2", 2, "disconnected"),
    ]);

    expect(game.getState().players.map((entry) => entry.playerId)).toEqual([
      "player-1",
    ]);
  });

  it("transitions from a three-second countdown into thirty-second play", () => {
    const game = createGame();
    game.start([player("player-1", 1)]);

    expect(game.getState()).toMatchObject({
      phase: "countdown",
      countdownEndsAt: 13_000,
      roundEndsAt: null,
    });
    vi.advanceTimersByTime(SIGNAL_SPRINT_COUNTDOWN_MS - 1);
    expect(game.getState().phase).toBe("countdown");
    vi.advanceTimersByTime(1);
    expect(game.getState()).toMatchObject({
      phase: "playing",
      countdownEndsAt: null,
      roundEndsAt: 43_000,
    });
  });

  it("scores one correct down, ignores up, and advances to a different target", () => {
    const game = createGame();
    startPlaying(game);
    const originalTarget = game.getState().players[0]!.target;

    expect(game.acceptInput("player-1", input(originalTarget, "up"))).toBe(false);
    expect(game.acceptInput("player-1", input(originalTarget))).toBe(true);

    const state = game.getState().players[0]!;
    expect(state.score).toBe(1);
    expect(state.mistakes).toBe(0);
    expect(state.target).not.toBe(originalTarget);
    expect(state.lastOutcome).toMatchObject({ kind: "correct", button: originalTarget });
  });

  it("records one mistake, applies a server stun, and ignores inputs during it", () => {
    const game = createGame();
    startPlaying(game);
    const current = game.getState().players[0]!;
    const wrong = wrongButton(current.target);

    expect(game.acceptInput("player-1", input(wrong))).toBe(true);
    expect(game.getState().players[0]!).toMatchObject({
      score: 0,
      mistakes: 1,
      stunnedUntil: Date.now() + SIGNAL_SPRINT_STUN_MS,
    });
    expect(game.getControllerStatus("player-1").status).toBe("stunned");
    expect(game.acceptInput("player-1", input(current.target))).toBe(false);
    expect(game.getState().players[0]!).toMatchObject({ score: 0, mistakes: 1 });

    vi.advanceTimersByTime(SIGNAL_SPRINT_STUN_MS);
    expect(game.getState().players[0]!.stunnedUntil).toBeNull();
    expect(game.getControllerStatus("player-1").status).toBe("round_active");
  });

  it("cannot score repeatedly from the same down input", () => {
    const game = createGame();
    startPlaying(game);
    const originalTarget = game.getState().players[0]!.target;

    game.acceptInput("player-1", input(originalTarget));
    game.acceptInput("player-1", input(originalTarget));

    expect(game.getState().players[0]!.score).toBe(1);
  });

  it("ignores inputs outside play and from unknown players", () => {
    const game = createGame();
    const target = "primary";

    expect(game.acceptInput("player-1", input(target))).toBe(false);
    game.start([player("player-1", 1)]);
    expect(game.acceptInput("player-1", input(target))).toBe(false);
    vi.advanceTimersByTime(SIGNAL_SPRINT_COUNTDOWN_MS);
    expect(game.acceptInput("unknown", input(target))).toBe(false);
    expect(game.getState().players[0]!.score).toBe(0);
  });

  it("ends immediately when the first player reaches fifteen", () => {
    const game = createGame();
    startPlaying(game);

    for (let score = 0; score < 15; score += 1) {
      const target = game.getState().players[0]!.target;
      game.acceptInput("player-1", input(target));
    }

    expect(game.getState()).toMatchObject({
      phase: "results",
      winnerPlayerIds: ["player-1"],
      players: [{ score: 15 }],
    });
  });

  it("ends after thirty seconds with the highest scorer", () => {
    const game = createGame();
    startPlaying(game, [player("player-1", 1), player("player-2", 2)]);
    game.acceptInput("player-2", input(game.getState().players[1]!.target));

    vi.advanceTimersByTime(SIGNAL_SPRINT_ROUND_MS);

    expect(game.getState()).toMatchObject({
      phase: "results",
      winnerPlayerIds: ["player-2"],
    });
  });

  it("rejects an input at the authoritative deadline even if its timer is delayed", () => {
    let currentTime = 10_000;
    const scheduled: Array<() => void> = [];
    const game = createGame({
      now: () => currentTime,
      schedule: (callback) => {
        scheduled.push(callback);
        return callback as unknown as ReturnType<typeof setTimeout>;
      },
      cancelSchedule: () => undefined,
    });
    game.start([player("player-1", 1)]);
    currentTime += SIGNAL_SPRINT_COUNTDOWN_MS;
    scheduled.shift()?.();
    const target = game.getState().players[0]!.target;
    currentTime += SIGNAL_SPRINT_ROUND_MS;

    expect(game.acceptInput("player-1", input(target))).toBe(false);
    expect(game.getState()).toMatchObject({
      phase: "results",
      players: [{ score: 0 }],
    });
  });

  it("returns joint winners for equal highest scores", () => {
    const game = createGame();
    startPlaying(game, [player("player-1", 1), player("player-2", 2)]);
    for (const current of game.getState().players) {
      game.acceptInput(current.playerId, input(current.target));
    }

    vi.advanceTimersByTime(SIGNAL_SPRINT_ROUND_MS);

    expect(game.getState().winnerPlayerIds).toEqual(["player-1", "player-2"]);
  });

  it("preserves score and target through disconnection and reconnection", () => {
    const game = createGame();
    startPlaying(game);
    game.acceptInput("player-1", input(game.getState().players[0]!.target));
    const beforeDisconnect = game.getState().players[0]!;

    game.syncPlayers([player("player-1", 1, "disconnected")]);
    expect(game.getState().players[0]!.connectionState).toBe("disconnected");
    game.syncPlayers([player("player-1", 1, "connected")]);

    expect(game.getState().players[0]!).toMatchObject({
      connectionState: "connected",
      score: beforeDisconnect.score,
      target: beforeDisconnect.target,
    });
  });

  it("marks an expired participant inactive and leaves a late joiner waiting", () => {
    const game = createGame();
    startPlaying(game);

    game.syncPlayers([player("late-player", 1)]);

    expect(game.getState().players[0]!.connectionState).toBe("inactive");
    expect(game.getControllerStatus("late-player")).toMatchObject({
      status: "waiting_next_round",
      participating: false,
    });
  });

  it("replays with reset state and preserves the increasing round identifier", () => {
    const game = createGame({ scoreToWin: 1 });
    const roster = [player("player-1", 1), player("player-2", 2)];
    startPlaying(game, roster);
    game.acceptInput("player-1", input(game.getState().players[0]!.target));

    expect(game.replay(roster)).toMatchObject({
      ok: true,
      game: {
        phase: "countdown",
        roundId: 2,
        players: [{ score: 0, mistakes: 0 }, { score: 0, mistakes: 0 }],
      },
    });
  });

  it("returns to the lobby without changing the supplied room roster", () => {
    const game = createGame({ scoreToWin: 1 });
    const roster = [player("player-1", 1)];
    startPlaying(game, roster);
    game.acceptInput("player-1", input(game.getState().players[0]!.target));

    expect(game.returnToLobby()).toMatchObject({
      ok: true,
      game: { phase: "lobby", players: [], roundId: 1 },
    });
    expect(roster).toHaveLength(1);
  });

  it("cancels every phase and stun timer on disposal", () => {
    const game = createGame();
    startPlaying(game);
    const target = game.getState().players[0]!.target;
    game.acceptInput("player-1", input(wrongButton(target)));
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    game.dispose();

    expect(vi.getTimerCount()).toBe(0);
  });
});
