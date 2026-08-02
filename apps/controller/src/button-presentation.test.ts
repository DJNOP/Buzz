import { describe, expect, it } from "vitest";
import { PRIMARY_BUTTON, SECONDARY_BUTTONS } from "./button-presentation";

describe("controller button presentation", () => {
  it("keeps the semantic five-button identifiers and required visual order", () => {
    expect([PRIMARY_BUTTON, ...SECONDARY_BUTTONS]).toEqual([
      expect.objectContaining({ button: "primary", symbol: "A", label: "Action" }),
      expect.objectContaining({ button: "secondary1", symbol: "1", label: "Red" }),
      expect.objectContaining({ button: "secondary2", symbol: "2", label: "Blue" }),
      expect.objectContaining({ button: "secondary3", symbol: "3", label: "Yellow" }),
      expect.objectContaining({ button: "secondary4", symbol: "4", label: "Green" }),
    ]);
  });
});
