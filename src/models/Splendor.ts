export enum Color {
  White = "white",
  Blue = "blue",
  Green = "green",
  Red = "red",
  Black = "black",
  Yellow = "yellow",
}

export type CoinSet = Record<Color, number>;

export type Card = {
  id: number;
  color: Color;
  cost: CoinSet;
  points: number;
  tier: "tier1" | "tier2" | "tier3";
};

export type Noble = {
  id: number;
  points: number;
  cards: Record<Color, number>;
};

export type Player = {
  id: number;
  coins: CoinSet;
  bought: Card[];
  reserved: Card[];
  nobles: Noble[];
  points: number;
  isHuman: boolean;
};

export type Game = {
  players: Player[];
  deck: {
    tier1: Card[];
    tier2: Card[];
    tier3: Card[];
  };
  table: Card[];
  nobles: Noble[];
  coins: Record<Color, number>;
  turn: number; // Player id
};

export type Action =
  | {
      type: "buy" | "reserve" | "buyReserve";
      coinCost: CoinSet;
      card: Card;
    }
  | { type: "takeCoins"; coinCost: CoinSet; card: null };
