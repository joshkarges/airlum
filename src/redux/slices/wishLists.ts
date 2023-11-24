import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChristmasList, EditMyListFormType } from "../../models/functions";

const WishListsSlice = createSlice({
  name: "wishLists",
  initialState: [] as ChristmasList[],
  reducers: {
    setWishLists: (state, action: PayloadAction<ChristmasList[]>) => {
      return action.payload;
    },
    setWishList: (
      state,
      action: PayloadAction<{
        userId: string;
        list: EditMyListFormType;
        exchangeEvent: string;
      }>
    ) => {
      const index = state.findIndex(
        (list) => list.user.uid === action.payload.userId
      );
      if (index !== -1) {
        state[index].ideas = action.payload.list.ideas;
        state[index].exchangeEvent = action.payload.exchangeEvent;
      }
    },
  },
});

export const { setWishLists, setWishList } = WishListsSlice.actions;
export const wishLists = WishListsSlice.reducer;
