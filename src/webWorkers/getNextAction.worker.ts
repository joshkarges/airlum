/* eslint-disable no-restricted-globals */
import { Game } from "../models/Splendor";
import { getPlayerIndex, getStrategy, Strategy } from "../utils/splendor";

self.onmessage = (ev: MessageEvent<{ game: Game; depth: number }>) => {
  const opportunisticPlayer = getPlayerIndex(ev.data.game) === 2;
  const getNextAction = opportunisticPlayer
    ? getStrategy(Strategy.Opportunistic)
    : getStrategy(Strategy.AlphaBeta);
  self.postMessage({
    action: getNextAction(ev.data.game, ev.data.depth),
    depth: opportunisticPlayer ? 2 : ev.data.depth,
  });
};

export {};
