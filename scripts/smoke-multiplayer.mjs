import { io } from "socket.io-client";
import {
  buildControllerJoinUrl,
  CONNECTION_ROLES,
  CONTROLLER_GAME_STATUS_EVENT,
  CONTROLLER_BUTTONS,
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
  parseRoomQuery,
} from "@party-game/shared";

const serverUrl = process.env.SMOKE_SERVER_URL ?? "http://127.0.0.1:3001";
const hostUrl = process.env.SMOKE_HOST_URL ?? "http://127.0.0.1:5173";
const controllerUrl =
  process.env.SMOKE_CONTROLLER_URL ?? "http://127.0.0.1:5174";
const clients = [];

const withTimeout = (operation, label, timeoutMs = 5_000) =>
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

const sendPress = (controller, button) => {
  controller.emit(CONTROLLER_INPUT_EVENT, {
    button,
    phase: "down",
    clientTimestamp: Date.now(),
  });
  controller.emit(CONTROLLER_INPUT_EVENT, {
    button,
    phase: "up",
    clientTimestamp: Date.now(),
  });
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
  const sessionTwo = expectSuccess(
    await acknowledge(controllerTwo, CONTROLLER_JOIN_ROOM_EVENT, {
      roomCode: roomOne.code,
      displayName: "Smoke Two",
    }),
    "Second controller join",
  ).session;

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

  const controllerGetReady = waitForEvent(
    controllerOne,
    CONTROLLER_GAME_STATUS_EVENT,
    (status) => status.status === "get_ready",
  );
  const roomOnePlaying = waitForEvent(
    hostOne,
    HOST_GAME_STATE_EVENT,
    (game) => game.phase === "playing" && game.roundId === 1,
  );
  const roomTwoPlaying = waitForEvent(
    hostTwo,
    HOST_GAME_STATE_EVENT,
    (game) => game.phase === "playing" && game.roundId === 1,
  );
  expectSuccess(
    await acknowledge(hostOne, HOST_GAME_ACTION_EVENT, { action: "start" }),
    "First Signal Sprint start",
  );
  expectSuccess(
    await acknowledge(hostTwo, HOST_GAME_ACTION_EVENT, { action: "start" }),
    "Second Signal Sprint start",
  );
  const getReadyStatus = await controllerGetReady;
  assert(
    !JSON.stringify(getReadyStatus).includes("target"),
    "Controller game status exposed a private target.",
  );
  let gameOne = await roomOnePlaying;
  let gameTwo = await roomTwoPlaying;
  assert(gameOne.players.length === 2, "First game captured the wrong roster.");
  assert(gameTwo.players.length === 4, "Second game captured the wrong roster.");

  const gamePlayerOne = () =>
    gameOne.players.find((player) => player.playerId === sessionOne.player.id);
  const gamePlayerTwo = () =>
    gameOne.players.find((player) => player.playerId === sessionTwo.player.id);
  const initialPlayerOne = gamePlayerOne();
  if (!initialPlayerOne) {
    throw new Error("Signal Sprint omitted the first participant.");
  }
  const wrongButton =
    initialPlayerOne.target === "primary" ? "secondary1" : "primary";
  const wrongState = waitForEvent(
    hostOne,
    HOST_GAME_STATE_EVENT,
    (game) =>
      game.players.some(
        (player) => player.playerId === sessionOne.player.id && player.mistakes === 1,
      ),
  );
  sendPress(controllerOne, wrongButton);
  gameOne = await wrongState;
  const stunnedPlayer = gamePlayerOne();
  assert(
    stunnedPlayer?.stunnedUntil && stunnedPlayer.stunnedUntil > Date.now(),
    "Wrong input did not apply a server stun.",
  );

  sendPress(controllerOne, stunnedPlayer.target);
  const stunCleared = waitForEvent(
    hostOne,
    HOST_GAME_STATE_EVENT,
    (game) =>
      game.players.some(
        (player) =>
          player.playerId === sessionOne.player.id &&
          player.mistakes === 1 &&
          player.stunnedUntil === null,
      ),
  );
  gameOne = await stunCleared;
  assert(gamePlayerOne()?.score === 0, "Input during stun changed the score.");

  const secondPlayerTarget = gamePlayerTwo()?.target;
  if (!secondPlayerTarget) {
    throw new Error("Signal Sprint omitted the second participant.");
  }
  const secondPlayerScored = waitForEvent(
    hostOne,
    HOST_GAME_STATE_EVENT,
    (game) =>
      game.players.some(
        (player) => player.playerId === sessionTwo.player.id && player.score === 1,
      ),
  );
  sendPress(controllerTwo, secondPlayerTarget);
  gameOne = await secondPlayerScored;

  const roomTwoParticipant = gameTwo.players[0];
  if (!roomTwoParticipant) {
    throw new Error("Second room had no game participant.");
  }
  let gameLeakedToRoomOne = false;
  const gameLeakListener = () => {
    gameLeakedToRoomOne = true;
  };
  hostOne.on(HOST_GAME_STATE_EVENT, gameLeakListener);
  const roomTwoScored = waitForEvent(
    hostTwo,
    HOST_GAME_STATE_EVENT,
    (game) => game.players.some((player) => player.score === 1),
  );
  sendPress(roomTwoControllers[0], roomTwoParticipant.target);
  gameTwo = await roomTwoScored;
  await new Promise((resolve) => setTimeout(resolve, 75));
  hostOne.off(HOST_GAME_STATE_EVENT, gameLeakListener);
  assert(!gameLeakedToRoomOne, "Second-room game state leaked into Room One.");

  const preservedBeforeReconnect = gamePlayerOne();
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
  const disconnectedGameState = waitForEvent(
    hostOne,
    HOST_GAME_STATE_EVENT,
    (game) =>
      game.players.some(
        (player) =>
          player.playerId === sessionOne.player.id &&
          player.connectionState === "disconnected",
      ),
  );
  controllerOne.disconnect();
  await Promise.all([disconnectedState, disconnectedGameState]);

  const replacementController = await connect(CONNECTION_ROLES.controller);
  const restoredGameState = waitForEvent(
    hostOne,
    HOST_GAME_STATE_EVENT,
    (game) =>
      game.players.some(
        (player) =>
          player.playerId === sessionOne.player.id &&
          player.connectionState === "connected",
      ),
  );
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
  gameOne = await restoredGameState;
  assert(
    gamePlayerOne()?.score === preservedBeforeReconnect?.score &&
      gamePlayerOne()?.target === preservedBeforeReconnect?.target,
    "Reconnection did not preserve Signal Sprint score and target.",
  );

  for (let expectedScore = (gamePlayerOne()?.score ?? 0) + 1; expectedScore <= 15; expectedScore += 1) {
    const target = gamePlayerOne()?.target;
    if (!target) {
      throw new Error("Winning player lost their target.");
    }
    const scoreUpdate = waitForEvent(
      hostOne,
      HOST_GAME_STATE_EVENT,
      (game) =>
        game.players.some(
          (player) =>
            player.playerId === sessionOne.player.id &&
            player.score === expectedScore,
        ),
    );
    sendPress(replacementController, target);
    gameOne = await scoreUpdate;
  }
  assert(gameOne.phase === "results", "Fifteen points did not end the round.");
  assert(
    gameOne.winnerPlayerIds.length === 1 &&
      gameOne.winnerPlayerIds[0] === sessionOne.player.id,
    "Signal Sprint reported the wrong winner.",
  );

  const replayPlaying = waitForEvent(
    hostOne,
    HOST_GAME_STATE_EVENT,
    (game) => game.phase === "playing" && game.roundId === 2,
  );
  const replayResult = expectSuccess(
    await acknowledge(hostOne, HOST_GAME_ACTION_EVENT, { action: "replay" }),
    "Signal Sprint replay",
  );
  assert(
    replayResult.game.players.every((player) => player.score === 0),
    "Replay did not reset round scores.",
  );
  gameOne = await replayPlaying;
  assert(
    gameOne.players.length === 2,
    "Replay did not preserve connected room membership.",
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
        signalSprint: {
          participants: 2,
          wrongInputStun: "passed",
          inputDuringStunIgnored: true,
          winningScore: 15,
          winner: sessionOne.player.id,
          replayRoundId: gameOne.roundId,
          replayWithoutReconnect: true,
          secondRoomIsolation: "passed",
        },
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
