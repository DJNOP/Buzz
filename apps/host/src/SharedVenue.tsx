import type { SignalSprintPlayer } from "@party-game/shared";
import { PlayerWorkstation } from "./PlayerWorkstation";
import type { RobotPresentation } from "./robot-presentation";
import { VenueStage } from "./VenueStage";

export const SharedVenue = ({
  players,
  scoreToWin,
  getPresentation,
}: {
  players: readonly SignalSprintPlayer[];
  scoreToWin: number;
  getPresentation: (player: SignalSprintPlayer) => RobotPresentation;
}) => {
  const playerPresentations = players.map((player) => ({
    player,
    presentation: getPresentation(player),
  }));
  const lightingPresentation = playerPresentations.find(
    ({ player }) => player.playerNumber === 1,
  )?.presentation;

  return (
    <section
      className="shared-venue"
      data-player-count={players.length}
      aria-label={`Shared Signal Sprint venue with ${players.length} workstation${
        players.length === 1 ? "" : "s"
      }`}
    >
      <VenueStage
        players={players}
        scoreToWin={scoreToWin}
        lightingInteractionState={lightingPresentation?.state}
      />
      <div className="venue-workstations" data-player-count={players.length}>
        {playerPresentations.map(({ player, presentation }) => (
          <PlayerWorkstation
            key={player.playerId}
            player={player}
            scoreToWin={scoreToWin}
            presentation={presentation}
          />
        ))}
      </div>
    </section>
  );
};
