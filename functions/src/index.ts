/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {
  HttpsError,
  onCall,
  CallableRequest,
} from "firebase-functions/v2/https";
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
import * as _ from "lodash";
import { log } from "firebase-functions/logger";

const oldConsoleLog = console.log;
console.log = (...args) => {
  oldConsoleLog(...args);
  log(...args);
};

admin.initializeApp({
  projectId: "airlum",
  storageBucket: "airlum.appspot.com",
});

exports.health = onCall(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async () => {
    return "OK";
  }
);

const getUserFromAuth = (auth: CallableRequest["auth"]) => {
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
  const result = await db.runTransaction(async (transaction) => {
    const wishListDoc = await transaction.get(doc);
    if (!wishListDoc.exists) {
      throw new HttpsError("not-found", "WishList does not exist");
    }
    return updateFunction(transaction, doc, wishListDoc.data() as WishList);
  });
  return result;
};

exports.createwishlist = onCall<
  CreateWishListRequest,
  Promise<CreateWishListResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  console.log("createWishList user ", user?.email);
  if (!user) {
    throw new HttpsError("unauthenticated", "No user found");
  }
  const wishListCollection = getFirestore().collection("wishList");
  const now = Date.now();
  const newData: Omit<WishList, "id"> = {
    title: data.isExtra ? "Extra List" : user.displayName,
    ...data,
    notes: "",
    ideas: {},
    author: user,
    createdAt: now,
    updatedAt: now,
  };
  console.log("createWishList newData", newData);
  const result = await wishListCollection.add(newData);
  return {
    wishList: {
      ...newData,
      id: result.id,
    },
  };
});

exports.deleteextrawishlist = onCall<
  DeleteExtraWishListRequest,
  Promise<DeleteExtraWishListResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("deleteExtraWishList user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishList) => {
      if (!wishList.isExtra) {
        throw new HttpsError(
          "failed-precondition",
          "Document is not an extra wish list"
        );
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
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("updateWishListMetadata user ", user.email);
  return runWishListTransaction(
    data.id,
    async (transaction, doc, wishListData) => {
      if (wishListData.author.uid !== user.uid) {
        throw new HttpsError(
          "permission-denied",
          "Only the author can edit their list metadata"
        );
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
      throw new HttpsError("unauthenticated", "No user found");
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
      throw new HttpsError("unauthenticated", "No user found");
    }
    console.log("deleteIdea user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      async (transaction, doc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToDelete = oldIdeas[data.ideaId];
        if (!ideaToDelete) {
          throw new HttpsError("not-found", "Idea not found");
        }
        if (ideaToDelete.author.uid !== user.uid) {
          throw new HttpsError(
            "permission-denied",
            "You are not allowed to delete this idea"
          );
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
      throw new HttpsError("unauthenticated", "No user found");
    }
    console.log("markIdea user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      async (transaction, wishListDoc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToMark = oldIdeas[data.ideaId];
        if (!ideaToMark) {
          throw new HttpsError("not-found", "Idea not found");
        }
        const wishListUser = wishListData.author;
        if (wishListUser.uid === user.uid && !wishListData.isExtra) {
          throw new HttpsError(
            "permission-denied",
            "You are not allowed to mark your own ideas"
          );
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
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("updateIdeaMetadata user ", user?.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw new HttpsError("not-found", "Idea not found");
      }
      if (ideaToUpdate.author.uid !== user.uid) {
        throw new HttpsError(
          "permission-denied",
          "You are not allowed to edit this idea"
        );
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
      throw new HttpsError("unauthenticated", "No user found");
    }
    console.log("addComment user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      async (transaction, doc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToUpdate = oldIdeas[data.ideaId];
        if (!ideaToUpdate) {
          throw new HttpsError("not-found", "Idea not found");
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
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("deleteComment user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw new HttpsError("not-found", "Idea not found");
      }
      const commentToDelete = ideaToUpdate.comments[data.commentId];
      if (!commentToDelete) {
        throw new HttpsError("not-found", "Comment not found");
      }
      if (commentToDelete.author.uid !== user.uid) {
        throw new HttpsError(
          "permission-denied",
          "You are not allowed to delete this comment"
        );
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
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("updateComment user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw new HttpsError("not-found", "Idea not found");
      }
      const commentToUpdate = ideaToUpdate.comments[data.commentId];
      if (!commentToUpdate) {
        throw new HttpsError("not-found", "Comment not found");
      }
      if (commentToUpdate.author.uid !== user.uid) {
        throw new HttpsError(
          "permission-denied",
          "You are not allowed to edit this comment"
        );
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
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("getExchangeEvent user ", user?.email);
  const result = await getFirestore()
    .collection("exchangeEvent")
    .doc(req.data.exchangeEvent)
    .get();
  if (!result.exists) {
    throw new HttpsError("not-found", "No event found");
  }

  const event = result.data() as ExchangeEvent;

  if (!event.users[user.email]) {
    throw new HttpsError("permission-denied", "User not in event");
  }
  return event;
});

exports.getallwishlists = onCall<
  GetAllWishListsRequest,
  Promise<GetAllWishListsResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("getAllWishLists user ", user.email);
  const db = getFirestore();
  const exchangeEventDoc = await db
    .collection("exchangeEvent")
    .doc(req.data.exchangeEvent)
    .get();
  if (!exchangeEventDoc.exists) {
    throw new HttpsError("not-found", "No event found");
  }
  const exchangeEvent = exchangeEventDoc.data() as ExchangeEvent;
  if (!exchangeEvent.users[user.email]) {
    throw new HttpsError("permission-denied", "User not in event");
  }

  const wishLists = await db
    .collection("wishList")
    .where("exchangeEvent", "==", req.data.exchangeEvent)
    .get();

  return _.mapValues(_.keyBy(wishLists.docs, "id"), (d, id) => {
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
        id,
      };
    } else {
      return wishList;
    }
  });
});

// Get's all the exchange events for which the user is the author.
exports.getallexchangeevents = onCall<
  GetAllExchangeEventsRequest,
  Promise<GetAllExchangeEventsResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  console.log("Reached getallexchangeevents");
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw new HttpsError("unauthenticated", "No user found");
  }
  console.log("Checked auth getallexchangeevents");
  try {
    const db = getFirestore();
    const exchangeEvents = await db
      .collection("exchangeEvent")
      .where("author.uid", "==", user.uid)
      .get();
    console.log("Got docs getallexchangeevents");
    return _.mapValues(
      _.keyBy(exchangeEvents.docs, "id"),
      (doc, id) =>
        ({
          ...doc.data(),
          id,
        } as ExchangeEvent)
    );
  } catch (e) {
    throw new HttpsError(
      _.get(e, "code", "internal"),
      _.get(e, "message", "unknown message")
    );
  }
});

const generateSixDigitAlphaNumericCode = () => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 6; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

exports.createexchangeevent = onCall<
  CreateExchangeEventRequest,
  Promise<CreateExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  console.log("createExchangeEvent user ", user?.email);
  if (!user) {
    throw new HttpsError("unauthenticated", "No user found");
  }
  const exchangeEventCollection = getFirestore().collection("exchangeEvent");
  let docRef = exchangeEventCollection.doc(_.kebabCase(data.name));
  let doc = await docRef.get();
  let tries = 3;
  while (doc.exists) {
    if (tries-- === 0) {
      docRef = exchangeEventCollection.doc();
      break;
    }
    docRef = exchangeEventCollection.doc(
      `${_.kebabCase(data.name)}_${generateSixDigitAlphaNumericCode()}`
    );
    doc = await docRef.get();
  }
  const now = Date.now();
  const newData: ExchangeEvent = {
    ...data,
    users: {
      ...data.users,
      [user.email]: {
        email: user.email,
        joinedAt: now,
        uid: user.uid,
      },
    },
    id: doc.id,
    author: user,
    createdAt: now,
    updatedAt: now,
  };
  console.log("createExchangeEvent newData", newData);
  await docRef.set(newData);
  return newData;
});

exports.updateexchangeevent = onCall<
  UpdateExchangeEventRequest,
  Promise<UpdateExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const { id, ...newMetadata } = req.data;
  const exchangeEventDoc = getFirestore().collection("exchangeEvent").doc(id);
  exchangeEventDoc.update({
    ...newMetadata,
    updatedAt: Date.now(),
  });
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
