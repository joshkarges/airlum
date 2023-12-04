import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WishList, EditMyListFormType } from "../../models/functions";
import { makeFetchedResourceReducer } from "../../utils/fetchers";

const WishListsSlice = createSlice({
  name: "wishLists",
  initialState: [] as WishList[],
  reducers: {
    setWishLists: makeFetchedResourceReducer("wishLists/setWishLists"),
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
