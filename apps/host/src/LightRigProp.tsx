import { useEffect, useState } from "react";
import {
  LIGHT_RIG_SPRITE_ASSETS,
  PIXELLAB_SPRITE_PRESENTATION_ENABLED,
  type LightRigProgressState,
} from "./sprite-assets";

export const LightRigProp = ({
  state,
  compact = false,
}: {
  state: LightRigProgressState;
  compact?: boolean;
}) => {
  const spriteUrl = LIGHT_RIG_SPRITE_ASSETS[state];
  const [spriteLoaded, setSpriteLoaded] = useState(false);

  useEffect(() => {
    setSpriteLoaded(false);
  }, [spriteUrl]);

  return (
    <div
      className={`station-prop station-prop--lights ${compact ? "light-rig-prop--compact" : ""} ${spriteLoaded ? "station-prop--sprite-ready" : ""}`}
      data-station-state={state}
      data-visual-source={spriteLoaded ? "pixellab" : "css-fallback"}
      aria-hidden="true"
    >
      <span /><span /><span />
      {PIXELLAB_SPRITE_PRESENTATION_ENABLED ? (
        <img
          className="light-rig-sprite"
          src={spriteUrl}
          alt=""
          draggable={false}
          onLoad={() => setSpriteLoaded(true)}
          onError={() => setSpriteLoaded(false)}
        />
      ) : null}
    </div>
  );
};

