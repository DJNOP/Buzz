import type { ControllerButton } from "@party-game/shared";

export const BUTTON_PRESENTATION: Record<
  ControllerButton,
  { label: string; symbol: string; tone: "action" | "red" | "blue" | "yellow" | "green" }
> = {
  primary: { label: "Action", symbol: "A", tone: "action" },
  secondary1: { label: "Red", symbol: "1", tone: "red" },
  secondary2: { label: "Blue", symbol: "2", tone: "blue" },
  secondary3: { label: "Yellow", symbol: "3", tone: "yellow" },
  secondary4: { label: "Green", symbol: "4", tone: "green" },
};
