import { Action, Game } from "../models/Splendor";

/** How deep the iterative deepening search goes before the AI commits to a move. */
export const MAX_AI_DEPTH = 2;

export type GetNextActionRequest = {
  game: Game;
  depth: number;
  /** Echoed back so the UI can discard replies from superseded requests. */
  requestId: number;
};

export type GetNextActionResponse = {
  requestId: number;
  depth: number;
  action: Action | null;
  error?: string;
};
