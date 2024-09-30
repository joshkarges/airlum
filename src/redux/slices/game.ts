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
  initialState: setupGame({ numberOfHumans: 2, numberOfAi: 0 }),
  reducers: {
    setGame: (state, action: PayloadAction<Game>) => action.payload,
    takeAction: (
      state,
      action: PayloadAction<
        Action & {
          dontAdvance?: boolean;
          popNoble?: boolean;
          playerIndex: number;
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
        const player = newState.players[getPlayerIndex(newState)];
        player.nobles = [...player.nobles];
        const poppedNoble = player.nobles.pop();
        if (!poppedNoble) return newState;
        player.points -= poppedNoble.points;
        newState.nobles = [...newState.nobles, poppedNoble];
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
  takeAction: takeActionAction,
  putCoinBack,
  chooseNoble,
  setGame,
} = gameSlice.actions;
export const game = gameSlice.reducer;
