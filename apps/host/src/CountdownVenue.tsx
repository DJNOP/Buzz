import type { SignalSprintState } from "@party-game/shared";
import { getPlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import { ServiceRobot } from "./ServiceRobot";
import { VenueStage } from "./VenueStage";

const COUNTDOWN_ROBOT_PRESENTATION: RobotPresentation = {
  state: "idle",
  label: "Ready for call time",
  acknowledgementSequence: null,
  showAcknowledgement: false,
};

export const CountdownVenue = ({
  game,
  clock,
  waitingNames,
}: {
  game: SignalSprintState;
  clock: number;
  waitingNames: readonly string[];
}) => (
  <section className="countdown-venue">
    <VenueStage players={game.players} scoreToWin={game.scoreToWin} />
    <div className="countdown-overlay">
      <p>Venue doors open // Round {game.roundId}</p>
      <strong className="countdown-number">
        {Math.max(
          1,
          Math.ceil(((game.countdownEndsAt ?? clock) - clock) / 1_000),
        )}
      </strong>
      <h2>Crews to stations</h2>
      <div className="countdown-players" data-player-count={game.players.length}>
        {game.players.map((player) => {
          const identity = getPlayerIdentity(player.playerNumber);
          return (
            <div
              key={player.playerId}
              data-player={player.playerNumber}
              data-identity-colour={identity.colour}
            >
              <ServiceRobot
                identity={identity}
                presentation={COUNTDOWN_ROBOT_PRESENTATION}
                compact
              />
              <span>
                P{player.playerNumber} {player.displayName}
              </span>
            </div>
          );
        })}
      </div>
      {waitingNames.length > 0 ? (
        <p>{waitingNames.join(", ")} will join next round.</p>
      ) : null}
    </div>
  </section>
);
