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
  users: {
    email: string;
    joinedAt: number;
    uid: string;
  }[];
};

export type User = {
  email: string;
  uid: string;
  displayName: string;
};

type UserCreatedAsset = {
  id: string;
  createdAt: number;
  updatedAt: number;
  user: User;
};

export type Comment = UserCreatedAsset & {
  text: string;
};

export enum IdeaMarkStatus {
  Completed = "completed",
  Incomplete = "incomplete",
  Reserved = "reserved",
  Deleted = "deleted",
}

export type IdeaMetadata = {
  title: string;
  description: string;
};

export type Mark = {
  user: User;
  timestamp: number;
  status: IdeaMarkStatus;
};

export type Idea = UserCreatedAsset &
  IdeaMetadata & {
    comments: Record<string, Comment>;
    mark: Mark | null;
  };

export type WishListMetadata = {
  title: string;
  notes: string;
};

export type WishList = UserCreatedAsset &
  WishListMetadata & {
    ideas: Record<string, Idea>;
    exchangeEvent: string; // Needs index in firestore
    isExtra: boolean;
  };

export type EditMyListFormType = Partial<WishList>;

export const wishListToForm = (wishList: WishList): EditMyListFormType => {
  return {
    ideas: wishList.ideas,
  };
};

/** Create Wish List */
export type CreateWishListRequest = {
  exchangeEvent: string;
  isExtra: boolean;
};

export type CreateWishListResponse = ServerResponse<{
  wishList: WishList;
} | null>;

/** Delete Extra Wish List */
export type DeleteExtraWishListRequest = {
  wishListId: string;
};

export type DeleteExtraWishListResponse = ServerResponse<null>;

/** Update Wish List Metadata */
export type UpdateWishListMetadataRequest = Partial<WishListMetadata> & {
  id: string;
};

export type UpdateWishListMetadataResponse = ServerResponse<null>;

/** Add Idea */
export type AddIdeaRequest = {
  wishListId: string;
  idea: IdeaMetadata;
};

export type AddIdeaResponse = ServerResponse<{
  idea: Idea;
} | null>;

/** Delete Idea */
export type DeleteIdeaRequest = {
  wishListId: string;
  ideaId: string;
};

export type DeleteIdeaResponse = ServerResponse<null>;

/** Update Idea Metadata */
export type UpdateIdeaMetadataRequest = Partial<IdeaMetadata> & {
  wishListId: string;
  ideaId: string;
};

export type UpdateIdeaMetadataResponse = ServerResponse<null>;

/** Mark Idea */
export type MarkIdeaRequest = {
  wishListId: string;
  ideaId: string;
  status: IdeaMarkStatus;
};

export type MarkIdeaResponse = ServerResponse<{ mark: Mark } | null>;

/** Add Comment */
export type AddCommentRequest = {
  wishListId: string;
  ideaId: string;
  text: string;
};

export type AddCommentResponse = ServerResponse<{
  comment: Comment;
} | null>;

/** Delete Comment */
export type DeleteCommentRequest = {
  wishListId: string;
  ideaId: string;
  commentId: string;
};

export type DeleteCommentResponse = ServerResponse<null>;

/** Update Comment */
export type UpdateCommentRequest = {
  wishListId: string;
  ideaId: string;
  commentId: string;
  text: string;
};

export type UpdateCommentResponse = ServerResponse<null>;

/** Get Exchange Event */
export type GetExchangeEventRequest = { exchangeEvent: string };

export type GetExchangeEventResponse = ServerResponse<ExchangeEvent | null>;

/** Get All Wish Lists */
export type GetAllWishListsRequest = { exchangeEvent: string };

export type GetAllWishListsResponse = ServerResponse<Record<string, WishList>>;
