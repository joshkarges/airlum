import _ from "lodash";

export const genMinimaxAB = <G, A>(
  getPossibleActions: (node: G) => A[],
  takeAction: (node: G, action: A) => G,
  nodeValue: (node: G) => number,
  isTerminal: (node: G) => boolean,
  depth: number) => {
  const minimaxAB = (node: G, bestAction: A | null = null, currDepth = depth, alpha = -Infinity, beta = Infinity, isMaximizingPlayer = true): [number, A | null] => {
    if (currDepth === 0 || isTerminal(node)) {
      return [nodeValue(node), bestAction];
    }

    const possibleActions = getPossibleActions(node);
    if (isMaximizingPlayer) {
      let value = -Infinity;
      possibleActions.some((action, i) => {
        const [newValue] = minimaxAB(takeAction(_.cloneDeep(node), action), possibleActions[i], currDepth - 1, alpha, beta, false)
        if (newValue > value) {
          value = newValue;
          bestAction = possibleActions[i];
        }
        if (value >= beta) return true;
        alpha = Math.max(alpha, value);
        return false;
      });
      return [value, bestAction];
    } else {
      let value = Infinity;
      possibleActions.some((action, i) => {
        const [newValue] = minimaxAB(takeAction(_.cloneDeep(node), action), possibleActions[i], currDepth - 1, alpha, beta, true)
        if (newValue < value) {
          value = newValue;
          bestAction = possibleActions[i];
        }
        if (value <= alpha) return true;
        beta = Math.min(beta, value);
        return false;
      });
      return [value, bestAction];
    }

  };
  return (game: G) => minimaxAB(game)[1];
};