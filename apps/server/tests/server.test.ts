import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import type { Server as SocketServer } from "socket.io";
import {
  CONNECTION_ROLES,
  HOST_PRIMARY_BUTTON_EVENT,
  PRIMARY_BUTTON_EVENT,
  type ClientToServerEvents,
  type ConnectionRole,
  type HostPrimaryButtonEvent,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "@party-game/shared";
import { createRealtimeServer } from "../src/create-server.js";

type TypedClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;
type TypedServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

interface RunningServer {
  httpServer: HttpServer;
  io: TypedServer;
  url: string;
}

const clients: TypedClient[] = [];
let runningServer: RunningServer | undefined;

const startServer = async (): Promise<RunningServer> => {
  const httpServer = createServer();
  const io = createRealtimeServer(httpServer);

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP address for the test server.");
  }

  runningServer = {
    httpServer,
    io,
    url: `http://127.0.0.1:${(address as AddressInfo).port}`,
  };

  return runningServer;
};

const connectClient = async (
  url: string,
  role: ConnectionRole,
): Promise<TypedClient> => {
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

const waitForPrimaryButton = (
  host: TypedClient,
): Promise<HostPrimaryButtonEvent> =>
  new Promise((resolve) => host.once(HOST_PRIMARY_BUTTON_EVENT, resolve));

afterEach(async () => {
  for (const client of clients.splice(0)) {
    client.disconnect();
  }

  if (runningServer) {
    await new Promise<void>((resolve) => runningServer?.io.close(() => resolve()));
    runningServer = undefined;
  }
});

describe("single-controller input server", () => {
  it("forwards a valid primary-button event to connected hosts", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const controller = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const pressedAt = Date.now();
    const forwarded = waitForPrimaryButton(host);

    controller.emit(PRIMARY_BUTTON_EVENT, { pressedAt });

    await expect(forwarded).resolves.toMatchObject({
      controllerPressedAt: pressedAt,
      serverReceivedAt: expect.any(Number),
    });
  });

  it("ignores malformed and unsupported controller input", async () => {
    const server = await startServer();
    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const controller = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const hostListener = vi.fn();
    host.on(HOST_PRIMARY_BUTTON_EVENT, hostListener);

    const unsafeController = controller as unknown as {
      emit: (event: string, payload: unknown) => void;
    };
    unsafeController.emit(PRIMARY_BUTTON_EVENT, { pressedAt: "now" });
    unsafeController.emit(PRIMARY_BUTTON_EVENT, { pressedAt: Date.now(), extra: true });
    unsafeController.emit("controller:unsupported", { pressedAt: Date.now() });
    host.emit(PRIMARY_BUTTON_EVENT, { pressedAt: Date.now() });

    await new Promise((resolve) => setTimeout(resolve, 75));
    expect(hostListener).not.toHaveBeenCalled();
  });

  it("continues forwarding after repeated controller connections", async () => {
    const server = await startServer();

    for (let index = 0; index < 5; index += 1) {
      const transientController = await connectClient(
        server.url,
        CONNECTION_ROLES.controller,
      );
      transientController.disconnect();
    }

    const host = await connectClient(server.url, CONNECTION_ROLES.host);
    const controller = await connectClient(
      server.url,
      CONNECTION_ROLES.controller,
    );
    const forwarded = waitForPrimaryButton(host);

    controller.emit(PRIMARY_BUTTON_EVENT, { pressedAt: Date.now() });

    await expect(forwarded).resolves.toEqual({
      controllerPressedAt: expect.any(Number),
      serverReceivedAt: expect.any(Number),
    });
  });
});
