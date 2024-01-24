type UserCreatedAsset = {
  id: string;
  createdAt: number;
  updatedAt: number;
  author: User;
};

export type ExchangeEventMetadata = {
  name: string;
  description: string;
  date: number;
  users: string[];
};

export type ExchangeEvent = UserCreatedAsset & ExchangeEventMetadata;

export type User = {
  email: string;
  uid: string;
  displayName: string;
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
  author: User;
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
export type CreateWishListRequest = Partial<WishListMetadata> & {
  exchangeEvent: string;
  isExtra: boolean;
};

export type CreateWishListResponse = {
  wishList: WishList;
};

/** Delete Extra Wish List */
export type DeleteExtraWishListRequest = {
  wishListId: string;
};

export type DeleteExtraWishListResponse = null;

/** Update Wish List Metadata */
export type UpdateWishListMetadataRequest = Partial<WishListMetadata> & {
  id: string;
};

export type UpdateWishListMetadataResponse = null;

/** Add Idea */
export type AddIdeaRequest = {
  wishListId: string;
  idea: IdeaMetadata;
};

export type AddIdeaResponse = {
  idea: Idea;
};

/** Delete Idea */
export type DeleteIdeaRequest = {
  wishListId: string;
  ideaId: string;
};

export type DeleteIdeaResponse = null;

/** Update Idea Metadata */
export type UpdateIdeaMetadataRequest = Partial<IdeaMetadata> & {
  wishListId: string;
  ideaId: string;
};

export type UpdateIdeaMetadataResponse = null;

/** Mark Idea */
export type MarkIdeaRequest = {
  wishListId: string;
  ideaId: string;
  status: IdeaMarkStatus;
};

export type MarkIdeaResponse = { mark: Mark };

/** Add Comment */
export type AddCommentRequest = {
  wishListId: string;
  ideaId: string;
  text: string;
};

export type AddCommentResponse = {
  comment: Comment;
};

/** Delete Comment */
export type DeleteCommentRequest = {
  wishListId: string;
  ideaId: string;
  commentId: string;
};

export type DeleteCommentResponse = null;

/** Update Comment */
export type UpdateCommentRequest = {
  wishListId: string;
  ideaId: string;
  commentId: string;
  text: string;
};

export type UpdateCommentResponse = null;

/** Get Exchange Event */
export type GetExchangeEventRequest = { exchangeEvent: string };

export type GetExchangeEventResponse = ExchangeEvent;

/** Get All Wish Lists */
export type GetAllWishListsRequest = { exchangeEvent: string };

export type GetAllWishListsResponse = Record<string, WishList>;

/** Get All Exchange Events */
export type GetAllExchangeEventsRequest = {
  uid: string;
};

export type GetAllExchangeEventsResponse = Record<string, ExchangeEvent>;

/** Create Exchange Event */
export type CreateExchangeEventRequest = ExchangeEventMetadata;

export type CreateExchangeEventResponse = ExchangeEvent;

/** Update Exchange Event */
export type UpdateExchangeEventRequest = Partial<ExchangeEventMetadata> & {
  id: string;
};

export type UpdateExchangeEventResponse = null;

export type DeleteExchangeEventRequest = {
  exchangeEventId: string;
};

export type DeleteExchangeEventResponse = null;
