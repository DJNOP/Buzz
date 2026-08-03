import { describe, expect, it } from "vitest";
import { getLightingInteractionPresentation } from "./lighting-interaction";

describe("Lighting interaction presentation", () => {
  it("maps an authoritative correct outcome to positive contact feedback", () => {
    expect(getLightingInteractionPresentation("correct")).toMatchObject({
      phase: "contact",
      feedbackTone: "positive",
      controlsLocked: false,
    });
  });

  it("keeps the immediate wrong reaction distinct from the stunned hold", () => {
    const wrong = getLightingInteractionPresentation("wrong");
    const stunned = getLightingInteractionPresentation("stunned");

    expect(wrong).toMatchObject({
      phase: "wrongReaction",
      feedbackTone: "warning",
      controlsLocked: false,
    });
    expect(stunned).toMatchObject({
      phase: "stunnedHold",
      feedbackTone: "locked",
      controlsLocked: true,
    });
  });

  it("exposes non-motion recovery and completion states", () => {
    expect(getLightingInteractionPresentation("losing").phase).toBe(
      "recovery",
    );
    expect(getLightingInteractionPresentation("winning")).toMatchObject({
      phase: "complete",
      feedbackTone: "positive",
    });
  });
});
