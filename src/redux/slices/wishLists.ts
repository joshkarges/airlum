import { produce } from "immer";
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
  isSettingAction,
  isSuccessAction,
  makeFetchedResourceReducer,
  makeFetchingActionCreator,
  makeIdleFetchedResource,
  UnsureReducer,
} from "../../utils/fetchers";
import { clearAllAction } from "./user";

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

const updateUpdatedAt = (
  wishList: WishList,
  timestamp: number,
  ideaId?: string,
  commentId?: string
) => {
  wishList.updatedAt = timestamp;
  if (ideaId) {
    wishList.ideas[ideaId].updatedAt = timestamp;
    if (commentId) {
      wishList.ideas[ideaId].comments[commentId].updatedAt = timestamp;
    }
  }
};

export const wishLists: UnsureReducer<FetchedResource<typeof initialState>> =
  produce(
    (state = makeIdleFetchedResource(initialState), action: AnyAction) => {
      let newState = wishListsGetAllReducer(state, action);
      if (isPendingAction(action, createWishListAction)) {
        newState.data[CREATING_WISHLIST_ID] = {
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
        };
      }
      if (isSuccessAction(action, createWishListAction)) {
        delete newState.data[CREATING_WISHLIST_ID];
        newState.data[action.data.wishList.id] = action.data.wishList;
      }
      if (isPendingAction(action, deleteExtraWishListAction)) {
        delete newState.data[action.opts.wishListId];
      }
      if (isPendingAction(action, updateWishListMetadataAction)) {
        newState.data[action.opts.id] = {
          ...newState.data[action.opts.id],
          ...action.opts,
          updatedAt: action.timestamp,
        };
      }
      if (isSuccessAction(action, addIdeaAction)) {
        const { wishListId } = action.opts;
        newState.data[wishListId].ideas[action.data.idea.id] = action.data.idea;
        updateUpdatedAt(newState.data[wishListId], action.timestamp);
      }
      if (isPendingAction(action, deleteIdeaAction)) {
        const { wishListId, ideaId } = action.opts;
        delete newState.data[wishListId].ideas[ideaId];
        updateUpdatedAt(newState.data[wishListId], action.timestamp);
      }
      if (isSuccessAction(action, markIdeaAction)) {
        const { wishListId, ideaId } = action.opts;
        newState.data[wishListId].ideas[ideaId].mark = action.data.mark;
        updateUpdatedAt(newState.data[wishListId], action.timestamp, ideaId);
      }
      if (isPendingAction(action, updateIdeaMetadataAction)) {
        const { wishListId, ideaId } = action.opts;
        newState.data[wishListId].ideas[ideaId] = {
          ...newState.data[wishListId].ideas[ideaId],
          ..._.pick(action.opts, "title", "description"),
        };
        updateUpdatedAt(newState.data[wishListId], action.timestamp, ideaId);
      }
      if (isSuccessAction(action, addCommentAction)) {
        const { wishListId, ideaId } = action.opts;
        newState.data[wishListId].ideas[ideaId].comments[
          action.data.comment.id
        ] = action.data.comment;
        updateUpdatedAt(newState.data[wishListId], action.timestamp, ideaId);
      }
      if (isPendingAction(action, deleteCommentAction)) {
        const { wishListId, ideaId, commentId } = action.opts;
        delete newState.data[wishListId].ideas[ideaId].comments[commentId];
        updateUpdatedAt(newState.data[wishListId], action.timestamp, ideaId);
      }
      if (isPendingAction(action, updateCommentAction)) {
        const { wishListId, ideaId, commentId } = action.opts;
        newState.data[wishListId].ideas[ideaId].comments[commentId].text =
          action.opts.text;
        updateUpdatedAt(
          newState.data[wishListId],
          action.timestamp,
          ideaId,
          commentId
        );
      }
      if (isSettingAction(action, clearAllAction)) {
        return makeIdleFetchedResource({});
      }

      return newState;
    }
  );
