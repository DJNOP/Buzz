import type { ButtonPhase, ControllerButton } from "@party-game/shared";

export interface LogicalButtonEvent {
  button: ControllerButton;
  phase: ButtonPhase;
}

export interface InputTracker {
  pointerDown: (pointerId: number, button: ControllerButton) => void;
  pointerUp: (pointerId: number) => void;
  pointerCancel: (pointerId: number) => void;
  keyDown: (button: ControllerButton) => void;
  keyUp: (button: ControllerButton) => void;
  activateClick: (button: ControllerButton, clickDetail: number) => void;
  releaseAll: () => void;
  getActiveButtons: () => ReadonlySet<ControllerButton>;
}

export const createInputTracker = (
  send: (event: LogicalButtonEvent) => void,
  onActiveButtonsChanged: (buttons: ReadonlySet<ControllerButton>) => void =
    () => undefined,
): InputTracker => {
  const pointerButtons = new Map<number, ControllerButton>();
  const keyboardButtons = new Set<ControllerButton>();
  const suppressKeyboardClicks = new Set<ControllerButton>();

  const activeButtons = () =>
    new Set<ControllerButton>([
      ...pointerButtons.values(),
      ...keyboardButtons.values(),
    ]);

  const notify = () => onActiveButtonsChanged(activeButtons());
  const isActive = (button: ControllerButton) => activeButtons().has(button);

  const releasePointer = (pointerId: number) => {
    const button = pointerButtons.get(pointerId);
    if (!button) {
      return;
    }
    pointerButtons.delete(pointerId);
    send({ button, phase: "up" });
    notify();
  };

  return {
    pointerDown(pointerId, button) {
      if (pointerButtons.has(pointerId) || isActive(button)) {
        return;
      }
      pointerButtons.set(pointerId, button);
      send({ button, phase: "down" });
      notify();
    },

    pointerUp: releasePointer,
    pointerCancel: releasePointer,

    keyDown(button) {
      if (isActive(button)) {
        return;
      }
      keyboardButtons.add(button);
      suppressKeyboardClicks.add(button);
      send({ button, phase: "down" });
      notify();
    },

    keyUp(button) {
      if (!keyboardButtons.delete(button)) {
        return;
      }
      send({ button, phase: "up" });
      notify();
    },

    activateClick(button, clickDetail) {
      if (clickDetail !== 0) {
        return;
      }
      if (suppressKeyboardClicks.delete(button)) {
        return;
      }
      if (isActive(button)) {
        return;
      }
      send({ button, phase: "down" });
      send({ button, phase: "up" });
      notify();
    },

    releaseAll() {
      const buttons = activeButtons();
      pointerButtons.clear();
      keyboardButtons.clear();
      suppressKeyboardClicks.clear();
      for (const button of buttons) {
        send({ button, phase: "up" });
      }
      notify();
    },

    getActiveButtons: activeButtons,
  };
};
