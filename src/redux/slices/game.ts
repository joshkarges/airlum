import { createSlice } from "@reduxjs/toolkit";
import { setupGame, takeAction } from "../../utils/splendor";

const gameSlice = createSlice({
  name: 'game',
  initialState: setupGame(2),
  reducers: {
    setupGame: (state, action) => setupGame(action.payload.numPlayers),
    takeAction: (state, action) => takeAction(state, { type: action.type, ...action.payload }),
  },
});

export const { setupGame: setupGameAction, takeAction: takeActionAction } = gameSlice.actions;
export const game = gameSlice.reducer;