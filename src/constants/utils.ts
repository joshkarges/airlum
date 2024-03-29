import { Color } from "../models/Splendor";

export const getCost = (white: number, blue: number, green: number, red: number, black: number, yellow: number = 0): Record<Color, number> => ({
  white,
  blue,
  green,
  red,
  black,
  yellow,
});

export const EMPTY_COINS = getCost(0, 0, 0, 0, 0, 0);
