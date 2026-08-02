import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SignalSprintPlayer, SignalSprintState } from "@party-game/shared";
import type { RobotPresentation } from "./robot-presentation";
import {
  getSignalSprintWinners,
  SignalSprintResults,
} from "./SignalSprintResults";

const player = (playerNumber: number): SignalSprintPlayer => ({
  playerId: `player-${playerNumber}`,
  playerNumber,
  displayName: `Crew ${playerNumber}`,
  accent: "violet",
  connectionState: "connected",
  target: "primary",
  score: 12,
  mistakes: playerNumber,
  stunnedUntil: null,
  lastOutcome: null,
});

const game = (winnerPlayerIds: string[]): SignalSprintState => ({
  roomCode: "TEST",
  phase: "results",
  roundId: 4,
  countdownEndsAt: null,
  roundEndsAt: null,
  scoreToWin: 15,
  players: [player(1), player(2), player(3)],
  winnerPlayerIds,
});

const winnerPresentation: RobotPresentation = {
  state: "winning",
  label: "Top crew",
  acknowledgementSequence: null,
  showAcknowledgement: false,
};

describe("Signal Sprint venue results", () => {
  it("represents every joint winner by identity and name", () => {
    const state = game(["player-1", "player-2"]);
    const markup = renderToStaticMarkup(
      <SignalSprintResults
        game={state}
        getPresentation={() => winnerPresentation}
        replayDisabled={false}
        pendingReplay={false}
        actionsDisabled={false}
        onReplay={() => undefined}
        onReturnToLobby={() => undefined}
        waitingNames={[]}
        error=""
      />,
    );

    expect(getSignalSprintWinners(state).map(({ playerId }) => playerId)).toEqual([
      "player-1",
      "player-2",
    ]);
    expect(markup).toContain("Joint winners");
    expect(markup).toContain("Crew 1 + Crew 2");
    expect(markup).toContain('data-winner-count="2"');
    expect(markup.match(/data-winner="true"/g)).toHaveLength(2);
  });

  it("announces a single winner with the player number", () => {
    const markup = renderToStaticMarkup(
      <SignalSprintResults
        game={game(["player-3"])}
        getPresentation={() => winnerPresentation}
        replayDisabled={false}
        pendingReplay={false}
        actionsDisabled={false}
        onReplay={() => undefined}
        onReturnToLobby={() => undefined}
        waitingNames={[]}
        error=""
      />,
    );

    expect(markup).toContain("P3 wins");
    expect(markup).toContain("Crew 3");
    expect(markup).toContain("Play again");
    expect(markup).toContain("Return to lobby");
  });
});
