import assert from "assert";
import { Action, Color, Game, Player } from "../models/Splendor";
import { actionPool, arrPool } from "../utils/memory";
import {
  Strategy,
  canAffordCard,
  generateThreeCoinPermutations,
  getBuyActions,
  getPossibleActions,
  getReserveActions,
  getStrategy,
  setupGame,
  takeAction,
} from "../utils/splendor";
import { ALL_CARDS } from "../constants/allCards";

const COIN_SET = {
  [Color.Black]: 4,
  [Color.Red]: 4,
  [Color.Green]: 4,
  [Color.Blue]: 4,
  [Color.White]: 4,
  [Color.Yellow]: 5,
};

const EMPTY_COIN_SET = {
  [Color.Black]: 0,
  [Color.Red]: 0,
  [Color.Green]: 0,
  [Color.Blue]: 0,
  [Color.White]: 0,
  [Color.Yellow]: 0,
};

arrPool.start();
const output = [] as Color[][];
generateThreeCoinPermutations(COIN_SET, output);
arrPool.end();
assert.strictEqual(
  output.length,
  10,
  "There should be 10 permutations of 3 coins from 5 colors: 5! / (3! * (5 - 3)!"
);

arrPool.start();
output.length = 0;
generateThreeCoinPermutations(
  {
    ...COIN_SET,
    [Color.Black]: 0,
  },
  output
);
arrPool.end();
assert.strictEqual(
  output.length,
  4,
  "There should be 4 permutations of 3 coins from 4 colors: 4! / (3! * (4 - 3)!"
);

const BLANK_PLAYER: Player = {
  id: 0,
  coins: { ...EMPTY_COIN_SET },
  bought: [],
  reserved: [],
  nobles: [],
  points: 0,
  isHuman: true,
};

assert(
  canAffordCard(
    {
      ...BLANK_PLAYER,
      coins: {
        ...EMPTY_COIN_SET,
        [Color.Black]: 1,
        [Color.Red]: 1,
        [Color.Green]: 1,
        [Color.Blue]: 1,
      },
    },
    ALL_CARDS[0]
  ),
  "Player should be able to afford the card."
);

assert(
  canAffordCard(
    {
      ...BLANK_PLAYER,
      coins: {
        ...EMPTY_COIN_SET,
        [Color.Black]: 1,
        [Color.Red]: 1,
        [Color.Green]: 1,
        [Color.Blue]: 1,
      },
      bought: [ALL_CARDS[1]],
    },
    ALL_CARDS[0]
  ),
  "Player should be able to afford the card with their white card."
);

assert(
  ALL_CARDS.every((card) => {
    const result = canAffordCard(
      {
        ...BLANK_PLAYER,
        coins: {
          ...EMPTY_COIN_SET,
          [Color.Black]: 7,
          [Color.Red]: 7,
          [Color.Green]: 7,
          [Color.Blue]: 7,
          [Color.White]: 7,
        },
      },
      card
    );
    if (!result) {
      console.log(card);
      console.log(BLANK_PLAYER);
    }
    return result;
  }),
  "Player should be able to afford all cards."
);

const BLANK_GAME: Game = {
  players: [],
  deck: {
    tier1: [],
    tier2: [],
    tier3: [],
  },
  table: [],
  nobles: [],
  coins: { ...COIN_SET },
  turn: 0,
};

actionPool.start();
const actionOutput = [] as Action[];
getBuyActions(
  { ...BLANK_GAME, table: [ALL_CARDS[10]] },
  {
    ...BLANK_PLAYER,
    coins: {
      ...EMPTY_COIN_SET,
      [Color.White]: 2,
      [Color.Blue]: 2,
      [Color.Red]: 1,
    },
  },
  actionOutput
);

assert.strictEqual(actionOutput.length, 1);
assert.strictEqual(actionOutput[0].type, "buy");
assert.strictEqual(actionOutput[0].card?.id, 10);
actionPool.end();

actionPool.start();
actionOutput.length = 0;
getBuyActions(
  { ...BLANK_GAME },
  {
    ...BLANK_PLAYER,
    coins: {
      ...EMPTY_COIN_SET,
      [Color.White]: 2,
      [Color.Blue]: 2,
      [Color.Red]: 1,
    },
    reserved: [ALL_CARDS[10]],
  },
  actionOutput
);
assert.strictEqual(actionOutput.length, 1);
assert.strictEqual(actionOutput[0].type, "buyReserve");
assert.strictEqual(actionOutput[0].card?.id, 10);
actionPool.end();

actionPool.start();
actionOutput.length = 0;
getReserveActions(
  { ...BLANK_GAME, table: [ALL_CARDS[10]] },
  {
    ...BLANK_PLAYER,
    coins: {
      ...EMPTY_COIN_SET,
      [Color.White]: 2,
      [Color.Blue]: 2,
      [Color.Red]: 1,
    },
  },
  actionOutput
);

assert.strictEqual(actionOutput.length, 1);
assert.strictEqual(actionOutput[0].type, "reserve");
assert.strictEqual(actionOutput[0].card?.id, 10);
actionPool.end();

actionPool.start();
actionOutput.length = 0;
getPossibleActions(
  {
    ...BLANK_GAME,
    coins: {
      ...COIN_SET,
    },
    table: [ALL_CARDS[0], ALL_CARDS[1]],
    players: [
      {
        ...BLANK_PLAYER,
        coins: {
          ...EMPTY_COIN_SET,
          [Color.Black]: 1,
          [Color.Red]: 1,
          [Color.Green]: 1,
          [Color.Blue]: 1,
        },
      },
    ],
    turn: 0,
  },
  actionOutput
);
assert.strictEqual(actionOutput.length, 18);
assert.strictEqual(
  actionOutput.filter((t) => t.type === "takeCoins").length,
  15
);
assert.strictEqual(actionOutput.filter((t) => t.type === "buy").length, 1);
assert.strictEqual(actionOutput.filter((t) => t.type === "reserve").length, 2);
assert.strictEqual(
  actionOutput.filter((t) => t.type === "buyReserve").length,
  0
);
actionPool.end();

// const testGame = {
//   players: [
//     {
//       id: 0,
//       coins: {
//         white: 0,
//         blue: 1,
//         green: 1,
//         red: 0,
//         black: 1,
//         yellow: 1,
//       },
//       bought: [],
//       reserved: [
//         {
//           id: 10,
//           color: "black",
//           cost: {
//             white: 2,
//             blue: 2,
//             green: 0,
//             red: 1,
//             black: 0,
//             yellow: 0,
//           },
//           points: 0,
//           tier: "tier1",
//         },
//       ],
//       nobles: [],
//       points: 0,
//       isHuman: true,
//     },
//     {
//       id: 1,
//       coins: {
//         white: 2,
//         blue: 2,
//         green: 2,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//       bought: [],
//       reserved: [],
//       nobles: [],
//       points: 0,
//       isHuman: false,
//     },
//   ],
//   deck: {
//     tier1: [],
//     tier2: [],
//     tier3: [],
//   },
//   table: [
//     {
//       id: 1,
//       color: "white",
//       cost: {
//         white: 0,
//         blue: 1,
//         green: 2,
//         red: 1,
//         black: 1,
//         yellow: 0,
//       },
//       points: 0,
//       tier: "tier1",
//     },
//     {
//       id: 5,
//       color: "white",
//       cost: {
//         white: 0,
//         blue: 2,
//         green: 0,
//         red: 0,
//         black: 2,
//         yellow: 0,
//       },
//       points: 0,
//       tier: "tier1",
//     },
//     {
//       id: 13,
//       color: "black",
//       cost: {
//         white: 2,
//         blue: 0,
//         green: 2,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//       points: 0,
//       tier: "tier1",
//     },
//     {
//       id: 7,
//       color: "white",
//       cost: {
//         white: 0,
//         blue: 0,
//         green: 4,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//       points: 1,
//       tier: "tier1",
//     },
//     {
//       id: 57,
//       color: "white",
//       cost: {
//         white: 6,
//         blue: 0,
//         green: 0,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//       points: 3,
//       tier: "tier2",
//     },
//     {
//       id: 46,
//       color: "blue",
//       cost: {
//         white: 0,
//         blue: 2,
//         green: 2,
//         red: 3,
//         black: 0,
//         yellow: 0,
//       },
//       points: 1,
//       tier: "tier2",
//     },
//     {
//       id: 61,
//       color: "green",
//       cost: {
//         white: 0,
//         blue: 5,
//         green: 3,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//       points: 2,
//       tier: "tier2",
//     },
//     {
//       id: 65,
//       color: "red",
//       cost: {
//         white: 0,
//         blue: 3,
//         green: 0,
//         red: 2,
//         black: 3,
//         yellow: 0,
//       },
//       points: 1,
//       tier: "tier2",
//     },
//     {
//       id: 83,
//       color: "green",
//       cost: {
//         white: 0,
//         blue: 7,
//         green: 0,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//       points: 4,
//       tier: "tier3",
//     },
//     {
//       id: 80,
//       color: "white",
//       cost: {
//         white: 3,
//         blue: 0,
//         green: 0,
//         red: 3,
//         black: 6,
//         yellow: 0,
//       },
//       points: 4,
//       tier: "tier3",
//     },
//     {
//       id: 84,
//       color: "green",
//       cost: {
//         white: 3,
//         blue: 6,
//         green: 3,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//       points: 4,
//       tier: "tier3",
//     },
//     {
//       id: 81,
//       color: "white",
//       cost: {
//         white: 3,
//         blue: 0,
//         green: 0,
//         red: 0,
//         black: 7,
//         yellow: 0,
//       },
//       points: 5,
//       tier: "tier3",
//     },
//   ],
//   nobles: [
//     {
//       id: 9,
//       points: 3,
//       cards: {
//         white: 0,
//         blue: 0,
//         green: 4,
//         red: 4,
//         black: 0,
//         yellow: 0,
//       },
//     },
//     {
//       id: 4,
//       points: 3,
//       cards: {
//         white: 0,
//         blue: 4,
//         green: 4,
//         red: 0,
//         black: 0,
//         yellow: 0,
//       },
//     },
//     {
//       id: 1,
//       points: 3,
//       cards: {
//         white: 3,
//         blue: 3,
//         green: 0,
//         red: 0,
//         black: 3,
//         yellow: 0,
//       },
//     },
//   ],
//   coins: {
//     white: 4,
//     blue: 4,
//     green: 4,
//     red: 4,
//     black: 4,
//     yellow: 5,
//   },
//   turn: 0,
// } as Game;

const testGame = setupGame({ numberOfAi: 2, numberOfHumans: 0 });

const getNextAction = getStrategy(Strategy.Probablistic);

actionPool.start();
actionOutput.length = 0;
// getBuyActions(testGame, testGame.players[0], actionOutput);
let game = testGame;
for (let i = 0; i < 60; i++) {
  const action = getNextAction(game, 2);
  const newGame = action ? takeAction(game, action) : game;
  for (const color in newGame.coins) {
    assert.strictEqual(
      newGame.coins[color as Color] +
        newGame.players[0].coins[color as Color] +
        newGame.players[1].coins[color as Color],
      color === "yellow" ? 5 : 4
    );
  }
  game = newGame;
}
actionPool.end();

console.log("ALL TESTS PASSED");
