import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum GameState {
  play = "play",
  chooseCoins = "chooseCoins",
  chooseNobles = "chooseNobles",
  endGame = "endGame",
}

type GameStateString = keyof typeof GameState;

const gameStateSlice = createSlice({
  name: "gameState",
  initialState: GameState.play as GameStateString,
  reducers: {
    setGameState: (state, action: PayloadAction<GameStateString>) =>
      action.payload,
  },
});

export const { setGameState } = gameStateSlice.actions;
export const gameState = gameStateSlice.reducer;
