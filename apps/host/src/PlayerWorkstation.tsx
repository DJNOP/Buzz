import type { SignalSprintPlayer } from "@party-game/shared";
import { getPlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import { ServiceRobot } from "./ServiceRobot";
import { StationTargetDisplay } from "./StationTargetDisplay";
import { getLightRigProgressState } from "./sprite-assets";

export const PlayerWorkstation = ({
  player,
  scoreToWin,
  presentation,
}: {
  player: SignalSprintPlayer;
  scoreToWin: number;
  presentation: RobotPresentation;
}) => {
  const identity = getPlayerIdentity(player.playerNumber);
  const progress =
    scoreToWin > 0 ? Math.min(100, (player.score / scoreToWin) * 100) : 0;
  const stationState = getLightRigProgressState(player.score, scoreToWin);

  return (
    <article
      className={`player-workstation player-workstation--${player.connectionState}`}
      data-player={identity.number}
      data-identity-colour={identity.colour}
      data-robot-state={presentation.state}
      data-station-state={stationState}
    >
      <header className="workstation-header">
        <span className={`identity-chip identity-chip--${identity.shape}`}>
          P{identity.number}
        </span>
        <div>
          <h2>{player.displayName}</h2>
          <span>
            {identity.colourLabel} {identity.shapeLabel} crew
          </span>
        </div>
        <div
          className="workstation-score"
          aria-label={`${player.score} of ${scoreToWin} jobs complete`}
        >
          <strong>{player.score}</strong>
          <span>/{scoreToWin}</span>
        </div>
      </header>

      <div className="workstation-bay">
        <div className="robot-operating-position">
          <ServiceRobot identity={identity} presentation={presentation} />
          <span className="robot-floor-shadow" aria-hidden="true" />
        </div>

        <div className="equipment-console">
          <span
            className="console-cable console-cable--input"
            aria-hidden="true"
          />
          <StationTargetDisplay target={player.target} />
          <div className="console-controls" aria-hidden="true">
            <i /><i /><i />
          </div>
          <div className="console-status" role="status">
            <strong>{presentation.label}</strong>
            <span>
              {player.mistakes} misroute
              {player.mistakes === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {presentation.state === "stunned" ? (
          <div className="workstation-lockout" aria-hidden="true">
            <i>!</i>
            <span>Station locked</span>
          </div>
        ) : null}
      </div>

      <footer className="workstation-deck">
        <div>
          <span>Lighting segment</span>
          <strong>{progress.toFixed(0)}% operational</strong>
        </div>
        <div
          className="workstation-progress"
          aria-label={`${player.score} of ${scoreToWin}`}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
        <small>
          {stationState === "nearlyOperational"
            ? "nearly operational"
            : stationState}
        </small>
      </footer>
    </article>
  );
};
