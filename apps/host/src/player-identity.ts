export type PlayerIdentityColour = "red" | "blue" | "yellow" | "green";
export type PlayerIdentityShape = "circle" | "square" | "triangle" | "diamond";

export interface PlayerIdentity {
  number: 1 | 2 | 3 | 4;
  colour: PlayerIdentityColour;
  colourLabel: "Red" | "Blue" | "Yellow" | "Green";
  shape: PlayerIdentityShape;
  shapeLabel: "Circle" | "Square" | "Triangle" | "Diamond";
}

export const PLAYER_IDENTITIES: readonly PlayerIdentity[] = [
  {
    number: 1,
    colour: "red",
    colourLabel: "Red",
    shape: "circle",
    shapeLabel: "Circle",
  },
  {
    number: 2,
    colour: "blue",
    colourLabel: "Blue",
    shape: "square",
    shapeLabel: "Square",
  },
  {
    number: 3,
    colour: "yellow",
    colourLabel: "Yellow",
    shape: "triangle",
    shapeLabel: "Triangle",
  },
  {
    number: 4,
    colour: "green",
    colourLabel: "Green",
    shape: "diamond",
    shapeLabel: "Diamond",
  },
] as const;

export const getPlayerIdentity = (playerNumber: number): PlayerIdentity => {
  const identity = PLAYER_IDENTITIES[playerNumber - 1];
  if (!identity || identity.number !== playerNumber) {
    throw new RangeError(`Unsupported player number: ${playerNumber}`);
  }
  return identity;
};
