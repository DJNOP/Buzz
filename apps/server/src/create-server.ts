import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import {
  CONNECTION_ROLES,
  CONTROLLER_INPUT_EVENT,
  CONTROLLER_JOIN_ROOM_EVENT,
  CONTROLLER_RECONNECT_EVENT,
  CONTROLLER_ROOM_CLOSED_EVENT,
  HOST_CREATE_ROOM_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  HOST_ROOM_STATE_EVENT,
  isConnectionAuth,
  isJoinRoomRequest,
  isReconnectControllerRequest,
  type ClientToServerEvents,
  type CreateRoomResult,
  type InterServerEvents,
  type JoinRoomResult,
  type ReconnectControllerResult,
  type ServerToClientEvents,
  type SocketData,
} from "@party-game/shared";
import { RoomManager } from "./room-manager.js";

export interface RealtimeServerOptions {
  roomManager?: RoomManager;
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

  roomManager.subscribe((event) => {
    if (event.type === "room-updated") {
      io.sockets.sockets
        .get(event.hostSocketId)
        ?.emit(HOST_ROOM_STATE_EVENT, event.room);
      return;
    }

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
    });

    socket.on("disconnect", () => {
      roomManager.handleDisconnect(socket.id);
    });
  });

  return { io, roomManager };
};
