/* eslint-disable no-restricted-globals */
import { getPlayerIndex, getStrategy, Strategy } from "../utils/splendor";
import {
  GetNextActionRequest,
  GetNextActionResponse,
  MAX_AI_DEPTH,
} from "./getNextAction.types";

self.onmessage = (ev: MessageEvent<GetNextActionRequest>) => {
  const { game, depth, requestId } = ev.data;
  const opportunisticPlayer = getPlayerIndex(game) === 2;
  const getNextAction = opportunisticPlayer
    ? getStrategy(Strategy.Opportunistic)
    : getStrategy(Strategy.AlphaBeta);
  // Opportunistic play doesn't search, so its first answer is its final one.
  const answeredDepth = opportunisticPlayer ? MAX_AI_DEPTH : depth;
  const respond = (response: GetNextActionResponse) => self.postMessage(response);

  try {
    respond({
      requestId,
      depth: answeredDepth,
      action: getNextAction(game, depth) ?? null,
    });
  } catch (e) {
    // The UI waits for a reply to every request, so a thrown search must still answer.
    respond({
      requestId,
      depth: answeredDepth,
      action: null,
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
