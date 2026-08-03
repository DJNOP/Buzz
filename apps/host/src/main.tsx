import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import {
  getLightingQaScenario,
  LightingQaFullHdCaptureFrame,
  LightingQaHarness,
  shouldUseLightingQaFullHdCaptureFrame,
} from "./LightingQaHarness";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Host root element was not found.");
}

const lightingQaScenario = import.meta.env.DEV
  ? getLightingQaScenario(window.location.search, true)
  : undefined;
const lightingQaFullHdCapture =
  import.meta.env.DEV &&
  shouldUseLightingQaFullHdCaptureFrame(window.location.search, true);

createRoot(root).render(
  <StrictMode>
    {lightingQaScenario ? (
      lightingQaFullHdCapture ? (
        <LightingQaFullHdCaptureFrame scenario={lightingQaScenario} />
      ) : (
        <LightingQaHarness scenario={lightingQaScenario} />
      )
    ) : (
      <App />
    )}
  </StrictMode>,
);
