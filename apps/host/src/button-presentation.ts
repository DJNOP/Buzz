import type { ControllerButton } from "@party-game/shared";

export const BUTTON_PRESENTATION: Record<
  ControllerButton,
  { label: string; symbol: string }
> = {
  primary: { label: "Primary", symbol: "A" },
  secondary1: { label: "Secondary 1", symbol: "1" },
  secondary2: { label: "Secondary 2", symbol: "2" },
  secondary3: { label: "Secondary 3", symbol: "3" },
  secondary4: { label: "Secondary 4", symbol: "4" },
};
