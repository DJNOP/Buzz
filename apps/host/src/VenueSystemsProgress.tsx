import {
  getStationSystemByType,
  STATION_PROGRESS_LABELS,
  type VenueStationSystem,
} from "./station-presentation";

export const VenueSystemsProgress = ({
  systems,
}: {
  systems: readonly VenueStationSystem[];
}) => {
  const lighting = getStationSystemByType(systems, "lighting");

  return (
    <section
      className="venue-systems-progress"
      aria-label="Independent event-production system progress"
    >
      <div className="shared-truss" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>
      {lighting ? (
        <div
          className="venue-lighting-system"
          data-station-state={lighting.state}
          aria-hidden="true"
        >
          <span className="venue-light-fixture" />
          <span className="venue-light-fixture" />
          <span className="venue-light-fixture" />
          <span className="venue-light-beam" />
        </div>
      ) : null}
      <ul className="visually-hidden">
        {systems.map(({ player, station, state }) => (
          <li key={player.playerId} data-station-type={station.type}>
            Player {player.playerNumber} {station.label}: {STATION_PROGRESS_LABELS[state]}
          </li>
        ))}
      </ul>
    </section>
  );
};
