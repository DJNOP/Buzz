import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("station presentation motion fallback", () => {
  it("removes venue and station motion without removing state geometry", () => {
    const reducedMotion = styles.slice(
      styles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );

    expect(reducedMotion).toContain(".station-prop");
    expect(reducedMotion).toContain(".venue-curtain");
    expect(reducedMotion).toContain(".performance-stage__platform");
    expect(reducedMotion).toContain(".lighting-layer--robot");
    expect(reducedMotion).toContain(".lighting-confirmation-burst");
    expect(styles).toContain(".lighting-monitor-housing");
    expect(styles).toContain(".lighting-monitor-status");
    expect(styles).toContain(".lighting-contact-point");
    expect(reducedMotion).toContain("animation: none !important");
    expect(reducedMotion).toContain("transition: none !important");
    expect(reducedMotion).toContain(
      '.lighting-diorama[data-interaction-phase="contact"]',
    );
    expect(reducedMotion).toContain(
      '.lighting-diorama[data-interaction-phase="wrongReaction"]',
    );
    expect(styles).toContain('[data-machinery-state="complete"]');
    expect(styles).toContain('[data-decorations-state="complete"]');
    expect(styles).toContain('[data-sound-state="complete"]');
    expect(styles).toContain('[data-lighting-state="complete"]');
  });
});
