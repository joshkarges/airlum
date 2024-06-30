import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const showGameSetupSlice = createSlice({
  name: "showGameSetup",
  initialState: true,
  reducers: {
    setShowGameSetup: (state, action: PayloadAction<boolean>) => action.payload,
  },
});

export const { setShowGameSetup } = showGameSetupSlice.actions;
export const showGameSetup = showGameSetupSlice.reducer;
