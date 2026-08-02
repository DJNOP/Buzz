import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { PRIMARY_BUTTON_EVENT } from "@party-game/shared";
import { shouldEmitFromClick } from "./input";
import { controllerSocket, serverUrl } from "./socket";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

export const App = () => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [connectionMessage, setConnectionMessage] = useState("Connecting…");
  const [isPressed, setIsPressed] = useState(false);
  const activePointerId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onConnect = () => {
      setConnectionState("connected");
      setConnectionMessage("Connected — ready");
    };
    const onDisconnect = () => {
      setConnectionState("disconnected");
      setConnectionMessage("Disconnected — reconnecting…");
      setIsPressed(false);
      activePointerId.current = undefined;
    };
    const onConnectError = (error: Error) => {
      setConnectionState("error");
      setConnectionMessage(`Connection failed: ${error.message}`);
    };

    controllerSocket.on("connect", onConnect);
    controllerSocket.on("disconnect", onDisconnect);
    controllerSocket.on("connect_error", onConnectError);
    controllerSocket.connect();

    return () => {
      controllerSocket.off("connect", onConnect);
      controllerSocket.off("disconnect", onDisconnect);
      controllerSocket.off("connect_error", onConnectError);
      controllerSocket.disconnect();
    };
  }, []);

  const sendPrimaryButton = useCallback(() => {
    if (!controllerSocket.connected) {
      return;
    }

    controllerSocket.emit(PRIMARY_BUTTON_EVENT, { pressedAt: Date.now() });

    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(18);
    }
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerId.current !== undefined) {
      return;
    }

    event.preventDefault();
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPressed(true);
    sendPrimaryButton();
  };

  const releasePointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    activePointerId.current = undefined;
    setIsPressed(false);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (shouldEmitFromClick(event.detail)) {
      sendPrimaryButton();
    }
  };

  const isConnected = connectionState === "connected";

  return (
    <main className="controller-screen">
      <header>
        <p className="eyebrow">Controller prototype</p>
        <div
          className={`connection connection--${connectionState}`}
          role="status"
          aria-live="polite"
        >
          <span className="connection__dot" aria-hidden="true" />
          {connectionMessage}
        </div>
      </header>

      <section className="control-area">
        <button
          className={`primary-button ${isPressed ? "primary-button--pressed" : ""}`}
          type="button"
          disabled={!isConnected}
          aria-label="Send primary action"
          onPointerDown={handlePointerDown}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onLostPointerCapture={() => {
            activePointerId.current = undefined;
            setIsPressed(false);
          }}
          onClick={handleClick}
          onKeyDown={(event) => {
            if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
              setIsPressed(true);
            }
          }}
          onKeyUp={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setIsPressed(false);
            }
          }}
          onBlur={() => setIsPressed(false)}
        >
          <span>Press</span>
        </button>
        <p className="instruction">
          {isConnected
            ? "Tap once and watch the shared screen."
            : "The button becomes available when connected."}
        </p>
      </section>

      <footer>
        <span>Input server</span>
        <strong>{serverUrl}</strong>
      </footer>
    </main>
  );
};
