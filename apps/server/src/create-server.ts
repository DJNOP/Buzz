import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
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
  isConnectionAuth,
  isHostGameActionRequest,
  isJoinRoomRequest,
  isReconnectControllerRequest,
  type ClientToServerEvents,
  type CreateRoomResult,
  type HostGameActionResult,
  type InterServerEvents,
  type LocalNetworkAddress,
  type JoinRoomResult,
  type ReconnectControllerResult,
  type RoomSnapshot,
  type ServerToClientEvents,
  type SocketData,
} from "@party-game/shared";
import { discoverLocalNetworkAddresses } from "./network-address.js";
import { RoomManager } from "./room-manager.js";
import { SignalSprintGame } from "./signal-sprint-game.js";

export interface RealtimeServerOptions {
  roomManager?: RoomManager;
  getNetworkAddresses?: () => LocalNetworkAddress[];
  createSignalSprintGame?: (roomCode: string) => SignalSprintGame;
}

const notAuthorizedToCreate: CreateRoomResult = {
  ok: false,
  error: {
    code: "not_authorized",
    message: "Only a host can create a room.",
  },
};

const notAuthorizedToJoin: JoinRoomResult = {
  ok: false,
  error: {
    code: "not_authorized",
    message: "Only a controller can join a room.",
  },
};

const notAuthorizedToReconnect: ReconnectControllerResult = {
  ok: false,
  error: {
    code: "not_authorized",
    message: "Only a controller can restore a player session.",
  },
};

const notAuthorizedToReadNetworkAddresses = {
  ok: false,
  error: {
    code: "not_authorized",
    message: "Only a host can request local network addresses.",
  },
} as const;

const notAuthorizedToControlGame: HostGameActionResult = {
  ok: false,
  error: {
    code: "not_authorized",
    message: "Only the room host can control Signal Sprint.",
  },
};

export const createRealtimeServer = (
  httpServer: HttpServer,
  options: RealtimeServerOptions = {},
) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
    },
    serveClient: false,
  });

  const roomManager = options.roomManager ?? new RoomManager();
  const getNetworkAddresses =
    options.getNetworkAddresses ?? discoverLocalNetworkAddresses;
  const createSignalSprintGame =
    options.createSignalSprintGame ??
    ((roomCode: string) => new SignalSprintGame(roomCode));
  const games = new Map<string, SignalSprintGame>();
  const latestRooms = new Map<string, RoomSnapshot>();
  const hostSocketByRoom = new Map<string, string>();

  const broadcastGame = (roomCode: string) => {
    const game = games.get(roomCode);
    const room = latestRooms.get(roomCode);
    const hostSocketId = hostSocketByRoom.get(roomCode);
    if (!game || !room || !hostSocketId) {
      return;
    }

    io.sockets.sockets
      .get(hostSocketId)
      ?.emit(HOST_GAME_STATE_EVENT, game.getState());
    for (const player of room.players) {
      const controllerSocketId = roomManager.getControllerSocketId(
        roomCode,
        player.id,
      );
      if (controllerSocketId) {
        io.sockets.sockets
          .get(controllerSocketId)
          ?.emit(
            CONTROLLER_GAME_STATUS_EVENT,
            game.getControllerStatus(player.id),
          );
      }
    }
  };

  const ensureGame = (roomCode: string) => {
    const existing = games.get(roomCode);
    if (existing) {
      return existing;
    }
    const game = createSignalSprintGame(roomCode);
    games.set(roomCode, game);
    game.subscribe(() => broadcastGame(roomCode));
    return game;
  };

  const unsubscribeRoomManager = roomManager.subscribe((event) => {
    if (event.type === "room-updated") {
      latestRooms.set(event.room.code, event.room);
      hostSocketByRoom.set(event.room.code, event.hostSocketId);
      const game = ensureGame(event.room.code);
      game.syncPlayers(event.room.players);
      io.sockets.sockets
        .get(event.hostSocketId)
        ?.emit(HOST_ROOM_STATE_EVENT, event.room);
      broadcastGame(event.room.code);
      return;
    }

    games.get(event.roomCode)?.dispose();
    games.delete(event.roomCode);
    latestRooms.delete(event.roomCode);
    hostSocketByRoom.delete(event.roomCode);

    for (const socketId of event.controllerSocketIds) {
      io.sockets.sockets.get(socketId)?.emit(CONTROLLER_ROOM_CLOSED_EVENT, {
        roomCode: event.roomCode,
        reason: "host_disconnected",
        message: "The host disconnected, so the room has closed.",
      });
    }
  });

  io.on("connection", (socket) => {
    if (!isConnectionAuth(socket.handshake.auth)) {
      socket.disconnect(true);
      return;
    }

    socket.data.role = socket.handshake.auth.role;

    socket.on(HOST_CREATE_ROOM_EVENT, (acknowledge) => {
      if (typeof acknowledge !== "function") {
        return;
      }
      if (socket.data.role !== CONNECTION_ROLES.host) {
        acknowledge(notAuthorizedToCreate);
        return;
      }
      acknowledge(roomManager.createRoom(socket.id));
    });

    socket.on(HOST_GET_NETWORK_ADDRESSES_EVENT, (acknowledge) => {
      if (typeof acknowledge !== "function") {
        return;
      }
      if (socket.data.role !== CONNECTION_ROLES.host) {
        acknowledge(notAuthorizedToReadNetworkAddresses);
        return;
      }

      let addresses: LocalNetworkAddress[] = [];
      try {
        addresses = getNetworkAddresses();
      } catch {
        // Address discovery is optional prototype infrastructure. Manual joining remains available.
      }
      acknowledge({ ok: true, addresses });
    });

    socket.on(HOST_GAME_ACTION_EVENT, (request, acknowledge) => {
      if (typeof acknowledge !== "function") {
        return;
      }
      if (socket.data.role !== CONNECTION_ROLES.host) {
        acknowledge(notAuthorizedToControlGame);
        return;
      }
      if (!isHostGameActionRequest(request)) {
        acknowledge({
          ok: false,
          error: {
            code: "invalid_phase",
            message: "That Signal Sprint action is not available.",
          },
        });
        return;
      }

      const room = roomManager.getRoomForHost(socket.id);
      if (!room) {
        acknowledge({
          ok: false,
          error: {
            code: "room_not_found",
            message: "Create a room before controlling Signal Sprint.",
          },
        });
        return;
      }

      const game = ensureGame(room.code);
      const result =
        request.action === "start"
          ? game.start(room.players)
          : request.action === "replay"
            ? game.replay(room.players)
            : game.returnToLobby();
      acknowledge(result);
    });

    socket.on(CONTROLLER_JOIN_ROOM_EVENT, (request, acknowledge) => {
      if (typeof acknowledge !== "function") {
        return;
      }
      if (socket.data.role !== CONNECTION_ROLES.controller) {
        acknowledge(notAuthorizedToJoin);
        return;
      }
      if (!isJoinRoomRequest(request)) {
        acknowledge({
          ok: false,
          error: {
            code: "invalid_room_code",
            message: "Check the room code and display name, then try again.",
          },
        });
        return;
      }
      acknowledge(roomManager.joinRoom(socket.id, request));
    });

    socket.on(CONTROLLER_RECONNECT_EVENT, (request, acknowledge) => {
      if (typeof acknowledge !== "function") {
        return;
      }
      if (socket.data.role !== CONNECTION_ROLES.controller) {
        acknowledge(notAuthorizedToReconnect);
        return;
      }
      if (!isReconnectControllerRequest(request)) {
        acknowledge({
          ok: false,
          error: {
            code: "invalid_reconnection_token",
            message: "The previous player session is not valid.",
          },
        });
        return;
      }

      const outcome = roomManager.reconnectController(
        socket.id,
        request.reconnectionToken,
      );
      if (
        outcome.result.ok &&
        outcome.replacedSocketId &&
        outcome.replacedSocketId !== socket.id
      ) {
        io.sockets.sockets.get(outcome.replacedSocketId)?.disconnect(true);
      }
      acknowledge(outcome.result);
    });

    socket.on(CONTROLLER_INPUT_EVENT, (payload) => {
      if (socket.data.role !== CONNECTION_ROLES.controller) {
        return;
      }
      const accepted = roomManager.acceptInput(socket.id, payload);
      if (!accepted) {
        return;
      }
      io.sockets.sockets
        .get(accepted.hostSocketId)
        ?.emit(HOST_PLAYER_INPUT_EVENT, accepted.event);
      games
        .get(accepted.event.roomCode)
        ?.acceptInput(accepted.event.playerId, accepted.event);
    });

    socket.on("disconnect", () => {
      roomManager.handleDisconnect(socket.id);
    });
  });

  const dispose = () => {
    unsubscribeRoomManager();
    for (const game of games.values()) {
      game.dispose();
    }
    games.clear();
    latestRooms.clear();
    hostSocketByRoom.clear();
  };

  return { io, roomManager, dispose };
};
