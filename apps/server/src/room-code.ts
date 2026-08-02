import { randomInt } from "node:crypto";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@party-game/shared";

export const generateRoomCode = () =>
  Array.from({ length: ROOM_CODE_LENGTH }, () =>
    ROOM_CODE_ALPHABET.at(randomInt(ROOM_CODE_ALPHABET.length)),
  ).join("");
