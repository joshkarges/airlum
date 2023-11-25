import { WriteResult } from "firebase-admin/firestore";

export type ServerResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

export type ExchangeEvent = {
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
  description: string;
  notes: string;
  timestamp: number;
  id: string;
};

export type ChristmasList = {
  ideas: Idea[];
  exchangeEvent: string;
  createdAt: number;
  user: {
    email: string;
    uid: string;
    displayName: string;
  };
  updatedAt: number;
  docId: string;
};

export type EditMyListFormType = {
  ideas: Idea[];
};

export const wishListToForm = (wishList: ChristmasList): EditMyListFormType => {
  return {
    ideas: wishList.ideas,
  };
};

export type SetWishListRequest = EditMyListFormType & {
  exchangeEvent: string;
  docId?: string;
};
export type SetWishListResponse = ServerResponse<WriteResult | null>;

export type GetExchangeEventRequest = { exchangeEvent: string };

export type GetExchangeEventResponse = ServerResponse<ExchangeEvent | null>;

export type GetAllWishListsRequest = { exchangeEvent: string };

export type GetAllWishListsResponse = ServerResponse<ChristmasList[]>;
