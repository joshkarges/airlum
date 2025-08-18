import _ from "lodash";
import { produce } from "immer";
import { DECK } from "../constants/allCards";
import { ALL_NOBLES } from "../constants/allNobles";
import { getCost, EMPTY_COINS } from "../constants/utils";
import { Action, Card, CoinSet, Color, Game, Player } from "../models/Splendor";
import { count } from "./collection";
import { actionPool, arrPool } from "./memory";
import { genMaxN, genMinimaxAB, genProbablyBestMove } from "./minimax";

export const getNumCoins = (coins: Record<Color, number>) =>
  _.reduce(Color, (sum, color) => sum + coins[color], 0);

/** Put this inside an arrPool */
const COLOR_KEYS = _.pull(_.values(Color), Color.Yellow);
export const generateThreeCoinPermutations = (
  coins: Record<Color, number>,
  output: Color[][] = [],
  numCoinsCanTake = 3
): Color[][] => {
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    const iColor = COLOR_KEYS[i];
    if (coins[iColor] === 0) continue;
    if (numCoinsCanTake === 1) {
      const newArr = arrPool.get();
      newArr.push(iColor);
      output.push(newArr);
      continue;
    }
    for (let j = i + 1; j < COLOR_KEYS.length; j++) {
      const jColor = COLOR_KEYS[j];
      if (coins[jColor] === 0) continue;
      if (numCoinsCanTake === 2) {
        const newArr = arrPool.get();
        newArr.push(iColor, jColor);
        output.push(newArr);
        continue;
      }
      for (let k = j + 1; k < COLOR_KEYS.length; k++) {
        const kColor = COLOR_KEYS[k];
        if (coins[kColor] === 0) continue;
        const newArr = arrPool.get();
        newArr.push(iColor, jColor, kColor);
        output.push(newArr);
      }
    }
  }
  return output;
};

const clearCoins = (coins: CoinSet) => {
  _.forEach(coins, (value, color) => {
    coins[color as Color] = 0;
  });
  return coins;
};

export const canAffordCard = (
  player: Player,
  card: Card,
  output: CoinSet = {} as CoinSet,
  withoutYellow = false
): CoinSet | null => {
  _.forEach(card.cost, (coinCost, color) => {
    output[color as Color] = Math.max(
      0,
      coinCost - count(player.bought, (card) => card.color === (color as Color))
    );
  });
  const canAfford = _.every(output, (coinsNeeded, color) => {
    if (player.coins[color as Color] >= coinsNeeded) return true;
    if (withoutYellow) return false;
    const yellowCoinsNeeded = coinsNeeded - player.coins[color as Color];
    const yellowCoinsAvailable =
      player.coins[Color.Yellow] - output[Color.Yellow];
    if (yellowCoinsAvailable >= yellowCoinsNeeded) {
      output[color as Color] = player.coins[color as Color];
      output[Color.Yellow] += yellowCoinsNeeded;
      return true;
    }
    return false;
  });
  return canAfford ? output : null;
};

const coinsNeededToAffordCard = (
  player: Player,
  card: Card,
  output: CoinSet = {} as CoinSet
): CoinSet | null => {
  let totalCoinsNeeded = 0;
  _.forEach(card.cost, (coinCost, color) => {
    const coinsNeededForColor = Math.max(
      0,
      coinCost -
        count(player.bought, (c) => c.color === (color as Color)) -
        player.coins[color as Color]
    );
    output[color as Color] = coinsNeededForColor;
    totalCoinsNeeded += coinsNeededForColor;
  });
  let numYellowCoins = player.coins[Color.Yellow];
  while (numYellowCoins && totalCoinsNeeded) {
    for (const color in output) {
      if (numYellowCoins <= 0) break;
      if (output[color as Color] > 0) {
        output[color as Color]--;
        numYellowCoins--;
        totalCoinsNeeded--;
      }
    }
  }
  return totalCoinsNeeded <= 10 ? output : null;
};

const giveUpCoins = (player: Player, card: Card, coinCost: CoinSet) => {
  let numCoinsGotten = -getNumCoins(coinCost);
  const numCoinsCanGet = Math.min(3, 10 - getNumCoins(player.coins));
  const coinsNeeded = coinsNeededToAffordCard(player, card);
  while (coinsNeeded && numCoinsGotten > numCoinsCanGet) {
    const prevNumCoinsGotten = numCoinsGotten;
    for (const color in player.coins) {
      if (color === Color.Yellow) continue;
      const value = player.coins[color as Color] - coinCost[color as Color];
      if (numCoinsGotten <= numCoinsCanGet) continue;
      if (value > card.cost[color as Color]) {
        numCoinsGotten -= 1;
        coinCost[color as Color] += 1;
      }
    }
    if (prevNumCoinsGotten === numCoinsGotten) {
      // Infinite loop protection
      break;
    }
  }
  return coinCost;
};

const collectCoinsForCard = (
  game: Game,
  player: Player,
  card: Card,
  output: CoinSet = {} as CoinSet
): CoinSet | null => {
  const coinsNeeded = coinsNeededToAffordCard(player, card, { ...EMPTY_COINS });
  if (!coinsNeeded || !_.some(coinsNeeded)) return null;
  const numCoinsCanGet = Math.min(3, 10 - getNumCoins(player.coins));
  let numCoinsGotten = 0;
  _.forEach(coinsNeeded, (needed, color) => {
    if (numCoinsGotten >= 3) return;
    if (needed > 0 && game.coins[color as Color] > 0) {
      numCoinsGotten += 1;
      output[color as Color] = -1;
    }
  });
  if (numCoinsGotten > 0) {
    if (numCoinsGotten < numCoinsCanGet) {
      _.forEach(game.coins, (value, color) => {
        if (numCoinsGotten >= numCoinsCanGet) return;
        if (value > 0 && !output[color as Color] && color !== Color.Yellow) {
          numCoinsGotten += 1;
          output[color as Color] = -1;
        }
      });
    }
    giveUpCoins(player, card, output);
  }
  return _.some(output) ? output : null;
};

/** Put this inside an actionPool */
const getCoinsActions = (
  game: Game,
  player: Player,
  output: Action[] = []
): Action[] => {
  arrPool.start();
  /** Take Coins */
  const lessThanThreeStacks =
    _.reduce(
      game.coins,
      (agg, value, color) =>
        (agg += value > 0 && color !== Color.Yellow ? 1 : 0),
      0
    ) < 3;
  const threeCoinPermutations: Color[][] = arrPool.get();
  if (lessThanThreeStacks) {
    const onlyCoinsToTake = _.reduce(
      game.coins,
      (agg, value, color) => {
        if (value > 0 && color !== Color.Yellow) agg.push(color as Color);
        return agg;
      },
      arrPool.get() as Color[]
    );
    if (onlyCoinsToTake.length) {
      threeCoinPermutations.push(onlyCoinsToTake);
    }
  } else {
    generateThreeCoinPermutations(game.coins, threeCoinPermutations);
  }
  threeCoinPermutations.forEach((permutation) => {
    const action = actionPool.get("takeCoins");
    action.card = null;
    permutation.forEach((color) => {
      action.coinCost[color] = -1;
    });
    output.push(action);
  });

  _.forEach(game.coins, (value, color) => {
    if (value >= 4 && color !== Color.Yellow) {
      const action = actionPool.get("takeCoins");
      action.card = null;
      action.coinCost[color as Color] = -2;
      output.push(action);
    }
  });
  arrPool.end();
  return output;
};

/** Put this inside an actionPool */
export const getBuyActions = (
  game: Game,
  player: Player,
  output: Action[] = []
) => {
  const gatherBuyActions = (type: "buy" | "buyReserve") => (card: Card) => {
    const action = actionPool.get();
    if (!action) return;
    const payableCost = canAffordCard(player, card, action.coinCost);
    if (payableCost) {
      action.type = type;
      action.card = card;
      output.push(action);
    } else {
      actionPool.freeOne();
    }
  };
  game.table.forEach(gatherBuyActions("buy"));
  player.reserved.forEach(gatherBuyActions("buyReserve"));
  return output;
};

/** Put this inside an actionPool */
export const getReserveActions = (
  game: Game,
  player: Player,
  output: Action[] = []
) => {
  if (player.reserved.length < 3) {
    const yellowCost = game.coins[Color.Yellow] > 0 ? -1 : 0;
    game.table.forEach((card) => {
      const action = actionPool.get();
      action.type = "reserve";
      action.coinCost[Color.Yellow] = yellowCost;
      action.card = card;
      output.push(action);
    });
  }
  return output;
};

/** Put inside actionPool */
export const getPossibleActions = (game: Game, output: Action[] = []) => {
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];

  /** Take Coins */
  getCoinsActions(game, player, output);

  /** Buy Or Reserve */
  getBuyActions(game, player, output);
  getReserveActions(game, player, output);

  return output;
};

export const forSomePossibleActions = (
  game: Game,
  callback: (action: Action) => any
) => {
  actionPool.start();
  const actions = getPossibleActions(game);
  const result = actions.some(callback);
  actionPool.end();
  return result;
};

const coinsExchange = (game: Game, player: Player, action: Action) => {
  _.assignWith(
    player.coins,
    action.coinCost,
    (playerCoins, actionCost) => playerCoins - actionCost
  );
  _.assignWith(
    game.coins,
    action.coinCost,
    (gameCoins, actionCost) => gameCoins + actionCost
  );
};

const drawCardFromDeck = (
  game: Game,
  tier: "tier1" | "tier2" | "tier3",
  removeCard?: Card
) => {
  const cardIndex = removeCard
    ? _.findIndex(game.table, (c) => c.id === removeCard.id)
    : game.table.length;
  const nextCard = game.deck[tier].pop();
  if (nextCard) {
    game.table.splice(cardIndex, removeCard ? 1 : 0, nextCard);
  } else {
    game.table.splice(cardIndex, removeCard ? 1 : 0);
  }
};

const takeCardFromTable = (game: Game, card: Card) =>
  drawCardFromDeck(game, card.tier, card);

export const getAffordableNobles = (game: Game, player: Player) =>
  game.nobles.filter((noble) => {
    return _.every(noble.cards, (value, color) => {
      return (
        count(player.bought, (card) => card.color === (color as Color)) >= value
      );
    });
  });

const maybeAcquireNoble = (game: Game, player: Player) => {
  const firstAffordableNoble = getAffordableNobles(game, player)[0];
  if (!firstAffordableNoble) return;
  _.remove(game.nobles, firstAffordableNoble);
  player.nobles.push(firstAffordableNoble);
  player.points += firstAffordableNoble.points;
};

export const takeAction = produce((game: Game, action: Action) => {
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];
  coinsExchange(game, player, action);
  game.turn++;
  switch (action.type) {
    case "buy":
      player.points += action.card.points;
      player.bought.push(action.card);
      takeCardFromTable(game, action.card);
      break;
    case "buyReserve":
      player.points += action.card.points;
      player.bought.push(action.card);
      _.remove(player.reserved, (card) => card.id === action.card.id);
      break;
    case "reserve":
      player.reserved.push(action.card);
      takeCardFromTable(game, action.card);
      break;
    case "takeCoins":
    default:
      break;
  }
  maybeAcquireNoble(game, player);
  return game;
});

export const initialSetUpGameForm = {
  numberOfHumans: 1,
  numberOfAi: 1,
};

export type SetupGameForm = typeof initialSetUpGameForm;

export const setupGame = ({
  numberOfAi,
  numberOfHumans,
}: SetupGameForm): Game => {
  const shuffledDeck = _.mapValues(DECK, (cards) => _.shuffle(cards));

  const numPlayers = numberOfAi + numberOfHumans;

  const players = _.times(numPlayers, (index) => ({
    id: index,
    coins: EMPTY_COINS,
    bought: [],
    reserved: [],
    nobles: [],
    points: 0,
    isHuman: index < numberOfHumans,
  }));

  const startingCoinsPerStack = numPlayers <= 2 ? 4 : numPlayers <= 3 ? 5 : 7;

  const startingPlayerIndex = _.random(0, numPlayers - 1);

  const game: Game = {
    players,
    deck: shuffledDeck,
    table: [],
    nobles: _.shuffle(ALL_NOBLES).slice(0, numPlayers + 1),
    coins: getCost(
      startingCoinsPerStack,
      startingCoinsPerStack,
      startingCoinsPerStack,
      startingCoinsPerStack,
      startingCoinsPerStack,
      5
    ),
    turn: startingPlayerIndex,
    startingPlayerIndex,
  };

  (["tier1", "tier2", "tier3"] as const).forEach((tier) => {
    _.times(4, () => drawCardFromDeck(game, tier));
  });

  return game;
};

export const playerValue = (game: Game, player: Player): number => {
  const points = player.points;
  const bought = player.bought.length;
  actionPool.start();
  const gainCards = getBuyActions(game, player).length;
  actionPool.end();
  const coins = Math.min(10, getNumCoins(player.coins));
  const canEndGame = points >= 15 ? 1 : 0;

  const valueString = [canEndGame, points, bought, gainCards, coins]
    .map((x) => x.toString().padStart(2, "0"))
    .join("");
  return +valueString;
};

const gameValue = (game: Game) => {
  const playerIndex = getPlayerIndex(game);
  return (
    playerValue(game, game.players[playerIndex]) -
    game.players.reduce((maxValue, player, i) => {
      return i === playerIndex
        ? maxValue
        : Math.max(maxValue, playerValue(game, player));
    }, -Infinity)
  );
};

export const gameValueForAllPlayers = (game: Game) => {
  arrPool.start();
  const playerValues = arrPool.get();
  game.players.forEach((player) =>
    playerValues.push(playerValue(game, player))
  );
  const [first, second] = playerValues.sort((a, b) => b - a);
  const firstIndex = playerValues.indexOf(first);
  playerValues.forEach((pVal, i) => {
    playerValues[i] = pVal - (i === firstIndex ? second : first);
  });
  arrPool.end();
  return playerValues;
};

export const getPlayerIndex = (game: Game) => {
  return game.turn % game.players.length;
};

export const isLastTurns = (game: Game) =>
  _.some(game.players, (player) => player.points >= 15);

export const isTerminal = (game: Game) => {
  return isLastTurns(game) && getPlayerIndex(game) === game.startingPlayerIndex;
};

const randomPlay = (game: Game) => {
  actionPool.start();
  const possibleActions = getPossibleActions(game);
  const bestAction =
    possibleActions[Math.floor(Math.random() * possibleActions.length)] || null;
  actionPool.end();
  return _.cloneDeep(bestAction);
};

const minimaxAB = genMinimaxAB(
  forSomePossibleActions,
  takeAction,
  gameValue,
  isTerminal,
  2
);

const maxn = genMaxN(
  forSomePossibleActions,
  takeAction,
  gameValueForAllPlayers,
  getPlayerIndex,
  isTerminal,
  4
);

const probablyBestMove = genProbablyBestMove(
  forSomePossibleActions,
  takeAction,
  gameValueForAllPlayers,
  getPlayerIndex,
  isTerminal,
  4
);

const opportunistic = (game: Game): Action => {
  // Do I have a high value reserved card?
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];
  const highPoints = Math.min(15 - player.points, 2);
  const highValueReservedCard = player.reserved.reduce((highCard, card) => {
    if (card.points < highPoints) return highCard;
    if (!highCard) return card;
    if (card.points > highCard.points) return card;
    if (card.points === highCard.points) {
      if (getNumCoins(card.cost) < getNumCoins(highCard.cost)) {
        return card;
      }
    }
    return highCard;
  }, null as Card | null);
  const coinCost = { ...EMPTY_COINS };
  if (highValueReservedCard) {
    if (canAffordCard(player, highValueReservedCard, coinCost)) {
      return {
        type: "buyReserve",
        card: highValueReservedCard,
        coinCost,
      };
    }

    // Try to collect coins to afford the high value reserved card
    const getCoins = { ...EMPTY_COINS };
    const collection = collectCoinsForCard(
      game,
      player,
      highValueReservedCard,
      getCoins
    );

    if (collection) {
      return {
        type: "takeCoins",
        card: null,
        coinCost: getCoins,
      };
    }

    // Try to buy a card that will help afford the high value reserved card
    // or reserve it if I can't afford it.
    const affordableHelpfulCards = game.table.filter((card) => {
      return (
        player.coins[card.color as Color] +
          player.bought.filter((c) => c.color === card.color).length <
          highValueReservedCard.cost[card.color as Color] &&
        canAffordCard(player, card, coinCost, true)
      );
    });
    if (affordableHelpfulCards.length > 0) {
      return {
        type: "buy",
        card: affordableHelpfulCards[0],
        coinCost: canAffordCard(
          player,
          affordableHelpfulCards[0],
          coinCost,
          true
        )!,
      };
    }
    const affordableHelpfulReserveCards = player.reserved.filter((card) => {
      return (
        player.coins[card.color as Color] +
          player.bought.filter((c) => c.color === card.color).length <
          highValueReservedCard.cost[card.color as Color] &&
        canAffordCard(player, card, coinCost, true)
      );
    });
    if (affordableHelpfulReserveCards.length > 0) {
      return {
        type: "buyReserve",
        card: affordableHelpfulReserveCards[0],
        coinCost: canAffordCard(
          player,
          affordableHelpfulReserveCards[0],
          coinCost,
          true
        )!,
      };
    }

    // Try to reserve a cheap card that will help afford the high value reserved card
    if (game.coins[Color.Yellow] > 0 && player.reserved.length < 3) {
      actionPool.start();
      const reserveActions = getReserveActions(game, player);
      const bestReserveAction = reserveActions.reduce((best, action) => {
        if (
          _.max(_.values(action.card!.cost))! <
          _.max(_.values(best.card!.cost))!
        ) {
          return _.cloneDeep(action);
        }
        if (
          _.max(_.values(action.card!.cost))! ===
          _.max(_.values(best.card!.cost))!
        ) {
          if (getNumCoins(action.card!.cost) < getNumCoins(best.card!.cost)) {
            return _.cloneDeep(action);
          }
        }
        return best;
      }, reserveActions[0]);
      actionPool.end();
      giveUpCoins(player, highValueReservedCard, bestReserveAction.coinCost);
      return _.cloneDeep(bestReserveAction);
    }
  }

  if (!highValueReservedCard) {
    // Do I have a high value card on the table that I could afford with 10 coins or less?
    const highValueCards = game.table.filter((card) => {
      if (card.points < 2) return false;
      const coinsNeeded = coinsNeededToAffordCard(
        player,
        card,
        clearCoins(coinCost)
      );
      if (!coinsNeeded) return false;
      const numCoinsNeeded = _.reduce(
        card.cost,
        (sum, value, color) => {
          return value
            ? sum + coinsNeeded[color as Color] + player.coins[color as Color]
            : sum;
        },
        0
      );
      return card.points >= highPoints && numCoinsNeeded <= 10;
    });
    if (highValueCards.length > 0) {
      const highValueCard = _.maxBy(
        highValueCards,
        (card) =>
          card.points /
          getNumCoins(
            coinsNeededToAffordCard(player, card, clearCoins(coinCost))!
          )
      )!;
      if (canAffordCard(player, highValueCard, clearCoins(coinCost))) {
        return {
          type: "buy",
          card: highValueCard,
          coinCost,
        };
      } else if (game.coins[Color.Yellow] > 0) {
        return {
          type: "reserve",
          card: highValueCard,
          coinCost: { ...EMPTY_COINS, [Color.Yellow]: -1 },
        };
      }
    }
  }

  // Otherwise, just take coins
  actionPool.start();
  const coinActions = getCoinsActions(game, player);
  const bestAction =
    coinActions[Math.floor(Math.random() * coinActions.length)] || null;
  actionPool.end();
  if (highValueReservedCard && bestAction) {
    giveUpCoins(player, highValueReservedCard, bestAction.coinCost);
  }
  if (bestAction) {
    return _.cloneDeep(bestAction);
  }

  // Otherwise, just reserve a card
  if (player.reserved.length < 3) {
    actionPool.start();
    const reserveActions = getReserveActions(game, player);
    const bestReserveAction = reserveActions.reduce((best, action) => {
      if (
        _.max(_.values(action.card!.cost))! < _.max(_.values(best.card!.cost))!
      ) {
        return _.cloneDeep(action);
      }
      if (
        _.max(_.values(action.card!.cost))! ===
        _.max(_.values(best.card!.cost))!
      ) {
        if (getNumCoins(action.card!.cost) < getNumCoins(best.card!.cost)) {
          return _.cloneDeep(action);
        }
      }
      return best;
    }, reserveActions[0]);
    actionPool.end();
    return _.cloneDeep(bestReserveAction);
  }

  // Otherwise, just try and buy any cheap card
  actionPool.start();
  const buyActions = getBuyActions(game, player);
  const bestBuyAction = buyActions.reduce((best, action) => {
    if (
      _.max(_.values(action.card!.cost))! < _.max(_.values(best.card!.cost))!
    ) {
      return _.cloneDeep(action);
    }
    if (
      _.max(_.values(action.card!.cost))! === _.max(_.values(best.card!.cost))!
    ) {
      if (getNumCoins(action.card!.cost) < getNumCoins(best.card!.cost)) {
        return _.cloneDeep(action);
      }
    }
    return best;
  }, buyActions[0]);
  actionPool.end();
  return bestBuyAction
    ? _.cloneDeep(bestBuyAction)
    : {
        type: "takeCoins",
        card: null,
        coinCost: { ...EMPTY_COINS },
      };
};

export enum Strategy {
  Random,
  AlphaBeta,
  MaxN,
  Probablistic,
  Opportunistic,
}

export const getStrategy = (strat: Strategy) => {
  switch (strat) {
    case Strategy.Random:
      return randomPlay;
    case Strategy.MaxN:
      return maxn;
    case Strategy.Probablistic:
      return probablyBestMove;
    case Strategy.Opportunistic:
      return opportunistic;
    case Strategy.AlphaBeta:
    default:
      return minimaxAB;
  }
};

export const runGame = (
  numPlayers: number,
  strat: Strategy = Strategy.Random
) => {
  const game = setupGame({ numberOfAi: numPlayers, numberOfHumans: 0 });
  const allActionsTaken: Action[][] = _.times(numPlayers, () => []);
  const getNextAction = getStrategy(strat);
  while (!isTerminal(game)) {
    let numNoActions = 0;
    _.times(numPlayers, () => {
      const playerIndex = getPlayerIndex(game);
      // console.log(`Player ${playerIndex}`);
      const action = getNextAction(game);
      // console.log(action);
      if (!action) {
        numNoActions++;
        const player = game.players[playerIndex];
        console.warn(
          "No action available for player",
          _.cloneDeep(player),
          _.cloneDeep(game)
        );
        game.turn++;
        return;
      }
      allActionsTaken[playerIndex].push(action);
      takeAction(game, action);
      numNoActions = 0;
    });
    if (numNoActions === numPlayers) {
      console.error("Infinite Loop", _.cloneDeep(game));
      break;
    }
  }
  const winningPlayer = _.maxBy(game.players, (player) => player.points);
  return [
    _.map(game.players, "points").join(",") + ":" + game.turn,
    ...allActionsTaken[winningPlayer!.id].map((action) =>
      JSON.stringify(action)
    ),
  ];
};
