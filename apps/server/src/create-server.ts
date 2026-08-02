import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import {
  CONNECTION_ROLES,
  HOST_PRIMARY_BUTTON_EVENT,
  PRIMARY_BUTTON_EVENT,
  isConnectionAuth,
  isPrimaryButtonPayload,
  type ClientToServerEvents,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "@party-game/shared";

export const createRealtimeServer = (httpServer: HttpServer) => {
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

  const hostSocketIds = new Set<string>();

  io.on("connection", (socket) => {
    if (!isConnectionAuth(socket.handshake.auth)) {
      socket.disconnect(true);
      return;
    }

    socket.data.role = socket.handshake.auth.role;

    if (socket.data.role === CONNECTION_ROLES.host) {
      hostSocketIds.add(socket.id);
    }

    socket.on(PRIMARY_BUTTON_EVENT, (payload) => {
      if (
        socket.data.role !== CONNECTION_ROLES.controller ||
        !isPrimaryButtonPayload(payload)
      ) {
        return;
      }

      const event = {
        controllerPressedAt: payload.pressedAt,
        serverReceivedAt: Date.now(),
      };

      for (const hostSocketId of hostSocketIds) {
        io.sockets.sockets
          .get(hostSocketId)
          ?.emit(HOST_PRIMARY_BUTTON_EVENT, event);
      }
    });

    socket.on("disconnect", () => {
      hostSocketIds.delete(socket.id);
    });
  });

  return io;
};
