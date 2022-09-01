import { Noble } from "../models/Splendor";
import { getCost } from "./utils";

export const ALL_NOBLES: Noble[] = [
  {
    id: 0,
    points: 3,
    cards: getCost(0, 3, 3, 3, 0),
  },
  {
    id: 1,
    points: 3,
    cards: getCost(3, 3, 0, 0, 3),
  },
  {
    id: 2,
    points: 3,
    cards: getCost(4, 0, 0, 0, 4),
  },
  {
    id: 3,
    points: 3,
    cards: getCost(4, 4, 0, 0, 0),
  },
  {
    id: 4,
    points: 3,
    cards: getCost(0, 4, 4, 0, 0),
  },
  {
    id: 5,
    points: 3,
    cards: getCost(3, 3, 3, 0, 0),
  },
  {
    id: 6,
    points: 3,
    cards: getCost(3, 0, 0, 3, 3),
  },
  {
    id: 7,
    points: 3,
    cards: getCost(0, 0, 3, 3, 3),
  },
  {
    id: 8,
    points: 3,
    cards: getCost(0, 0, 0, 4, 4),
  },
  {
    id: 9,
    points: 3,
    cards: getCost(0, 0, 4, 4, 0),
  },
];