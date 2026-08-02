import { describe, expect, it, vi } from "vitest";
import { createInputTracker, type LogicalButtonEvent } from "./input";

describe("controller input tracker", () => {
  it("produces one logical down and up for pointer interaction", () => {
    const events: LogicalButtonEvent[] = [];
    const tracker = createInputTracker((event) => events.push(event));

    tracker.pointerDown(10, "primary");
    tracker.pointerDown(10, "primary");
    tracker.activateClick("primary", 1);
    tracker.pointerUp(10);
    tracker.pointerUp(10);

    expect(events).toEqual([
      { button: "primary", phase: "down" },
      { button: "primary", phase: "up" },
    ]);
  });

  it("pairs cancellation with up and never leaves a stuck button", () => {
    const events: LogicalButtonEvent[] = [];
    const states = vi.fn();
    const tracker = createInputTracker((event) => events.push(event), states);

    tracker.pointerDown(4, "secondary2");
    tracker.pointerCancel(4);

    expect(events).toEqual([
      { button: "secondary2", phase: "down" },
      { button: "secondary2", phase: "up" },
    ]);
    expect(tracker.getActiveButtons().size).toBe(0);
    expect(states).toHaveBeenLastCalledWith(new Set());
  });

  it("releases all active pointers and keys when focus is lost", () => {
    const events: LogicalButtonEvent[] = [];
    const tracker = createInputTracker((event) => events.push(event));
    tracker.pointerDown(1, "secondary1");
    tracker.keyDown("secondary3");

    tracker.releaseAll();

    expect(events).toEqual([
      { button: "secondary1", phase: "down" },
      { button: "secondary3", phase: "down" },
      { button: "secondary1", phase: "up" },
      { button: "secondary3", phase: "up" },
    ]);
    expect(tracker.getActiveButtons().size).toBe(0);
  });

  it("supports keyboard and assistive clicks without compatibility duplicates", () => {
    const events: LogicalButtonEvent[] = [];
    const tracker = createInputTracker((event) => events.push(event));

    tracker.keyDown("secondary4");
    tracker.activateClick("secondary4", 0);
    tracker.keyUp("secondary4");
    tracker.activateClick("secondary2", 0);

    expect(events).toEqual([
      { button: "secondary4", phase: "down" },
      { button: "secondary4", phase: "up" },
      { button: "secondary2", phase: "down" },
      { button: "secondary2", phase: "up" },
    ]);
  });
});
