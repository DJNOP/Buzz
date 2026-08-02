import { useEffect, useState } from "react";
import {
  PIXELLAB_SPRITE_PRESENTATION_ENABLED,
  STATION_SPRITE_ASSETS,
} from "./sprite-assets";
import type {
  StationProgressState,
  StationType,
} from "./station-presentation";

export const StationProp = ({
  type,
  state,
  compact = false,
}: {
  type: StationType;
  state: StationProgressState;
  compact?: boolean;
}) => {
  const spriteUrl = STATION_SPRITE_ASSETS[type][state];
  const [spriteLoaded, setSpriteLoaded] = useState(false);

  useEffect(() => {
    setSpriteLoaded(false);
  }, [spriteUrl]);

  return (
    <div
      className={`station-prop station-prop--${type} ${compact ? "station-prop--compact" : ""} ${spriteLoaded ? "station-prop--sprite-ready" : ""}`}
      data-station-type={type}
      data-station-state={state}
      data-visual-source={spriteLoaded ? "pixellab" : "css-fallback"}
      aria-hidden="true"
    >
      <span /><span /><span /><span />
      {PIXELLAB_SPRITE_PRESENTATION_ENABLED ? (
        <img
          className="station-sprite"
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
