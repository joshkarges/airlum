/* eslint-disable no-restricted-globals */
import { Game } from "../models/Splendor";
import { getStrategy, Strategy } from "../utils/splendor";

const getNextAction = getStrategy(Strategy.AlphaBeta);

self.onmessage = (ev: MessageEvent<{ game: Game; depth: number }>) => {
  self.postMessage({
    action: getNextAction(ev.data.game, ev.data.depth),
    depth: ev.data.depth,
  });
};

export {};
