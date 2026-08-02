import type { SignalSprintPlayer } from "@party-game/shared";
import { BUTTON_PRESENTATION } from "./button-presentation";
import { getPlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import { ServiceRobot } from "./ServiceRobot";

const STATIONS = [
  { name: "Light rig", task: "Patch the stage lights", icon: "lights" },
  { name: "Sound desk", task: "Balance the speaker stacks", icon: "sound" },
  { name: "Decor bay", task: "Dress the celebration arch", icon: "decor" },
  { name: "Supply dock", task: "Route the event crates", icon: "supply" },
] as const;

export const EventStation = ({
  player,
  scoreToWin,
  presentation,
}: {
  player: SignalSprintPlayer;
  scoreToWin: number;
  presentation: RobotPresentation;
}) => {
  const identity = getPlayerIdentity(player.playerNumber);
  const target = BUTTON_PRESENTATION[player.target];
  const station = STATIONS[player.playerNumber - 1] ?? STATIONS[0];
  const progress = Math.min(100, (player.score / scoreToWin) * 100);

  return (
    <article
      className={`event-station event-station--${player.connectionState}`}
      data-player={identity.number}
      data-identity-colour={identity.colour}
      data-robot-state={presentation.state}
    >
      <header className="station-header">
        <span className={`identity-chip identity-chip--${identity.shape}`}>
          P{identity.number}
        </span>
        <div>
          <h2>{player.displayName}</h2>
          <span>{station.name}</span>
        </div>
        <div className="station-score" aria-label={`${player.score} of ${scoreToWin} jobs complete`}>
          <strong>{player.score}</strong><span>/{scoreToWin}</span>
        </div>
      </header>

      <div className="station-workspace">
        <div className={`station-prop station-prop--${station.icon}`} aria-hidden="true">
          <span /><span /><span />
        </div>
        <ServiceRobot identity={identity} presentation={presentation} />
        <div
          className="signal-console"
          data-button={player.target}
          data-tone={target.tone}
          aria-label={`Current target ${target.symbol} ${target.label}`}
        >
          <small>Next cue</small>
          <strong>{target.symbol}</strong>
          <b>{target.label}</b>
        </div>
      </div>

      <div className="operation-readout">
        <div>
          <span>{station.task}</span>
          <strong>{progress.toFixed(0)}% operational</strong>
        </div>
        <div className="operation-meter" aria-label={`${player.score} of ${scoreToWin}`}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <small>{player.mistakes} misroutes</small>
      </div>
    </article>
  );
};
