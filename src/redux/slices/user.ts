import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../models/functions";
import {
  FetchedStatusString,
  makeIdleFetchedResource,
  makeSimpleSettingActionCreator,
} from "../../utils/fetchers";

export const clearAllAction = makeSimpleSettingActionCreator("user/clearAll");

const userSlice = createSlice({
  name: "user",
  initialState: makeIdleFetchedResource(null as User | null),
  reducers: {
    userAuthChange: (state, action: PayloadAction<User | null>) => {
      return {
        ...state,
        data: action.payload,
        status: FetchedStatusString.Success,
      };
    },
    userAuthPending: (state, action: PayloadAction<void>) => {
      return {
        ...state,
        status: FetchedStatusString.Pending,
      };
    },
  },
});

export const { userAuthChange, userAuthPending } = userSlice.actions;
export const user = userSlice.reducer;
