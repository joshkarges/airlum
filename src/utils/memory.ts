import { EMPTY_COINS } from "../constants/utils";
import { Action, Card, CoinSet } from "../models/Splendor";

const makePool = <T extends object, P extends Array<any> = any[]>(createNew: (...args: P) => T, cleanNew: (x: T) => T = (x) => x) => {
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
      return cleanNew(pool[currIndex]);
    },

    end() {
      numUsedAtDepth.pop();
    },

  };
};

export const arrPool = makePool(() => [] as any[], (x) => {
  x.length = 0;
  return x;
});

// Keep the object entries for now.  It's the user's responsibility to clear fields or iterate responsibly.
export const objPool = makePool(() => ({}));

export const actionPool = makePool((type: Action['type'] = 'takeCoins', coinCost: CoinSet = { ...EMPTY_COINS }, card: Card | null = null) => ({ type, coinCost, card } as Action));

export const coinSetPool = makePool(() => ({ ...EMPTY_COINS } as CoinSet));
