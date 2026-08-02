import {
  HOST_PRIMARY_BUTTON_EVENT,
  PRIMARY_BUTTON_EVENT,
  type ClientToServerEvents,
  type HostPrimaryButtonEvent,
  type PrimaryButtonPayload,
  type ServerToClientEvents,
} from "../src/index.js";

const sendPrimaryButton: ClientToServerEvents[typeof PRIMARY_BUTTON_EVENT] = (
  payload,
) => payload.pressedAt.toFixed(0);

const receivePrimaryButton: ServerToClientEvents[typeof HOST_PRIMARY_BUTTON_EVENT] =
  (event) => event.serverReceivedAt.toFixed(0);

const validPayload: PrimaryButtonPayload = { pressedAt: Date.now() };
const validHostEvent: HostPrimaryButtonEvent = {
  controllerPressedAt: validPayload.pressedAt,
  serverReceivedAt: Date.now(),
};

// @ts-expect-error The shared contract rejects non-numeric timestamps.
const invalidPayload: PrimaryButtonPayload = { pressedAt: "now" };

void sendPrimaryButton;
void receivePrimaryButton;
void validHostEvent;
void invalidPayload;
