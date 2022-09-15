import _ from 'lodash';
import { DECK } from '../constants/allCards';
import { ALL_NOBLES } from '../constants/allNobles';
import { getCost, EMPTY_COINS } from '../constants/utils';
import { Action, Card, Color, Game, Player } from "../models/Splendor";
import { genMaxN, genMinimaxAB } from './minimax';

export const getNumCoins = (coins: Record<Color, number>) => _.reduce(coins, (sum, num) => sum + num, 0);

const generateThreeCoinPermutations = (coins: Record<Color, number>, currentCoins: Color[] = []): Color[][] => {
  if (currentCoins.length === 3) {
    return [currentCoins];
  }
  const coinsLeft = { ...coins }
  return _.reduce(coins, (agg, value, color) => {
    if (value > 0 && color !== Color.Yellow) {
      coinsLeft[color as Color] = 0;
      agg.push(...generateThreeCoinPermutations(coinsLeft, [...currentCoins, color as Color]));
    }
    return agg;
  }, [] as Color[][]);
};

export const canAffordCard = (player: Player, card: Card) => {
  let yellowCoins = player.coins[Color.Yellow];
  const cardCost = _.mapValues(card.cost, (coinCost, color) => Math.max(0, coinCost - player.bought.filter(card => card.color === color as Color).length));
  const canAfford = _.every(cardCost, (value, color) => {
    if (player.coins[color as Color] - value >= 0) return true;
    if (yellowCoins > 0 && player.coins[color as Color] - value >= -yellowCoins) {
      yellowCoins += (player.coins[color as Color] - value);
      cardCost[color as Color] = player.coins[color as Color];
      return true;
    }
    return false;
  });
  return canAfford ? { ...cardCost, [Color.Yellow]: player.coins[Color.Yellow] - yellowCoins } : null;
}

export const getBuyActions = (game: Game, player: Player) => [...game.table, ...player.reserved].reduce((agg, card, index) => {
  const payableCost = canAffordCard(player, card);
  if (payableCost) {
    agg.push({
      type: index >= game.table.length ? 'buyReserve' : 'buy',
      coinCost: payableCost,
      card,
    });
  }
  return agg;
}, [] as Action[]);

export const getReserveActions = (game: Game, player: Player) => {
  return player.reserved.length >= 3 ? [] : game.table.map(card => ({
    type: 'reserve',
    coinCost: { ...EMPTY_COINS, [Color.Yellow]: game.coins[Color.Yellow] > 0 ? -1 : 0 },
    card,
  }) as Action)
};

export const getPossibleActions = (game: Game) => {
  const playerIndex = game.turn % game.players.length;
  const player = game.players[playerIndex];
  /** Take Coins */
  const lessThanThreeStacks = _.reduce(game.coins, (agg, value, color) => agg += (value > 0 && color !== Color.Yellow ? 1 : 0), 0) < 3;
  let threeCoinPermutations = [];
  if (lessThanThreeStacks) {
    const onlyCoinsToTake = _.reduce(game.coins, (agg, value, color) => {
      if (value > 0 && color !== Color.Yellow) agg.push(color as Color);
      return agg;
    }, [] as Color[]);
    threeCoinPermutations = onlyCoinsToTake.length ? [onlyCoinsToTake] : [];
  } else {
    threeCoinPermutations = generateThreeCoinPermutations(game.coins);
  }
  const threeCoinActions = threeCoinPermutations.map((permutation): Action => ({
    type: 'takeCoins',
    coinCost: {
      ...EMPTY_COINS, ...permutation.reduce((agg, color) => {
        agg[color] = -1;
        return agg;
      }, {} as Record<Color, number>)
    },
  }));
  const twoCoinActions = _.reduce(game.coins, (agg, value, color) => {
    if (value >= 4 && color !== Color.Yellow) {
      agg.push({
        type: 'takeCoins',
        coinCost: { ...EMPTY_COINS, [color as Color]: -2 },
      });
    }
    return agg;
  }, [] as Action[]);
  // TODO(jkarges): Put back coins if you have more than 10.

  /** Buy Or Reserve */
  const buyActions = getBuyActions(game, player);
  const reserveActions = getReserveActions(game, player);

  return [...threeCoinActions, ...twoCoinActions, ...buyActions, ...reserveActions];
};

const coinsExchange = (game: Game, player: Player, action: Action) => {
  player.coins = _.mapValues(player.coins, (value, color) => value - action.coinCost[color as Color]);
  game.coins = _.mapValues(game.coins, (value, color) => value + action.coinCost[color as Color]);
};

const drawCardFromDeck = (game: Game, tier: 'tier1' | 'tier2' | 'tier3') => {
  const nextCard = game.deck[tier].pop();
  if (nextCard) game.table.push(nextCard);
};

const takeCardFromTable = (game: Game, card: Card) => {
  _.remove(game.table, (c) => c.id === card.id);
  drawCardFromDeck(game, card.tier);
};

const maybeAcquireNoble = (game: Game, player: Player) => {
  const firstAffordableNoble = game.nobles.find((noble) => {
    return _.every(noble.cards, (value, color) => {
      return player.bought.filter(card => card.color === color as Color).length >= value;
    });
  })
  // TODO(jkarges): Decide between multiple nobles.
  if (!firstAffordableNoble) return;
  _.remove(game.nobles, firstAffordableNoble);
  player.nobles.push(firstAffordableNoble);
  player.points += firstAffordableNoble.points;
};

export const takeAction = (game: Game, action: Action) => {
  const playerIndex = game.turn % game.players.length;
  const player = game.players[playerIndex];
  coinsExchange(game, player, action);
  game.turn++;
  switch (action.type) {
    case 'buy':
      player.points += action.card.points;
      player.bought.push(action.card);
      takeCardFromTable(game, action.card);
      maybeAcquireNoble(game, player);
      break;
    case 'buyReserve':
      player.points += action.card.points;
      player.bought.push(action.card);
      _.remove(player.reserved, (card) => card.id === action.card.id);
      maybeAcquireNoble(game, player);
      break;
    case 'reserve':
      player.reserved.push(action.card);
      takeCardFromTable(game, action.card);
      break;
    case 'takeCoins':
    default:
      break;
  }
  return game;
};

export const setupGame = (numPlayers: number): Game => {
  const shuffledDeck = _.mapValues(DECK, (cards) => _.shuffle(cards));

  const players = _.times(numPlayers, (index) => ({
    id: index,
    coins: EMPTY_COINS,
    bought: [],
    reserved: [],
    nobles: [],
    points: 0,
  }))

  const startingCoinsPerStack = numPlayers <= 2 ? 4 : numPlayers <= 3 ? 5 : 7;

  const game: Game = {
    players,
    deck: shuffledDeck,
    table: [],
    nobles: _.shuffle(ALL_NOBLES).slice(0, numPlayers + 1),
    coins: getCost(startingCoinsPerStack, startingCoinsPerStack, startingCoinsPerStack, startingCoinsPerStack, startingCoinsPerStack, 5),
    turn: 0,
  };

  (['tier1', 'tier2', 'tier3'] as const).forEach((tier) => {
    _.times(4, () => drawCardFromDeck(game, tier));
  });

  return game;
};

const playerValue = (game: Game, player: Player): number => {
  const pointsString = player.points.toString().padStart(2, '0');
  const boughtString = player.bought.length.toString().padStart(2, '0');
  const gainCardsString = getBuyActions(game, player).length.toString().padStart(2, '0');
  const coinsString = _.reduce(player.coins, (sumCoins, numCoins) => sumCoins + numCoins, 0).toString().padStart(2, '0');
  const valueString = `${pointsString}${boughtString}${gainCardsString}${coinsString}`;
  return +valueString;
};

const gameValue = (game: Game) => {
  const playerIndex = getPlayerIndex(game);
  return playerValue(game, game.players[playerIndex]) - game.players.reduce((maxValue, player, i) => {
    return i === playerIndex ? maxValue : Math.max(maxValue, playerValue(game, player));
  }, -Infinity);
};

const gameValueForAllPlayers = (game: Game) => {
  const playerValues = game.players.map((player) => playerValue(game, player));
  const [first, second] = playerValues.sort((a, b) => b - a);
  const firstIndex = playerValues.indexOf(first);
  return playerValues.map((pVal, i) => {
    return pVal - (i === firstIndex ? second : first);
  });
};

export const getPlayerIndex = (game: Game) => {
  return game.turn % game.players.length;
};

export const isTerminal = (game: Game) => {
  return _.some(game.players, player => player.points >= 15);
};

const randomPlay = (game: Game) => {
  const possibleActions = getPossibleActions(game);
  return possibleActions[Math.floor(Math.random() * possibleActions.length)] || null;
};

const minimaxAB = genMinimaxAB(getPossibleActions, takeAction, gameValue, isTerminal, 2);

const maxn = genMaxN(getPossibleActions, takeAction, gameValueForAllPlayers, getPlayerIndex, isTerminal, 4);

export enum Strategy {
  Random,
  AlphaBeta,
  MaxN,
}

const getStrategy = (strat: Strategy) => {
  switch (strat) {
    case (Strategy.Random):
      return randomPlay;
    case (Strategy.MaxN):
      return maxn;
    case (Strategy.AlphaBeta):
    default:
      return minimaxAB;
  }
}

export const runGame = (numPlayers: number, strat: Strategy = Strategy.Random) => {
  const game = setupGame(numPlayers);
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
        console.warn('No action available for player', _.cloneDeep(player), _.cloneDeep(game));
        game.turn++;
        return;
      }
      allActionsTaken[playerIndex].push(action);
      takeAction(game, action);
      numNoActions = 0;
    });
    if (numNoActions === numPlayers) {
      console.error('Infinite Loop', _.cloneDeep(game));
      break;
    }
  }
  const winningPlayer = _.maxBy(game.players, player => player.points);
  return [_.map(game.players, 'points').join(',') + ':' + game.turn, ...allActionsTaken[winningPlayer!.id].map(action => JSON.stringify(action))];
};
