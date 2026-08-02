import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  buildControllerJoinUrl,
  HOST_CREATE_ROOM_EVENT,
  HOST_GET_NETWORK_ADDRESSES_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  HOST_ROOM_STATE_EVENT,
  type HostPlayerInputEvent,
  type LocalNetworkAddress,
  type PublicPlayer,
  type RoomSnapshot,
} from "@party-game/shared";
import { BUTTON_PRESENTATION } from "./button-presentation";
import { hostSocket, serverUrl } from "./socket";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) {
    throw new Error("Copy command was unavailable.");
  }
};

const formatTime = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  }).format(timestamp);

const applyInputToRoom = (
  room: RoomSnapshot,
  input: HostPlayerInputEvent,
): RoomSnapshot => ({
  ...room,
  players: room.players.map((player) =>
    player.id === input.playerId
      ? {
          ...player,
          validInputCount: input.validInputCount,
          latestInput: {
            button: input.button,
            phase: input.phase,
            clientTimestamp: input.clientTimestamp,
            serverReceivedAt: input.serverReceivedAt,
          },
        }
      : player,
  ),
});

const EmptySlot = ({ number }: { number: number }) => (
  <article className="player-card player-card--empty">
    <div className="player-card__identity">
      <span className="player-number">P{number}</span>
      <div>
        <h2>Open slot</h2>
        <p>Waiting for a controller</p>
      </div>
    </div>
    <div className="empty-marker" aria-hidden="true">
      +
    </div>
  </article>
);

const PlayerSlot = ({ player }: { player: PublicPlayer }) => {
  const latest = player.latestInput;
  const presentation = latest ? BUTTON_PRESENTATION[latest.button] : null;

  return (
    <article
      className={`player-card player-card--${player.connectionState}`}
      data-accent={player.accent}
    >
      <div className="player-card__identity">
        <span className="player-number">P{player.number}</span>
        <div>
          <h2>{player.displayName}</h2>
          <p className="player-state">
            <span className="player-state__dot" aria-hidden="true" />
            {player.connectionState === "connected"
              ? "Connected"
              : "Reconnecting…"}
          </p>
        </div>
      </div>

      <div className="input-diagnostic">
        <div
          key={`${player.validInputCount}-${latest?.phase ?? "none"}`}
          className={`input-shape ${latest ? `input-shape--${latest.button} input-shape--flash` : ""}`}
          aria-hidden="true"
        >
          {presentation?.symbol ?? "–"}
        </div>
        <div>
          <span>Latest input</span>
          <strong>
            {latest && presentation
              ? `${presentation.label} · ${latest.phase}`
              : "No input yet"}
          </strong>
          <small>
            {latest ? `Server receipt ${formatTime(latest.serverReceivedAt)}` : "—"}
          </small>
        </div>
      </div>

      <div className="input-count">
        <strong>{player.validInputCount}</strong>
        <span>valid phases</span>
      </div>
    </article>
  );
};

export const App = () => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [connectionMessage, setConnectionMessage] = useState("Connecting…");
  const [room, setRoom] = useState<RoomSnapshot>();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [networkAddresses, setNetworkAddresses] = useState<
    LocalNetworkAddress[] | null
  >(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    let active = true;

    const readNetworkAddresses = () => {
      hostSocket.emit(HOST_GET_NETWORK_ADDRESSES_EVENT, (result) => {
        if (!active) {
          return;
        }
        const addresses = result.ok ? result.addresses : [];
        setNetworkAddresses(addresses);
        setSelectedAddress((current) =>
          addresses.some((candidate) => candidate.address === current)
            ? current
            : (addresses[0]?.address ?? ""),
        );
      });
    };

    const onConnect = () => {
      setConnectionState("connected");
      setConnectionMessage("Connected to room server");
      readNetworkAddresses();
    };
    const onDisconnect = () => {
      setConnectionState("disconnected");
      setConnectionMessage("Disconnected — this room has closed");
      setRoom(undefined);
      setIsCreating(false);
    };
    const onConnectError = (error: Error) => {
      setConnectionState("error");
      setConnectionMessage(`Connection failed: ${error.message}`);
    };
    const onRoomState = (nextRoom: RoomSnapshot) => {
      setRoom(nextRoom);
      setCreateError("");
      setIsCreating(false);
    };
    const onPlayerInput = (input: HostPlayerInputEvent) => {
      setRoom((currentRoom) =>
        currentRoom && currentRoom.code === input.roomCode
          ? applyInputToRoom(currentRoom, input)
          : currentRoom,
      );
    };

    hostSocket.on("connect", onConnect);
    hostSocket.on("disconnect", onDisconnect);
    hostSocket.on("connect_error", onConnectError);
    hostSocket.on(HOST_ROOM_STATE_EVENT, onRoomState);
    hostSocket.on(HOST_PLAYER_INPUT_EVENT, onPlayerInput);
    hostSocket.connect();

    return () => {
      active = false;
      hostSocket.off("connect", onConnect);
      hostSocket.off("disconnect", onDisconnect);
      hostSocket.off("connect_error", onConnectError);
      hostSocket.off(HOST_ROOM_STATE_EVENT, onRoomState);
      hostSocket.off(HOST_PLAYER_INPUT_EVENT, onPlayerInput);
      hostSocket.disconnect();
    };
  }, []);

  const createRoom = () => {
    setIsCreating(true);
    setCreateError("");
    hostSocket.emit(HOST_CREATE_ROOM_EVENT, (result) => {
      setIsCreating(false);
      if (result.ok) {
        setRoom(result.room);
        return;
      }
      setCreateError(result.error.message);
    });
  };

  const slots = Array.from({ length: 4 }, (_, index) => {
    const number = index + 1;
    return room?.players.find((player) => player.number === number) ?? number;
  });

  const controllerUrl =
    room && selectedAddress
      ? buildControllerJoinUrl(selectedAddress, room.code)
      : "";

  const copyControllerUrl = async () => {
    if (!controllerUrl) {
      return;
    }
    try {
      await copyText(controllerUrl);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Copy unavailable — select the link below");
    }
  };

  return (
    <main className="host-screen">
      <header className="host-header">
        <div>
          <p className="eyebrow">Multiplayer controller foundation</p>
          <h1>Host diagnostics</h1>
        </div>
        <div
          className={`connection connection--${connectionState}`}
          role="status"
          aria-live="polite"
        >
          <span className="connection__dot" aria-hidden="true" />
          {connectionMessage}
        </div>
      </header>

      {!room ? (
        <section className="room-start">
          <div className="room-start__shape" aria-hidden="true" />
          <p>Start one temporary room for up to four controllers.</p>
          <button
            type="button"
            onClick={createRoom}
            disabled={connectionState !== "connected" || isCreating}
          >
            {isCreating ? "Creating…" : "Create room"}
          </button>
          {createError ? <p className="error-message">{createError}</p> : null}
        </section>
      ) : (
        <div className="room-session">
          <section className="join-card" aria-label="Join this room">
            <div className="room-banner" aria-label="Current room code">
              <span>Controller room</span>
              <strong>{room.code}</strong>
              <p>Scan to join, or enter this code manually.</p>
            </div>

            {networkAddresses === null ? (
              <p className="network-message" role="status">
                Finding this computer on the local network…
              </p>
            ) : controllerUrl ? (
              <>
                <div className="qr-frame">
                  <QRCodeSVG
                    value={controllerUrl}
                    size={320}
                    level="M"
                    marginSize={4}
                    bgColor="#ffffff"
                    fgColor="#111426"
                    title={`Join room ${room.code}`}
                  />
                </div>

                {networkAddresses.length > 1 ? (
                  <label className="address-select">
                    Network address
                    <select
                      value={selectedAddress}
                      onChange={(event) => {
                        setSelectedAddress(event.target.value);
                        setCopyStatus("");
                      }}
                    >
                      {networkAddresses.map((candidate) => (
                        <option key={candidate.address} value={candidate.address}>
                          {candidate.address}
                          {candidate.isPrivate
                            ? " — private network"
                            : " — other network"}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div className="controller-link">
                  <label htmlFor="controller-url">Controller link</label>
                  <div>
                    <input
                      id="controller-url"
                      value={controllerUrl}
                      readOnly
                      onFocus={(event) => event.currentTarget.select()}
                    />
                    <button type="button" onClick={copyControllerUrl}>
                      Copy link
                    </button>
                  </div>
                  <span role="status" aria-live="polite">
                    {copyStatus}
                  </span>
                </div>

                <p className="network-note">
                  Both devices must be on the same local network. The QR code is
                  generated here and contains only this controller link.
                </p>
              </>
            ) : (
              <div className="network-fallback" role="status">
                <strong>No usable local network address was detected.</strong>
                <p>
                  Keep using room code {room.code}. Find this computer’s local
                  IPv4 address and open the controller page manually on the same
                  network.
                </p>
              </div>
            )}
          </section>

          <section className="player-grid" aria-label="Player slots">
            {slots.map((slot) =>
              typeof slot === "number" ? (
                <EmptySlot key={slot} number={slot} />
              ) : (
                <PlayerSlot key={slot.id} player={slot} />
              ),
            )}
          </section>
        </div>
      )}

      <footer className="diagnostics-footer">
        <span>Input server</span>
        <strong>{serverUrl}</strong>
        <span>Times are diagnostics, not measured end-to-end latency.</span>
      </footer>
    </main>
  );
};
