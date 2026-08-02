import type { ControllerButton } from "@party-game/shared";

export interface ButtonPresentation {
  button: ControllerButton;
  label: string;
  symbol: string;
}

export const PRIMARY_BUTTON: ButtonPresentation = {
  button: "primary",
  label: "Action",
  symbol: "A",
};

export const SECONDARY_BUTTONS: ButtonPresentation[] = [
  { button: "secondary1", label: "One", symbol: "1" },
  { button: "secondary2", label: "Two", symbol: "2" },
  { button: "secondary3", label: "Three", symbol: "3" },
  { button: "secondary4", label: "Four", symbol: "4" },
];
