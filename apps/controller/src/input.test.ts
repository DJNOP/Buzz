import { describe, expect, it } from "vitest";
import { shouldEmitFromClick } from "./input";

describe("controller input deduplication", () => {
  it("ignores the click generated after pointer input", () => {
    expect(shouldEmitFromClick(1)).toBe(false);
  });

  it("accepts keyboard and assistive-technology click activation", () => {
    expect(shouldEmitFromClick(0)).toBe(true);
  });
});
