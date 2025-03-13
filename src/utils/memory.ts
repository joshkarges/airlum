import { EMPTY_COINS } from "../constants/utils";
import { Action, Card, CoinSet } from "../models/Splendor";

const makePool = <T extends object, P extends Array<any> = any[]>(
  createNew: (...args: P) => T,
  cleanNew: (x: T, ...args: P) => T = (x, ...args) => x
) => {
  const pool = [] as T[];
  const numUsedAtDepth = [] as number[];
  return {
    start() {
      numUsedAtDepth.push(pool.length);
    },

    get(...args: P) {
      const currIndex = numUsedAtDepth[numUsedAtDepth.length - 1];
      if (currIndex > pool.length) {
        console.error(`Pool error: get ${currIndex} / ${pool.length}`);
        return createNew(...args);
      }
      if (currIndex === pool.length) {
        pool.push(createNew(...args));
      }
      numUsedAtDepth[numUsedAtDepth.length - 1]++;
      return cleanNew(pool[currIndex], ...args);
    },

    freeOne() {
      if (numUsedAtDepth[numUsedAtDepth.length - 1] === 0) {
        console.error("Pool error: freeOne");
        return;
      }
      numUsedAtDepth[numUsedAtDepth.length - 1]--;
    },

    end() {
      numUsedAtDepth.pop();
    },
  };
};

export const arrPool = makePool(
  () => [] as any[],
  (x) => {
    x.length = 0;
    return x;
  }
);

export const actionPool = makePool(
  (type: Action["type"] = "takeCoins") =>
    ({ type, coinCost: { ...EMPTY_COINS }, card: null } as Action),
  (action: Action, type: Action["type"] = "takeCoins") => {
    action.type = type;
    action.coinCost.black = 0;
    action.coinCost.blue = 0;
    action.coinCost.green = 0;
    action.coinCost.red = 0;
    action.coinCost.white = 0;
    action.coinCost.yellow = 0;
    action.card = null;
    return action;
  }
);
