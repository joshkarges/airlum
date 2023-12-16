import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../models/functions";

const userSlice = createSlice({
  name: "user",
  initialState: null as User | null,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      return action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;
export const user = userSlice.reducer;
