import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  getLightingQaScenario,
  LightingQaFullHdCaptureFrame,
  LightingQaHarness,
  shouldUseLightingQaFullHdCaptureFrame,
} from "./LightingQaHarness";

describe("Lighting presentation-only QA harness", () => {
  it("is available only for named development scenarios", () => {
    expect(getLightingQaScenario("?lightingQa=one-stunned", true)).toBe(
      "one-stunned",
    );
    expect(getLightingQaScenario("?lightingQa=unknown", true)).toBeUndefined();
    expect(
      getLightingQaScenario("?lightingQa=one-stunned", false),
    ).toBeUndefined();
  });

  it("renders deterministic four-player stunned evidence without changing gameplay timing", () => {
    const markup = renderToStaticMarkup(
      <LightingQaHarness scenario="four-stunned" />,
    );

    expect(markup).toContain('data-lighting-qa-scenario="four-stunned"');
    expect(markup.match(/class="player-workstation /g)).toHaveLength(4);
    expect(markup).toContain('data-interaction-phase="stunnedHold"');
    expect(markup).toContain("Lighting controls locked");
    expect(markup).toContain("Production rules and timing are unchanged");
  });

  it("provides a development-only 1920x1080 capture frame", () => {
    expect(
      shouldUseLightingQaFullHdCaptureFrame(
        "?lightingQa=one-idle&lightingQaViewport=1920x1080",
        true,
      ),
    ).toBe(true);
    expect(
      shouldUseLightingQaFullHdCaptureFrame(
        "?lightingQa=one-idle&lightingQaViewport=1920x1080",
        false,
      ),
    ).toBe(false);

    const markup = renderToStaticMarkup(
      <LightingQaFullHdCaptureFrame scenario="one-idle" />,
    );
    expect(markup).toContain('class="lighting-qa-full-hd-frame"');
    expect(markup).toContain('src="/?lightingQa=one-idle&amp;assetRevision=3"');
  });
});
