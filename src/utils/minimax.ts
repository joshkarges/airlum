import _ from "lodash";
import { Game } from "../models/Splendor";

export const genMinimaxAB = <G extends Game, A>(
  forSomePossibleActions: (
    node: G,
    callback: (action: A) => boolean | undefined
  ) => void,
  takeAction: (node: G, action: A) => G,
  nodeValue: (node: G) => number,
  isTerminal: (node: G) => boolean,
  depth: number
) => {
  const minimaxAB = (
    node: G,
    bestAction: A | null = null,
    currDepth = depth,
    alpha = -Infinity,
    beta = Infinity,
    isMaximizingPlayer = true
  ): [number, A | null] => {
    // Minimize other players value while maximizing your own value.
    if (currDepth === 0 || isTerminal(node)) {
      const originalTurn = node.turn;
      const currValue = nodeValue({
        ...node,
        turn:
          (originalTurn - (depth - currDepth) + 1 + node.players.length) %
          node.players.length,
      });
      return [currValue, bestAction];
    }

    const bestActions = [] as A[];
    let value = isMaximizingPlayer ? -Infinity : Infinity;
    if (isMaximizingPlayer) {
      forSomePossibleActions(node, (action) => {
        const [newValue] = minimaxAB(
          takeAction(node, action),
          action,
          currDepth - 1,
          alpha,
          beta,
          false
        );
        // console.log(newValue, action);
        if (newValue >= value) {
          if (newValue === value) {
            bestActions.push(action);
          } else  {
            bestActions.length = 0; // Reset best actions if we found a better one
            bestActions.push(action);
          }
          value = newValue;
        }
        if (value >= beta) return true;
        alpha = Math.max(alpha, value);
        return false;
      });
    } else {
      forSomePossibleActions(node, (action) => {
        const [newValue] = minimaxAB(
          takeAction(node, action),
          action,
          currDepth - 1,
          alpha,
          beta,
          true
        );
        if (newValue <= value) {
          if (newValue === value) {
            bestActions.push(action);
          } else {
            bestActions.length = 0; // Reset best actions if we found a better one
            bestActions.push(action);
          }
          value = newValue;
        }
        if (value <= alpha) return true;
        beta = Math.min(beta, value);
        return false;
      });
    }
    return [value, _.sample(bestActions) || bestAction];
  };
  return (game: G, endDepth = depth) => minimaxAB(game, null, endDepth)[1];
};

export const genMaxN = <G, A>(
  forEachPossibleAction: (node: G, callback: (action: A) => void) => void,
  takeAction: (node: G, action: A) => G,
  nodeValue: (node: G) => number[],
  getPlayerIndex: (node: G) => number,
  isTerminal: (node: G) => boolean,
  depth: number
) => {
  // Generate the best move given that the other players will also try to make their best move.
  const maxn = (
    node: G,
    bestAction: A | null = null,
    currDepth = depth
  ): [number[], A | null] => {
    if (currDepth === 0 || isTerminal(node)) {
      return [nodeValue(node), bestAction];
    }
    const playerIndex = getPlayerIndex(node);
    let maxValue = [] as number[];
    const bestActions = [] as A[];
    
    forEachPossibleAction(node, (action) => {
      const [playerValues] = maxn(
        takeAction(node, action),
        action,
        currDepth - 1
      );
      if (
        !maxValue.length ||
        playerValues[playerIndex] >= maxValue[playerIndex]
      ) {
        maxValue = playerValues;
        if (playerValues[playerIndex] === maxValue[playerIndex]) {
          bestActions.push(action);
        } else {
          bestActions.length = 0; // Reset best actions if we found a better one
          bestActions.push(action);
        }
      }

    });
    return [maxValue, _.sample(bestActions) || bestAction];
  };
  return (game: G, endDepth = depth) => maxn(game, null, endDepth)[1];
};

export const genProbablyBestMove = <G, A>(
  forEachPossibleAction: (node: G, callback: (action: A) => void) => void,
  takeAction: (node: G, action: A) => G,
  getPlayerValues: (node: G) => number[],
  getPlayerIndex: (node: G) => number,
  isTerminal: (node: G) => boolean,
  depth: number
) => {
  // Generate the best move where the next game state has the best possible value for all the other players' moves.
  const probablyBestMove = (
    node: G,
    bestAction: A | null = null,
    playerIndex: number = 0,
    currDepth = depth
  ): [number, A | null] => {
    if (currDepth === 0 || isTerminal(node)) {
      return [getPlayerValues(node)[playerIndex], bestAction];
    }
    const currentPlayerIndex = getPlayerIndex(node);
    const values = [] as number[];
    const opponentValues = [] as number[];
    let maxValue = -Infinity;
    forEachPossibleAction(node, (action) => {
      const nextNode = takeAction(node, action);
      const nodeValues = getPlayerValues(nextNode);
      const [value] = probablyBestMove(
        nextNode,
        action,
        playerIndex,
        currDepth - 1
      );
      if (value > maxValue) {
        maxValue = value;
        bestAction = action;
      }
      values.push(value);
      opponentValues.push(nodeValues[currentPlayerIndex]);
    });
    const opponentSum = opponentValues.reduce((sum, x) => sum + x, 0);
    return [
      values.reduce(
        (agg, x, i) => agg + (opponentValues[i] * x) / opponentSum,
        0
      ),
      bestAction,
    ];
  };
  return (game: G, endDepth = depth) => {
    const playerIndex = getPlayerIndex(game);
    return probablyBestMove(game, null, playerIndex, endDepth)[1];
  };
};
