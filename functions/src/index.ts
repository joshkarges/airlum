/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";
import * as uuid from "uuid";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// The Firebase Admin SDK to access Firestore.
import * as admin from "firebase-admin";
import { FieldValue, getFirestore, UpdateData } from "firebase-admin/firestore";
import {
  User,
  ExchangeEvent,
  GetExchangeEventRequest,
  GetExchangeEventResponse,
  WishList,
  CreateWishListRequest,
  CreateWishListResponse,
  GetAllWishListsRequest,
  GetAllWishListsResponse,
  UpdateWishListMetadataRequest,
  UpdateWishListMetadataResponse,
  DeleteExtraWishListRequest,
  DeleteExtraWishListResponse,
  Idea,
  AddIdeaRequest,
  AddIdeaResponse,
  UpdateIdeaMetadataRequest,
  UpdateIdeaMetadataResponse,
  DeleteIdeaRequest,
  DeleteIdeaResponse,
  Mark,
  MarkIdeaRequest,
  MarkIdeaResponse,
  Comment,
  AddCommentRequest,
  AddCommentResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
  GetAllExchangeEventsResponse,
  GetAllExchangeEventsRequest,
  CreateExchangeEventRequest,
  CreateExchangeEventResponse,
  UpdateExchangeEventRequest,
  UpdateExchangeEventResponse,
  DeleteExchangeEventRequest,
  DeleteExchangeEventResponse,
} from "./models";
import _ = require("lodash");
import { AuthData } from "firebase-functions/lib/common/providers/https";

admin.initializeApp();

exports.health = onCall(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async () => {
    return "OK";
  }
);

const getUserFromAuth = (auth: AuthData | undefined) => {
  if (!auth) return null;
  return {
    displayName: auth.token.name,
    uid: auth.uid,
    email: auth.token.email,
  } as User;
};

const runWishListTransaction = async <T>(
  wishListId: string,
  updateFunction: (
    transaction: admin.firestore.Transaction,
    doc: admin.firestore.DocumentReference<WishList>,
    wishList: WishList
  ) => Promise<T>
) => {
  const db = getFirestore();
  const wishListCollection = db.collection("wishList");
  const doc = wishListCollection.doc(
    wishListId
  ) as admin.firestore.DocumentReference<WishList>;
  try {
    const result = await db.runTransaction(async (transaction) => {
      const wishListDoc = await transaction.get(doc);
      if (!wishListDoc.exists) {
        throw "WishList does not exist";
      }
      return updateFunction(transaction, doc, wishListDoc.data() as WishList);
    });
    return result;
  } catch (error) {
    throw `${error}`;
  }
};

exports.createwishlist = onCall<
  CreateWishListRequest,
  Promise<CreateWishListResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  console.log("createWishList user ", user?.email);
  if (!user) {
    throw "No user found";
  }
  const wishListCollection = getFirestore().collection("wishList");
  const newDoc = wishListCollection.doc();
  const newData: WishList = {
    title: data.isExtra ? "Extra List" : user.displayName,
    ...data,
    notes: "",
    ideas: {},
    author: user,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    id: newDoc.id,
  };
  console.log("createWishList newData", newData);
  await newDoc.set(newData);
  return { wishList: newData };
});

exports.deleteextrawishlist = onCall<
  DeleteExtraWishListRequest,
  Promise<DeleteExtraWishListResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  console.log("deleteExtraWishList user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishList) => {
      if (!wishList.isExtra) {
        throw "Document is not an extra wish list";
      }
      transaction.delete(doc);
      return null;
    }
  );
});

exports.updatewishlistmetadata = onCall<
  UpdateWishListMetadataRequest,
  Promise<UpdateWishListMetadataResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  console.log("updateWishListMetadata user ", user.email);
  return runWishListTransaction(
    data.id,
    async (transaction, doc, wishListData) => {
      if (wishListData.author.uid !== user.uid) {
        throw "Only the author can edit their list metadata";
      }
      const newData = {
        ...data,
        updatedAt: Date.now(),
      };
      console.log("updateWishListMetadata newData", newData);
      transaction.update(doc, newData);
      return null;
    }
  );
});

exports.addidea = onCall<AddIdeaRequest, Promise<AddIdeaResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req): Promise<AddIdeaResponse> => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      throw "No user found";
    }
    console.log("addIdea user ", user.email);
    const wishListCollection = getFirestore().collection("wishList");
    const wishListDoc = wishListCollection.doc(data.wishListId);
    const newIdea: Idea = {
      ...data.idea,
      comments: {},
      mark: null,
      author: user,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: uuid.v4(),
    };
    console.log("addIdea newIdea", newIdea);
    await wishListDoc.update({
      [`ideas.${newIdea.id}`]: newIdea,
      updatedAt: Date.now(),
    });
    return { idea: newIdea };
  }
);

exports.deleteidea = onCall<DeleteIdeaRequest, Promise<DeleteIdeaResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      throw "No user found";
    }
    console.log("deleteIdea user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      async (transaction, doc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToDelete = oldIdeas[data.ideaId];
        if (!ideaToDelete) {
          throw "Idea not found";
        }
        if (ideaToDelete.author.uid !== user.uid) {
          throw "You are not allowed to delete this idea";
        }

        console.log("deleteIdea ideaId", data.ideaId);
        transaction.update(doc, {
          // Google "How to get the writeResult from a transaction"
          [`ideas.${data.ideaId}`]: FieldValue.delete(),
          updatedAt: Date.now(),
        } as UpdateData<WishList>);
        return null;
      }
    );
  }
);

exports.markidea = onCall<MarkIdeaRequest, Promise<MarkIdeaResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      throw "No user found";
    }
    console.log("markIdea user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      async (transaction, wishListDoc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToMark = oldIdeas[data.ideaId];
        if (!ideaToMark) {
          throw "Idea not found";
        }
        const wishListUser = wishListData.author;
        if (wishListUser.uid === user.uid && !wishListData.isExtra) {
          throw "You are not allowed to mark your own ideas";
        }

        console.log("markIdea ideaId", data.ideaId, data.status);
        const newMark: Mark = {
          status: data.status,
          author: user,
          timestamp: Date.now(),
        };
        transaction.update(wishListDoc, {
          [`ideas.${data.ideaId}.mark`]: newMark,
          updatedAt: Date.now(),
        } as UpdateData<WishList>);
        return { mark: newMark };
      }
    );
  }
);

exports.updateideametadata = onCall<
  UpdateIdeaMetadataRequest,
  Promise<UpdateIdeaMetadataResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  console.log("updateIdeaMetadata user ", user?.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw "Idea not found";
      }
      if (ideaToUpdate.author.uid !== user.uid) {
        throw "You are not allowed to edit this idea";
      }
      const now = Date.now();
      const newData: Idea = {
        ...ideaToUpdate,
        ..._.pick(data, "title", "description"),
        updatedAt: now,
      };
      console.log("updateIdeaMetadata newData", newData);
      transaction.update(doc, {
        ...(data.title ? { [`ideas.${data.ideaId}.title`]: data.title } : {}),
        ...(data.description
          ? { [`ideas.${data.ideaId}.description`]: data.description }
          : {}),
        [`ideas.${data.ideaId}.updatedAt`]: now,
        updatedAt: now,
      } as unknown as UpdateData<WishList>);
      return null;
    }
  );
});

exports.addcomment = onCall<AddCommentRequest, Promise<AddCommentResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      throw "No user found";
    }
    console.log("addComment user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      async (transaction, doc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToUpdate = oldIdeas[data.ideaId];
        if (!ideaToUpdate) {
          throw "Idea not found";
        }
        const newComment: Comment = {
          text: data.text,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          author: user,
          id: uuid.v4(),
        };
        console.log("addComment newData", newComment);
        transaction.update(doc, {
          [`ideas.${data.ideaId}.comments.${newComment.id}`]: newComment,
          [`ideas.${data.ideaId}.updatedAt`]: Date.now(),
          updatedAt: Date.now(),
        } as UpdateData<WishList>);
        return { comment: newComment };
      }
    );
  }
);

exports.deletecomment = onCall<
  DeleteCommentRequest,
  Promise<DeleteCommentResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  console.log("deleteComment user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw "Idea not found";
      }
      const commentToDelete = ideaToUpdate.comments[data.commentId];
      if (!commentToDelete) {
        throw "Comment not found";
      }
      if (commentToDelete.author.uid !== user.uid) {
        throw "You are not allowed to delete this comment";
      }
      console.log("deleteComment commentId", data.commentId);
      transaction.update(doc, {
        [`ideas.${data.ideaId}.comments.${data.commentId}`]:
          FieldValue.delete(),
        [`ideas.${data.ideaId}.updatedAt`]: Date.now(),
        updatedAt: Date.now(),
      } as UpdateData<WishList>);
      return null;
    }
  );
});

exports.updatecomment = onCall<
  UpdateCommentRequest,
  Promise<UpdateCommentResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  console.log("updateComment user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw "Idea not found";
      }
      const commentToUpdate = ideaToUpdate.comments[data.commentId];
      if (!commentToUpdate) {
        throw "Comment not found";
      }
      if (commentToUpdate.author.uid !== user.uid) {
        throw "You are not allowed to edit this comment";
      }
      const newData = {
        text: data.text,
        updatedAt: Date.now(),
      };
      const now = Date.now();
      console.log("updateComment newData", newData);
      transaction.update(doc, {
        [`ideas.${data.ideaId}.comments.${data.commentId}.text`]:
          // It doesn't realize that this key is a part of a Comment which is part of a WishList
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.text as any,
        [`ideas.${data.ideaId}.comments.${data.commentId}.updatedAt`]: now,
        [`ideas.${data.ideaId}.updatedAt`]: now,
        updatedAt: now,
      } as UpdateData<WishList>);
      return null;
    }
  );
});

exports.getexchangeevent = onCall<
  GetExchangeEventRequest,
  Promise<GetExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  console.log("getExchangeEvent user ", user?.email);
  const result = await getFirestore()
    .collection("exchangeEvent")
    .doc(req.data.exchangeEvent)
    .get();
  if (!result.exists) {
    throw "No event found";
  }

  const event = result.data() as ExchangeEvent;

  if (!event.users[user.email]) {
    throw "User not in event";
  }
  return event;
});

exports.getallwishlists = onCall<
  GetAllWishListsRequest,
  Promise<GetAllWishListsResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  console.log("getAllWishLists user ", user.email);
  const db = getFirestore();
  const exchangeEventDoc = await db
    .collection("exchangeEvent")
    .doc(req.data.exchangeEvent)
    .get();
  if (!exchangeEventDoc.exists) {
    throw "No event found";
  }
  const exchangeEvent = exchangeEventDoc.data() as ExchangeEvent;
  if (!exchangeEvent.users[user.email]) {
    throw "User not in event";
  }

  const wishLists = await db
    .collection("wishList")
    .where("exchangeEvent", "==", req.data.exchangeEvent)
    .get();

  return _.keyBy(
    wishLists.docs.map((d) => {
      const wishList = d.data() as WishList;
      if (wishList.author.uid === user.uid && !wishList.isExtra) {
        return {
          ...wishList,
          ideas: _.mapValues(
            _.pickBy(wishList.ideas, (idea) => idea.author.uid === user.uid),
            (idea) => ({
              ...idea,
              mark: null,
              comments: _.pickBy(idea.comments, (comment) => {
                return comment.author.uid === user.uid;
              }),
            })
          ),
        };
      } else {
        return wishList;
      }
    }),
    "id"
  );
});

// Get's all the exchange events for which the user is the author.
exports.getallexchangeevents = onCall<
  GetAllExchangeEventsRequest,
  Promise<GetAllExchangeEventsResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw "No user found";
  }
  const db = getFirestore();
  const exchangeEvents = await db
    .collection("exchangeEvent")
    .where("author.uid", "==", user.uid)
    .get();
  return _.keyBy(
    _.invokeMap(exchangeEvents.docs, "data"),
    "id"
  ) as GetAllExchangeEventsResponse;
});

exports.createexchangeevent = onCall<
  CreateExchangeEventRequest,
  Promise<CreateExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  console.log("createExchangeEvent user ", user?.email);
  if (!user) {
    throw "No user found";
  }
  const exchangeEventCollection = getFirestore().collection("exchangeEvent");
  const newDoc = exchangeEventCollection.doc();
  const newData: ExchangeEvent = {
    ...data,
    author: user,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    id: newDoc.id,
  };
  console.log("createExchangeEvent newData", newData);
  await newDoc.set(newData);
  return newData;
});

exports.updateexchangeevent = onCall<
  UpdateExchangeEventRequest,
  Promise<UpdateExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const { id, ...newMetadata } = req.data;
  const exchangeEventDoc = getFirestore().collection("exchangeEvent").doc(id);
  exchangeEventDoc.update(newMetadata);
  return null;
});

exports.deleteexchangeevent = onCall<
  DeleteExchangeEventRequest,
  Promise<DeleteExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const { exchangeEventId } = req.data;
  getFirestore().collection("exchangeEvent").doc(exchangeEventId).delete();
  return null;
});
