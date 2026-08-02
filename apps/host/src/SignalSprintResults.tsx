import type { SignalSprintPlayer, SignalSprintState } from "@party-game/shared";
import { getPlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import { ServiceRobot } from "./ServiceRobot";
import { VenueStage } from "./VenueStage";

export const getSignalSprintWinners = (game: SignalSprintState) =>
  game.players.filter((player) =>
    game.winnerPlayerIds.includes(player.playerId),
  );

export const SignalSprintResults = ({
  game,
  getPresentation,
  replayDisabled,
  pendingReplay,
  actionsDisabled,
  onReplay,
  onReturnToLobby,
  waitingNames,
  error,
}: {
  game: SignalSprintState;
  getPresentation: (player: SignalSprintPlayer) => RobotPresentation;
  replayDisabled: boolean;
  pendingReplay: boolean;
  actionsDisabled: boolean;
  onReplay: () => void;
  onReturnToLobby: () => void;
  waitingNames: readonly string[];
  error: string;
}) => {
  const winners = getSignalSprintWinners(game);
  const rankedPlayers = [...game.players].sort(
    (left, right) =>
      right.score - left.score || left.playerNumber - right.playerNumber,
  );

  return (
    <section className="results-stage results-stage--venue">
      <VenueStage
        players={game.players}
        scoreToWin={game.scoreToWin}
        celebration
      />
      <div className="results-content">
        <header className="results-heading">
          <p className="section-kicker">Event report // Round {game.roundId}</p>
          <h2>
            {winners.length > 1
              ? "Joint winners"
              : `P${winners[0]?.playerNumber ?? "?"} wins`}
          </h2>
          <div className="winner-names">
            {winners.map((player) => player.displayName).join(" + ")}
          </div>
        </header>

        <div className="winner-robots" data-winner-count={winners.length}>
          {winners.map((player) => {
            const identity = getPlayerIdentity(player.playerNumber);
            return (
              <article
                key={player.playerId}
                data-player={player.playerNumber}
                data-identity-colour={identity.colour}
              >
                <ServiceRobot
                  identity={identity}
                  presentation={getPresentation(player)}
                />
                <div>
                  <strong>P{player.playerNumber}</strong>
                  <span>{player.displayName}</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="results-scoreboard" aria-label="Round scores">
          {rankedPlayers.map((player) => {
            const identity = getPlayerIdentity(player.playerNumber);
            return (
              <article
                key={player.playerId}
                data-player={player.playerNumber}
                data-identity-colour={identity.colour}
                data-winner={game.winnerPlayerIds.includes(player.playerId)}
              >
                <ServiceRobot
                  identity={identity}
                  presentation={getPresentation(player)}
                  compact
                />
                <div>
                  <strong>P{player.playerNumber} // {player.displayName}</strong>
                  <small>{player.mistakes} misroutes</small>
                </div>
                <span>{player.score} jobs</span>
              </article>
            );
          })}
        </div>

        <div className="results-actions">
          <button type="button" onClick={onReplay} disabled={replayDisabled}>
            {pendingReplay ? "Starting..." : "Play again"}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={onReturnToLobby}
            disabled={actionsDisabled}
          >
            Return to lobby
          </button>
        </div>
        {waitingNames.length > 0 ? (
          <p className="results-waiting">
            Next round also includes {waitingNames.join(", ")}.
          </p>
        ) : null}
        {error ? <p className="error-message">{error}</p> : null}
      </div>
    </section>
  );
};
