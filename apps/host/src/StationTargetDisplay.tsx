import type { ControllerButton } from "@party-game/shared";
import { BUTTON_PRESENTATION } from "./button-presentation";

export const StationTargetDisplay = ({
  target,
}: {
  target: ControllerButton;
}) => {
  const presentation = BUTTON_PRESENTATION[target];

  return (
    <div
      className="station-target-display"
      data-button={target}
      data-target={target}
      data-tone={presentation.tone}
      aria-label={`Current target ${presentation.symbol} ${presentation.label}`}
    >
      <span>Next cue</span>
      <strong>{presentation.symbol}</strong>
      <b>{presentation.label}</b>
      <small>{target}</small>
    </div>
  );
};
