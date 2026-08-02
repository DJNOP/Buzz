export const CONNECTION_ROLES = {
  host: "host",
  controller: "controller",
} as const;

export type ConnectionRole =
  (typeof CONNECTION_ROLES)[keyof typeof CONNECTION_ROLES];

export interface ConnectionAuth {
  role: ConnectionRole;
}

export const PRIMARY_BUTTON_EVENT = "controller:primary-button" as const;
export const HOST_PRIMARY_BUTTON_EVENT = "host:primary-button" as const;

export interface PrimaryButtonPayload {
  pressedAt: number;
}

export interface HostPrimaryButtonEvent {
  controllerPressedAt: number;
  serverReceivedAt: number;
}

export interface ClientToServerEvents {
  [PRIMARY_BUTTON_EVENT]: (payload: PrimaryButtonPayload) => void;
}

export interface ServerToClientEvents {
  [HOST_PRIMARY_BUTTON_EVENT]: (event: HostPrimaryButtonEvent) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  role: ConnectionRole;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isConnectionAuth = (value: unknown): value is ConnectionAuth => {
  if (!isRecord(value) || Object.keys(value).length !== 1) {
    return false;
  }

  return (
    value.role === CONNECTION_ROLES.host ||
    value.role === CONNECTION_ROLES.controller
  );
};

export const isPrimaryButtonPayload = (
  value: unknown,
): value is PrimaryButtonPayload => {
  if (!isRecord(value) || Object.keys(value).length !== 1) {
    return false;
  }

  const { pressedAt } = value;
  return (
    typeof pressedAt === "number" &&
    Number.isSafeInteger(pressedAt) &&
    pressedAt >= 0
  );
};
