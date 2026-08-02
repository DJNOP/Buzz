import { io } from "socket.io-client";
import {
  buildControllerJoinUrl,
  CONNECTION_ROLES,
  CONTROLLER_BUTTONS,
  CONTROLLER_INPUT_EVENT,
  CONTROLLER_JOIN_ROOM_EVENT,
  CONTROLLER_RECONNECT_EVENT,
  CONTROLLER_ROOM_CLOSED_EVENT,
  HOST_CREATE_ROOM_EVENT,
  HOST_GET_NETWORK_ADDRESSES_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  HOST_ROOM_STATE_EVENT,
  parseRoomQuery,
} from "@party-game/shared";

const serverUrl = process.env.SMOKE_SERVER_URL ?? "http://127.0.0.1:3001";
const hostUrl = process.env.SMOKE_HOST_URL ?? "http://127.0.0.1:5173";
const controllerUrl =
  process.env.SMOKE_CONTROLLER_URL ?? "http://127.0.0.1:5174";
const clients = [];

const withTimeout = (operation, label, timeoutMs = 3_000) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out while waiting for ${label}.`)),
      timeoutMs,
    );
    operation(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });

const connect = (role) =>
  withTimeout((resolve, reject) => {
    const socket = io(serverUrl, {
      auth: { role },
      forceNew: true,
      reconnection: false,
      transports: ["websocket"],
    });
    clients.push(socket);
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  }, `${role} connection`);

const acknowledge = (socket, eventName, ...args) =>
  withTimeout((resolve) => {
    socket.emit(eventName, ...args, resolve);
  }, `${eventName} acknowledgement`);

const waitForEvent = (socket, eventName, predicate = () => true) =>
  withTimeout((resolve) => {
    const listener = (event) => {
      if (!predicate(event)) {
        return;
      }
      socket.off(eventName, listener);
      resolve(event);
    };
    socket.on(eventName, listener);
  }, eventName);

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const expectSuccess = (result, label) => {
  assert(result?.ok === true, `${label} failed: ${result?.error?.message ?? "unknown"}`);
  return result;
};

try {
  const [hostResponse, controllerResponse] = await Promise.all([
    fetch(hostUrl),
    fetch(controllerUrl),
  ]);
  assert(hostResponse.ok, `Host page returned HTTP ${hostResponse.status}.`);
  assert(
    controllerResponse.ok,
    `Controller page returned HTTP ${controllerResponse.status}.`,
  );

  const hostOne = await connect(CONNECTION_ROLES.host);
  const hostTwo = await connect(CONNECTION_ROLES.host);
  const roomOneResult = expectSuccess(
    await acknowledge(hostOne, HOST_CREATE_ROOM_EVENT),
    "First room creation",
  );
  const roomTwoResult = expectSuccess(
    await acknowledge(hostTwo, HOST_CREATE_ROOM_EVENT),
    "Second room creation",
  );
  const roomOne = roomOneResult.room;
  const roomTwo = roomTwoResult.room;
  assert(roomOne.code !== roomTwo.code, "Two hosts received the same room code.");

  const networkResult = await acknowledge(
    hostOne,
    HOST_GET_NETWORK_ADDRESSES_EVENT,
  );
  assert(networkResult.ok === true, "Host could not read detected network addresses.");
  assert(
    networkResult.addresses.length > 0,
    "No usable LAN address was detected for QR smoke validation.",
  );
  const selectedAddress = networkResult.addresses[0].address;
  const controllerJoinUrl = buildControllerJoinUrl(
    selectedAddress,
    roomOne.code,
  );
  const parsedRoomQuery = parseRoomQuery(new URL(controllerJoinUrl).search);
  assert(
    parsedRoomQuery.status === "valid" &&
      parsedRoomQuery.roomCode === roomOne.code,
    "The generated controller URL did not preserve the room code.",
  );
  const controllerQueryResponse = await fetch(
    `${controllerUrl}/?room=${encodeURIComponent(roomOne.code)}`,
  );
  assert(
    controllerQueryResponse.ok,
    `Controller query route returned HTTP ${controllerQueryResponse.status}.`,
  );
  assert(
    parseRoomQuery("?room=O0I1").status === "invalid",
    "An invalid QR room query was accepted.",
  );
  assert(
    parseRoomQuery("").status === "missing",
    "A missing QR room query did not preserve manual joining.",
  );

  const controllerOne = await connect(CONNECTION_ROLES.controller);
  const controllerTwo = await connect(CONNECTION_ROLES.controller);
  const sessionOne = expectSuccess(
    await acknowledge(controllerOne, CONTROLLER_JOIN_ROOM_EVENT, {
      roomCode: parsedRoomQuery.roomCode,
      displayName: "Smoke One",
    }),
    "First controller join",
  ).session;
  expectSuccess(
    await acknowledge(controllerTwo, CONTROLLER_JOIN_ROOM_EVENT, {
      roomCode: roomOne.code,
      displayName: "Smoke Two",
    }),
    "Second controller join",
  );

  const receivedPhases = [];
  for (const button of CONTROLLER_BUTTONS) {
    for (const phase of ["down", "up"]) {
      const received = waitForEvent(
        hostOne,
        HOST_PLAYER_INPUT_EVENT,
        (event) => event.button === button && event.phase === phase,
      );
      controllerOne.emit(CONTROLLER_INPUT_EVENT, {
        button,
        phase,
        clientTimestamp: Date.now(),
      });
      const event = await received;
      assert(event.roomCode === roomOne.code, "Input reached the wrong host room.");
      assert(
        event.playerId === sessionOne.player.id,
        "Input was associated with the wrong player.",
      );
      receivedPhases.push(`${button}:${phase}`);
    }
  }

  const invalidController = await connect(CONNECTION_ROLES.controller);
  const invalidJoin = await acknowledge(
    invalidController,
    CONTROLLER_JOIN_ROOM_EVENT,
    { roomCode: "ZZZZ", displayName: "Nobody" },
  );
  assert(
    invalidJoin.ok === false && invalidJoin.error.code === "room_not_found",
    "A nonexistent room was not rejected correctly.",
  );

  const roomTwoControllers = [];
  for (let playerNumber = 1; playerNumber <= 4; playerNumber += 1) {
    const controller = await connect(CONNECTION_ROLES.controller);
    roomTwoControllers.push(controller);
    expectSuccess(
      await acknowledge(controller, CONTROLLER_JOIN_ROOM_EVENT, {
        roomCode: roomTwo.code,
        displayName: `Capacity ${playerNumber}`,
      }),
      `Capacity player ${playerNumber} join`,
    );
  }

  const fifthController = await connect(CONNECTION_ROLES.controller);
  const fullJoin = await acknowledge(fifthController, CONTROLLER_JOIN_ROOM_EVENT, {
    roomCode: roomTwo.code,
    displayName: "Capacity Five",
  });
  assert(
    fullJoin.ok === false && fullJoin.error.code === "room_full",
    "A fifth controller was not rejected from a full room.",
  );

  let leakedToHostOne = false;
  const leakageListener = () => {
    leakedToHostOne = true;
  };
  hostOne.on(HOST_PLAYER_INPUT_EVENT, leakageListener);
  const isolatedInput = waitForEvent(hostTwo, HOST_PLAYER_INPUT_EVENT);
  roomTwoControllers[0].emit(CONTROLLER_INPUT_EVENT, {
    button: "primary",
    phase: "down",
    clientTimestamp: Date.now(),
  });
  await isolatedInput;
  await new Promise((resolve) => setTimeout(resolve, 75));
  hostOne.off(HOST_PLAYER_INPUT_EVENT, leakageListener);
  assert(!leakedToHostOne, "Cross-room input leakage was detected.");
  roomTwoControllers[0].emit(CONTROLLER_INPUT_EVENT, {
    button: "primary",
    phase: "up",
    clientTimestamp: Date.now(),
  });

  const disconnectedState = waitForEvent(
    hostOne,
    HOST_ROOM_STATE_EVENT,
    (room) =>
      room.players.some(
        (player) =>
          player.id === sessionOne.player.id &&
          player.connectionState === "disconnected",
      ),
  );
  controllerOne.disconnect();
  await disconnectedState;

  const replacementController = await connect(CONNECTION_ROLES.controller);
  const restored = expectSuccess(
    await acknowledge(replacementController, CONTROLLER_RECONNECT_EVENT, {
      reconnectionToken: sessionOne.reconnectionToken,
    }),
    "Controller reconnection",
  ).session;
  assert(restored.player.id === sessionOne.player.id, "Reconnection changed player ID.");
  assert(
    restored.player.number === sessionOne.player.number,
    "Reconnection changed player number.",
  );

  const roomClosedOne = waitForEvent(
    controllerTwo,
    CONTROLLER_ROOM_CLOSED_EVENT,
  );
  const roomClosedReplacement = waitForEvent(
    replacementController,
    CONTROLLER_ROOM_CLOSED_EVENT,
  );
  hostOne.disconnect();
  const closedNotices = await Promise.all([
    roomClosedOne,
    roomClosedReplacement,
  ]);
  assert(
    closedNotices.every((notice) => notice.roomCode === roomOne.code),
    "Room closure notice identified the wrong room.",
  );

  console.log(
    JSON.stringify(
      {
        http: { host: hostResponse.status, controller: controllerResponse.status },
        roomCreation: [roomOne.code, roomTwo.code],
        qrJoining: {
          detectedAddresses: networkResult.addresses,
          selectedAddress,
          controllerJoinUrl,
          queryRouteStatus: controllerQueryResponse.status,
          prefilledRoomCode: parsedRoomQuery.roomCode,
          invalidQueryRejected: true,
          manualJoinPreserved: true,
        },
        joinedControllers: 2,
        fiveButtonPhases: receivedPhases,
        invalidRoomRejected: invalidJoin.error.code,
        fullRoomRejected: fullJoin.error.code,
        roomIsolation: "passed",
        reconnection: {
          playerIdStable: restored.player.id === sessionOne.player.id,
          playerNumberStable: restored.player.number === sessionOne.player.number,
        },
        hostClosure: "passed",
      },
      null,
      2,
    ),
  );
} finally {
  for (const client of clients) {
    client.disconnect();
  }
}
