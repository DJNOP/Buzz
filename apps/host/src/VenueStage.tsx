import type { SignalSprintPlayer } from "@party-game/shared";
import {
  getStationSystemByType,
  getVenueStationSystems,
} from "./station-presentation";
import { VenueSystemsProgress } from "./VenueSystemsProgress";

export const VenueStage = ({
  players,
  scoreToWin,
  celebration = false,
  completedPlayerIds = [],
}: {
  players: readonly SignalSprintPlayer[];
  scoreToWin: number;
  celebration?: boolean;
  completedPlayerIds?: readonly string[];
}) => {
  const systems = getVenueStationSystems(
    players,
    scoreToWin,
    completedPlayerIds,
  );
  const sound = getStationSystemByType(systems, "sound");
  const decorations = getStationSystemByType(systems, "decorations");
  const machinery = getStationSystemByType(systems, "machinery");

  return (
    <div
      className={`venue-stage ${celebration ? "venue-stage--celebration" : ""}`}
      data-player-count={players.length}
      data-lighting-state={getStationSystemByType(systems, "lighting")?.state}
      data-sound-state={sound?.state}
      data-decorations-state={decorations?.state}
      data-machinery-state={machinery?.state}
      aria-label="Shared backstage event venue"
    >
      <div className="venue-back-wall" aria-hidden="true">
        <span className="venue-gantry venue-gantry--left" />
        <span className="venue-gantry venue-gantry--right" />
        {sound ? (
          <>
            <span className="venue-speaker-stack venue-speaker-stack--left">
              <i /><i /><b />
            </span>
            <span className="venue-speaker-stack venue-speaker-stack--right">
              <i /><i /><b />
            </span>
          </>
        ) : null}
        {decorations ? (
          <div className="venue-decorations">
            <span className="venue-bunting venue-bunting--left"><i /><i /><i /></span>
            <span className="venue-bunting venue-bunting--right"><i /><i /><i /></span>
            <span className="venue-stage-drape" />
            <span className="venue-ornament venue-ornament--left" />
            <span className="venue-ornament venue-ornament--right" />
          </div>
        ) : null}
        {machinery ? (
          <div className="venue-machinery">
            <span className="venue-curtain venue-curtain--left" />
            <span className="venue-curtain venue-curtain--right" />
            <span className="venue-backdrop-rail"><i /><i /><i /></span>
          </div>
        ) : null}
      </div>
      <VenueSystemsProgress systems={systems} />
      <div className="performance-stage" aria-hidden="true">
        <span className="performance-stage__screen">SIGNAL SPRINT</span>
        <span className="performance-stage__deck" />
        <span className="performance-stage__platform" />
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
};
