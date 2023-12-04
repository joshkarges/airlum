import { WriteResult } from "firebase-admin/firestore";

export type ServerResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

export type ExchangeEvent = {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  description: string;
  owner: {
    email: string;
    uid: string;
  };
  ledger: {
    [uid: string]: {
      [ideaId: string]: {
        completedBy: string;
        completedAt: number;
        ideaTimestamp: number;
      };
    };
  }[];
  users: {
    email: string;
    joinedAt: number;
    uid: string;
  }[];
};

export type Idea = {
  id: string;
  description: string;
  timestamp: number;
};

type UserCreatedAsset = {
  id: string;
  createdAt: number;
  updatedAt: number;
  user: {
    email: string;
    uid: string;
    displayName: string;
  };
};

export type Comment = UserCreatedAsset & {
  text: string;
};

export type WishItem = UserCreatedAsset & {
  title: string;
  description: string;
  comments: Comment[];
};

export type WishList = UserCreatedAsset & {
  title: string;
  notes: string;
  ideas: WishItem[];
  exchangeEvent: string; // Needs index in firestore
};

export type EditMyListFormType = Partial<WishList>;

export const wishListToForm = (wishList: WishList): EditMyListFormType => {
  return {
    ideas: wishList.ideas,
  };
};

export type SetWishListRequest = EditMyListFormType & {
  exchangeEvent: string;
  id?: string;
};

export type SetWishListResponse = ServerResponse<WriteResult | null>;

export type GetExchangeEventRequest = { exchangeEvent: string };

export type GetExchangeEventResponse = ServerResponse<ExchangeEvent | null>;

export type GetAllWishListsRequest = { exchangeEvent: string };

export type GetAllWishListsResponse = ServerResponse<WishList[]>;
