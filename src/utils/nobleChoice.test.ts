import { getCost, EMPTY_COINS } from "../constants/utils";
import { Action, Card, Color, Game, Noble, Player } from "../models/Splendor";
import {
  getAffordableNobles,
  getNoblesAfterAction,
  needsNobleChoice,
} from "./splendor";

const makeCard = (id: number, color: Color): Card => ({
  id,
  color,
  cost: { ...EMPTY_COINS },
  points: 0,
  tier: "tier1",
});

/** Needs 3 white and 3 blue cards. */
const WHITE_BLUE_NOBLE: Noble = {
  id: 100,
  points: 3,
  cards: getCost(3, 3, 0, 0, 0),
};

/** Needs 3 white and 3 green cards. */
const WHITE_GREEN_NOBLE: Noble = {
  id: 101,
  points: 3,
  cards: getCost(3, 0, 3, 0, 0),
};

const makePlayer = (bought: Card[]): Player => ({
  id: 0,
  coins: { ...EMPTY_COINS },
  bought,
  reserved: [],
  nobles: [],
  points: 0,
  isHuman: true,
});

const makeGame = (player: Player, nobles: Noble[]): Game => ({
  players: [player],
  deck: { tier1: [], tier2: [], tier3: [] },
  table: [],
  nobles,
  coins: { ...EMPTY_COINS },
  turn: 0,
  startingPlayerIndex: 0,
});

/**
 * Three white cards plus two blue and two green, so buying one more blue or one
 * more green card claims a noble, and buying a card that is both claims two.
 */
const almostThereBought = () => [
  makeCard(1, Color.White),
  makeCard(2, Color.White),
  makeCard(3, Color.White),
  makeCard(4, Color.Blue),
  makeCard(5, Color.Blue),
  makeCard(6, Color.Green),
  makeCard(7, Color.Green),
];

describe("getNoblesAfterAction", () => {
  it("counts a bought card toward the noble requirements", () => {
    const player = makePlayer(almostThereBought());
    const game = makeGame(player, [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE]);
    const action: Action = {
      type: "buy",
      coinCost: { ...EMPTY_COINS },
      card: makeCard(8, Color.Blue),
    };

    expect(getAffordableNobles(game, player)).toHaveLength(0);
    expect(getNoblesAfterAction(game, player, action)).toEqual([
      WHITE_BLUE_NOBLE,
    ]);
  });

  it("counts a card bought out of the reserve", () => {
    const player = makePlayer(almostThereBought());
    const game = makeGame(player, [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE]);
    const action: Action = {
      type: "buyReserve",
      coinCost: { ...EMPTY_COINS },
      card: makeCard(8, Color.Green),
    };

    expect(getNoblesAfterAction(game, player, action)).toEqual([
      WHITE_GREEN_NOBLE,
    ]);
  });

  it("does not count a reserved card, which never earns a noble", () => {
    const player = makePlayer(almostThereBought());
    const game = makeGame(player, [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE]);
    const action: Action = {
      type: "reserve",
      coinCost: { ...EMPTY_COINS },
      card: makeCard(8, Color.Blue),
    };

    expect(getNoblesAfterAction(game, player, action)).toHaveLength(0);
  });

  it("handles taking coins, which carries no card", () => {
    const player = makePlayer(almostThereBought());
    const game = makeGame(player, [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE]);
    const action: Action = {
      type: "takeCoins",
      coinCost: { ...EMPTY_COINS },
      card: null,
    };

    expect(getNoblesAfterAction(game, player, action)).toHaveLength(0);
  });
});

describe("needsNobleChoice", () => {
  it("is true only when the action puts more than one noble in reach", () => {
    // Two blue and two green already, so a third of each is one card away.
    const player = makePlayer([
      makeCard(1, Color.White),
      makeCard(2, Color.White),
      makeCard(3, Color.White),
      makeCard(4, Color.Blue),
      makeCard(5, Color.Blue),
      makeCard(6, Color.Blue),
      makeCard(7, Color.Green),
      makeCard(8, Color.Green),
    ]);
    const game = makeGame(player, [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE]);
    const buyGreen: Action = {
      type: "buy",
      coinCost: { ...EMPTY_COINS },
      card: makeCard(9, Color.Green),
    };

    // The blue noble is already earned, and the green one arrives with this card.
    expect(getNoblesAfterAction(game, player, buyGreen)).toHaveLength(2);
    expect(needsNobleChoice(game, player, buyGreen)).toBe(true);
  });

  it("is false when exactly one noble is in reach", () => {
    const player = makePlayer(almostThereBought());
    const game = makeGame(player, [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE]);
    const buyBlue: Action = {
      type: "buy",
      coinCost: { ...EMPTY_COINS },
      card: makeCard(8, Color.Blue),
    };

    expect(needsNobleChoice(game, player, buyBlue)).toBe(false);
  });

  it("is false for a reserve that would have qualified if it were a purchase", () => {
    const player = makePlayer([
      makeCard(1, Color.White),
      makeCard(2, Color.White),
      makeCard(3, Color.White),
      makeCard(4, Color.Blue),
      makeCard(5, Color.Blue),
      makeCard(6, Color.Blue),
      makeCard(7, Color.Green),
      makeCard(8, Color.Green),
    ]);
    const game = makeGame(player, [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE]);
    const card = makeCard(9, Color.Green);

    expect(
      needsNobleChoice(game, player, {
        type: "buy",
        coinCost: { ...EMPTY_COINS },
        card,
      })
    ).toBe(true);
    expect(
      needsNobleChoice(game, player, {
        type: "reserve",
        coinCost: { ...EMPTY_COINS },
        card,
      })
    ).toBe(false);
  });
});
