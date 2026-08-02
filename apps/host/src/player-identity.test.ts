import { describe, expect, it } from "vitest";
import { getPlayerIdentity, PLAYER_IDENTITIES } from "./player-identity";

describe("temporary service robot identities", () => {
  it("maps every player to the required colour and geometric mark", () => {
    expect(PLAYER_IDENTITIES).toEqual([
      expect.objectContaining({ number: 1, colour: "red", shape: "circle" }),
      expect.objectContaining({ number: 2, colour: "blue", shape: "square" }),
      expect.objectContaining({ number: 3, colour: "yellow", shape: "triangle" }),
      expect.objectContaining({ number: 4, colour: "green", shape: "diamond" }),
    ]);
  });

  it("rejects unsupported player numbers instead of inventing an identity", () => {
    expect(() => getPlayerIdentity(5)).toThrow(RangeError);
  });
});
