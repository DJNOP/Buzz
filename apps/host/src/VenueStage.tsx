import type { SignalSprintPlayer } from "@party-game/shared";
import { VenueLightingProgress } from "./VenueLightingProgress";

export const VenueStage = ({
  players,
  scoreToWin,
  celebration = false,
}: {
  players: readonly SignalSprintPlayer[];
  scoreToWin: number;
  celebration?: boolean;
}) => (
  <div
    className={`venue-stage ${celebration ? "venue-stage--celebration" : ""}`}
    data-player-count={players.length}
    aria-label="Shared backstage event venue"
  >
    <div className="venue-back-wall" aria-hidden="true">
      <span className="venue-gantry venue-gantry--left" />
      <span className="venue-gantry venue-gantry--right" />
      <span className="venue-speaker-stack venue-speaker-stack--left">
        <i /><i />
      </span>
      <span className="venue-speaker-stack venue-speaker-stack--right">
        <i /><i />
      </span>
    </div>
    <VenueLightingProgress players={players} scoreToWin={scoreToWin} />
    <div className="performance-stage" aria-hidden="true">
      <span className="performance-stage__screen">SIGNAL SPRINT</span>
      <span className="performance-stage__deck" />
      <span className="performance-stage__step" />
    </div>
    <div className="venue-floor" aria-hidden="true">
      <span className="floor-cable floor-cable--one" />
      <span className="floor-cable floor-cable--two" />
      <span className="equipment-case equipment-case--left">
        <i />
      </span>
      <span className="equipment-case equipment-case--right">
        <i />
      </span>
      <span className="floor-tape floor-tape--one" />
      <span className="floor-tape floor-tape--two" />
    </div>
  </div>
);
