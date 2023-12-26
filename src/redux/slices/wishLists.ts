import _ from "lodash";
import {
  addCommentOnServer,
  addIdeaOnServer,
  createWishListOnServer,
  deleteCommentOnServer,
  deleteExtraWishListOnServer,
  deleteIdeaOnServer,
  getAllWishListsFromServer,
  markIdeaOnServer,
  updateCommentOnServer,
  updateIdeaMetadataOnServer,
  updateWishListMetadataOnServer,
} from "../../api/ChristmasListApi";
import { WishList } from "../../models/functions";
import {
  AnyAction,
  FetchedResource,
  FetchedStatusString,
  Fetcher,
  isPendingAction,
  isSuccessAction,
  makeFetchedResourceReducer,
  makeFetchingActionCreator,
  makeIdleFetchedResource,
  UnsureReducer,
} from "../../utils/fetchers";

const initialState = {} as Record<string, WishList>;

const makeWishListAction = <Req, Res>(fn: Fetcher<Res, [Req]>) => {
  return makeFetchingActionCreator(`wishLists/${_.get(fn, "displayName")}`, fn);
};

export const getAllWishListsAction = makeWishListAction(
  getAllWishListsFromServer
);

export const createWishListAction = makeWishListAction(createWishListOnServer);

export const deleteExtraWishListAction = makeWishListAction(
  deleteExtraWishListOnServer
);

export const updateWishListMetadataAction = makeWishListAction(
  updateWishListMetadataOnServer
);

export const addIdeaAction = makeWishListAction(addIdeaOnServer);

export const deleteIdeaAction = makeWishListAction(deleteIdeaOnServer);
export const markIdeaAction = makeWishListAction(markIdeaOnServer);
export const updateIdeaMetadataAction = makeWishListAction(
  updateIdeaMetadataOnServer
);
export const addCommentAction = makeWishListAction(addCommentOnServer);
export const deleteCommentAction = makeWishListAction(deleteCommentOnServer);
export const updateCommentAction = makeWishListAction(updateCommentOnServer);

const wishListsGetAllReducer = makeFetchedResourceReducer(
  getAllWishListsAction.type,
  initialState
);

export const CREATING_WISHLIST_ID = "CREATING_WISHLIST_ID";

export const wishLists: UnsureReducer<FetchedResource<typeof initialState>> = (
  state = makeIdleFetchedResource(initialState),
  action: AnyAction
) => {
  let newState = wishListsGetAllReducer(state, action);
  if (isPendingAction(action, createWishListAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [CREATING_WISHLIST_ID]: {
          id: CREATING_WISHLIST_ID,
          createdAt: action.timestamp,
          updatedAt: action.timestamp,
          author: {
            uid: "temp-creator-id",
            displayName: "temp-creator-name",
            email: "temp-creator-email",
          },
          ideas: {},
          notes: "",
          title: "",
          ...action.opts,
        },
      },
    };
  }
  if (isSuccessAction(action, createWishListAction)) {
    const { [CREATING_WISHLIST_ID]: _unused, ...dataWithoutTempList } =
      newState.data;
    newState = {
      ...newState,
      data: {
        ...dataWithoutTempList,
        [action.data.wishList.id]: action.data.wishList,
      },
    };
  }
  if (isPendingAction(action, deleteExtraWishListAction)) {
    newState = {
      ...newState,
      data: _.omit(newState.data, action.opts.wishListId),
    };
  }
  if (isPendingAction(action, updateWishListMetadataAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.id]: {
          ...newState.data[action.opts.id],
          ...action.opts,
          updatedAt: action.timestamp,
        },
      },
    };
  }
  if (isSuccessAction(action, addIdeaAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.wishListId]: {
          ...newState.data[action.opts.wishListId],
          ideas: {
            ...newState.data[action.opts.wishListId].ideas,
            [action.data.idea.id]: action.data.idea,
          },
          updatedAt: action.timestamp,
        },
      },
    };
  }
  if (isPendingAction(action, deleteIdeaAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.wishListId]: {
          ...newState.data[action.opts.wishListId],
          ideas: _.omit(
            newState.data[action.opts.wishListId].ideas,
            action.opts.ideaId
          ),
          updatedAt: action.timestamp,
        },
      },
    };
  }
  if (isSuccessAction(action, markIdeaAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.wishListId]: {
          ...newState.data[action.opts.wishListId],
          ideas: {
            ...newState.data[action.opts.wishListId].ideas,
            [action.opts.ideaId]: {
              ...newState.data[action.opts.wishListId].ideas[
                action.opts.ideaId
              ],
              mark: action.data.mark,
              updatedAt: action.timestamp,
            },
          },
          updatedAt: action.timestamp,
        },
      },
      status: FetchedStatusString.Success,
    };
  }
  if (isPendingAction(action, updateIdeaMetadataAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.wishListId]: {
          ...newState.data[action.opts.wishListId],
          ideas: {
            ...newState.data[action.opts.wishListId].ideas,
            [action.opts.ideaId]: {
              ...newState.data[action.opts.wishListId].ideas[
                action.opts.ideaId
              ],
              ..._.pick(action.opts, "title", "description"),
              updatedAt: action.timestamp,
            },
          },
          updatedAt: action.timestamp,
        },
      },
    };
  }
  if (isSuccessAction(action, addCommentAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.wishListId]: {
          ...newState.data[action.opts.wishListId],
          ideas: {
            ...newState.data[action.opts.wishListId].ideas,
            [action.opts.ideaId]: {
              ...newState.data[action.opts.wishListId].ideas[
                action.opts.ideaId
              ],
              comments: {
                ...newState.data[action.opts.wishListId].ideas[
                  action.opts.ideaId
                ].comments,
                [action.data.comment.id]: action.data.comment,
              },
            },
          },
        },
      },
    };
  }
  if (isPendingAction(action, deleteCommentAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.wishListId]: {
          ...newState.data[action.opts.wishListId],
          ideas: {
            ...newState.data[action.opts.wishListId].ideas,
            [action.opts.ideaId]: {
              ...newState.data[action.opts.wishListId].ideas[
                action.opts.ideaId
              ],
              comments: _.omit(
                newState.data[action.opts.wishListId].ideas[action.opts.ideaId]
                  .comments,
                action.opts.commentId
              ),
              updatedAt: action.timestamp,
            },
          },
          updatedAt: action.timestamp,
        },
      },
    };
  }
  if (isPendingAction(action, updateCommentAction)) {
    newState = {
      ...newState,
      data: {
        ...newState.data,
        [action.opts.wishListId]: {
          ...newState.data[action.opts.wishListId],
          ideas: {
            ...newState.data[action.opts.wishListId].ideas,
            [action.opts.ideaId]: {
              ...newState.data[action.opts.wishListId].ideas[
                action.opts.ideaId
              ],
              comments: {
                ...newState.data[action.opts.wishListId].ideas[
                  action.opts.ideaId
                ].comments,
                [action.opts.commentId]: {
                  ...newState.data[action.opts.wishListId].ideas[
                    action.opts.ideaId
                  ].comments[action.opts.commentId],
                  ..._.pick(action.opts, "text"),
                  updatedAt: action.timestamp,
                },
              },
              updatedAt: action.timestamp,
            },
          },
          updatedAt: action.timestamp,
        },
      },
    };
  }

  return newState;
};
