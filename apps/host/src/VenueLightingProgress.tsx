import type { SignalSprintPlayer } from "@party-game/shared";
import { LightRigProp } from "./LightRigProp";
import { getPlayerIdentity } from "./player-identity";
import {
  getLightRigProgressState,
  type LightRigProgressState,
} from "./sprite-assets";

const LIGHT_STATE_LABELS: Record<LightRigProgressState, string> = {
  broken: "broken",
  partial: "partially active",
  nearlyOperational: "nearly operational",
  complete: "complete",
};

export const getVenueLightingSegments = (
  players: readonly SignalSprintPlayer[],
  scoreToWin: number,
) =>
  players.map((player) => ({
    player,
    identity: getPlayerIdentity(player.playerNumber),
    state: getLightRigProgressState(player.score, scoreToWin),
  }));

export const VenueLightingProgress = ({
  players,
  scoreToWin,
}: {
  players: readonly SignalSprintPlayer[];
  scoreToWin: number;
}) => {
  const segments = getVenueLightingSegments(players, scoreToWin);

  return (
    <section
      className="venue-lighting-progress"
      data-player-count={players.length}
      aria-label="Individual lighting-system progress"
    >
      <div className="shared-truss" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>
      <div className="venue-lighting-segments">
        {segments.map(({ player, identity, state }) => (
          <article
            key={player.playerId}
            className="venue-lighting-segment"
            data-player={player.playerNumber}
            data-identity-colour={identity.colour}
            data-station-state={state}
          >
            <LightRigProp state={state} />
            <span className="venue-light-beam" aria-hidden="true" />
            <div>
              <strong>P{player.playerNumber}</strong>
              <span>{LIGHT_STATE_LABELS[state]}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
