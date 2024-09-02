import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { GameRecord } from "../../models/functions";
import { takeActionAction } from "./game";
import { Game } from "../../models/Splendor";

export const gameRecordSlice = createSlice({
  name: "gameRecord",
  initialState: {
    startTime: 0,
    endTime: 0,
    players: [],
    startCards: [],
    startNobles: [],
  } as GameRecord,
  reducers: {
    startGameRecord: (state, action: PayloadAction<Game>) => {
      state.startTime = Date.now();
      state.endTime = 0;
      state.players = action.payload.players.map((player) => ({
        isHuman: player.isHuman,
        points: 0,
        cards: [],
        nobles: [],
        takeCoinsActions: 0,
        reserveActions: 0,
      }));
      state.startCards = action.payload.table.map((card) => card.id);
      state.startNobles = action.payload.nobles.map((noble) => noble.id);
    },
    endGameRecord: (state, action: PayloadAction<Game>) => {
      state.endTime = Date.now();
      state.players = action.payload.players.map((player, i) => ({
        ...state.players[i],
        points: player.points,
        cards: player.bought.map((card) => card.id),
        nobles: player.nobles.map((noble) => noble.id),
      }));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(takeActionAction, (state, action) => {
      const type = action.payload.type;
      switch (type) {
        case "takeCoins":
          state.players[action.payload.playerIndex].takeCoinsActions =
            state.players[action.payload.playerIndex].takeCoinsActions + 1;
          break;
        case "reserve":
          state.players[action.payload.playerIndex].reserveActions =
            state.players[action.payload.playerIndex].reserveActions + 1;
          break;
      }
      return state;
    });
  },
});

export const { startGameRecord, endGameRecord } = gameRecordSlice.actions;
export const gameRecord = gameRecordSlice.reducer;
