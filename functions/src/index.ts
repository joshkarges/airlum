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
import {
  FieldValue,
  getFirestore,
  Transaction,
  UpdateData,
} from "firebase-admin/firestore";
import {
  CreateWishListRequest,
  ExchangeEvent,
  GetAllWishListsRequest,
  GetAllWishListsResponse,
  GetExchangeEventRequest,
  GetExchangeEventResponse,
  WishList,
  UpdateWishListMetadataRequest,
  UpdateWishListMetadataResponse,
  AddIdeaRequest,
  AddIdeaResponse,
  Idea,
  DeleteIdeaRequest,
  DeleteIdeaResponse,
  MarkIdeaRequest,
  MarkIdeaResponse,
  User,
  DeleteExtraWishListRequest,
  DeleteExtraWishListResponse,
  Mark,
  UpdateIdeaMetadataRequest,
  UpdateIdeaMetadataResponse,
  AddCommentRequest,
  AddCommentResponse,
  Comment,
  DeleteCommentRequest,
  DeleteCommentResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
} from "./models";
import _ = require("lodash");
import { AuthData } from "firebase-functions/lib/common/providers/https";

admin.initializeApp();

exports.health = onCall(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
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

const runWishListTransaction = async (
  wishListId: string,
  updateFunction: (
    transaction: admin.firestore.Transaction,
    doc: admin.firestore.DocumentReference<WishList>,
    wishList: WishList
  ) => void
) => {
  const db = getFirestore();
  const wishListCollection = db.collection("wishList");
  const doc = wishListCollection.doc(
    wishListId
  ) as admin.firestore.DocumentReference<WishList>;
  try {
    await db.runTransaction(async (transaction) => {
      const wishListDoc = await transaction.get(doc);
      if (!wishListDoc.exists) {
        throw "WishList does not exist";
      }
      updateFunction(transaction, doc, wishListDoc.data() as WishList);
    });
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return { success: false, error: `${error}`, data: null };
  }
};

exports.createWishList = onCall<CreateWishListRequest>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    console.log("createWishList user ", user?.email);
    if (!user) {
      return { success: false, error: "No user found", data: null };
    }
    const wishListCollection = getFirestore().collection("wishList");
    const newDoc = wishListCollection.doc();
    const newData: WishList = {
      title: data.isExtra ? "Extra List" : user.displayName,
      notes: "",
      ideas: {},
      exchangeEvent: data.exchangeEvent,
      isExtra: data.isExtra,
      user,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: newDoc.id,
    };
    console.log("createWishList newData", newData);
    const writeResult = await newDoc.set(newData);
    return { success: true, data: writeResult };
  }
);

exports.deleteExtraWishList = onCall<
  DeleteExtraWishListRequest,
  Promise<DeleteExtraWishListResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    return { success: false, error: "No user found", data: null };
  }
  console.log("deleteExtraWishList user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    async (transaction, doc, wishList) => {
      if (!wishList.isExtra) {
        throw "Document is not an extra wish list";
      }
      transaction.delete(doc);
    }
  );
});

exports.updateWishListMetadata = onCall<
  UpdateWishListMetadataRequest,
  Promise<UpdateWishListMetadataResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    return { success: false, error: "No user found", data: null };
  }
  console.log("updateWishListMetadata user ", user.email);
  return runWishListTransaction(
    data.id,
    async (transaction, doc, wishListData) => {
      if (wishListData.user.uid !== user.uid) {
        throw "Only the author can edit their list descriptions";
      }
      const newData = {
        ...data,
        updatedAt: Date.now(),
      };
      console.log("updateWishListMetadata newData", newData);
      transaction.update(doc, newData);
    }
  );
});

exports.addIdea = onCall<AddIdeaRequest, Promise<AddIdeaResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      return { success: false, error: "No user found", data: null };
    }
    console.log("addIdea user ", user.email);
    const wishListCollection = getFirestore().collection("wishList");
    const wishListDoc = wishListCollection.doc(data.wishListId);
    const newIdea: Idea = {
      ...data.idea,
      comments: {},
      mark: null,
      user,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: uuid.v4(),
    };
    console.log("addIdea newIdea", newIdea);
    const writeResult = await wishListDoc.update({
      [`ideas.${newIdea.id}`]: newIdea,
      updatedAt: Date.now(),
    });
    return { success: true, data: writeResult };
  }
);

exports.deleteIdea = onCall<DeleteIdeaRequest, Promise<DeleteIdeaResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      return { success: false, error: "No user found", data: null };
    }
    console.log("deleteIdea user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      (transaction, doc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToDelete = oldIdeas[data.ideaId];
        if (!ideaToDelete) {
          throw "Idea not found";
        }
        if (ideaToDelete.user.uid !== user.uid) {
          throw "You are not allowed to delete this idea";
        }

        console.log("deleteIdea ideaId", data.ideaId);
        transaction.update(doc, {
          // Google "How to get the writeResult from a transaction"
          [`ideas.${data.ideaId}`]: FieldValue.delete(),
          updatedAt: Date.now(),
        } as UpdateData<WishList>);
      }
    );
  }
);

exports.markIdea = onCall<MarkIdeaRequest, Promise<MarkIdeaResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      return { success: false, error: "No user found", data: null };
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
        const wishListUser = wishListData.user;
        if (wishListUser.uid === user.uid) {
          throw "You are not allowed to mark your own ideas";
        }

        console.log("markIdea ideaId", data.ideaId, data.status);
        transaction.update(wishListDoc, {
          [`ideas.${data.ideaId}.mark`]: {
            status: data.status,
            user: user,
            timestamp: Date.now(),
          } as Mark,
          updatedAt: Date.now(),
        } as UpdateData<WishList>);
      }
    );
  }
);

exports.updateIdeaMetadata = onCall<
  UpdateIdeaMetadataRequest,
  Promise<UpdateIdeaMetadataResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    return { success: false, error: "No user found", data: null };
  }
  console.log("updateIdeaMetadata user ", user?.email);
  return runWishListTransaction(
    data.wishListId,
    (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw "Idea not found";
      }
      if (ideaToUpdate.user.uid !== user.uid) {
        throw "You are not allowed to edit this idea";
      }
      const newData = {
        ...data,
        updatedAt: Date.now(),
      };
      console.log("updateIdeaMetadata newData", newData);
      transaction.update(doc, {
        [`ideas.${data.ideaId}`]: newData,
        updatedAt: Date.now(),
      } as UpdateData<WishList>);
    }
  );
});

exports.addComment = onCall<AddCommentRequest, Promise<AddCommentResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const user = getUserFromAuth(req.auth);
    if (!user) {
      return { success: false, error: "No user found", data: null };
    }
    console.log("addComment user ", user.email);
    return runWishListTransaction(
      data.wishListId,
      (transaction, doc, wishListData) => {
        const oldIdeas = wishListData.ideas;
        const ideaToUpdate = oldIdeas[data.ideaId];
        if (!ideaToUpdate) {
          throw "Idea not found";
        }
        const newData: Comment = {
          text: data.text,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          user,
          id: uuid.v4(),
        };
        console.log("addComment newData", newData);
        transaction.update(doc, {
          [`ideas.${data.ideaId}.comments.${newData.id}`]: newData,
          [`ideas.${data.ideaId}.updatedAt`]: Date.now(),
          updatedAt: Date.now(),
        } as UpdateData<WishList>);
      }
    );
  }
);

exports.deleteComment = onCall<
  DeleteCommentRequest,
  Promise<DeleteCommentResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    return { success: false, error: "No user found", data: null };
  }
  console.log("deleteComment user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw "Idea not found";
      }
      const commentToDelete = ideaToUpdate.comments[data.commentId];
      if (!commentToDelete) {
        throw "Comment not found";
      }
      if (commentToDelete.user.uid !== user.uid) {
        throw "You are not allowed to delete this comment";
      }
      console.log("deleteComment commentId", data.commentId);
      transaction.update(doc, {
        [`ideas.${data.ideaId}.comments.${data.commentId}`]:
          FieldValue.delete(),
        [`ideas.${data.ideaId}.updatedAt`]: Date.now(),
        updatedAt: Date.now(),
      } as UpdateData<WishList>);
    }
  );
});

exports.updateComment = onCall<
  UpdateCommentRequest,
  Promise<UpdateCommentResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const data = req.data;
  const user = getUserFromAuth(req.auth);
  if (!user) {
    return { success: false, error: "No user found", data: null };
  }
  console.log("updateComment user ", user.email);
  return runWishListTransaction(
    data.wishListId,
    (transaction, doc, wishListData) => {
      const oldIdeas = wishListData.ideas;
      const ideaToUpdate = oldIdeas[data.ideaId];
      if (!ideaToUpdate) {
        throw "Idea not found";
      }
      const commentToUpdate = ideaToUpdate.comments[data.commentId];
      if (!commentToUpdate) {
        throw "Comment not found";
      }
      if (commentToUpdate.user.uid !== user.uid) {
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
    }
  );
});

exports.getExchangeEvent = onCall<
  GetExchangeEventRequest,
  Promise<GetExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = getUserFromAuth(req.auth);
  if (!user) {
    return { success: false, error: "No user found", data: null };
  }
  console.log("getExchangeEvent user ", user?.email);
  const result = await getFirestore()
    .collection("exchangeEvent")
    .doc(req.data.exchangeEvent)
    .get();
  if (!result.exists) {
    return { success: false, error: "No event found", data: null };
  }

  const event = result.data() as ExchangeEvent;

  if (!event.users.find((u) => u.email === user.email)) {
    return { success: false, error: "User not in event", data: null };
  }
  return { success: true, data: event };
});

exports.getAllWishLists = onCall<
  GetAllWishListsRequest,
  Promise<GetAllWishListsResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = getUserFromAuth(req.auth);
  if (!user) {
    return { success: false, error: "No user found", data: {} };
  }
  console.log("getAllWishLists user ", user.email);
  const db = getFirestore();
  const exchangeEventDoc = await db
    .collection("exchangeEvent")
    .doc(req.data.exchangeEvent)
    .get();
  if (!exchangeEventDoc.exists) {
    return { success: false, error: "No event found", data: {} };
  }
  const exchangeEvent = exchangeEventDoc.data() as ExchangeEvent;
  if (!exchangeEvent.users.find((u) => u.email === user.email)) {
    return { success: false, error: "User not in event", data: {} };
  }

  const wishLists = await db
    .collection("wishList")
    .where("exchangeEvent", "==", req.data.exchangeEvent)
    .get();

  if (wishLists.empty) {
    return { success: false, error: "No wish lists found", data: {} };
  }

  return {
    success: true,
    data: _.keyBy(
      wishLists.docs.map((d) => {
        const wishList = d.data() as WishList;
        if (wishList.user.uid === user.uid && !wishList.isExtra) {
          return {
            ...wishList,
            ideas: _.mapValues(
              _.pickBy(wishList.ideas, (idea) => idea.user.uid === user.uid),
              (idea) => ({
                ...idea,
                mark: null,
                comments: _.pickBy(idea.comments, (comment) => {
                  return comment.user.uid === user.uid;
                }),
              })
            ),
          };
        } else {
          return wishList;
        }
      }),
      "id"
    ),
  };
});
