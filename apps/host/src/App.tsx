import { useEffect, useState } from "react";
import {
  HOST_PRIMARY_BUTTON_EVENT,
  type HostPrimaryButtonEvent,
} from "@party-game/shared";
import { hostSocket, serverUrl } from "./socket";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface LastPress extends HostPrimaryButtonEvent {
  browserReceivedAt: number;
}

const formatTime = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  }).format(timestamp);

export const App = () => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [connectionMessage, setConnectionMessage] = useState("Connecting…");
  const [pressCount, setPressCount] = useState(0);
  const [lastPress, setLastPress] = useState<LastPress>();

  useEffect(() => {
    const onConnect = () => {
      setConnectionState("connected");
      setConnectionMessage("Connected to input server");
    };
    const onDisconnect = () => {
      setConnectionState("disconnected");
      setConnectionMessage("Disconnected — reconnecting…");
    };
    const onConnectError = (error: Error) => {
      setConnectionState("error");
      setConnectionMessage(`Connection failed: ${error.message}`);
    };
    const onPrimaryButton = (event: HostPrimaryButtonEvent) => {
      setPressCount((count) => count + 1);
      setLastPress({ ...event, browserReceivedAt: Date.now() });
    };

    hostSocket.on("connect", onConnect);
    hostSocket.on("disconnect", onDisconnect);
    hostSocket.on("connect_error", onConnectError);
    hostSocket.on(HOST_PRIMARY_BUTTON_EVENT, onPrimaryButton);
    hostSocket.connect();

    return () => {
      hostSocket.off("connect", onConnect);
      hostSocket.off("disconnect", onDisconnect);
      hostSocket.off("connect_error", onConnectError);
      hostSocket.off(HOST_PRIMARY_BUTTON_EVENT, onPrimaryButton);
      hostSocket.disconnect();
    };
  }, []);

  return (
    <main className="host-screen">
      <header className="host-header">
        <div>
          <p className="eyebrow">Input loop prototype</p>
          <h1>Host display</h1>
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

      <section className="visualizer" aria-live="polite">
        <div
          key={pressCount}
          className={`signal-shape ${lastPress ? "signal-shape--active" : ""}`}
          aria-hidden="true"
        />
        <p className="visualizer__label">
          {lastPress ? "Primary input received" : "Waiting for controller input"}
        </p>
        <p className="press-count">{pressCount}</p>
        <p className="press-count__caption">
          {pressCount === 1 ? "valid press" : "valid presses"}
        </p>
      </section>

      <footer className="diagnostics">
        <div>
          <span>Server</span>
          <strong>{serverUrl}</strong>
        </div>
        <div>
          <span>Last server receipt</span>
          <strong>
            {lastPress ? formatTime(lastPress.serverReceivedAt) : "—"}
          </strong>
        </div>
        <div>
          <span>Last browser receipt</span>
          <strong>
            {lastPress ? formatTime(lastPress.browserReceivedAt) : "—"}
          </strong>
        </div>
      </footer>
    </main>
  );
};
