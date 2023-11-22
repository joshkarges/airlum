import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ExchangeEvent } from "../../models/ExchangeEvent";

const exchangeEventSlice = createSlice({
  name: 'exchangeEvent',
  initialState: null as ExchangeEvent | null,
  reducers: {
    setExchangeEvent: (state, action: PayloadAction<ExchangeEvent>) => {
      return action.payload;
    },
  },
});

export const { setExchangeEvent } = exchangeEventSlice.actions;
export const exchangeEvent = exchangeEventSlice.reducer;
