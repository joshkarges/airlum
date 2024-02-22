import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { Action, Color, Game, Noble } from "../../models/Splendor";
import {
  getNumCoins,
  getPlayerIndex,
  setupGame,
  takeAction,
} from "../../utils/splendor";
import { original } from "immer";

const gameSlice = createSlice({
  name: "game",
  initialState: setupGame(2),
  reducers: {
    setGame: (state, action: PayloadAction<Game>) => action.payload,
    setupGame: (state, action: PayloadAction<2 | 3 | 4>) =>
      setupGame(action.payload),
    takeAction: (
      state,
      action: PayloadAction<
        Action & {
          dontAdvance?: boolean;
          popNoble?: boolean;
        }
      >
    ) => {
      const { dontAdvance, popNoble, ...gameAction } = action.payload;
      const newState = takeAction(original(state)!, gameAction);
      if (dontAdvance) {
        newState.turn = state.turn;
      }
      if (popNoble) {
        // Return the noble you just aquired because there are multiple to choose from.
        const player =
          newState.players[newState.turn % newState.players.length];
        const poppedNoble = player.nobles.pop();
        if (!poppedNoble) return newState;
        player.points -= poppedNoble.points;
        newState.nobles.push(poppedNoble);
      }
      return newState;
    },
    putCoinBack: (
      state,
      action: PayloadAction<{ color: Color; playerIndex: number }>
    ) => {
      state.coins[action.payload.color]++;
      state.players[action.payload.playerIndex].coins[action.payload.color]--;
      if (getNumCoins(state.players[action.payload.playerIndex].coins) <= 10)
        state.turn++;
    },
    chooseNoble: (state, action: PayloadAction<Noble>) => {
      const player = state.players[getPlayerIndex(state)];
      _.remove(state.nobles, action.payload);
      player.points += action.payload.points;
      player.nobles.push(action.payload);
      state.turn++;
    },
  },
});

export const {
  setupGame: setupGameAction,
  takeAction: takeActionAction,
  putCoinBack,
  chooseNoble,
  setGame,
} = gameSlice.actions;
export const game = gameSlice.reducer;
