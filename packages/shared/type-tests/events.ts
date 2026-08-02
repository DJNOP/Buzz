import {
  CONTROLLER_INPUT_EVENT,
  CONTROLLER_GAME_STATUS_EVENT,
  CONTROLLER_JOIN_ROOM_EVENT,
  HOST_GET_NETWORK_ADDRESSES_EVENT,
  HOST_GAME_ACTION_EVENT,
  HOST_GAME_STATE_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  type ClientToServerEvents,
  type ControllerInputPayload,
  type ControllerGameStatus,
  type HostPlayerInputEvent,
  type SignalSprintState,
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

const readNetworkAddresses: ClientToServerEvents[
  typeof HOST_GET_NETWORK_ADDRESSES_EVENT
] = (acknowledge) => {
  acknowledge({
    ok: true,
    addresses: [{ address: "192.168.1.24", isPrivate: true }],
  });
};

const controlGame: ClientToServerEvents[typeof HOST_GAME_ACTION_EVENT] = (
  request,
  acknowledge,
) => {
  request.action.toUpperCase();
  acknowledge({
    ok: false,
    error: { code: "invalid_phase", message: "Not available." },
  });
};

const receiveInput: ServerToClientEvents[typeof HOST_PLAYER_INPUT_EVENT] = (
  event,
) => event.validInputCount.toFixed(0);

const receiveGame: ServerToClientEvents[typeof HOST_GAME_STATE_EVENT] = (
  game,
) => game.roundId.toFixed(0);

const receiveControllerStatus: ServerToClientEvents[
  typeof CONTROLLER_GAME_STATUS_EVENT
] = (status) => status.participating.valueOf();

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

const validGameState: SignalSprintState = {
  roomCode: "ABCD",
  phase: "playing",
  roundId: 1,
  countdownEndsAt: null,
  roundEndsAt: Date.now() + 30_000,
  scoreToWin: 15,
  players: [],
  winnerPlayerIds: [],
};

const validControllerStatus: ControllerGameStatus = {
  phase: "playing",
  roundId: 1,
  status: "round_active",
  participating: true,
  stunnedUntil: null,
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
void readNetworkAddresses;
void controlGame;
void receiveInput;
void receiveGame;
void receiveControllerStatus;
void validHostEvent;
void validGameState;
void validControllerStatus;
void invalidButton;
void invalidPhase;
