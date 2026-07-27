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
        const currentPlayerIndex = getPlayerIndex(newState);
        const player = newState.players[currentPlayerIndex];
        const noblesBeforeAction =
          state.players[currentPlayerIndex].nobles.length;
        // Only give back a noble that this action actually earned, never an older one.
        if (player.nobles.length <= noblesBeforeAction) return newState;
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
      action: PayloadAction<{
        color: Color;
        playerIndex: number;
        /** When finishing discard but the same player must still choose a noble, do not advance turn yet (chooseNoble will). */
        skipTurnAdvance?: boolean;
      }>
    ) => {
      const { color, playerIndex, skipTurnAdvance } = action.payload;
      state.coins[color]++;
      state.players[playerIndex].coins[color]--;
      if (
        getNumCoins(state.players[playerIndex].coins) <= 10 &&
        !skipTurnAdvance
      )
        state.turn++;
    },
    chooseNoble: (state, action: PayloadAction<Noble>) => {
      // Ignore a repeated choice so points and turn are only applied once.
      if (!_.some(state.nobles, (noble) => noble.id === action.payload.id))
        return;
      const player = state.players[getPlayerIndex(state)];
      _.remove(state.nobles, (noble) => noble.id === action.payload.id);
      player.points += action.payload.points;
      player.nobles.push(action.payload);
      state.turn++;
    },
    /** The turn was held back for a noble choice that turned out not to exist. */
    skipNobleChoice: (state, action: PayloadAction<{ turn: number }>) => {
      if (state.turn === action.payload.turn) state.turn++;
    },
  },
});

export const {
  takeAction: takeActionAction,
  putCoinBack,
  chooseNoble,
  skipNobleChoice,
  setGame,
} = gameSlice.actions;
export const game = gameSlice.reducer;
