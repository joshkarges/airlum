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
import {
  GameRecord,
  WriteGameRequest,
  WriteGameResponse,
} from "./models/splendor";
import {
  UpsertTimedTeamRequest,
  UpsertTimedTeamResponse,
  DeleteMemberRequest,
  DeleteMemberResponse,
  FinishTimedTeamRequest,
  FinishTimedTeamResponse,
  JoinTimedTeamRequest,
  JoinTimedTeamResponse,
  StartTimedTeamRequest,
  StartTimedTeamResponse,
  TimedTeam,
  ResetTimedTeamResponse,
  ResetTimedTeamRequest,
  EditMemberNameRequest,
  EditMemberNameResponse,
} from "./models/timedTeam";

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
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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

const runExchangeEventTransaction = async <T>(
  exchangeEventId: string,
  updateFunction: (
    transaction: admin.firestore.Transaction,
    doc: admin.firestore.DocumentReference<ExchangeEvent>,
    exchangeEvent: ExchangeEvent
  ) => Promise<T>
) => {
  const exchangeEventCollection = dbAdmin.collection("exchangeEvent");
  const document = exchangeEventCollection.doc(
    exchangeEventId
  ) as admin.firestore.DocumentReference<ExchangeEvent>;
  const result = await dbAdmin.runTransaction(async (transaction) => {
    const exchangeEventDoc = await transaction.get(document);
    if (!exchangeEventDoc.exists) {
      throw new HttpsError("not-found", "ExchangeEvent does not exist");
    }
    return updateFunction(transaction, document, exchangeEventDoc.data()!);
  });
  return result;
};

exports.createwishlist = onCall<
  CreateWishListRequest,
  Promise<CreateWishListResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
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
  }
);

exports.deleteextrawishlist = onCall<
  DeleteExtraWishListRequest,
  Promise<DeleteExtraWishListResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
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
  }
);

exports.updatewishlistmetadata = onCall<
  UpdateWishListMetadataRequest,
  Promise<UpdateWishListMetadataResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
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
  }
);

exports.addidea = onCall<AddIdeaRequest, Promise<AddIdeaResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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
  }
);

exports.addcomment = onCall<AddCommentRequest, Promise<AddCommentResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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
  }
);

exports.updatecomment = onCall<
  UpdateCommentRequest,
  Promise<UpdateCommentResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
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
  }
);

exports.getexchangeevent = onCall<
  GetExchangeEventRequest,
  Promise<GetExchangeEventResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
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
  }
);

exports.getallwishlists = onCall<
  GetAllWishListsRequest,
  Promise<GetAllWishListsResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
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
      if (
        !exchangeEvent.users.includes(user.email) &&
        exchangeEvent.author.uid !== user.uid
      ) {
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
  }
);

// Get's all the exchange events for which the user is the author.
exports.getallexchangeevents = onCall<
  GetAllExchangeEventsRequest,
  Promise<GetAllExchangeEventsResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
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
  }
);

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
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
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
  }
);

exports.updateexchangeevent = onCall<
  UpdateExchangeEventRequest,
  Promise<UpdateExchangeEventResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const user = getUserFromAuth(req.auth);
    if (!user) {
      throw new HttpsError("unauthenticated", "No user found");
    }
    const { id, ...newMetadata } = req.data;
    return runExchangeEventTransaction(
      id,
      async (transaction, exchangeEventDoc, exchangeEvent) => {
        if (exchangeEvent.author.uid !== user.uid) {
          throw new HttpsError(
            "permission-denied",
            "Only the author can update the event"
          );
        }
        transaction.update(exchangeEventDoc, {
          ...newMetadata,
          updatedAt: Date.now(),
        });
        return null;
      }
    );
  }
);

exports.deleteexchangeevent = onCall<
  DeleteExchangeEventRequest,
  Promise<DeleteExchangeEventResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const user = getUserFromAuth(req.auth);
    if (!user) {
      throw new HttpsError("unauthenticated", "No user found");
    }
    const { exchangeEventId } = req.data;
    return runExchangeEventTransaction(
      exchangeEventId,
      async (transaction, exchangeEventDoc, exchangeEvent) => {
        if (exchangeEvent.author.uid !== user.uid) {
          throw new HttpsError(
            "permission-denied",
            "Only the author can delete the event"
          );
        }
        const wishListsQuery = dbAdmin
          .collection("wishList")
          .where("exchangeEvent", "==", exchangeEventId);
        const wishLists = await transaction.get(wishListsQuery);

        transaction.delete(exchangeEventDoc);
        wishLists.forEach((wishList) => {
          transaction.delete(wishList.ref);
        });
        return null;
      }
    );
  }
);

exports.writeSplendorGame = onCall<
  WriteGameRequest,
  Promise<WriteGameResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const gamesCollection = dbAdmin.collection("splendorGames");
    const result = await gamesCollection.add(req.data);
    return result.id;
  }
);

exports.getAllSplendorGames = onCall<void, Promise<GameRecord[]>>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    console.log("req", req);
    const gamesCollection = dbAdmin.collection(
      "splendorGames"
    ) as admin.firestore.CollectionReference<GameRecord>;
    console.log("gamesCollection", gamesCollection);
    const games = await gamesCollection.get();
    console.log("games", games);
    return games.docs.map((doc) => doc.data());
  }
);

exports.upsertTimedTeam = onCall<
  UpsertTimedTeamRequest,
  Promise<UpsertTimedTeamResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection(
      "timedTeams"
    ) as admin.firestore.CollectionReference<TimedTeam>;
    const docId = req.data.gameId || generateSixDigitAlphaNumericCode();
    const docRef = timedTeamsCollection.doc(docId);

    if (req.data.gameId) {
      await docRef.update({
        duration: req.data.duration,
        numPerTeam: req.data.numPerTeam,
        name: req.data.name,
        author: req.data.author,
      });
      return { id: docId };
    }

    await docRef.set({
      id: docId,
      name: req.data.name,
      author: req.data.author,
      members: [],
      duration: req.data.duration,
      numPerTeam: req.data.numPerTeam,
      started: false,
      finished: false,
      startedAt: 0,
    });
    return { id: docId };
  }
);

exports.resetTimedTeam = onCall<
  ResetTimedTeamRequest,
  Promise<ResetTimedTeamResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection("timedTeams");
    const timedTeamDoc = timedTeamsCollection.doc(req.data.id);
    const timedTeam = (await timedTeamDoc.get()).data();
    if (!timedTeam) {
      throw new HttpsError("not-found", "Timed team not found");
    }
    const promise1 = timedTeamDoc
      .collection("teams")
      .listDocuments()
      .then((docs) => {
        docs.forEach((doc) => {
          doc.update({
            team: "",
          });
        });
      });
    const promise2 = timedTeamDoc.update({
      started: false,
      finished: false,
      startedAt: 0,
    });
    await Promise.all([promise1, promise2]);
  }
);

exports.getTimedTeam = onCall<{ id: string }, Promise<TimedTeam>>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection("timedTeams");
    const timedTeamDoc = timedTeamsCollection.doc(req.data.id);
    const timedTeam = (await timedTeamDoc.get()).data();
    if (!timedTeam) {
      throw new HttpsError("not-found", "Timed team not found");
    }
    return timedTeam as TimedTeam;
  }
);

exports.joinTimedTeam = onCall<
  JoinTimedTeamRequest,
  Promise<JoinTimedTeamResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection(
      "timedTeams"
    ) as admin.firestore.CollectionReference<TimedTeam>;
    const timedTeamDoc = timedTeamsCollection.doc(req.data.id);
    const timedTeam = (await timedTeamDoc.get()).data();
    if (!timedTeam) {
      throw new HttpsError("not-found", "Timed team not found");
    }
    if (timedTeam.members.includes(req.data.user)) {
      throw new HttpsError("already-exists", "User already in team");
    }
    await timedTeamDoc.update({
      members: FieldValue.arrayUnion(req.data.user),
    });
    const memberKey = generateSixDigitAlphaNumericCode();
    await timedTeamDoc.collection("teams").doc(memberKey).set({
      user: req.data.user,
      memberKey,
      team: "",
      isAuthor: req.data.isAuthor,
    });
    return { memberKey };
  }
);

exports.editMemberName = onCall<
  EditMemberNameRequest,
  Promise<EditMemberNameResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection(
      "timedTeams"
    ) as admin.firestore.CollectionReference<TimedTeam>;
    const timedTeamDoc = timedTeamsCollection.doc(req.data.id);
    const memberDoc = timedTeamDoc.collection("teams").doc(req.data.memberKey);
    const member = (await memberDoc.get()).data();
    if (!member) {
      throw new HttpsError("not-found", "Member not found");
    }
    const timedTeam = (await timedTeamDoc.get()).data();
    if (!timedTeam) {
      throw new HttpsError("not-found", "Timed team not found");
    }
    const members = timedTeam.members;
    const memberIndex = members.indexOf(member.user);
    if (memberIndex === -1) {
      throw new HttpsError("not-found", "User not in team");
    }
    members[memberIndex] = req.data.username;
    const promise1 = timedTeamDoc.update({
      members,
    });
    const promise2 = memberDoc.update({
      user: req.data.username,
    });
    await Promise.all([promise1, promise2]);
  }
);

exports.deleteMemberFromTimedTeam = onCall<
  DeleteMemberRequest,
  Promise<DeleteMemberResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection(
      "timedTeams"
    ) as admin.firestore.CollectionReference<TimedTeam>;
    const timedTeamDoc = timedTeamsCollection.doc(req.data.id);
    const timedTeam = (await timedTeamDoc.get()).data();
    if (!timedTeam) {
      throw new HttpsError("not-found", "Timed team not found");
    }
    if (!timedTeam.members.includes(req.data.user)) {
      throw new HttpsError("not-found", "User not in team");
    }
    await timedTeamDoc.update({
      members: FieldValue.arrayRemove(req.data.user),
    });
    const teamsCollection = timedTeamDoc.collection("teams");
    const teams = await teamsCollection
      .where("user", "==", req.data.user)
      .get();
    teams.forEach((doc) => {
      doc.ref.delete();
    });
  }
);

exports.startTimedTeam = onCall<
  StartTimedTeamRequest,
  Promise<StartTimedTeamResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection("timedTeams");
    const timedTeamDoc = timedTeamsCollection.doc(req.data.id);
    const timedTeam = (await timedTeamDoc.get()).data();
    if (!timedTeam) {
      throw new HttpsError("not-found", "Timed team not found");
    }
    if (timedTeam.started) {
      throw new HttpsError("already-exists", "Timed team already started");
    }
    await timedTeamDoc.update({
      started: true,
      startedAt: Date.now(),
    });
  }
);

exports.finishTimedTeam = onCall<
  FinishTimedTeamRequest,
  Promise<FinishTimedTeamResponse>
>(
  { cors: [/firebase\.com$/, /airlum.web.app/, /joshkarges.com/] },
  async (req) => {
    const timedTeamsCollection = dbAdmin.collection(
      "timedTeams"
    ) as admin.firestore.CollectionReference<TimedTeam>;
    const timedTeamDoc = timedTeamsCollection.doc(req.data.id);
    const timedTeam = (await timedTeamDoc.get()).data();
    if (!timedTeam) {
      throw new HttpsError("not-found", "Timed team not found");
    }
    if (timedTeam.finished) {
      throw new HttpsError("already-exists", "Timed team already finished");
    }
    // Put members into teams
    const teams = _.flatMap(
      timedTeam.numPerTeam,
      ({ teamName, numPlayers }) => {
        return _.times(numPlayers, () => teamName);
      }
    );
    const teamsWithZeroPlayers = _.filter(
      timedTeam.numPerTeam,
      ({ numPlayers }) => numPlayers === 0
    ).map(({ teamName }) => teamName);
    if (teamsWithZeroPlayers.length === 0) {
      teamsWithZeroPlayers.push("no team");
    }
    for (let i = teams.length; i < timedTeam.members.length; i++) {
      teams.push(teamsWithZeroPlayers[i % teamsWithZeroPlayers.length]);
    }
    const promise1 = timedTeamDoc
      .collection("teams")
      .listDocuments()
      .then((docs) => {
        docs.forEach((doc) => {
          doc.update({
            team: teams.pop() || "no team",
          });
        });
      });
    const promise2 = timedTeamDoc.update({
      finished: true,
    });
    await Promise.all([promise1, promise2]);
  }
);
