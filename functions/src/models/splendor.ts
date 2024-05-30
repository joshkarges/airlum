export type PlayerRecord = {
  isHuman: boolean;
  points: number;
  cards: number[];
  nobles: number[];
  takeCoinsActions: number;
  reserveActions: number;
};

export type GameRecord = {
  startTime: number;
  endTime: number;
  players: PlayerRecord[];
  startCards: number[];
  startNobles: number[];
};

export type WriteGameRequest = GameRecord;
export type WriteGameResponse = string;
