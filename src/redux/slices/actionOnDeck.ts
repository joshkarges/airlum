import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { EMPTY_COINS } from "../../constants/utils";
import { Card, Color } from "../../models/Splendor";
import { getNumCoins } from "../../utils/splendor";
import { takeActionAction } from "./game";

const INITIAL_STATE = {
  type: 'none',
  coins: EMPTY_COINS,
  card: null as null | Card,
};

export const actionOnDeckSlice = createSlice({
  name: 'actionOnDeck',
  initialState: INITIAL_STATE,
  reducers: {
    prepCoin: (state, action) => {
      state.type = 'takeCoins';
      state.coins[action.payload as Color]++;
    },
    unPrepCoin: (state, action) => {
      state.coins[action.payload as Color]--;
      if (!getNumCoins(state.coins)) state.type = 'none';
    },
    setType: (state, action) => {
      state.type = action.payload;
    },
    prepBuyCard: (state, action) => {
      state.type = 'buy';
      state.card = action.payload;
    },
    unPrepBuyCard: (state) => {
      state.type = 'none';
      state.card = null;
    },
    prepReserveCard: (state, action) => {
      state.type = 'reserve';
      state.card = action.payload.card;
      state.coins[Color.Yellow] = action.payload.yellow;
    },
    unPrepReserveCard: (state) => {
      state.type = 'none';
      state.card = null;
      state.coins[Color.Yellow] = 0;
    },
    prepBuyReserveCard: (state, action: PayloadAction<Card>) => {
      state.type = 'buyReserve';
      state.card = action.payload;
    },
    unPrepBuyReserveCard: (state) => {
      state.type = 'none';
      state.card = null;
    },
    cancel: () => INITIAL_STATE,
    setActionOnDeck: (state, action) => _.assign(state, action.payload),
  },
  extraReducers: (builder) => {
    builder.addCase(takeActionAction, (state) => INITIAL_STATE)
  },
});

export const { prepCoin, unPrepCoin, setActionOnDeck, setType, prepBuyCard, unPrepBuyCard, prepReserveCard, unPrepReserveCard, prepBuyReserveCard, unPrepBuyReserveCard, cancel } = actionOnDeckSlice.actions;
export const actionOnDeck = actionOnDeckSlice.reducer;