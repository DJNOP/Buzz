import { useEffect, useState } from "react";
import type { PlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import {
  PIXELLAB_SPRITE_PRESENTATION_ENABLED,
  ROBOT_SPRITE_ASSETS,
} from "./sprite-assets";

const CssRobotVisual = ({ identity }: { identity: PlayerIdentity }) => (
  <>
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
  </>
);

export const ServiceRobot = ({
  identity,
  presentation,
  compact = false,
}: {
  identity: PlayerIdentity;
  presentation: RobotPresentation;
  compact?: boolean;
}) => {
  const spriteAsset = PIXELLAB_SPRITE_PRESENTATION_ENABLED
    ? ROBOT_SPRITE_ASSETS[presentation.state]
    : undefined;
  const [spriteFailed, setSpriteFailed] = useState(false);

  useEffect(() => {
    setSpriteFailed(false);
  }, [spriteAsset?.animationUrl]);

  const showSprite = Boolean(spriteAsset && !spriteFailed);
  const animationKey = `${presentation.state}-${presentation.acknowledgementSequence ?? 0}`;

  return (
    <div
      className={`service-robot ${compact ? "service-robot--compact" : ""} ${showSprite ? "service-robot--sprite" : ""}`}
      data-player={identity.number}
      data-identity-colour={identity.colour}
      data-state={presentation.state}
      data-visual-source={showSprite ? "pixellab" : "css-fallback"}
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
      {showSprite && spriteAsset ? (
        <div className="robot-sprite-stage" aria-hidden="true">
          <picture className="robot-sprite-picture">
            <source
              media="(prefers-reduced-motion: reduce)"
              srcSet={spriteAsset.posterUrl}
            />
            <img
              key={animationKey}
              src={spriteAsset.animationUrl}
              alt=""
              draggable={false}
              onError={() => setSpriteFailed(true)}
            />
          </picture>
          <span
            className={`robot-sprite-identity identity-mark--${identity.shape}`}
          />
        </div>
      ) : (
        <CssRobotVisual identity={identity} />
      )}
      <span className="robot-state-label">{presentation.label}</span>
    </div>
  );
};
