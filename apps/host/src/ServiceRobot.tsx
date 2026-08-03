import { useEffect, useState, type CSSProperties } from "react";
import type { PlayerIdentity } from "./player-identity";
import type { RobotPresentation } from "./robot-presentation";
import {
  PIXELLAB_SPRITE_PRESENTATION_ENABLED,
  LIGHTING_ROBOT_SPRITE_ASSETS,
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
  useLightingWorkSprites = false,
}: {
  identity: PlayerIdentity;
  presentation: RobotPresentation;
  compact?: boolean;
  useLightingWorkSprites?: boolean;
}) => {
  const spriteAssets = useLightingWorkSprites
    ? LIGHTING_ROBOT_SPRITE_ASSETS
    : ROBOT_SPRITE_ASSETS;
  const spriteAsset = PIXELLAB_SPRITE_PRESENTATION_ENABLED
    ? spriteAssets[presentation.state]
    : undefined;
  const [spriteFailed, setSpriteFailed] = useState(false);

  useEffect(() => {
    setSpriteFailed(false);
  }, [spriteAsset?.animationUrl]);

  const showSprite = Boolean(spriteAsset && !spriteFailed);
  const animationKey = `${presentation.state}-${presentation.acknowledgementSequence ?? 0}`;
  const anchorStyle = spriteAsset
    ? ({
        "--robot-anchor-head-x": `${spriteAsset.anchors.head[0]}%`,
        "--robot-anchor-head-y": `${spriteAsset.anchors.head[1]}%`,
        "--robot-anchor-torso-x": `${spriteAsset.anchors.torso[0]}%`,
        "--robot-anchor-torso-y": `${spriteAsset.anchors.torso[1]}%`,
        "--robot-anchor-hand-x": `${spriteAsset.anchors.workingHand[0]}%`,
        "--robot-anchor-hand-y": `${spriteAsset.anchors.workingHand[1]}%`,
        "--robot-anchor-feet-x": `${spriteAsset.anchors.feet[0]}%`,
        "--robot-anchor-feet-y": `${spriteAsset.anchors.feet[1]}%`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={`service-robot ${compact ? "service-robot--compact" : ""} ${showSprite ? "service-robot--sprite" : ""}`}
      data-player={identity.number}
      data-identity-colour={identity.colour}
      data-state={presentation.state}
      data-visual-source={showSprite ? "pixellab" : "css-fallback"}
      data-sprite-name={showSprite ? spriteAsset?.name : undefined}
      style={anchorStyle}
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
      <span
        className="robot-presentation-anchor robot-presentation-anchor--head"
        data-presentation-anchor="head"
        aria-hidden="true"
      />
      <span
        className="robot-presentation-anchor robot-presentation-anchor--torso"
        data-presentation-anchor="torso"
        aria-hidden="true"
      />
      <span
        className="robot-presentation-anchor robot-presentation-anchor--working-hand"
        data-presentation-anchor="working-hand"
        aria-hidden="true"
      />
      <span
        className="robot-presentation-anchor robot-presentation-anchor--feet"
        data-presentation-anchor="feet"
        aria-hidden="true"
      />
      <span className="robot-state-label">{presentation.label}</span>
    </div>
  );
};
