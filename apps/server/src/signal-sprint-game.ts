import {
  CONTROLLER_BUTTONS,
  SIGNAL_SPRINT_SCORE_TO_WIN,
  type ControllerButton,
  type ControllerGameStatus,
  type ControllerInputPayload,
  type HostGameActionResult,
  type PublicPlayer,
  type SignalSprintPlayer,
  type SignalSprintState,
} from "@party-game/shared";

export const SIGNAL_SPRINT_COUNTDOWN_MS = 3_000;
export const SIGNAL_SPRINT_ROUND_MS = 30_000;
export const SIGNAL_SPRINT_STUN_MS = 600;

type TimerHandle = ReturnType<typeof setTimeout>;
type ParticipantSource = Pick<
  PublicPlayer,
  "id" | "number" | "displayName" | "accent" | "connectionState"
>;

export interface SignalSprintGameOptions {
  now?: () => number;
  random?: () => number;
  schedule?: (callback: () => void, delay: number) => TimerHandle;
  cancelSchedule?: (handle: TimerHandle) => void;
  countdownMs?: number;
  roundMs?: number;
  stunMs?: number;
  scoreToWin?: number;
}

const actionError = (
  code: "no_connected_players" | "invalid_phase",
  message: string,
): HostGameActionResult => ({ ok: false, error: { code, message } });

export class SignalSprintGame {
  private state: SignalSprintState;
  private readonly listeners = new Set<(state: SignalSprintState) => void>();
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly schedule: NonNullable<SignalSprintGameOptions["schedule"]>;
  private readonly cancelSchedule: NonNullable<
    SignalSprintGameOptions["cancelSchedule"]
  >;
  private readonly countdownMs: number;
  private readonly roundMs: number;
  private readonly stunMs: number;
  private phaseTimer: TimerHandle | null = null;
  private readonly stunTimers = new Map<string, TimerHandle>();
  private outcomeSequence = 0;

  constructor(
    private readonly roomCode: string,
    options: SignalSprintGameOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
    this.schedule = options.schedule ?? setTimeout;
    this.cancelSchedule = options.cancelSchedule ?? clearTimeout;
    this.countdownMs = options.countdownMs ?? SIGNAL_SPRINT_COUNTDOWN_MS;
    this.roundMs = options.roundMs ?? SIGNAL_SPRINT_ROUND_MS;
    this.stunMs = options.stunMs ?? SIGNAL_SPRINT_STUN_MS;
    this.state = {
      roomCode,
      phase: "lobby",
      roundId: 0,
      countdownEndsAt: null,
      roundEndsAt: null,
      scoreToWin: options.scoreToWin ?? SIGNAL_SPRINT_SCORE_TO_WIN,
      players: [],
      winnerPlayerIds: [],
    };
  }

  subscribe(listener: (state: SignalSprintState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): SignalSprintState {
    return structuredClone(this.state);
  }

  start(players: ParticipantSource[]): HostGameActionResult {
    if (this.state.phase !== "lobby") {
      return actionError(
        "invalid_phase",
        "Signal Sprint can only start from the lobby.",
      );
    }
    return this.beginCountdown(players);
  }

  replay(players: ParticipantSource[]): HostGameActionResult {
    if (this.state.phase !== "results") {
      return actionError(
        "invalid_phase",
        "A replay can only begin from the results screen.",
      );
    }
    return this.beginCountdown(players);
  }

  returnToLobby(): HostGameActionResult {
    if (this.state.phase !== "results") {
      return actionError(
        "invalid_phase",
        "The game can only return to the lobby from results.",
      );
    }

    this.cancelAllTimers();
    this.state = {
      ...this.state,
      phase: "lobby",
      countdownEndsAt: null,
      roundEndsAt: null,
      players: [],
      winnerPlayerIds: [],
    };
    this.emit();
    return { ok: true, game: this.getState() };
  }

  syncPlayers(roomPlayers: ParticipantSource[]) {
    if (this.state.players.length === 0) {
      return false;
    }

    const currentPlayers = new Map(roomPlayers.map((player) => [player.id, player]));
    let changed = false;
    for (const player of this.state.players) {
      const current = currentPlayers.get(player.playerId);
      const connectionState = current?.connectionState ?? "inactive";
      if (player.connectionState !== connectionState) {
        player.connectionState = connectionState;
        changed = true;
      }
    }

    if (changed) {
      this.emit();
    }
    return changed;
  }

  acceptInput(playerId: string, input: ControllerInputPayload) {
    if (this.state.phase !== "playing" || input.phase !== "down") {
      return false;
    }

    const player = this.state.players.find(
      (candidate) => candidate.playerId === playerId,
    );
    const receivedAt = this.now();
    if (
      this.state.roundEndsAt !== null &&
      receivedAt >= this.state.roundEndsAt
    ) {
      this.finishAtTimeLimit(this.state.roundId);
      return false;
    }
    if (
      !player ||
      player.connectionState !== "connected" ||
      (player.stunnedUntil !== null && receivedAt < player.stunnedUntil)
    ) {
      return false;
    }

    if (player.stunnedUntil !== null) {
      const stunTimer = this.stunTimers.get(player.playerId);
      if (stunTimer) {
        this.cancelSchedule(stunTimer);
        this.stunTimers.delete(player.playerId);
      }
      player.stunnedUntil = null;
    }

    if (input.button === player.target) {
      player.score += 1;
      player.lastOutcome = {
        sequence: (this.outcomeSequence += 1),
        kind: "correct",
        button: input.button,
        occurredAt: receivedAt,
      };
      player.target = this.pickTarget(player.target);

      if (player.score >= this.state.scoreToWin) {
        this.finishRound([player.playerId]);
      } else {
        this.emit();
      }
      return true;
    }

    player.mistakes += 1;
    player.stunnedUntil = receivedAt + this.stunMs;
    player.lastOutcome = {
      sequence: (this.outcomeSequence += 1),
      kind: "wrong",
      button: input.button,
      occurredAt: receivedAt,
    };
    this.scheduleStunExpiry(player);
    this.emit();
    return true;
  }

  getControllerStatus(playerId: string): ControllerGameStatus {
    const player = this.state.players.find(
      (candidate) => candidate.playerId === playerId,
    );
    const participating = Boolean(player);
    let status: ControllerGameStatus["status"];

    if (this.state.phase === "lobby") {
      status = "waiting_lobby";
    } else if (this.state.phase === "countdown") {
      status = participating ? "get_ready" : "waiting_next_round";
    } else if (this.state.phase === "results") {
      status = "results";
    } else if (!player) {
      status = "waiting_next_round";
    } else if (
      player.stunnedUntil !== null &&
      this.now() < player.stunnedUntil
    ) {
      status = "stunned";
    } else {
      status = "round_active";
    }

    return {
      phase: this.state.phase,
      roundId: this.state.roundId,
      status,
      participating,
      stunnedUntil: status === "stunned" ? player?.stunnedUntil ?? null : null,
    };
  }

  dispose() {
    this.cancelAllTimers();
    this.listeners.clear();
  }

  private beginCountdown(players: ParticipantSource[]): HostGameActionResult {
    const connectedPlayers = players.filter(
      (player) => player.connectionState === "connected",
    );
    if (connectedPlayers.length === 0) {
      return actionError(
        "no_connected_players",
        "Connect at least one controller before starting Signal Sprint.",
      );
    }

    this.cancelAllTimers();
    const startedAt = this.now();
    const nextRoundId = this.state.roundId + 1;
    this.state = {
      ...this.state,
      phase: "countdown",
      roundId: nextRoundId,
      countdownEndsAt: startedAt + this.countdownMs,
      roundEndsAt: null,
      players: connectedPlayers
        .map((player) => ({
          playerId: player.id,
          playerNumber: player.number,
          displayName: player.displayName,
          accent: player.accent,
          connectionState: player.connectionState,
          target: this.pickTarget(),
          score: 0,
          mistakes: 0,
          stunnedUntil: null,
          lastOutcome: null,
        }))
        .sort((left, right) => left.playerNumber - right.playerNumber),
      winnerPlayerIds: [],
    };
    this.phaseTimer = this.schedule(
      () => this.beginPlaying(nextRoundId),
      this.countdownMs,
    );
    this.emit();
    return { ok: true, game: this.getState() };
  }

  private beginPlaying(roundId: number) {
    if (this.state.phase !== "countdown" || this.state.roundId !== roundId) {
      return;
    }

    this.phaseTimer = null;
    const startedAt = this.now();
    this.state.phase = "playing";
    this.state.countdownEndsAt = null;
    this.state.roundEndsAt = startedAt + this.roundMs;
    this.phaseTimer = this.schedule(
      () => this.finishAtTimeLimit(roundId),
      this.roundMs,
    );
    this.emit();
  }

  private finishAtTimeLimit(roundId: number) {
    if (this.state.phase !== "playing" || this.state.roundId !== roundId) {
      return;
    }
    const highestScore = Math.max(...this.state.players.map((player) => player.score));
    this.finishRound(
      this.state.players
        .filter((player) => player.score === highestScore)
        .map((player) => player.playerId),
    );
  }

  private finishRound(winnerPlayerIds: string[]) {
    this.cancelAllTimers();
    for (const player of this.state.players) {
      player.stunnedUntil = null;
    }
    this.state.phase = "results";
    this.state.countdownEndsAt = null;
    this.state.roundEndsAt = null;
    this.state.winnerPlayerIds = winnerPlayerIds;
    this.emit();
  }

  private scheduleStunExpiry(player: SignalSprintPlayer) {
    const existing = this.stunTimers.get(player.playerId);
    if (existing) {
      this.cancelSchedule(existing);
    }
    const roundId = this.state.roundId;
    const stunnedUntil = player.stunnedUntil;
    const handle = this.schedule(() => {
      this.stunTimers.delete(player.playerId);
      if (
        this.state.phase !== "playing" ||
        this.state.roundId !== roundId ||
        player.stunnedUntil !== stunnedUntil
      ) {
        return;
      }
      player.stunnedUntil = null;
      this.emit();
    }, this.stunMs);
    this.stunTimers.set(player.playerId, handle);
  }

  private pickTarget(previous?: ControllerButton) {
    const choices = previous
      ? CONTROLLER_BUTTONS.filter((button) => button !== previous)
      : [...CONTROLLER_BUTTONS];
    const randomValue = this.random();
    const normalized = Number.isFinite(randomValue)
      ? Math.min(Math.max(randomValue, 0), 0.999999999)
      : 0;
    return choices[Math.floor(normalized * choices.length)] ?? "primary";
  }

  private cancelAllTimers() {
    if (this.phaseTimer) {
      this.cancelSchedule(this.phaseTimer);
      this.phaseTimer = null;
    }
    for (const timer of this.stunTimers.values()) {
      this.cancelSchedule(timer);
    }
    this.stunTimers.clear();
  }

  private emit() {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
