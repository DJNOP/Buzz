export const CONNECTION_ROLES = {
  host: "host",
  controller: "controller",
} as const;

export type ConnectionRole =
  (typeof CONNECTION_ROLES)[keyof typeof CONNECTION_ROLES];

export interface ConnectionAuth {
  role: ConnectionRole;
}

export const CONTROLLER_BUTTONS = [
  "primary",
  "secondary1",
  "secondary2",
  "secondary3",
  "secondary4",
] as const;

export type ControllerButton = (typeof CONTROLLER_BUTTONS)[number];

export const BUTTON_PHASES = ["down", "up"] as const;
export type ButtonPhase = (typeof BUTTON_PHASES)[number];

export const PLAYER_ACCENTS = [
  "violet",
  "teal",
  "amber",
  "rose",
] as const;

export type PlayerAccent = (typeof PLAYER_ACCENTS)[number];
export type PlayerConnectionState = "connected" | "disconnected";

export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const DISPLAY_NAME_MAX_LENGTH = 16;

export interface ControllerInputPayload {
  button: ControllerButton;
  phase: ButtonPhase;
  clientTimestamp: number;
}

export interface PlayerInputDiagnostic extends ControllerInputPayload {
  serverReceivedAt: number;
}

export interface PublicPlayer {
  id: string;
  number: number;
  displayName: string;
  accent: PlayerAccent;
  connectionState: PlayerConnectionState;
  validInputCount: number;
  latestInput: PlayerInputDiagnostic | null;
}

export interface RoomSnapshot {
  code: string;
  players: PublicPlayer[];
}

export interface ControllerSession {
  roomCode: string;
  player: PublicPlayer;
  reconnectionToken: string;
}

export interface HostPlayerInputEvent extends PlayerInputDiagnostic {
  roomCode: string;
  playerId: string;
  playerNumber: number;
  validInputCount: number;
}

export interface JoinRoomRequest {
  roomCode: string;
  displayName: string;
}

export interface ReconnectControllerRequest {
  reconnectionToken: string;
}

export type CreateRoomErrorCode =
  | "not_authorized"
  | "host_already_has_room"
  | "room_code_unavailable";

export type JoinRoomErrorCode =
  | "not_authorized"
  | "already_joined"
  | "invalid_room_code"
  | "room_not_found"
  | "invalid_display_name"
  | "duplicate_display_name"
  | "room_full"
  | "session_unavailable";

export type ReconnectControllerErrorCode =
  | "not_authorized"
  | "already_joined"
  | "invalid_reconnection_token";

export interface ProtocolError<Code extends string> {
  code: Code;
  message: string;
}

export type CreateRoomResult =
  | { ok: true; room: RoomSnapshot }
  | { ok: false; error: ProtocolError<CreateRoomErrorCode> };

export type JoinRoomResult =
  | { ok: true; session: ControllerSession }
  | { ok: false; error: ProtocolError<JoinRoomErrorCode> };

export type ReconnectControllerResult =
  | { ok: true; session: ControllerSession }
  | { ok: false; error: ProtocolError<ReconnectControllerErrorCode> };

export interface RoomClosedNotice {
  roomCode: string;
  reason: "host_disconnected";
  message: string;
}

export interface LocalNetworkAddress {
  address: string;
  isPrivate: boolean;
}

export type HostNetworkAddressesResult =
  | { ok: true; addresses: LocalNetworkAddress[] }
  | {
      ok: false;
      error: ProtocolError<"not_authorized">;
    };

export const HOST_CREATE_ROOM_EVENT = "host:create-room" as const;
export const HOST_GET_NETWORK_ADDRESSES_EVENT =
  "host:get-network-addresses" as const;
export const HOST_ROOM_STATE_EVENT = "host:room-state" as const;
export const HOST_PLAYER_INPUT_EVENT = "host:player-input" as const;
export const CONTROLLER_JOIN_ROOM_EVENT = "controller:join-room" as const;
export const CONTROLLER_RECONNECT_EVENT = "controller:reconnect" as const;
export const CONTROLLER_INPUT_EVENT = "controller:input" as const;
export const CONTROLLER_ROOM_CLOSED_EVENT = "controller:room-closed" as const;

type Acknowledge<Result> = (result: Result) => void;

export interface ClientToServerEvents {
  [HOST_CREATE_ROOM_EVENT]: (acknowledge: Acknowledge<CreateRoomResult>) => void;
  [HOST_GET_NETWORK_ADDRESSES_EVENT]: (
    acknowledge: Acknowledge<HostNetworkAddressesResult>,
  ) => void;
  [CONTROLLER_JOIN_ROOM_EVENT]: (
    request: JoinRoomRequest,
    acknowledge: Acknowledge<JoinRoomResult>,
  ) => void;
  [CONTROLLER_RECONNECT_EVENT]: (
    request: ReconnectControllerRequest,
    acknowledge: Acknowledge<ReconnectControllerResult>,
  ) => void;
  [CONTROLLER_INPUT_EVENT]: (payload: ControllerInputPayload) => void;
}

export interface ServerToClientEvents {
  [HOST_ROOM_STATE_EVENT]: (room: RoomSnapshot) => void;
  [HOST_PLAYER_INPUT_EVENT]: (event: HostPlayerInputEvent) => void;
  [CONTROLLER_ROOM_CLOSED_EVENT]: (notice: RoomClosedNotice) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  role: ConnectionRole;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: string[]) => {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => key in value);
};

export const normalizeRoomCode = (value: string) =>
  value.trim().toUpperCase();

export const isRoomCode = (value: string) =>
  value.length === ROOM_CODE_LENGTH &&
  [...value].every((character) => ROOM_CODE_ALPHABET.includes(character));

export const normalizeDisplayName = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ");

export const isDisplayName = (value: string) => {
  const length = [...value].length;
  return (
    length >= 1 &&
    length <= DISPLAY_NAME_MAX_LENGTH &&
    /^[\p{L}\p{N}][\p{L}\p{N} _'-]*$/u.test(value)
  );
};

export const isConnectionAuth = (value: unknown): value is ConnectionAuth => {
  if (!isRecord(value) || !hasExactKeys(value, ["role"])) {
    return false;
  }

  return (
    value.role === CONNECTION_ROLES.host ||
    value.role === CONNECTION_ROLES.controller
  );
};

export const isJoinRoomRequest = (value: unknown): value is JoinRoomRequest =>
  isRecord(value) &&
  hasExactKeys(value, ["roomCode", "displayName"]) &&
  typeof value.roomCode === "string" &&
  typeof value.displayName === "string";

export const isReconnectControllerRequest = (
  value: unknown,
): value is ReconnectControllerRequest =>
  isRecord(value) &&
  hasExactKeys(value, ["reconnectionToken"]) &&
  typeof value.reconnectionToken === "string" &&
  value.reconnectionToken.length >= 20 &&
  value.reconnectionToken.length <= 128;

export const isControllerButton = (
  value: unknown,
): value is ControllerButton =>
  typeof value === "string" &&
  CONTROLLER_BUTTONS.includes(value as ControllerButton);

export const isButtonPhase = (value: unknown): value is ButtonPhase =>
  typeof value === "string" && BUTTON_PHASES.includes(value as ButtonPhase);

export const isControllerInputPayload = (
  value: unknown,
): value is ControllerInputPayload => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["button", "phase", "clientTimestamp"])
  ) {
    return false;
  }

  return (
    isControllerButton(value.button) &&
    isButtonPhase(value.phase) &&
    typeof value.clientTimestamp === "number" &&
    Number.isSafeInteger(value.clientTimestamp) &&
    value.clientTimestamp >= 0
  );
};
