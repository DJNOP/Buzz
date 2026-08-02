import { randomBytes, randomUUID } from "node:crypto";
import {
  PLAYER_ACCENTS,
  isControllerInputPayload,
  isDisplayName,
  isRoomCode,
  normalizeDisplayName,
  normalizeRoomCode,
  type ControllerButton,
  type ControllerInputPayload,
  type ControllerSession,
  type CreateRoomResult,
  type HostPlayerInputEvent,
  type JoinRoomRequest,
  type JoinRoomResult,
  type PlayerAccent,
  type PublicPlayer,
  type ReconnectControllerResult,
  type RoomSnapshot,
} from "@party-game/shared";
import { generateRoomCode } from "./room-code.js";

export const DEFAULT_RECONNECTION_GRACE_MS = 20_000;
const MAX_ROOM_CODE_ATTEMPTS = 100;
const MAX_IDENTIFIER_ATTEMPTS = 10;
const MAX_PLAYERS = 4;

type TimerHandle = ReturnType<typeof setTimeout>;

interface PlayerRecord {
  id: string;
  number: number;
  displayName: string;
  accent: PlayerAccent;
  connected: boolean;
  socketId: string | null;
  reconnectionToken: string;
  disconnectTimer: TimerHandle | null;
  validInputCount: number;
  latestInput: PublicPlayer["latestInput"];
  activeButtons: Set<ControllerButton>;
}

interface RoomRecord {
  code: string;
  hostSocketId: string;
  players: Map<number, PlayerRecord>;
}

interface PlayerLocator {
  roomCode: string;
  playerId: string;
}

export type RoomManagerEvent =
  | {
      type: "room-updated";
      hostSocketId: string;
      room: RoomSnapshot;
    }
  | {
      type: "room-closed";
      roomCode: string;
      controllerSocketIds: string[];
    };

export interface ReconnectControllerOutcome {
  result: ReconnectControllerResult;
  replacedSocketId: string | null;
}

export interface AcceptedInput {
  hostSocketId: string;
  event: HostPlayerInputEvent;
}

export interface RoomManagerOptions {
  reconnectGraceMs?: number;
  now?: () => number;
  createRoomCode?: () => string;
  createPlayerId?: () => string;
  createReconnectionToken?: () => string;
  schedule?: (callback: () => void, delay: number) => TimerHandle;
  cancelSchedule?: (handle: TimerHandle) => void;
}

const createSessionToken = () => randomBytes(32).toString("base64url");

export class RoomManager {
  readonly reconnectGraceMs: number;

  private readonly rooms = new Map<string, RoomRecord>();
  private readonly roomCodeByHostSocket = new Map<string, string>();
  private readonly playerBySocket = new Map<string, PlayerLocator>();
  private readonly playerByToken = new Map<string, PlayerLocator>();
  private readonly listeners = new Set<(event: RoomManagerEvent) => void>();
  private readonly now: () => number;
  private readonly createRoomCode: () => string;
  private readonly createPlayerId: () => string;
  private readonly createReconnectionToken: () => string;
  private readonly schedule: RoomManagerOptions["schedule"];
  private readonly cancelSchedule: RoomManagerOptions["cancelSchedule"];

  constructor(options: RoomManagerOptions = {}) {
    this.reconnectGraceMs =
      options.reconnectGraceMs ?? DEFAULT_RECONNECTION_GRACE_MS;
    this.now = options.now ?? Date.now;
    this.createRoomCode = options.createRoomCode ?? generateRoomCode;
    this.createPlayerId = options.createPlayerId ?? randomUUID;
    this.createReconnectionToken =
      options.createReconnectionToken ?? createSessionToken;
    this.schedule = options.schedule ?? setTimeout;
    this.cancelSchedule = options.cancelSchedule ?? clearTimeout;
  }

  subscribe(listener: (event: RoomManagerEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  createRoom(hostSocketId: string): CreateRoomResult {
    if (this.roomCodeByHostSocket.has(hostSocketId)) {
      return {
        ok: false,
        error: {
          code: "host_already_has_room",
          message: "This host already owns a room.",
        },
      };
    }

    let code: string | undefined;
    for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
      const candidate = normalizeRoomCode(this.createRoomCode());
      if (isRoomCode(candidate) && !this.rooms.has(candidate)) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return {
        ok: false,
        error: {
          code: "room_code_unavailable",
          message: "A room code could not be generated. Please try again.",
        },
      };
    }

    const room: RoomRecord = {
      code,
      hostSocketId,
      players: new Map(),
    };
    this.rooms.set(code, room);
    this.roomCodeByHostSocket.set(hostSocketId, code);

    const snapshot = this.toRoomSnapshot(room);
    this.emit({ type: "room-updated", hostSocketId, room: snapshot });
    return { ok: true, room: snapshot };
  }

  joinRoom(controllerSocketId: string, request: JoinRoomRequest): JoinRoomResult {
    if (this.playerBySocket.has(controllerSocketId)) {
      return {
        ok: false,
        error: {
          code: "already_joined",
          message: "This controller is already joined to a room.",
        },
      };
    }

    const roomCode = normalizeRoomCode(request.roomCode);
    if (!isRoomCode(roomCode)) {
      return {
        ok: false,
        error: {
          code: "invalid_room_code",
          message: "Enter the four-character room code shown on the host.",
        },
      };
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      return {
        ok: false,
        error: {
          code: "room_not_found",
          message: "That room does not exist. Check the code and try again.",
        },
      };
    }

    const displayName = normalizeDisplayName(request.displayName);
    if (!isDisplayName(displayName)) {
      return {
        ok: false,
        error: {
          code: "invalid_display_name",
          message:
            "Use 1–16 letters or numbers; spaces, apostrophes, hyphens, and underscores are allowed.",
        },
      };
    }

    const normalizedName = displayName.toLocaleLowerCase("en-US");
    const duplicateName = [...room.players.values()].some(
      (player) =>
        player.displayName.toLocaleLowerCase("en-US") === normalizedName,
    );
    if (duplicateName) {
      return {
        ok: false,
        error: {
          code: "duplicate_display_name",
          message: "That display name is already in use in this room.",
        },
      };
    }

    if (room.players.size >= MAX_PLAYERS) {
      return {
        ok: false,
        error: {
          code: "room_full",
          message: "This room already has four players.",
        },
      };
    }

    const playerId = this.createUniquePlayerId();
    const reconnectionToken = this.createUniqueToken();
    if (!playerId || !reconnectionToken) {
      return {
        ok: false,
        error: {
          code: "session_unavailable",
          message: "A private player session could not be created. Please try again.",
        },
      };
    }

    const number = this.nextPlayerNumber(room);
    const player: PlayerRecord = {
      id: playerId,
      number,
      displayName,
      accent: PLAYER_ACCENTS[number - 1] ?? PLAYER_ACCENTS[0],
      connected: true,
      socketId: controllerSocketId,
      reconnectionToken,
      disconnectTimer: null,
      validInputCount: 0,
      latestInput: null,
      activeButtons: new Set(),
    };

    room.players.set(number, player);
    const locator = { roomCode, playerId };
    this.playerBySocket.set(controllerSocketId, locator);
    this.playerByToken.set(reconnectionToken, locator);
    this.emitRoomUpdated(room);

    return {
      ok: true,
      session: this.toControllerSession(room, player),
    };
  }

  reconnectController(
    controllerSocketId: string,
    reconnectionToken: string,
  ): ReconnectControllerOutcome {
    if (this.playerBySocket.has(controllerSocketId)) {
      return {
        result: {
          ok: false,
          error: {
            code: "already_joined",
            message: "This controller is already joined to a room.",
          },
        },
        replacedSocketId: null,
      };
    }

    const locator = this.playerByToken.get(reconnectionToken);
    const room = locator ? this.rooms.get(locator.roomCode) : undefined;
    const player = room && locator ? this.findPlayer(room, locator.playerId) : undefined;

    if (!locator || !room || !player || player.reconnectionToken !== reconnectionToken) {
      return {
        result: {
          ok: false,
          error: {
            code: "invalid_reconnection_token",
            message: "The previous player session has expired or is no longer valid.",
          },
        },
        replacedSocketId: null,
      };
    }

    const replacedSocketId = player.socketId;
    if (replacedSocketId) {
      this.playerBySocket.delete(replacedSocketId);
    }
    if (player.disconnectTimer) {
      this.cancelSchedule?.(player.disconnectTimer);
    }

    player.socketId = controllerSocketId;
    player.connected = true;
    player.disconnectTimer = null;
    player.activeButtons.clear();
    this.playerBySocket.set(controllerSocketId, locator);
    this.emitRoomUpdated(room);

    return {
      result: {
        ok: true,
        session: this.toControllerSession(room, player),
      },
      replacedSocketId,
    };
  }

  acceptInput(socketId: string, value: unknown): AcceptedInput | null {
    if (!isControllerInputPayload(value)) {
      return null;
    }

    const locator = this.playerBySocket.get(socketId);
    const room = locator ? this.rooms.get(locator.roomCode) : undefined;
    const player = room && locator ? this.findPlayer(room, locator.playerId) : undefined;
    if (!locator || !room || !player || !player.connected || player.socketId !== socketId) {
      return null;
    }

    if (value.phase === "down") {
      if (player.activeButtons.has(value.button)) {
        return null;
      }
      player.activeButtons.add(value.button);
    } else {
      if (!player.activeButtons.has(value.button)) {
        return null;
      }
      player.activeButtons.delete(value.button);
    }

    const serverReceivedAt = this.now();
    player.validInputCount += 1;
    player.latestInput = { ...value, serverReceivedAt };

    return {
      hostSocketId: room.hostSocketId,
      event: {
        ...value,
        roomCode: room.code,
        playerId: player.id,
        playerNumber: player.number,
        serverReceivedAt,
        validInputCount: player.validInputCount,
      },
    };
  }

  handleDisconnect(socketId: string) {
    const hostedRoomCode = this.roomCodeByHostSocket.get(socketId);
    if (hostedRoomCode) {
      this.closeRoom(hostedRoomCode);
      return;
    }

    const locator = this.playerBySocket.get(socketId);
    if (!locator) {
      return;
    }

    this.playerBySocket.delete(socketId);
    const room = this.rooms.get(locator.roomCode);
    const player = room ? this.findPlayer(room, locator.playerId) : undefined;
    if (!room || !player || player.socketId !== socketId) {
      return;
    }

    player.connected = false;
    player.socketId = null;
    player.activeButtons.clear();
    if (player.disconnectTimer) {
      this.cancelSchedule?.(player.disconnectTimer);
    }
    player.disconnectTimer = this.schedule?.(
      () => this.expireDisconnectedPlayer(room.code, player.id),
      this.reconnectGraceMs,
    ) ?? null;
    this.emitRoomUpdated(room);
  }

  getRoomForHost(hostSocketId: string): RoomSnapshot | null {
    const roomCode = this.roomCodeByHostSocket.get(hostSocketId);
    const room = roomCode ? this.rooms.get(roomCode) : undefined;
    return room ? this.toRoomSnapshot(room) : null;
  }

  dispose() {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.disconnectTimer) {
          this.cancelSchedule?.(player.disconnectTimer);
        }
      }
    }
    this.rooms.clear();
    this.roomCodeByHostSocket.clear();
    this.playerBySocket.clear();
    this.playerByToken.clear();
    this.listeners.clear();
  }

  private closeRoom(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return;
    }

    const controllerSocketIds: string[] = [];
    for (const player of room.players.values()) {
      if (player.disconnectTimer) {
        this.cancelSchedule?.(player.disconnectTimer);
      }
      if (player.socketId) {
        controllerSocketIds.push(player.socketId);
        this.playerBySocket.delete(player.socketId);
      }
      this.playerByToken.delete(player.reconnectionToken);
    }

    this.rooms.delete(roomCode);
    this.roomCodeByHostSocket.delete(room.hostSocketId);
    this.emit({ type: "room-closed", roomCode, controllerSocketIds });
  }

  private expireDisconnectedPlayer(roomCode: string, playerId: string) {
    const room = this.rooms.get(roomCode);
    const player = room ? this.findPlayer(room, playerId) : undefined;
    if (!room || !player || player.connected) {
      return;
    }

    room.players.delete(player.number);
    this.playerByToken.delete(player.reconnectionToken);
    player.disconnectTimer = null;
    this.emitRoomUpdated(room);
  }

  private nextPlayerNumber(room: RoomRecord) {
    for (let number = 1; number <= MAX_PLAYERS; number += 1) {
      if (!room.players.has(number)) {
        return number;
      }
    }
    throw new Error("Room capacity was checked before assigning a player number.");
  }

  private createUniquePlayerId() {
    for (let attempt = 0; attempt < MAX_IDENTIFIER_ATTEMPTS; attempt += 1) {
      const id = this.createPlayerId();
      const alreadyUsed = [...this.rooms.values()].some((room) =>
        [...room.players.values()].some((player) => player.id === id),
      );
      if (!alreadyUsed) {
        return id;
      }
    }
    return null;
  }

  private createUniqueToken() {
    for (let attempt = 0; attempt < MAX_IDENTIFIER_ATTEMPTS; attempt += 1) {
      const token = this.createReconnectionToken();
      if (
        token.length >= 20 &&
        token.length <= 128 &&
        !this.playerByToken.has(token)
      ) {
        return token;
      }
    }
    return null;
  }

  private findPlayer(room: RoomRecord, playerId: string) {
    return [...room.players.values()].find((player) => player.id === playerId);
  }

  private toPublicPlayer(player: PlayerRecord): PublicPlayer {
    return {
      id: player.id,
      number: player.number,
      displayName: player.displayName,
      accent: player.accent,
      connectionState: player.connected ? "connected" : "disconnected",
      validInputCount: player.validInputCount,
      latestInput: player.latestInput,
    };
  }

  private toRoomSnapshot(room: RoomRecord): RoomSnapshot {
    return {
      code: room.code,
      players: [...room.players.values()]
        .sort((left, right) => left.number - right.number)
        .map((player) => this.toPublicPlayer(player)),
    };
  }

  private toControllerSession(
    room: RoomRecord,
    player: PlayerRecord,
  ): ControllerSession {
    return {
      roomCode: room.code,
      player: this.toPublicPlayer(player),
      reconnectionToken: player.reconnectionToken,
    };
  }

  private emitRoomUpdated(room: RoomRecord) {
    this.emit({
      type: "room-updated",
      hostSocketId: room.hostSocketId,
      room: this.toRoomSnapshot(room),
    });
  }

  private emit(event: RoomManagerEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
