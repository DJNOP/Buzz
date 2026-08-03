import {
  CONTROLLER_BUTTONS,
  type ControllerButton,
  type SignalSprintPlayer,
} from "@party-game/shared";
import { BUTTON_PRESENTATION } from "./button-presentation";
import {
  getLightingInteractionPresentation,
} from "./lighting-interaction";
import type { PlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import { ServiceRobot } from "./ServiceRobot";
import { StationProp } from "./StationProp";
import { StationTargetDisplay } from "./StationTargetDisplay";
import type { StationProgressState } from "./station-presentation";

const LightingControl = ({
  button,
  target,
}: {
  button: ControllerButton;
  target: ControllerButton;
}) => {
  const control = BUTTON_PRESENTATION[button];
  const isPrimary = button === "primary";

  return (
    <span
      className={`lighting-control lighting-control--${isPrimary ? "primary" : "secondary"}`}
      data-button={button}
      data-tone={control.tone}
      data-targeted={button === target ? "true" : "false"}
    >
      <b>{control.symbol}</b>
      <small>{isPrimary ? "Action" : control.label}</small>
    </span>
  );
};

export const LightingInteractionDiorama = ({
  player,
  identity,
  presentation,
  stationState,
}: {
  player: SignalSprintPlayer;
  identity: PlayerIdentity;
  presentation: RobotPresentation;
  stationState: StationProgressState;
}) => {
  const interaction = getLightingInteractionPresentation(presentation.state);
  const actionKey = `${presentation.state}-${presentation.acknowledgementSequence ?? "steady"}`;

  return (
    <section
      className="lighting-diorama"
      data-interaction-phase={interaction.phase}
      data-feedback-tone={interaction.feedbackTone}
      data-controls-locked={interaction.controlsLocked ? "true" : "false"}
      aria-label="Lighting interaction station"
    >
      <div
        className="lighting-layer lighting-layer--bay"
        data-layer="lighting-bay-background"
        aria-hidden="true"
      >
        <span className="lighting-bay-rib lighting-bay-rib--left" />
        <span className="lighting-bay-rib lighting-bay-rib--right" />
        <span className="lighting-work-lamp" />
        <span className="lighting-flightcase"><i /></span>
        <span className="lighting-cable-run" />
      </div>

      <div
        className="lighting-layer lighting-layer--station-back"
        data-layer="station-back"
      >
        <div className="lighting-equipment-rack" aria-hidden="true">
          <StationProp type="lighting" state={stationState} />
        </div>
        <span className="lighting-back-status" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="lighting-monitor-arm" aria-hidden="true" />
      </div>

      <div
        key={`robot-${actionKey}`}
        className="lighting-layer lighting-layer--robot"
        data-layer="robot"
      >
        <span className="lighting-robot-sightline" aria-hidden="true" />
        <ServiceRobot
          identity={identity}
          presentation={presentation}
          useLightingWorkSprites
        />
        <span className="lighting-floor-shadow" aria-hidden="true" />
      </div>

      <div
        className="lighting-layer lighting-layer--station-front"
        data-layer="station-front"
        aria-hidden="true"
      >
        <span className="lighting-console-rear-edge" />
        <span className="lighting-console-surface" />
        <span className="lighting-console-lip" />
        <span className="lighting-console-panel" />
        <span className="lighting-console-foot lighting-console-foot--left" />
        <span className="lighting-console-foot lighting-console-foot--right" />
        <span
          className="lighting-contact-point"
          data-presentation-anchor="station-contact"
        />
      </div>

      <div
        className="lighting-layer lighting-layer--target"
        data-layer="dynamic-target-monitor"
        data-target-monitor="integrated"
      >
        <div className="lighting-monitor-housing">
          <div className="lighting-monitor-screen">
            <StationTargetDisplay target={player.target} />
          </div>
          <span className="lighting-monitor-leds" aria-hidden="true">
            <i /><i /><i />
          </span>
          <div className="lighting-monitor-status" role="status">
            <strong>{interaction.statusLabel}</strong>
            <span>
              {player.mistakes} misroute{player.mistakes === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div
        key={`effects-${actionKey}`}
        className="lighting-layer lighting-layer--effects"
        data-layer="local-station-effects"
        aria-hidden="true"
      >
        <span className="lighting-confirmation-burst" />
        <span className="lighting-error-spark lighting-error-spark--one" />
        <span className="lighting-error-spark lighting-error-spark--two" />
        <span className="lighting-lock-indicator">!</span>
        <span className="lighting-stage-signal" />
      </div>

      <div
        className="lighting-layer lighting-layer--foreground"
        data-layer="foreground-props"
      >
        <div className="lighting-console-controls" aria-hidden="true">
          <LightingControl button="primary" target={player.target} />
          <div className="lighting-secondary-controls">
            {CONTROLLER_BUTTONS.filter((button) => button !== "primary").map(
              (button) => (
                <LightingControl
                  key={button}
                  button={button}
                  target={player.target}
                />
              ),
            )}
          </div>
        </div>
        <div className="lighting-utility-controls" aria-hidden="true">
          <span /><span /><span />
        </div>
        <span className="lighting-foreground-cable" aria-hidden="true" />
      </div>
    </section>
  );
};
