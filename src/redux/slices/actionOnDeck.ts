import {
  ActionReducerMapBuilder,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import _ from "lodash";
import { EMPTY_COINS } from "../../constants/utils";
import { Action, Card, Color } from "../../models/Splendor";
import { getNumCoins } from "../../utils/splendor";
import { takeActionAction } from "./game";

const INITIAL_STATE = {
  type: "none",
  coinCost: EMPTY_COINS,
  card: null,
} as
  | Action
  | {
      type: "none";
      coinCost: Action["coinCost"];
      card: null;
    };

type ActionOnDeck = typeof INITIAL_STATE;

export const actionOnDeckSlice = createSlice({
  name: "actionOnDeck",
  initialState: INITIAL_STATE as ActionOnDeck,
  reducers: {
    prepCoin: (state, action: PayloadAction<Color>) => {
      if (state.type !== "takeCoins") {
        // If we're not already taking coins, reset the coinCost.
        state.coinCost = { ...EMPTY_COINS };
      }
      state.type = "takeCoins";
      state.coinCost[action.payload]--;
      state.coinCost[Color.Yellow] = 0;
      state.card = null;
    },
    unPrepCoin: (state, action: PayloadAction<Color>) => {
      state.coinCost[action.payload as Color]++;
      if (!getNumCoins(state.coinCost)) state.type = "none";
    },
    setType: (state, action: PayloadAction<ActionOnDeck["type"]>) => {
      state.type = action.payload;
    },
    prepBuyCard: (
      state,
      action: PayloadAction<{ card: Card; coinCost: Action["coinCost"] }>
    ) => {
      state.type = "buy";
      state.card = action.payload.card;
      state.coinCost = action.payload.coinCost;
    },
    unPrepBuyCard: (state) => {
      state.type = "none";
      state.card = null;
      state.coinCost = EMPTY_COINS;
    },
    prepReserveCard: (
      state,
      action: PayloadAction<{ card: Card; takeYellow: boolean }>
    ) => {
      state.type = "reserve";
      state.card = action.payload.card;
      state.coinCost = {
        ...EMPTY_COINS,
        [Color.Yellow]: action.payload.takeYellow ? -1 : 0,
      };
    },
    unPrepReserveCard: (state) => {
      state.type = "none";
      state.card = null;
      state.coinCost = EMPTY_COINS;
    },
    prepBuyReserveCard: (
      state,
      action: PayloadAction<{ card: Card; coinCost: Action["coinCost"] }>
    ) => {
      state.type = "buyReserve";
      state.card = action.payload.card;
      state.coinCost = action.payload.coinCost;
    },
    unPrepBuyReserveCard: (state) => {
      state.type = "none";
      state.card = null;
      state.coinCost = EMPTY_COINS;
    },
    cancelAllPrep: () => INITIAL_STATE,
    setActionOnDeck: (state, action) => _.assign(state, action.payload),
  },
  extraReducers: (builder: ActionReducerMapBuilder<ActionOnDeck>) => {
    builder.addCase(takeActionAction, (state) => INITIAL_STATE);
  },
});

export const {
  prepCoin,
  unPrepCoin,
  setActionOnDeck,
  setType,
  prepBuyCard,
  unPrepBuyCard,
  prepReserveCard,
  unPrepReserveCard,
  prepBuyReserveCard,
  unPrepBuyReserveCard,
  cancelAllPrep,
} = actionOnDeckSlice.actions;
export const actionOnDeck = actionOnDeckSlice.reducer;
