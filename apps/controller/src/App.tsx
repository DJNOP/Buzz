import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  CONTROLLER_INPUT_EVENT,
  CONTROLLER_JOIN_ROOM_EVENT,
  CONTROLLER_RECONNECT_EVENT,
  CONTROLLER_ROOM_CLOSED_EVENT,
  DISPLAY_NAME_MAX_LENGTH,
  normalizeRoomCode,
  type ControllerButton,
  type ControllerSession,
  type RoomClosedNotice,
} from "@party-game/shared";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTONS,
  type ButtonPresentation,
} from "./button-presentation";
import { createInputTracker, type InputTracker } from "./input";
import {
  clearStoredSession,
  readStoredSession,
  storeSession,
} from "./session-storage";
import { controllerSocket, serverUrl } from "./socket";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface ControlButtonProps {
  presentation: ButtonPresentation;
  tracker: InputTracker;
  active: boolean;
  disabled: boolean;
  primary?: boolean;
}

const isActivationKey = (event: KeyboardEvent<HTMLButtonElement>) =>
  event.key === "Enter" || event.key === " ";

const ControlButton = ({
  presentation,
  tracker,
  active,
  disabled,
  primary = false,
}: ControlButtonProps) => {
  const { button, label, symbol } = presentation;

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    tracker.pointerDown(event.pointerId, button);
  };

  const onPointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    tracker.pointerUp(event.pointerId);
  };

  return (
    <button
      className={`control-button ${primary ? "control-button--primary" : "control-button--secondary"} ${active ? "control-button--active" : ""}`}
      data-button={button}
      type="button"
      disabled={disabled}
      aria-label={`${label} button`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerEnd}
      onPointerCancel={(event) => tracker.pointerCancel(event.pointerId)}
      onLostPointerCapture={(event) => tracker.pointerCancel(event.pointerId)}
      onKeyDown={(event) => {
        if (!event.repeat && isActivationKey(event)) {
          tracker.keyDown(button);
        }
      }}
      onKeyUp={(event) => {
        if (isActivationKey(event)) {
          tracker.keyUp(button);
        }
      }}
      onBlur={() => tracker.keyUp(button)}
      onClick={(event: MouseEvent<HTMLButtonElement>) =>
        tracker.activateClick(button, event.detail)
      }
    >
      <span className="control-button__symbol" aria-hidden="true">
        {symbol}
      </span>
      <span className="control-button__label">{label}</span>
    </button>
  );
};

export const App = () => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [connectionMessage, setConnectionMessage] = useState("Connecting…");
  const [session, setSession] = useState<ControllerSession>();
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [activeButtons, setActiveButtons] = useState<ReadonlySet<ControllerButton>>(
    new Set(),
  );
  const sessionRef = useRef<ControllerSession | undefined>(undefined);
  const trackerRef = useRef<InputTracker | null>(null);

  if (!trackerRef.current) {
    trackerRef.current = createInputTracker(
      ({ button, phase }) => {
        if (!controllerSocket.connected || !sessionRef.current) {
          return;
        }
        controllerSocket.emit(CONTROLLER_INPUT_EVENT, {
          button,
          phase,
          clientTimestamp: Date.now(),
        });
        if (phase === "down" && typeof navigator.vibrate === "function") {
          navigator.vibrate(16);
        }
      },
      (buttons) => setActiveButtons(new Set(buttons)),
    );
  }

  const tracker = trackerRef.current;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let active = true;

    const recoverSession = () => {
      const currentSession = sessionRef.current;
      const stored = currentSession
        ? {
            roomCode: currentSession.roomCode,
            reconnectionToken: currentSession.reconnectionToken,
          }
        : readStoredSession();
      if (!stored) {
        return;
      }

      setIsRecovering(true);
      setConnectionMessage("Connected — restoring player…");
      controllerSocket.emit(
        CONTROLLER_RECONNECT_EVENT,
        { reconnectionToken: stored.reconnectionToken },
        (result) => {
          if (!active) {
            return;
          }
          setIsRecovering(false);
          if (result.ok) {
            sessionRef.current = result.session;
            setSession(result.session);
            setJoinError("");
            setConnectionMessage("Connected — player restored");
            storeSession({
              roomCode: result.session.roomCode,
              reconnectionToken: result.session.reconnectionToken,
            });
            return;
          }

          clearStoredSession();
          sessionRef.current = undefined;
          setSession(undefined);
          setRoomCode(stored.roomCode);
          setJoinError(result.error.message);
          setConnectionMessage("Connected — join a room");
        },
      );
    };

    const onConnect = () => {
      setConnectionState("connected");
      setConnectionMessage("Connected — join a room");
      recoverSession();
    };
    const onDisconnect = () => {
      tracker.releaseAll();
      setConnectionState("disconnected");
      setConnectionMessage("Disconnected — attempting to reconnect…");
      setIsJoining(false);
      setIsRecovering(false);
    };
    const onConnectError = (error: Error) => {
      setConnectionState("error");
      setConnectionMessage(`Connection failed: ${error.message}`);
    };
    const onRoomClosed = (notice: RoomClosedNotice) => {
      tracker.releaseAll();
      clearStoredSession();
      sessionRef.current = undefined;
      setSession(undefined);
      setRoomCode(notice.roomCode);
      setJoinError(notice.message);
      setConnectionMessage("Connected — room closed");
    };
    const releaseInputs = () => tracker.releaseAll();
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        releaseInputs();
      }
    };

    controllerSocket.on("connect", onConnect);
    controllerSocket.on("disconnect", onDisconnect);
    controllerSocket.on("connect_error", onConnectError);
    controllerSocket.on(CONTROLLER_ROOM_CLOSED_EVENT, onRoomClosed);
    window.addEventListener("blur", releaseInputs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    controllerSocket.connect();

    return () => {
      active = false;
      tracker.releaseAll();
      controllerSocket.off("connect", onConnect);
      controllerSocket.off("disconnect", onDisconnect);
      controllerSocket.off("connect_error", onConnectError);
      controllerSocket.off(CONTROLLER_ROOM_CLOSED_EVENT, onRoomClosed);
      window.removeEventListener("blur", releaseInputs);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      controllerSocket.disconnect();
    };
  }, [tracker]);

  const joinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!controllerSocket.connected || isJoining) {
      return;
    }

    const normalizedCode = normalizeRoomCode(roomCode);
    setRoomCode(normalizedCode);
    setJoinError("");
    setIsJoining(true);
    controllerSocket.emit(
      CONTROLLER_JOIN_ROOM_EVENT,
      { roomCode: normalizedCode, displayName },
      (result) => {
        setIsJoining(false);
        if (result.ok) {
          sessionRef.current = result.session;
          setSession(result.session);
          setConnectionMessage("Connected — controller ready");
          storeSession({
            roomCode: result.session.roomCode,
            reconnectionToken: result.session.reconnectionToken,
          });
          return;
        }
        setJoinError(result.error.message);
      },
    );
  };

  const controlsDisabled = connectionState !== "connected" || !session;

  return (
    <main className="controller-screen">
      <header className="controller-header">
        <p className="eyebrow">Standard controller prototype</p>
        <div
          className={`connection connection--${connectionState}`}
          role="status"
          aria-live="polite"
        >
          <span className="connection__dot" aria-hidden="true" />
          {connectionMessage}
        </div>
      </header>

      {!session ? (
        <section className="join-panel">
          <div>
            <p className="join-panel__kicker">Join the shared screen</p>
            <h1>{isRecovering ? "Restoring player…" : "Enter room"}</h1>
          </div>
          <form onSubmit={joinRoom}>
            <label>
              Room code
              <input
                name="roomCode"
                value={roomCode}
                onChange={(event) =>
                  setRoomCode(event.target.value.toUpperCase().slice(0, 4))
                }
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                maxLength={4}
                placeholder="ABCD"
                disabled={isRecovering}
                required
              />
            </label>
            <label>
              Display name
              <input
                name="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="nickname"
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                placeholder="Player name"
                disabled={isRecovering}
                required
              />
            </label>
            <button
              className="join-button"
              type="submit"
              disabled={
                connectionState !== "connected" || isJoining || isRecovering
              }
            >
              {isJoining ? "Joining…" : "Join room"}
            </button>
          </form>
          {joinError ? (
            <p className="join-error" role="alert">
              {joinError}
            </p>
          ) : null}
          <p className="join-panel__footnote">
            Reconnection is temporary and private to this browser. No account is
            created.
          </p>
        </section>
      ) : (
        <div className="controller-session">
          <section className="player-identity" data-accent={session.player.accent}>
            <span className="player-identity__number">
              P{session.player.number}
            </span>
            <div>
              <strong>{session.player.displayName}</strong>
              <span>Room {session.roomCode}</span>
            </div>
          </section>

          <section className="controls" aria-label="Game controls">
            <ControlButton
              presentation={PRIMARY_BUTTON}
              tracker={tracker}
              active={activeButtons.has("primary")}
              disabled={controlsDisabled}
              primary
            />
            <div className="secondary-grid">
              {SECONDARY_BUTTONS.map((presentation) => (
                <ControlButton
                  key={presentation.button}
                  presentation={presentation}
                  tracker={tracker}
                  active={activeButtons.has(presentation.button)}
                  disabled={controlsDisabled}
                />
              ))}
            </div>
            <p className="controller-hint">Keep your eyes on the shared screen.</p>
          </section>
        </div>
      )}

      <footer>
        <span>Input server</span>
        <strong>{serverUrl}</strong>
      </footer>
    </main>
  );
};
