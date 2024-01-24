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
import * as admin from "firebase-admin";
import {
  getFirestore as getFirestoreAdmin,
  Filter,
  FieldValue,
  UpdateData,
} from "firebase-admin/firestore";
import { initializeApp } from "firebase/app";
import * as uuid from "uuid";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

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

// Initialize Firebase
const appAdmin = admin.initializeApp({
  projectId: "airlum",
  storageBucket: "airlum.appspot.com",
});

const dbAdmin = getFirestoreAdmin(appAdmin);

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
  const wishListCollection = dbAdmin.collection("wishList");
  const document = wishListCollection.doc(
    wishListId
  ) as admin.firestore.DocumentReference<WishList>;
  const result = await dbAdmin.runTransaction(async (transaction) => {
    const wishListDoc = await transaction.get(document);
    if (!wishListDoc.exists) {
      throw new HttpsError("not-found", "WishList does not exist");
    }
    return updateFunction(transaction, document, wishListDoc.data()!);
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
  const wishListCollection = dbAdmin.collection("wishList");
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
    const wishListCollection = dbAdmin.collection("wishList");
    const wishListDoc = wishListCollection.doc(data.wishListId);
    const now = Date.now();
    const newIdea: Idea = {
      ...data.idea,
      comments: {},
      mark: null,
      author: user,
      createdAt: now,
      updatedAt: now,
      id: uuid.v4(),
    };
    await wishListDoc.update({
      [`ideas.${newIdea.id}`]: newIdea,
      updatedAt: now,
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
            "Only the author can delete their ideas"
          );
        }

        transaction.update(doc, {
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

        const now = Date.now();
        const newMark: Mark = {
          status: data.status,
          author: user,
          timestamp: now,
        };
        transaction.update(wishListDoc, {
          [`ideas.${data.ideaId}.mark`]: newMark,
          [`ideas.${data.ideaId}.updatedAt`]: now,
          updatedAt: now,
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
          "Only the author can update the idea metadata"
        );
      }
      const now = Date.now();
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
          "Only the author can delete the comment."
        );
      }
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
          "Only the author can edit this comment."
        );
      }
      const now = Date.now();
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
  let event: ExchangeEvent;
  try {
    const exchangeEventCollection = dbAdmin.collection("exchangeEvent");
    const exchangeEventDocRef = exchangeEventCollection.doc(
      req.data.exchangeEvent
    );
    const exchangeEventDoc = await exchangeEventDocRef.get();
    if (!exchangeEventDoc.exists) {
      throw new HttpsError("not-found", "No event found");
    }

    event = exchangeEventDoc.data() as ExchangeEvent;

    if (!event.users.includes(user.email)) {
      throw new HttpsError("permission-denied", "User not in event");
    }
  } catch (err) {
    throw new HttpsError("unknown", `${err}`);
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
  let wishLists: admin.firestore.QuerySnapshot<WishList>;
  try {
    const exchangeEventCollection = dbAdmin.collection("exchangeEvent");
    const exchangeEventDocRef = exchangeEventCollection.doc(
      req.data.exchangeEvent
    );
    const exchangeEventDoc = await exchangeEventDocRef.get();
    if (!exchangeEventDoc.exists) {
      throw new HttpsError("not-found", "No event found");
    }
    const exchangeEvent = exchangeEventDoc.data() as ExchangeEvent;
    if (!exchangeEvent.users.includes(user.email)) {
      throw new HttpsError("permission-denied", "User not in event");
    }

    const wishListCollection = dbAdmin.collection(
      "wishList"
    ) as admin.firestore.CollectionReference<WishList>;
    const wishListQuery = wishListCollection.where(
      "exchangeEvent",
      "==",
      req.data.exchangeEvent
    );
    wishLists = await wishListQuery.get();
  } catch (err) {
    throw new HttpsError("unknown", `${err}`);
  }

  return _.mapValues(_.keyBy(wishLists.docs, "id"), (d, id) => {
    const wishList = d.data();
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
      return {
        ...wishList,
        id,
      };
    }
  });
});

// Get's all the exchange events for which the user is the author.
exports.getallexchangeevents = onCall<
  GetAllExchangeEventsRequest,
  Promise<GetAllExchangeEventsResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = getUserFromAuth(req.auth);
  if (!user) {
    throw new HttpsError("unauthenticated", "No user found");
  }
  try {
    const exchangeEvents = await dbAdmin
      .collection("exchangeEvent")
      .where(
        Filter.or(
          Filter.where("users", "array-contains", user.email),
          Filter.where("author.uid", "==", user.uid)
        )
      )
      .get();
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
  if (!user) {
    throw new HttpsError("unauthenticated", "No user found");
  }
  const dbAdmin = getFirestoreAdmin(appAdmin);
  const exchangeEventCollection = dbAdmin.collection("exchangeEvent");
  let docRef = exchangeEventCollection.doc(_.kebabCase(data.name));
  let document = await docRef.get();
  let tries = 3;
  while (document.exists) {
    if (tries-- === 0) {
      docRef = exchangeEventCollection.doc();
      break;
    }
    docRef = exchangeEventCollection.doc(
      `${_.kebabCase(data.name)}_${generateSixDigitAlphaNumericCode()}`
    );
    document = await docRef.get();
  }
  const now = Date.now();
  const newData: Omit<ExchangeEvent, "id"> = {
    ...data,
    author: user,
    createdAt: now,
    updatedAt: now,
  };
  await docRef.set(newData);
  return {
    ...newData,
    id: docRef.id,
  };
});

exports.updateexchangeevent = onCall<
  UpdateExchangeEventRequest,
  Promise<UpdateExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const { id, ...newMetadata } = req.data;
  const exchangeEventCollection = dbAdmin.collection("exchangeEvent");
  const exchangeEventDoc = exchangeEventCollection.doc(id);
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
  dbAdmin.collection("exchangeEvent").doc(exchangeEventId).delete();
  const wishLists = await dbAdmin
    .collection("wishList")
    .where("exchangeEvent", "==", exchangeEventId)
    .get();
  wishLists.forEach((doc) => {
    doc.ref.delete();
  });
  return null;
});
