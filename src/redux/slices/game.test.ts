import { getCost, EMPTY_COINS } from "../../constants/utils";
import { Card, Color, Game, Noble, Player } from "../../models/Splendor";
import {
  chooseNoble,
  game as gameReducer,
  putCoinBack,
  skipNobleChoice,
  takeActionAction,
} from "./game";

const makeCard = (id: number, color: Color, points = 0): Card => ({
  id,
  color,
  cost: { ...EMPTY_COINS },
  points,
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

const makePlayer = (id: number, overrides: Partial<Player> = {}): Player => ({
  id,
  coins: { ...EMPTY_COINS },
  bought: [],
  reserved: [],
  nobles: [],
  points: 0,
  isHuman: true,
  ...overrides,
});

const makeGame = (overrides: Partial<Game> = {}): Game => ({
  players: [makePlayer(0), makePlayer(1)],
  deck: { tier1: [], tier2: [], tier3: [] },
  table: [],
  nobles: [],
  coins: { ...EMPTY_COINS },
  turn: 0,
  startingPlayerIndex: 0,
  ...overrides,
});

/** Three white and three blue cards, so the white/blue noble is already in reach. */
const boughtCards = () => [
  makeCard(1, Color.White),
  makeCard(2, Color.White),
  makeCard(3, Color.White),
  makeCard(4, Color.Blue),
  makeCard(5, Color.Blue),
  makeCard(6, Color.Blue),
  makeCard(7, Color.Green),
  makeCard(8, Color.Green),
];

const GREEN_CARD = makeCard(9, Color.Green, 1);

/**
 * Buying the green card completes both nobles, which is the case where the
 * player has to choose one.
 */
const gameWithTwoAffordableNobles = () =>
  makeGame({
    players: [makePlayer(0, { bought: boughtCards() }), makePlayer(1)],
    table: [GREEN_CARD],
    nobles: [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE],
  });

const buyGreenCard = (extra: { dontAdvance?: boolean; popNoble?: boolean }) =>
  takeActionAction({
    type: "buy",
    coinCost: { ...EMPTY_COINS },
    card: GREEN_CARD,
    playerIndex: 0,
    ...extra,
  });

describe("takeAction", () => {
  it("auto awards a noble when no choice is needed", () => {
    const state = gameWithTwoAffordableNobles();

    const next = gameReducer(state, buyGreenCard({}));

    expect(next.players[0].nobles).toHaveLength(1);
    // One point for the card and three for the noble.
    expect(next.players[0].points).toBe(4);
    expect(next.nobles).toHaveLength(1);
    expect(next.turn).toBe(1);
  });

  it("puts the auto awarded noble back so the player can choose, and holds the turn", () => {
    const state = gameWithTwoAffordableNobles();

    const next = gameReducer(
      state,
      buyGreenCard({ dontAdvance: true, popNoble: true })
    );

    expect(next.players[0].nobles).toHaveLength(0);
    // Only the card's point, since no noble has been claimed yet.
    expect(next.players[0].points).toBe(1);
    expect(next.nobles.map((noble) => noble.id).sort()).toEqual([100, 101]);
    // The turn is held so the same player resolves their noble choice.
    expect(next.turn).toBe(0);
  });

  it("never takes back a noble earned on an earlier turn", () => {
    const state = makeGame({
      players: [
        makePlayer(0, {
          // Not enough green cards for the white/green noble.
          bought: [
            makeCard(1, Color.White),
            makeCard(2, Color.White),
            makeCard(3, Color.White),
          ],
          nobles: [WHITE_BLUE_NOBLE],
          points: 3,
        }),
        makePlayer(1),
      ],
      table: [GREEN_CARD],
      nobles: [WHITE_GREEN_NOBLE],
    });

    const next = gameReducer(
      state,
      buyGreenCard({ dontAdvance: true, popNoble: true })
    );

    expect(next.players[0].nobles).toEqual([WHITE_BLUE_NOBLE]);
    // The three noble points are kept, plus the point from the card.
    expect(next.players[0].points).toBe(4);
    expect(next.nobles).toEqual([WHITE_GREEN_NOBLE]);
  });
});

describe("chooseNoble", () => {
  it("claims the noble, scores it, and advances the turn", () => {
    const state = makeGame({
      players: [makePlayer(0, { bought: boughtCards() }), makePlayer(1)],
      nobles: [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE],
    });

    const next = gameReducer(state, chooseNoble(WHITE_GREEN_NOBLE));

    expect(next.players[0].nobles).toEqual([WHITE_GREEN_NOBLE]);
    expect(next.players[0].points).toBe(3);
    expect(next.nobles).toEqual([WHITE_BLUE_NOBLE]);
    expect(next.turn).toBe(1);
  });

  it("ignores a repeated choice of the same noble", () => {
    const state = makeGame({
      players: [makePlayer(0, { bought: boughtCards() }), makePlayer(1)],
      nobles: [WHITE_BLUE_NOBLE, WHITE_GREEN_NOBLE],
    });

    const once = gameReducer(state, chooseNoble(WHITE_GREEN_NOBLE));
    const twice = gameReducer(once, chooseNoble(WHITE_GREEN_NOBLE));

    expect(twice.players[0].nobles).toEqual([WHITE_GREEN_NOBLE]);
    expect(twice.players[0].points).toBe(3);
    expect(twice.turn).toBe(1);
  });
});

describe("skipNobleChoice", () => {
  it("releases the held back turn when there is no noble to choose", () => {
    const state = makeGame({ turn: 4 });

    const next = gameReducer(state, skipNobleChoice({ turn: 4 }));

    expect(next.turn).toBe(5);
  });

  it("only releases the turn once", () => {
    const state = makeGame({ turn: 4 });

    const once = gameReducer(state, skipNobleChoice({ turn: 4 }));
    const twice = gameReducer(once, skipNobleChoice({ turn: 4 }));

    expect(twice.turn).toBe(5);
  });
});

describe("putCoinBack", () => {
  const stateWithElevenCoins = () =>
    makeGame({
      players: [
        makePlayer(0, {
          coins: getCost(3, 3, 3, 1, 1),
        }),
        makePlayer(1),
      ],
    });

  it("advances the turn once the player is back down to ten coins", () => {
    const next = gameReducer(
      stateWithElevenCoins(),
      putCoinBack({ color: Color.White, playerIndex: 0 })
    );

    expect(next.players[0].coins[Color.White]).toBe(2);
    expect(next.coins[Color.White]).toBe(1);
    expect(next.turn).toBe(1);
  });

  it("holds the turn when the same player still has a noble to choose", () => {
    const next = gameReducer(
      stateWithElevenCoins(),
      putCoinBack({
        color: Color.White,
        playerIndex: 0,
        skipTurnAdvance: true,
      })
    );

    expect(next.players[0].coins[Color.White]).toBe(2);
    // The turn stays put so the noble choice applies to the discarding player.
    expect(next.turn).toBe(0);
  });

  it("does not advance the turn while the player is still over ten coins", () => {
    const state = makeGame({
      players: [makePlayer(0, { coins: getCost(4, 4, 4, 0, 0) }), makePlayer(1)],
    });

    const next = gameReducer(
      state,
      putCoinBack({ color: Color.White, playerIndex: 0 })
    );

    expect(next.turn).toBe(0);
  });
});
