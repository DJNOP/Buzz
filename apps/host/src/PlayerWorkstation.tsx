import type { SignalSprintPlayer } from "@party-game/shared";
import { LightingInteractionDiorama } from "./LightingInteractionDiorama";
import { getPlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import { ServiceRobot } from "./ServiceRobot";
import { StationProp } from "./StationProp";
import { StationTargetDisplay } from "./StationTargetDisplay";
import {
  getStationProgressState,
  getStationTypeForPlayerNumber,
  STATION_METADATA,
  STATION_PROGRESS_LABELS,
} from "./station-presentation";

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
  const stationType = getStationTypeForPlayerNumber(player.playerNumber);
  const station = STATION_METADATA[stationType];
  const stationState = getStationProgressState(player.score, scoreToWin);

  return (
    <article
      className={`player-workstation player-workstation--${player.connectionState}`}
      data-player={identity.number}
      data-identity-colour={identity.colour}
      data-robot-state={presentation.state}
      data-station-type={stationType}
      data-station-state={stationState}
      aria-label={`Player ${player.playerNumber} ${player.displayName}, ${station.label}`}
    >
      <header className="workstation-header">
        <span className={`identity-chip identity-chip--${identity.shape}`}>
          P{identity.number}
        </span>
        <div>
          <h2>{player.displayName}</h2>
          <span>
            {station.shortLabel} // {identity.colourLabel} {identity.shapeLabel}
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

      {stationType === "lighting" ? (
        <div className="workstation-bay workstation-bay--lighting">
          <LightingInteractionDiorama
            player={player}
            identity={identity}
            presentation={presentation}
            stationState={stationState}
          />
        </div>
      ) : (
        <div className="workstation-bay">
          <div className="robot-operating-position">
            <StationProp type={stationType} state={stationState} />
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
      )}

      <footer className="workstation-deck">
        <div>
          <span>{station.responsibility}</span>
          <strong>{progress.toFixed(0)}% operational</strong>
        </div>
        <div
          className="workstation-progress"
          aria-label={`${player.score} of ${scoreToWin}`}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
        <small>{STATION_PROGRESS_LABELS[stationState]}</small>
      </footer>
    </article>
  );
};
