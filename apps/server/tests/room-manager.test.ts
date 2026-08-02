import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ControllerSession,
  RoomSnapshot,
} from "@party-game/shared";
import {
  RoomManager,
  type RoomManagerEvent,
} from "../src/room-manager.js";

const managers: RoomManager[] = [];

const createManager = (
  options: ConstructorParameters<typeof RoomManager>[0] = {},
) => {
  let playerSequence = 0;
  let tokenSequence = 0;
  const manager = new RoomManager({
    createRoomCode: () => "ABCD",
    createPlayerId: () => `player-${(playerSequence += 1)}`,
    createReconnectionToken: () =>
      `private-reconnect-token-${(tokenSequence += 1).toString().padStart(4, "0")}`,
    ...options,
  });
  managers.push(manager);
  return manager;
};

const createRoom = (manager: RoomManager, hostSocketId = "host-1") => {
  const result = manager.createRoom(hostSocketId);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.room;
};

const joinRoom = (
  manager: RoomManager,
  socketId: string,
  displayName: string,
  roomCode = "ABCD",
): ControllerSession => {
  const result = manager.joinRoom(socketId, { roomCode, displayName });
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.session;
};

const latestRoom = (events: RoomManagerEvent[]): RoomSnapshot => {
  const update = [...events]
    .reverse()
    .find(
      (event): event is Extract<RoomManagerEvent, { type: "room-updated" }> =>
        event.type === "room-updated",
    );
  if (!update) {
    throw new Error("Expected a room update event.");
  }
  return update.room;
};

afterEach(() => {
  for (const manager of managers.splice(0)) {
    manager.dispose();
  }
  vi.useRealTimers();
});

describe("RoomManager", () => {
  it("creates one room owned by a host", () => {
    const manager = createManager();

    expect(manager.createRoom("host-1")).toEqual({
      ok: true,
      room: { code: "ABCD", players: [] },
    });
    expect(manager.getRoomForHost("host-1")).toEqual({
      code: "ABCD",
      players: [],
    });
    expect(manager.createRoom("host-1")).toMatchObject({
      ok: false,
      error: { code: "host_already_has_room" },
    });
  });

  it("retries when a generated room code collides", () => {
    const codes = ["ABCD", "ABCD", "EFGH"];
    const manager = createManager({ createRoomCode: () => codes.shift() ?? "JKLM" });

    expect(manager.createRoom("host-1")).toMatchObject({
      ok: true,
      room: { code: "ABCD" },
    });
    expect(manager.createRoom("host-2")).toMatchObject({
      ok: true,
      room: { code: "EFGH" },
    });
  });

  it("joins a controller to an existing normalized room", () => {
    const manager = createManager();
    createRoom(manager);

    const result = manager.joinRoom("controller-1", {
      roomCode: " abcd ",
      displayName: "  Ada   Lovelace ",
    });

    expect(result).toMatchObject({
      ok: true,
      session: {
        roomCode: "ABCD",
        player: {
          number: 1,
          displayName: "Ada Lovelace",
          connectionState: "connected",
        },
      },
    });
  });

  it("rejects invalid and nonexistent room codes", () => {
    const manager = createManager();
    createRoom(manager);

    expect(
      manager.joinRoom("controller-1", {
        roomCode: "O0I1",
        displayName: "Ada",
      }),
    ).toMatchObject({ ok: false, error: { code: "invalid_room_code" } });
    expect(
      manager.joinRoom("controller-2", {
        roomCode: "EFGH",
        displayName: "Ada",
      }),
    ).toMatchObject({ ok: false, error: { code: "room_not_found" } });
  });

  it.each(["", "   ", "!name", "name?", "abcdefghijklmnopq"])(
    "rejects invalid display name %j",
    (displayName) => {
      const manager = createManager();
      createRoom(manager);

      expect(
        manager.joinRoom("controller-1", { roomCode: "ABCD", displayName }),
      ).toMatchObject({
        ok: false,
        error: { code: "invalid_display_name" },
      });
    },
  );

  it("rejects duplicate display names case-insensitively", () => {
    const manager = createManager();
    createRoom(manager);
    joinRoom(manager, "controller-1", "Ada");

    expect(
      manager.joinRoom("controller-2", {
        roomCode: "ABCD",
        displayName: "  ADA ",
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "duplicate_display_name" },
    });
  });

  it("allows four players and rejects a fifth", () => {
    const manager = createManager();
    createRoom(manager);

    const sessions = [1, 2, 3, 4].map((number) =>
      joinRoom(manager, `controller-${number}`, `Player ${number}`),
    );

    expect(sessions.map((session) => session.player.number)).toEqual([1, 2, 3, 4]);
    expect(
      manager.joinRoom("controller-5", {
        roomCode: "ABCD",
        displayName: "Player 5",
      }),
    ).toMatchObject({ ok: false, error: { code: "room_full" } });
  });

  it("never exposes a reconnection token in the host room snapshot", () => {
    const manager = createManager();
    createRoom(manager);
    const session = joinRoom(manager, "controller-1", "Ada");

    const serializedRoom = JSON.stringify(manager.getRoomForHost("host-1"));
    expect(serializedRoom).not.toContain(session.reconnectionToken);
    expect(serializedRoom).not.toContain("reconnectionToken");
  });

  it("marks a disconnected player disconnected during the grace period", () => {
    vi.useFakeTimers();
    const events: RoomManagerEvent[] = [];
    const manager = createManager({ reconnectGraceMs: 5_000 });
    manager.subscribe((event) => events.push(event));
    createRoom(manager);
    joinRoom(manager, "controller-1", "Ada");

    manager.handleDisconnect("controller-1");

    expect(latestRoom(events).players[0]).toMatchObject({
      number: 1,
      displayName: "Ada",
      connectionState: "disconnected",
    });
  });

  it("restores the same stable player identity with a valid token", () => {
    vi.useFakeTimers();
    const manager = createManager({ reconnectGraceMs: 5_000 });
    createRoom(manager);
    const original = joinRoom(manager, "controller-old", "Ada");
    manager.handleDisconnect("controller-old");

    const outcome = manager.reconnectController(
      "controller-new",
      original.reconnectionToken,
    );

    expect(outcome.result).toMatchObject({
      ok: true,
      session: {
        player: {
          id: original.player.id,
          number: original.player.number,
          displayName: original.player.displayName,
          accent: original.player.accent,
          connectionState: "connected",
        },
      },
    });

    vi.advanceTimersByTime(5_000);
    expect(manager.getRoomForHost("host-1")?.players[0]).toMatchObject({
      id: original.player.id,
      connectionState: "connected",
    });
  });

  it("keeps the replacement socket active when the old socket disconnects late", () => {
    const manager = createManager({ now: () => 123_456 });
    createRoom(manager);
    const original = joinRoom(manager, "controller-old", "Ada");

    const outcome = manager.reconnectController(
      "controller-new",
      original.reconnectionToken,
    );

    expect(outcome.replacedSocketId).toBe("controller-old");
    expect(outcome.result).toMatchObject({ ok: true });

    manager.handleDisconnect("controller-old");

    expect(manager.getRoomForHost("host-1")?.players[0]).toMatchObject({
      id: original.player.id,
      connectionState: "connected",
    });
    expect(
      manager.acceptInput("controller-new", {
        button: "primary",
        phase: "down",
        clientTimestamp: 100,
      }),
    ).toMatchObject({ event: { playerId: original.player.id, phase: "down" } });
  });

  it("rejects an invalid reconnection token", () => {
    const manager = createManager();
    createRoom(manager);

    expect(
      manager.reconnectController(
        "controller-new",
        "private-reconnect-token-missing",
      ).result,
    ).toMatchObject({
      ok: false,
      error: { code: "invalid_reconnection_token" },
    });
  });

  it("removes an expired disconnected player and reuses the free number", () => {
    vi.useFakeTimers();
    const manager = createManager({ reconnectGraceMs: 5_000 });
    createRoom(manager);
    const expired = joinRoom(manager, "controller-1", "Ada");
    manager.handleDisconnect("controller-1");

    vi.advanceTimersByTime(5_000);

    expect(manager.getRoomForHost("host-1")?.players).toEqual([]);
    expect(
      manager.reconnectController("controller-new", expired.reconnectionToken).result,
    ).toMatchObject({
      ok: false,
      error: { code: "invalid_reconnection_token" },
    });
    expect(joinRoom(manager, "controller-2", "Grace").player.number).toBe(1);
  });

  it("accepts only paired, valid input from a joined controller", () => {
    const manager = createManager({ now: () => 123_456 });
    createRoom(manager);
    const session = joinRoom(manager, "controller-1", "Ada");

    expect(
      manager.acceptInput("controller-1", {
        button: "secondary2",
        phase: "down",
        clientTimestamp: 100,
      }),
    ).toMatchObject({
      hostSocketId: "host-1",
      event: {
        roomCode: "ABCD",
        playerId: session.player.id,
        playerNumber: 1,
        button: "secondary2",
        phase: "down",
        serverReceivedAt: 123_456,
        validInputCount: 1,
      },
    });
    expect(
      manager.acceptInput("controller-1", {
        button: "secondary2",
        phase: "down",
        clientTimestamp: 101,
      }),
    ).toBeNull();
    expect(
      manager.acceptInput("controller-1", {
        button: "secondary2",
        phase: "up",
        clientTimestamp: 102,
      }),
    ).toMatchObject({ event: { phase: "up", validInputCount: 2 } });
  });

  it("rejects malformed, unjoined, and removed-controller input", () => {
    vi.useFakeTimers();
    const manager = createManager({ reconnectGraceMs: 1_000 });
    createRoom(manager);
    joinRoom(manager, "controller-1", "Ada");

    expect(
      manager.acceptInput("controller-1", {
        button: "red",
        phase: "down",
        clientTimestamp: 1,
      }),
    ).toBeNull();
    expect(
      manager.acceptInput("unjoined", {
        button: "primary",
        phase: "down",
        clientTimestamp: 1,
      }),
    ).toBeNull();
    manager.handleDisconnect("controller-1");
    vi.advanceTimersByTime(1_000);
    expect(
      manager.acceptInput("controller-1", {
        button: "primary",
        phase: "down",
        clientTimestamp: 1,
      }),
    ).toBeNull();
  });

  it("closes a room and invalidates sessions when its host disconnects", () => {
    const events: RoomManagerEvent[] = [];
    const manager = createManager();
    manager.subscribe((event) => events.push(event));
    createRoom(manager);
    const session = joinRoom(manager, "controller-1", "Ada");

    manager.handleDisconnect("host-1");

    expect(manager.getRoomForHost("host-1")).toBeNull();
    expect(events.at(-1)).toEqual({
      type: "room-closed",
      roomCode: "ABCD",
      controllerSocketIds: ["controller-1"],
    });
    expect(
      manager.reconnectController("controller-new", session.reconnectionToken).result,
    ).toMatchObject({
      ok: false,
      error: { code: "invalid_reconnection_token" },
    });
  });
});
