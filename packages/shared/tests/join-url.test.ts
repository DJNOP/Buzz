import { describe, expect, it } from "vitest";
import {
  buildControllerJoinUrl,
  parseRoomQuery,
  removeRoomQueryFromUrl,
} from "../src/join-url.js";

describe("controller join URL", () => {
  it("constructs a local controller URL with the room code", () => {
    expect(buildControllerJoinUrl("192.168.1.24", "QTHY")).toBe(
      "http://192.168.1.24:5174/?room=QTHY",
    );
  });

  it("URL-encodes room values rather than interpolating query text", () => {
    expect(buildControllerJoinUrl("10.0.0.8", "AB C&")).toBe(
      "http://10.0.0.8:5174/?room=AB+C%26",
    );
  });

  it("extracts and normalizes a valid room query", () => {
    expect(parseRoomQuery("?room=qthy")).toEqual({
      status: "valid",
      roomCode: "QTHY",
    });
  });

  it.each(["?room=", "?room=O0I1", "?room=ABCD&room=EFGH"])(
    "rejects an invalid or ambiguous room query: %s",
    (search) => {
      expect(parseRoomQuery(search)).toEqual({ status: "invalid" });
    },
  );

  it("preserves manual joining when no room query exists", () => {
    expect(parseRoomQuery("?source=camera")).toEqual({ status: "missing" });
  });

  it("removes only the consumed room query after joining", () => {
    expect(
      removeRoomQueryFromUrl(
        "http://192.168.1.24:5174/?room=QTHY&source=camera#controller",
      ),
    ).toBe("/?source=camera#controller");
  });
});
