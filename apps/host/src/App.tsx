import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  buildControllerJoinUrl,
  HOST_CREATE_ROOM_EVENT,
  HOST_GAME_ACTION_EVENT,
  HOST_GAME_STATE_EVENT,
  HOST_GET_NETWORK_ADDRESSES_EVENT,
  HOST_PLAYER_INPUT_EVENT,
  HOST_ROOM_STATE_EVENT,
  type HostGameAction,
  type HostPlayerInputEvent,
  type LocalNetworkAddress,
  type PublicPlayer,
  type RoomSnapshot,
  type SignalSprintState,
} from "@party-game/shared";
import { EventStation } from "./EventStation";
import { getPlayerIdentity } from "./player-identity";
import {
  deriveRobotPresentation,
  recordRobotAcknowledgement,
  type RobotAcknowledgements,
  type RobotPresentation,
} from "./robot-presentation";
import { ServiceRobot } from "./ServiceRobot";
import { hostSocket, serverUrl } from "./socket";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

const COUNTDOWN_ROBOT_PRESENTATION: RobotPresentation = {
  state: "idle",
  label: "Ready for call time",
  acknowledgementSequence: null,
  showAcknowledgement: false,
};

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

const EmptySlot = ({ number }: { number: number }) => (
  <article className="lobby-player lobby-player--empty">
    <span className="player-number">P{number}</span>
    <div>
      <strong>Open slot</strong>
      <span>Waiting for a controller</span>
    </div>
  </article>
);

const LobbyPlayer = ({ player }: { player: PublicPlayer }) => {
  const identity = getPlayerIdentity(player.number);
  const presentation: RobotPresentation = {
    state: "idle",
    label:
      player.connectionState === "connected" ? "Crew ready" : "Reconnecting",
    acknowledgementSequence: null,
    showAcknowledgement: false,
  };

  return (
    <article
      className={`lobby-player lobby-player--${player.connectionState}`}
      data-player={player.number}
      data-identity-colour={identity.colour}
    >
      <ServiceRobot
        identity={identity}
        presentation={presentation}
        compact
      />
      <div>
        <span className={`identity-chip identity-chip--${identity.shape}`}>
          P{player.number}
        </span>
        <strong>{player.displayName}</strong>
        <span>
          {player.connectionState === "connected"
            ? `${identity.colourLabel} ${identity.shapeLabel} crew`
            : "Reconnecting..."}
        </span>
      </div>
    </article>
  );
};

interface JoinCardProps {
  room: RoomSnapshot;
  networkAddresses: LocalNetworkAddress[] | null;
  selectedAddress: string;
  setSelectedAddress: (address: string) => void;
  copyStatus: string;
  copyControllerUrl: (url: string) => void;
}

const JoinCard = ({
  room,
  networkAddresses,
  selectedAddress,
  setSelectedAddress,
  copyStatus,
  copyControllerUrl,
}: JoinCardProps) => {
  const controllerUrl = selectedAddress
    ? buildControllerJoinUrl(selectedAddress, room.code)
    : "";

  return (
    <section className="join-card" aria-label="Join this room">
      <div className="room-banner" aria-label="Current room code">
        <span>Controller room</span>
        <strong>{room.code}</strong>
        <p>Scan to join, or enter this code manually.</p>
      </div>

      {networkAddresses === null ? (
        <p className="network-message" role="status">
          Finding this computer on the local network...
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
                onChange={(event) => setSelectedAddress(event.target.value)}
              >
                {networkAddresses.map((candidate) => (
                  <option key={candidate.address} value={candidate.address}>
                    {candidate.address}
                    {candidate.isPrivate
                      ? " - private network"
                      : " - other network"}
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
              <button type="button" onClick={() => copyControllerUrl(controllerUrl)}>
                Copy
              </button>
            </div>
            <span role="status" aria-live="polite">
              {copyStatus}
            </span>
          </div>

          <p className="network-note">
            Keep every device on the same local network. This QR is generated
            locally and contains only the controller link.
          </p>
        </>
      ) : (
        <div className="network-fallback" role="status">
          <strong>No usable local network address was detected.</strong>
          <p>
            Join manually with room code {room.code} from a controller on the
            same network.
          </p>
        </div>
      )}
    </section>
  );
};

const formatRoundTime = (roundEndsAt: number | null, clock: number) => {
  const remainingMs = Math.max(0, (roundEndsAt ?? clock) - clock);
  return (remainingMs / 1_000).toFixed(1);
};

export const App = () => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [connectionMessage, setConnectionMessage] = useState("Connecting...");
  const [room, setRoom] = useState<RoomSnapshot>();
  const [game, setGame] = useState<SignalSprintState>();
  const [robotAcknowledgements, setRobotAcknowledgements] =
    useState<RobotAcknowledgements>({});
  const [clock, setClock] = useState(Date.now());
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [gameError, setGameError] = useState("");
  const [pendingAction, setPendingAction] = useState<HostGameAction>();
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
      setConnectionMessage("Disconnected - this room has closed");
      setRoom(undefined);
      setGame(undefined);
      setIsCreating(false);
      setPendingAction(undefined);
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
    const onGameState = (nextGame: SignalSprintState) => {
      setGame(nextGame);
      setClock(Date.now());
      setGameError("");
      setPendingAction(undefined);
    };
    const onPlayerInput = (event: HostPlayerInputEvent) => {
      setRobotAcknowledgements((current) =>
        recordRobotAcknowledgement(current, event),
      );
      setClock(Date.now());
    };

    hostSocket.on("connect", onConnect);
    hostSocket.on("disconnect", onDisconnect);
    hostSocket.on("connect_error", onConnectError);
    hostSocket.on(HOST_ROOM_STATE_EVENT, onRoomState);
    hostSocket.on(HOST_GAME_STATE_EVENT, onGameState);
    hostSocket.on(HOST_PLAYER_INPUT_EVENT, onPlayerInput);
    hostSocket.connect();

    return () => {
      active = false;
      hostSocket.off("connect", onConnect);
      hostSocket.off("disconnect", onDisconnect);
      hostSocket.off("connect_error", onConnectError);
      hostSocket.off(HOST_ROOM_STATE_EVENT, onRoomState);
      hostSocket.off(HOST_GAME_STATE_EVENT, onGameState);
      hostSocket.off(HOST_PLAYER_INPUT_EVENT, onPlayerInput);
      hostSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (game?.phase !== "countdown" && game?.phase !== "playing") {
      return;
    }
    const timer = window.setInterval(() => setClock(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [game?.phase, game?.roundId]);

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

  const controlGame = (action: HostGameAction) => {
    setPendingAction(action);
    setGameError("");
    hostSocket.emit(HOST_GAME_ACTION_EVENT, { action }, (result) => {
      setPendingAction(undefined);
      if (result.ok) {
        setGame(result.game);
        setClock(Date.now());
        return;
      }
      setGameError(result.error.message);
    });
  };

  const copyControllerUrl = async (controllerUrl: string) => {
    try {
      await copyText(controllerUrl);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Copy unavailable - select the link instead");
    }
  };

  const connectedPlayers = room?.players.filter(
    (player) => player.connectionState === "connected",
  ) ?? [];
  const participantIds = new Set(game?.players.map((player) => player.playerId));
  const waitingPlayers = room?.players.filter(
    (player) => !participantIds.has(player.id),
  ) ?? [];
  const phase = game?.phase ?? "lobby";

  return (
    <main className={`host-screen host-screen--${phase}`}>
      <div className="venue-set" aria-hidden="true">
        <span className="venue-rig venue-rig--left" />
        <span className="venue-rig venue-rig--right" />
        <span className="venue-curtain venue-curtain--left" />
        <span className="venue-curtain venue-curtain--right" />
        <span className="venue-floor-line" />
      </div>
      <header className="host-header">
        <div>
          <p className="eyebrow">Event Rescue // Service Crew</p>
          <h1>{room ? "Signal Sprint" : "Open the venue"}</h1>
        </div>
        <div className="header-status">
          {room ? <span className="header-room">Room {room.code}</span> : null}
          <div
            className={`connection connection--${connectionState}`}
            role="status"
            aria-live="polite"
          >
            <span className="connection__dot" aria-hidden="true" />
            {connectionMessage}
          </div>
        </div>
      </header>

      {!room ? (
        <section className="room-start">
          <div className="venue-pass" aria-hidden="true">
            <i /><i /><i />
          </div>
          <p>
            Call in up to four temporary service robots and save tonight's event.
          </p>
          <button
            type="button"
            onClick={createRoom}
            disabled={connectionState !== "connected" || isCreating}
          >
            {isCreating ? "Creating..." : "Create room"}
          </button>
          {createError ? <p className="error-message">{createError}</p> : null}
        </section>
      ) : phase === "lobby" ? (
        <div className="room-session">
          <JoinCard
            room={room}
            networkAddresses={networkAddresses}
            selectedAddress={selectedAddress}
            setSelectedAddress={(address) => {
              setSelectedAddress(address);
              setCopyStatus("");
            }}
            copyStatus={copyStatus}
            copyControllerUrl={copyControllerUrl}
          />
          <section className="lobby-board" aria-label="Signal Sprint lobby">
            <div className="lobby-copy">
              <p className="section-kicker">Venue call time</p>
              <h2>Restore every station before doors open.</h2>
              <p>
                Match each work cue on your controller. The first crew to 15
                completed jobs rescues the event; a misroute briefly stuns the
                robot.
              </p>
            </div>
            <div className="lobby-grid">
              {Array.from({ length: 4 }, (_, index) => {
                const number = index + 1;
                const player = room.players.find(
                  (candidate) => candidate.number === number,
                );
                return player ? (
                  <LobbyPlayer key={player.id} player={player} />
                ) : (
                  <EmptySlot key={number} number={number} />
                );
              })}
            </div>
            <div className="lobby-action">
              {connectedPlayers.length === 0 ? (
                <p role="status">Connect at least one controller to start.</p>
              ) : (
                <p>
                  {connectedPlayers.length} controller
                  {connectedPlayers.length === 1 ? "" : "s"} ready. One-player
                  mode is for development; the intended experience is 2-4.
                </p>
              )}
              <button
                type="button"
                onClick={() => controlGame("start")}
                disabled={connectedPlayers.length === 0 || Boolean(pendingAction)}
              >
                {pendingAction === "start" ? "Starting..." : "Start Signal Sprint"}
              </button>
              {gameError ? <span className="error-message">{gameError}</span> : null}
            </div>
          </section>
        </div>
      ) : phase === "countdown" && game ? (
        <section className="countdown-stage">
          <p>Venue doors open // Round {game.roundId}</p>
          <strong className="countdown-number">
            {Math.max(1, Math.ceil(((game.countdownEndsAt ?? clock) - clock) / 1_000))}
          </strong>
          <h2>Crews to stations</h2>
          <div className="countdown-players">
            {game.players.map((player) => {
              const identity = getPlayerIdentity(player.playerNumber);
              return (
                <div
                  key={player.playerId}
                  data-player={player.playerNumber}
                  data-identity-colour={identity.colour}
                >
                  <ServiceRobot
                    identity={identity}
                    presentation={COUNTDOWN_ROBOT_PRESENTATION}
                    compact
                  />
                  <span>P{player.playerNumber} {player.displayName}</span>
                </div>
              );
            })}
          </div>
          {waitingPlayers.length > 0 ? (
            <p>{waitingPlayers.map((player) => player.displayName).join(", ")} will join next round.</p>
          ) : null}
        </section>
      ) : phase === "playing" && game ? (
        <section className="play-stage">
          <div className="round-bar">
            <div>
              <span>Live production // Round {game.roundId}</span>
              <strong>Route the next cue</strong>
            </div>
            <div className="round-timer" aria-label="Time remaining">
              <strong>{formatRoundTime(game.roundEndsAt, clock)}</strong>
              <span>seconds</span>
            </div>
          </div>
          <div className="event-stations" data-player-count={game.players.length}>
            {game.players.map((player) => {
              const presentation = deriveRobotPresentation({
                phase: game.phase,
                player,
                winnerPlayerIds: game.winnerPlayerIds,
                acknowledgement: robotAcknowledgements[player.playerId],
                now: clock,
              });
              return (
                <EventStation
                  key={player.playerId}
                  player={player}
                  scoreToWin={game.scoreToWin}
                  presentation={presentation}
                />
              );
            })}
          </div>
          {waitingPlayers.length > 0 ? (
            <div className="waiting-strip">
              Waiting for next round: {waitingPlayers.map((player) => player.displayName).join(", ")}
            </div>
          ) : null}
        </section>
      ) : game ? (
        <section className="results-stage">
          <p className="section-kicker">Event report // Round {game.roundId}</p>
          <h2>
            {game.winnerPlayerIds.length > 1 ? "Joint rescue crew" : "Venue rescued"}
          </h2>
          <div className="winner-names">
            {game.players
              .filter((player) => game.winnerPlayerIds.includes(player.playerId))
              .map((player) => player.displayName)
              .join(" + ")}
          </div>
          <div className="results-grid">
            {[...game.players]
              .sort(
                (left, right) =>
                  right.score - left.score || left.playerNumber - right.playerNumber,
              )
              .map((player) => {
                const identity = getPlayerIdentity(player.playerNumber);
                const presentation = deriveRobotPresentation({
                  phase: game.phase,
                  player,
                  winnerPlayerIds: game.winnerPlayerIds,
                  acknowledgement: robotAcknowledgements[player.playerId],
                  now: clock,
                });
                return (
                  <article
                    key={player.playerId}
                    data-player={player.playerNumber}
                    data-identity-colour={identity.colour}
                  >
                    <ServiceRobot
                      identity={identity}
                      presentation={presentation}
                      compact
                    />
                    <div>
                      <span>P{player.playerNumber}</span>
                      <strong>{player.displayName}</strong>
                      <b>{player.score} jobs</b>
                      <small>{player.mistakes} misroutes</small>
                    </div>
                  </article>
                );
              })}
          </div>
          <div className="results-actions">
            <button
              type="button"
              onClick={() => controlGame("replay")}
              disabled={Boolean(pendingAction) || connectedPlayers.length === 0}
            >
              {pendingAction === "replay" ? "Starting..." : "Play again"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => controlGame("return_to_lobby")}
              disabled={Boolean(pendingAction)}
            >
              Return to lobby
            </button>
          </div>
          {waitingPlayers.length > 0 ? (
            <p className="results-waiting">
              Next round also includes {waitingPlayers.map((player) => player.displayName).join(", ")}.
            </p>
          ) : null}
          {gameError ? <p className="error-message">{gameError}</p> : null}
        </section>
      ) : null}

      <footer className="host-footer">
        <span>Temporary Event Rescue prototype</span>
        <strong>{serverUrl}</strong>
        <span>Venue control owns scoring and timing</span>
      </footer>
    </main>
  );
};
