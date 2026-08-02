import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import type { Server as SocketServer } from "socket.io";
import {
  CONNECTION_ROLES,
  CONTROLLER_INPUT_EVENT,
  CONTROLLER_JOIN_ROOM_EVENT,
  CONTROLLER_RECONNECT_EVENT,
  CONTROLLER_ROOM_CLOSED_EVENT,
  HOST_CREATE_ROOM_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  HOST_ROOM_STATE_EVENT,
  type ClientToServerEvents,
  type ConnectionRole,
  type ControllerSession,
  type CreateRoomResult,
  type HostPlayerInputEvent,
  type InterServerEvents,
  type JoinRoomResult,
  type ReconnectControllerResult,
  type RoomClosedNotice,
  type RoomSnapshot,
  type ServerToClientEvents,
  type SocketData,
} from "@party-game/shared";
import { createRealtimeServer } from "../src/create-server.js";
import { RoomManager } from "../src/room-manager.js";

type TypedClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type TypedServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

interface RunningServer {
  io: TypedServer;
  roomManager: RoomManager;
  url: string;
}

const clients: TypedClient[] = [];
let runningServer: RunningServer | undefined;

const startServer = async (): Promise<RunningServer> => {
  let roomSequence = 0;
  let playerSequence = 0;
  let tokenSequence = 0;
  const codes = ["ABCD", "EFGH", "JKLM", "NPQR"];
  const roomManager = new RoomManager({
    createRoomCode: () => codes[roomSequence++] ?? "STUV",
    createPlayerId: () => `player-${(playerSequence += 1)}`,
    createReconnectionToken: () =>
      `private-reconnect-token-${(tokenSequence += 1).toString().padStart(4, "0")}`,
    reconnectGraceMs: 5_000,
  });
  const httpServer = createServer();
  const { io } = createRealtimeServer(httpServer, { roomManager });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP address for the test server.");
  }

  runningServer = {
    io,
    roomManager,
    url: `http://127.0.0.1:${(address as AddressInfo).port}`,
  };
  return runningServer;
};

const connectClient = async (url: string, role: ConnectionRole) => {
  const client: TypedClient = createClient(url, {
    auth: { role },
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
  });
  clients.push(client);
  await new Promise<void>((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });
  return client;
};

const createRoom = (host: TypedClient) =>
  new Promise<CreateRoomResult>((resolve) =>
    host.emit(HOST_CREATE_ROOM_EVENT, resolve),
  );

const joinRoom = (client: TypedClient, roomCode: string, displayName: string) =>
  new Promise<JoinRoomResult>((resolve) =>
    client.emit(CONTROLLER_JOIN_ROOM_EVENT, { roomCode, displayName }, resolve),
  );

const reconnect = (client: TypedClient, reconnectionToken: string) =>
  new Promise<ReconnectControllerResult>((resolve) =>
    client.emit(CONTROLLER_RECONNECT_EVENT, { reconnectionToken }, resolve),
  );

const waitForEvent = <Event>(
  socket: TypedClient,
  eventName: string,
): Promise<Event> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out: ${eventName}`)), 2_000);
    socket.once(eventName as never, ((event: Event) => {
      clearTimeout(timeout);
      resolve(event);
    }) as never);
  });

const expectJoined = (result: JoinRoomResult): ControllerSession => {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.session;
};

afterEach(async () => {
  for (const client of clients.splice(0)) {
    client.disconnect();
  }
  if (runningServer) {
    await new Promise<void>((resolve) => runningServer?.io.close(() => resolve()));
    runningServer.roomManager.dispose();
    runningServer = undefined;
  }
});

describe("multiplayer Socket.IO transport", () => {
  it("creates a room and joins a controller", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const controller = await connectClient(server.url, CONNECTION_ROLES.controller);

    await expect(createRoom(host)).resolves.toMatchObject({
      ok: true,
      room: { code: "ABCD", players: [] },
    });
    await expect(joinRoom(controller, "abcd", "Ada")).resolves.toMatchObject({
      ok: true,
      session: { roomCode: "ABCD", player: { number: 1, displayName: "Ada" } },
    });
  });

  it("routes valid input only to the joined controller's host room", async () => {
    const server = await startServer();
    const hostOne = await connectClient(server.url, CONNECTION_ROLES.host);
    const hostTwo = await connectClient(server.url, CONNECTION_ROLES.host);
    const controllerOne = await connectClient(server.url, CONNECTION_ROLES.controller);
    const controllerTwo = await connectClient(server.url, CONNECTION_ROLES.controller);
    const roomOne = await createRoom(hostOne);
    const roomTwo = await createRoom(hostTwo);
    if (!roomOne.ok || !roomTwo.ok) {
      throw new Error("Expected both rooms to be created.");
    }
    expectJoined(await joinRoom(controllerOne, roomOne.room.code, "Ada"));
    expectJoined(await joinRoom(controllerTwo, roomTwo.room.code, "Grace"));
    const hostTwoListener = vi.fn();
    hostTwo.on(HOST_PLAYER_INPUT_EVENT, hostTwoListener);
    const received = waitForEvent<HostPlayerInputEvent>(hostOne, HOST_PLAYER_INPUT_EVENT);

    controllerOne.emit(CONTROLLER_INPUT_EVENT, {
      button: "secondary4",
      phase: "down",
      clientTimestamp: 123,
    });

    await expect(received).resolves.toMatchObject({
      roomCode: roomOne.room.code,
      playerNumber: 1,
      button: "secondary4",
      phase: "down",
      validInputCount: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(hostTwoListener).not.toHaveBeenCalled();
  });

  it("rejects malformed input plus unjoined and host impersonation", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const joined = await connectClient(server.url, CONNECTION_ROLES.controller);
    const unjoined = await connectClient(server.url, CONNECTION_ROLES.controller);
    const room = await createRoom(host);
    if (!room.ok) {
      throw new Error(room.error.message);
    }
    expectJoined(await joinRoom(joined, room.room.code, "Ada"));
    const listener = vi.fn();
    host.on(HOST_PLAYER_INPUT_EVENT, listener);
    const unsafeJoined = joined as unknown as {
      emit: (event: string, payload: unknown) => void;
    };

    unsafeJoined.emit(CONTROLLER_INPUT_EVENT, {
      button: "red",
      phase: "down",
      clientTimestamp: 1,
    });
    unsafeJoined.emit(CONTROLLER_INPUT_EVENT, {
      button: "primary",
      phase: "held",
      clientTimestamp: 1,
    });
    unjoined.emit(CONTROLLER_INPUT_EVENT, {
      button: "primary",
      phase: "down",
      clientTimestamp: 1,
    });
    host.emit(CONTROLLER_INPUT_EVENT, {
      button: "primary",
      phase: "down",
      clientTimestamp: 1,
    });

    await new Promise((resolve) => setTimeout(resolve, 75));
    expect(listener).not.toHaveBeenCalled();
  });

  it("marks disconnection and restores the same player through the transport", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const originalController = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const room = await createRoom(host);
    if (!room.ok) {
      throw new Error(room.error.message);
    }
    const session = expectJoined(
      await joinRoom(originalController, room.room.code, "Ada"),
    );
    const disconnectedState = waitForEvent<RoomSnapshot>(host, HOST_ROOM_STATE_EVENT);

    originalController.disconnect();

    await expect(disconnectedState).resolves.toMatchObject({
      players: [{ id: session.player.id, connectionState: "disconnected" }],
    });
    const replacement = await connectClient(server.url, CONNECTION_ROLES.controller);
    await expect(reconnect(replacement, session.reconnectionToken)).resolves.toMatchObject({
      ok: true,
      session: {
        player: {
          id: session.player.id,
          number: session.player.number,
          displayName: session.player.displayName,
        },
      },
    });
  });

  it("rejects invalid reconnection through the transport", async () => {
    const server = await startServer();
    const controller = await connectClient(server.url, CONNECTION_ROLES.controller);

    await expect(
      reconnect(controller, "private-reconnect-token-does-not-exist"),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_reconnection_token" },
    });
  });

  it("closes the room and notifies controllers when the host disconnects", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const controller = await connectClient(server.url, CONNECTION_ROLES.controller);
    const room = await createRoom(host);
    if (!room.ok) {
      throw new Error(room.error.message);
    }
    expectJoined(await joinRoom(controller, room.room.code, "Ada"));
    const notice = waitForEvent<RoomClosedNotice>(
      controller,
      CONTROLLER_ROOM_CLOSED_EVENT,
    );

    host.disconnect();

    await expect(notice).resolves.toEqual({
      roomCode: room.room.code,
      reason: "host_disconnected",
      message: "The host disconnected, so the room has closed.",
    });
  });
});
