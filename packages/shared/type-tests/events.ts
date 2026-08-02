import {
  CONTROLLER_INPUT_EVENT,
  CONTROLLER_JOIN_ROOM_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  type ClientToServerEvents,
  type ControllerInputPayload,
  type HostPlayerInputEvent,
  type ServerToClientEvents,
} from "../src/index.js";

const sendInput: ClientToServerEvents[typeof CONTROLLER_INPUT_EVENT] = (
  payload,
) => payload.clientTimestamp.toFixed(0);

const joinRoom: ClientToServerEvents[typeof CONTROLLER_JOIN_ROOM_EVENT] = (
  request,
  acknowledge,
) => {
  request.roomCode.toUpperCase();
  acknowledge({
    ok: false,
    error: { code: "room_not_found", message: "Room not found." },
  });
};

const receiveInput: ServerToClientEvents[typeof HOST_PLAYER_INPUT_EVENT] = (
  event,
) => event.validInputCount.toFixed(0);

const validInput: ControllerInputPayload = {
  button: "secondary3",
  phase: "down",
  clientTimestamp: Date.now(),
};

const validHostEvent: HostPlayerInputEvent = {
  ...validInput,
  roomCode: "ABCD",
  playerId: "player-id",
  playerNumber: 2,
  serverReceivedAt: Date.now(),
  validInputCount: 7,
};

const invalidButton: ControllerInputPayload = {
  // @ts-expect-error Button names are semantic and restricted to the five-button contract.
  button: "red",
  phase: "down",
  clientTimestamp: Date.now(),
};

const invalidPhase: ControllerInputPayload = {
  button: "primary",
  // @ts-expect-error Input phases are restricted to down and up.
  phase: "held",
  clientTimestamp: Date.now(),
};

void sendInput;
void joinRoom;
void receiveInput;
void validHostEvent;
void invalidButton;
void invalidPhase;
