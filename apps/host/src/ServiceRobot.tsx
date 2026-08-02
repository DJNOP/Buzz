import type { PlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";

export const ServiceRobot = ({
  identity,
  presentation,
  compact = false,
}: {
  identity: PlayerIdentity;
  presentation: RobotPresentation;
  compact?: boolean;
}) => (
  <div
    className={`service-robot ${compact ? "service-robot--compact" : ""}`}
    data-player={identity.number}
    data-identity-colour={identity.colour}
    data-state={presentation.state}
    role="img"
    aria-label={`Player ${identity.number} ${identity.colourLabel} ${identity.shapeLabel} service robot: ${presentation.label}`}
  >
    {presentation.showAcknowledgement ? (
      <span
        key={presentation.acknowledgementSequence}
        className="robot-acknowledgement"
        aria-hidden="true"
      />
    ) : null}
    <div className="robot-antenna" aria-hidden="true">
      <i />
    </div>
    <div className="robot-head" aria-hidden="true">
      <span className="robot-ear robot-ear--left" />
      <span className="robot-ear robot-ear--right" />
      <div className="robot-face">
        <i className="robot-eye" />
        <i className="robot-eye" />
        <span className="robot-mouth" />
      </div>
      <span className="robot-status-light" />
    </div>
    <div className="robot-body" aria-hidden="true">
      <span className="robot-arm robot-arm--left"><i /></span>
      <div className="robot-torso">
        <span className={`identity-mark identity-mark--${identity.shape}`} />
        <span className="robot-vent"><i /><i /><i /></span>
      </div>
      <span className="robot-arm robot-arm--right"><i /></span>
    </div>
    <div className="robot-feet" aria-hidden="true">
      <i /><i />
    </div>
    <span className="robot-state-label">{presentation.label}</span>
  </div>
);
