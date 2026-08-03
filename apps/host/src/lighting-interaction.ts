import type { RobotPresentationState } from "./robot-presentation";

export type LightingInteractionPhase =
  | "workIdle"
  | "acknowledgement"
  | "contact"
  | "wrongReaction"
  | "stunnedHold"
  | "recovery"
  | "complete";

export type LightingFeedbackTone =
  | "neutral"
  | "acknowledged"
  | "positive"
  | "warning"
  | "locked";

export interface LightingInteractionPresentation {
  phase: LightingInteractionPhase;
  feedbackTone: LightingFeedbackTone;
  statusLabel: string;
  controlsLocked: boolean;
}

export const getLightingInteractionPresentation = (
  state: RobotPresentationState,
): LightingInteractionPresentation => {
  switch (state) {
    case "inputAcknowledgement":
      return {
        phase: "acknowledgement",
        feedbackTone: "acknowledged",
        statusLabel: "Signal received",
        controlsLocked: false,
      };
    case "correct":
      return {
        phase: "contact",
        feedbackTone: "positive",
        statusLabel: "Lighting cue confirmed",
        controlsLocked: false,
      };
    case "wrong":
      return {
        phase: "wrongReaction",
        feedbackTone: "warning",
        statusLabel: "Wrong control",
        controlsLocked: false,
      };
    case "stunned":
      return {
        phase: "stunnedHold",
        feedbackTone: "locked",
        statusLabel: "Lighting controls locked",
        controlsLocked: true,
      };
    case "winning":
      return {
        phase: "complete",
        feedbackTone: "positive",
        statusLabel: "Lighting complete",
        controlsLocked: false,
      };
    case "losing":
      return {
        phase: "recovery",
        feedbackTone: "neutral",
        statusLabel: "Lighting station standing by",
        controlsLocked: false,
      };
    case "idle":
    case "working":
      return {
        phase: "workIdle",
        feedbackTone: "neutral",
        statusLabel: state === "working" ? "Lighting ready" : "Standing by",
        controlsLocked: false,
      };
  }
};
