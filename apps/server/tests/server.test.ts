import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import type { Server as SocketServer } from "socket.io";
import {
  CONNECTION_ROLES,
  CONTROLLER_GAME_STATUS_EVENT,
  CONTROLLER_INPUT_EVENT,
  CONTROLLER_JOIN_ROOM_EVENT,
  CONTROLLER_RECONNECT_EVENT,
  CONTROLLER_ROOM_CLOSED_EVENT,
  HOST_CREATE_ROOM_EVENT,
  HOST_GAME_ACTION_EVENT,
  HOST_GAME_STATE_EVENT,
  HOST_GET_NETWORK_ADDRESSES_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  HOST_ROOM_STATE_EVENT,
  type ClientToServerEvents,
  type ConnectionRole,
  type ControllerSession,
  type ControllerGameStatus,
  type CreateRoomResult,
  type HostPlayerInputEvent,
  type HostGameAction,
  type HostGameActionResult,
  type InterServerEvents,
  type JoinRoomResult,
  type HostNetworkAddressesResult,
  type LocalNetworkAddress,
  type ReconnectControllerResult,
  type RoomClosedNotice,
  type RoomSnapshot,
  type SignalSprintState,
  type ServerToClientEvents,
  type SocketData,
} from "@party-game/shared";
import { createRealtimeServer } from "../src/create-server.js";
import { RoomManager } from "../src/room-manager.js";
import { SignalSprintGame } from "../src/signal-sprint-game.js";

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
  signalSprintGames: SignalSprintGame[];
  dispose: () => void;
  url: string;
}

const clients: TypedClient[] = [];
let runningServer: RunningServer | undefined;

const startServer = async (
  networkAddresses: LocalNetworkAddress[] = [],
): Promise<RunningServer> => {
  let roomSequence = 0;
  let playerSequence = 0;
  let tokenSequence = 0;
  const codes = ["ABCD", "EFGH", "JKLM", "NPQR"];
  const roomManager = new RoomManager({
    createRoomCode: () => codes[roomSequence++] ?? "STUV",
    createPlayerId: () => `player-${(playerSequence += 1)}`,
    createReconnectionToken: () =>
      `private-reconnect-token-${(tokenSequence += 1).toString().padStart(4, "0")}`,
    reconnectGraceMs: 120,
  });
  const httpServer = createServer();
  const signalSprintGames: SignalSprintGame[] = [];
  const { io, dispose } = createRealtimeServer(httpServer, {
    roomManager,
    getNetworkAddresses: () => networkAddresses,
    createSignalSprintGame: (roomCode) => {
      const game = new SignalSprintGame(roomCode, {
        countdownMs: 25,
        roundMs: 2_000,
        stunMs: 60,
      });
      signalSprintGames.push(game);
      return game;
    },
  });

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
    signalSprintGames,
    dispose,
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

const getNetworkAddresses = (client: TypedClient) =>
  new Promise<HostNetworkAddressesResult>((resolve) =>
    client.emit(HOST_GET_NETWORK_ADDRESSES_EVENT, resolve),
  );

const joinRoom = (client: TypedClient, roomCode: string, displayName: string) =>
  new Promise<JoinRoomResult>((resolve) =>
    client.emit(CONTROLLER_JOIN_ROOM_EVENT, { roomCode, displayName }, resolve),
  );

const reconnect = (client: TypedClient, reconnectionToken: string) =>
  new Promise<ReconnectControllerResult>((resolve) =>
    client.emit(CONTROLLER_RECONNECT_EVENT, { reconnectionToken }, resolve),
  );

const gameAction = (client: TypedClient, action: HostGameAction) =>
  new Promise<HostGameActionResult>((resolve) =>
    client.emit(HOST_GAME_ACTION_EVENT, { action }, resolve),
  );

const sendPress = (client: TypedClient, button: SignalSprintState["players"][number]["target"]) => {
  client.emit(CONTROLLER_INPUT_EVENT, {
    button,
    phase: "down",
    clientTimestamp: Date.now(),
  });
  client.emit(CONTROLLER_INPUT_EVENT, {
    button,
    phase: "up",
    clientTimestamp: Date.now(),
  });
};

const waitForEvent = <Event>(
  socket: TypedClient,
  eventName: string,
  predicate: (event: Event) => boolean = () => true,
): Promise<Event> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out: ${eventName}`)), 2_000);
    const listener = (event: Event) => {
      if (!predicate(event)) {
        return;
      }
      clearTimeout(timeout);
      socket.off(eventName as never, listener as never);
      resolve(event);
    };
    socket.on(eventName as never, listener as never);
  });

const waitForGame = (
  socket: TypedClient,
  predicate: (game: SignalSprintState) => boolean,
) => waitForEvent<SignalSprintState>(socket, HOST_GAME_STATE_EVENT, predicate);

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
    runningServer.dispose();
    runningServer.roomManager.dispose();
    runningServer = undefined;
  }
});

describe("multiplayer Socket.IO transport", () => {
  it("exposes only detected local addresses to hosts", async () => {
    const detected = [
      { address: "192.168.1.24", isPrivate: true },
      { address: "10.0.0.8", isPrivate: true },
    ];
    const server = await startServer(detected);
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const controller = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );

    await expect(getNetworkAddresses(host)).resolves.toEqual({
      ok: true,
      addresses: detected,
    });
    await expect(getNetworkAddresses(controller)).resolves.toMatchObject({
      ok: false,
      error: { code: "not_authorized" },
    });
  });

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

  it("runs the authoritative Signal Sprint lifecycle and preserves membership", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const controllerOne = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const controllerTwo = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const room = await createRoom(host);
    if (!room.ok) {
      throw new Error(room.error.message);
    }

    await expect(gameAction(host, "start")).resolves.toMatchObject({
      ok: false,
      error: { code: "no_connected_players" },
    });
    const sessionOne = expectJoined(
      await joinRoom(controllerOne, room.room.code, "Ada"),
    );
    expectJoined(await joinRoom(controllerTwo, room.room.code, "Grace"));

    const getReady = waitForEvent<ControllerGameStatus>(
      controllerOne,
      CONTROLLER_GAME_STATUS_EVENT,
    );
    const playing = waitForGame(host, (game) => game.phase === "playing");
    await expect(gameAction(host, "start")).resolves.toMatchObject({
      ok: true,
      game: { phase: "countdown", roundId: 1 },
    });
    await expect(getReady).resolves.toMatchObject({
      status: "get_ready",
      participating: true,
    });
    expect(JSON.stringify(await getReady)).not.toContain("target");
    let currentGame = await playing;
    expect(currentGame.players).toHaveLength(2);
    expect(currentGame.players.every((player) => Boolean(player.target))).toBe(true);
    await expect(gameAction(host, "start")).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_phase" },
    });

    const firstPlayer = () =>
      currentGame.players.find(
        (player) => player.playerId === sessionOne.player.id,
      );
    const firstTarget = firstPlayer()?.target;
    if (!firstTarget) {
      throw new Error("Expected the first player's target.");
    }
    const wrongButton = firstTarget === "primary" ? "secondary1" : "primary";
    const stunned = waitForGame(
      host,
      (game) => game.players.some((player) => player.mistakes === 1),
    );
    const stunnedStatus = waitForEvent<ControllerGameStatus>(
      controllerOne,
      CONTROLLER_GAME_STATUS_EVENT,
    );
    sendPress(controllerOne, wrongButton);
    currentGame = await stunned;
    await expect(stunnedStatus).resolves.toMatchObject({ status: "stunned" });
    expect(firstPlayer()).toMatchObject({ score: 0, mistakes: 1 });

    sendPress(controllerOne, firstTarget);
    const stunCleared = await waitForGame(
      host,
      (game) =>
        game.players.some(
          (player) =>
            player.playerId === sessionOne.player.id &&
            player.stunnedUntil === null &&
            player.mistakes === 1,
        ),
    );
    currentGame = stunCleared;
    expect(firstPlayer()?.score).toBe(0);

    for (let expectedScore = 1; expectedScore <= 15; expectedScore += 1) {
      const target = firstPlayer()?.target;
      if (!target) {
        throw new Error("Expected an active target while scoring.");
      }
      const update = waitForGame(
        host,
        (game) =>
          game.players.some(
            (player) =>
              player.playerId === sessionOne.player.id &&
              player.score === expectedScore,
          ),
      );
      sendPress(controllerOne, target);
      currentGame = await update;
    }

    expect(currentGame.phase).toBe("results");
    expect(currentGame.winnerPlayerIds).toEqual([sessionOne.player.id]);
    expect(firstPlayer()).toMatchObject({ score: 15, mistakes: 1 });

    const nextPlaying = waitForGame(
      host,
      (game) => game.phase === "playing" && game.roundId === 2,
    );
    await expect(gameAction(host, "replay")).resolves.toMatchObject({
      ok: true,
      game: {
        phase: "countdown",
        roundId: 2,
        players: [{ score: 0, mistakes: 0 }, { score: 0, mistakes: 0 }],
      },
    });
    currentGame = await nextPlaying;
    for (let expectedScore = 1; expectedScore <= 15; expectedScore += 1) {
      const participant = currentGame.players.find(
        (player) => player.playerId === sessionOne.player.id,
      );
      if (!participant) {
        throw new Error("Expected replay participant.");
      }
      const update = waitForGame(
        host,
        (game) =>
          game.players.some(
            (player) =>
              player.playerId === sessionOne.player.id &&
              player.score === expectedScore,
          ),
      );
      sendPress(controllerOne, participant.target);
      currentGame = await update;
    }

    await expect(gameAction(host, "return_to_lobby")).resolves.toMatchObject({
      ok: true,
      game: { phase: "lobby", roundId: 2, players: [] },
    });
    expect(server.roomManager.getRoomForHost(host.id ?? "")?.players).toHaveLength(2);
  });

  it("isolates Signal Sprint state between rooms", async () => {
    const server = await startServer();
    const hostOne = await connectClient(server.url, CONNECTION_ROLES.host);
    const hostTwo = await connectClient(server.url, CONNECTION_ROLES.host);
    const controllerOne = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const controllerTwo = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const roomOne = await createRoom(hostOne);
    const roomTwo = await createRoom(hostTwo);
    if (!roomOne.ok || !roomTwo.ok) {
      throw new Error("Expected both rooms.");
    }
    expectJoined(await joinRoom(controllerOne, roomOne.room.code, "Ada"));
    expectJoined(await joinRoom(controllerTwo, roomTwo.room.code, "Grace"));
    const playingOne = waitForGame(hostOne, (game) => game.phase === "playing");
    const playingTwo = waitForGame(hostTwo, (game) => game.phase === "playing");
    await gameAction(hostOne, "start");
    await gameAction(hostTwo, "start");
    const stateOne = await playingOne;
    const stateTwo = await playingTwo;
    const hostTwoUpdates = vi.fn();
    hostTwo.on(HOST_GAME_STATE_EVENT, hostTwoUpdates);
    const scored = waitForGame(
      hostOne,
      (game) => game.players[0]?.score === 1,
    );

    sendPress(controllerOne, stateOne.players[0]!.target);
    await scored;
    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(stateTwo.players[0]?.score).toBe(0);
    expect(hostTwoUpdates).not.toHaveBeenCalled();
  });

  it("preserves round state on reconnect, excludes late joins, and inactivates expiry", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const original = await connectClient(server.url, CONNECTION_ROLES.controller);
    const room = await createRoom(host);
    if (!room.ok) {
      throw new Error(room.error.message);
    }
    const originalSession = expectJoined(
      await joinRoom(original, room.room.code, "Ada"),
    );
    const playing = waitForGame(host, (game) => game.phase === "playing");
    await gameAction(host, "start");
    let state = await playing;
    const scored = waitForGame(host, (game) => game.players[0]?.score === 1);
    sendPress(original, state.players[0]!.target);
    state = await scored;
    const preservedTarget = state.players[0]!.target;

    const disconnected = waitForGame(
      host,
      (game) => game.players[0]?.connectionState === "disconnected",
    );
    original.disconnect();
    await disconnected;
    const replacement = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const restoredState = waitForGame(
      host,
      (game) => game.players[0]?.connectionState === "connected",
    );
    await expect(
      reconnect(replacement, originalSession.reconnectionToken),
    ).resolves.toMatchObject({ ok: true });
    state = await restoredState;
    expect(state.players[0]).toMatchObject({ score: 1, target: preservedTarget });

    const lateController = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const lateStatus = waitForEvent<ControllerGameStatus>(
      lateController,
      CONTROLLER_GAME_STATUS_EVENT,
    );
    expectJoined(await joinRoom(lateController, room.room.code, "Late"));
    await expect(lateStatus).resolves.toMatchObject({
      status: "waiting_next_round",
      participating: false,
    });

    const inactive = waitForGame(
      host,
      (game) => game.players[0]?.connectionState === "inactive",
    );
    replacement.disconnect();
    state = await inactive;
    expect(state.players[0]).toMatchObject({
      connectionState: "inactive",
      score: 1,
      target: preservedTarget,
    });
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
    const game = server.signalSprintGames[0];
    if (!game) {
      throw new Error("Expected room game state.");
    }
    const disposeGame = vi.spyOn(game, "dispose");
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
    expect(disposeGame).toHaveBeenCalledOnce();
  });
});
