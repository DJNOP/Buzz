import type {
  HostPlayerInputEvent,
  SignalSprintPhase,
  SignalSprintPlayer,
} from "@party-game/shared";

export type RobotPresentationState =
  | "idle"
  | "inputAcknowledgement"
  | "correct"
  | "wrong"
  | "stunned"
  | "working"
  | "winning"
  | "losing";

export interface RobotAcknowledgement {
  sequence: number;
  occurredAt: number;
}

export type RobotAcknowledgements = Readonly<
  Record<string, RobotAcknowledgement>
>;

export interface RobotPresentation {
  state: RobotPresentationState;
  label: string;
  acknowledgementSequence: number | null;
  showAcknowledgement: boolean;
}

export const ROBOT_PRESENTATION_TIMING = {
  acknowledgementMs: 260,
  wrongLeadMs: 180,
  outcomeMs: 760,
} as const;

export const ROBOT_STATE_INFORMATION: Record<
  RobotPresentationState,
  { label: string; reliesOnMotion: false }
> = {
  idle: { label: "Standing by", reliesOnMotion: false },
  inputAcknowledgement: { label: "Input received", reliesOnMotion: false },
  correct: { label: "Correct signal", reliesOnMotion: false },
  wrong: { label: "Wrong signal", reliesOnMotion: false },
  stunned: { label: "Systems stunned", reliesOnMotion: false },
  working: { label: "Working", reliesOnMotion: false },
  winning: { label: "Top crew", reliesOnMotion: false },
  losing: { label: "Shift complete", reliesOnMotion: false },
};

export const recordRobotAcknowledgement = (
  current: RobotAcknowledgements,
  event: HostPlayerInputEvent,
): RobotAcknowledgements => {
  if (event.phase !== "down") {
    return current;
  }

  return {
    ...current,
    [event.playerId]: {
      sequence: event.validInputCount,
      occurredAt: event.serverReceivedAt,
    },
  };
};

const isRecent = (occurredAt: number, now: number, duration: number) => {
  const age = now - occurredAt;
  return age >= 0 && age < duration;
};

export const deriveRobotPresentation = ({
  phase,
  player,
  winnerPlayerIds,
  acknowledgement,
  now,
}: {
  phase: SignalSprintPhase;
  player: SignalSprintPlayer;
  winnerPlayerIds: readonly string[];
  acknowledgement?: RobotAcknowledgement | undefined;
  now: number;
}): RobotPresentation => {
  const showAcknowledgement = Boolean(
    acknowledgement &&
      isRecent(
        acknowledgement.occurredAt,
        now,
        ROBOT_PRESENTATION_TIMING.acknowledgementMs,
      ),
  );

  let state: RobotPresentationState = "idle";

  if (phase === "results") {
    state = winnerPlayerIds.includes(player.playerId) ? "winning" : "losing";
  } else if (phase === "playing") {
    const recentOutcome =
      player.lastOutcome &&
      isRecent(
        player.lastOutcome.occurredAt,
        now,
        ROBOT_PRESENTATION_TIMING.outcomeMs,
      )
        ? player.lastOutcome
        : null;
    const showingWrongLead = Boolean(
      recentOutcome?.kind === "wrong" &&
        isRecent(
          recentOutcome.occurredAt,
          now,
          ROBOT_PRESENTATION_TIMING.wrongLeadMs,
        ),
    );

    if (showingWrongLead) {
      state = "wrong";
    } else if (player.stunnedUntil !== null && player.stunnedUntil > now) {
      state = "stunned";
    } else if (recentOutcome?.kind === "correct") {
      state = "correct";
    } else if (showAcknowledgement) {
      state = "inputAcknowledgement";
    } else if (player.score > 0) {
      state = "working";
    }
  }

  const baseLabel = ROBOT_STATE_INFORMATION[state].label;
  const label =
    player.connectionState === "inactive"
      ? "Off shift"
      : player.connectionState === "disconnected"
        ? "Reconnecting"
        : baseLabel;

  return {
    state,
    label,
    acknowledgementSequence: showAcknowledgement
      ? (acknowledgement?.sequence ?? null)
      : null,
    showAcknowledgement,
  };
};
