import _ from "lodash";
import { isSuccessAction, UnsureReducer } from "../../utils/fetchers";
import {
  getAllWishListsAction,
  createWishListAction,
  addIdeaAction,
  addCommentAction,
} from "./wishLists";

const getNameSet = (name: string) => {
  if (!name) return { first: "", firstL: "", firstLast: "", full: "" };
  const splitAuthor = _.startCase(name.toLowerCase()).split(" ");
  return {
    first: splitAuthor[0],
    firstL: `${splitAuthor[0]} ${
      splitAuthor[splitAuthor.length - 1]?.[0] ?? ""
    }`.trim(),
    firstLast: `${splitAuthor[0]} ${
      splitAuthor[splitAuthor.length - 1] ?? ""
    }`.trim(),
    full: name,
  };
};

const getShortNameMap = (nameMap: Record<string, string>) => {
  const nameCounts = _.reduce(
    nameMap,
    (acc, fullName) => {
      const nameSet = getNameSet(fullName);
      new Set(_.values(nameSet)).forEach((name) => {
        acc[name] = (acc[name] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );
  return _.mapValues(nameMap, (fullName) => {
    const nameSet = getNameSet(fullName);
    if (nameCounts[nameSet.first] === 1) return nameSet.first;
    if (nameCounts[nameSet.firstL] === 1) return nameSet.firstL;
    if (nameCounts[nameSet.firstLast] === 1) return nameSet.firstLast;
    return nameSet.full;
  });
};

export const userShortNames: UnsureReducer<Record<string, string>> = (
  state = {},
  action
) => {
  if (isSuccessAction(action, getAllWishListsAction)) {
    return getShortNameMap(
      _.reduce(
        action.data,
        (acc, wishList) => {
          acc[wishList.author.uid] = wishList.author.displayName;
          _.forEach(wishList.ideas, (idea) => {
            acc[idea.author.uid] = idea.author.displayName;
            _.forEach(idea.comments, (comment) => {
              acc[comment.author.uid] = comment.author.displayName;
            });
          });
          return acc;
        },
        {} as Record<string, string>
      )
    );
  }
  if (isSuccessAction(action, createWishListAction)) {
    return getShortNameMap({
      ...state,
      [action.data.wishList.author.uid]:
        action.data.wishList.author.displayName,
    });
  }
  if (isSuccessAction(action, addIdeaAction)) {
    return getShortNameMap({
      ...state,
      [action.data.idea.author.uid]: action.data.idea.author.displayName,
    });
  }
  if (isSuccessAction(action, addCommentAction)) {
    return getShortNameMap({
      ...state,
      [action.data.comment.author.uid]: action.data.comment.author.displayName,
    });
  }
  return state;
};
