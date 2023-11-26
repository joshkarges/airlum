/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// The Firebase Admin SDK to access Firestore.
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import {
  ChristmasList,
  ExchangeEvent,
  GetAllWishListsRequest,
  GetAllWishListsResponse,
  GetExchangeEventRequest,
  GetExchangeEventResponse,
  SetWishListRequest,
  SetWishListResponse,
} from "./models";

admin.initializeApp();

exports.health = onCall(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    return "OK";
  }
);

exports.setWishList = onCall<SetWishListRequest, Promise<SetWishListResponse>>(
  { cors: [/firebase\.com$/, /airlum.web.app/] },
  async (req) => {
    const data = req.data;
    const uid = req.auth?.uid;
    const name = req.auth?.token.name;
    const email = req.auth?.token.email;
    console.log("setWishList user ", email);
    if (!uid) {
      return { success: false, error: "No user found", data: null };
    }
    const wishListCollection = getFirestore().collection("wishList");
    const newDoc = data.docId
      ? wishListCollection.doc(data.docId)
      : wishListCollection.doc();
    const newData = {
      ...data,
      user: {
        displayName: name,
        uid: uid,
        email: email,
      },
      ...(data.docId ? {} : { createdAt: Date.now() }),
      updatedAt: Date.now(),
      docId: newDoc.id,
    };
    console.log("setWishList newData", newData);
    const writeResult = await newDoc.set(newData, { merge: true });
    return { success: true, data: writeResult };
  }
);

exports.getExchangeEvent = onCall<
  GetExchangeEventRequest,
  Promise<GetExchangeEventResponse>
>({ cors: [/firebase\.com$/, /airlum.web.app/] }, async (req) => {
  const user = req.auth?.token;
  if (!user || !("uid" in user) || !user.uid) {
    return { success: false, error: "No user found", data: null };
  }
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
  const user = req.auth?.token;
  if (!user || !("uid" in user) || !user.uid) {
    return { success: false, error: "No user found", data: [] };
  }
  const result = await getFirestore()
    .collection("exchangeEvent")
    .doc(req.data.exchangeEvent)
    .get();
  if (!result.exists) {
    return { success: false, error: "No event found", data: [] };
  }
  const event = result.data() as ExchangeEvent;
  if (!event.users.find((u) => u.email === user.email)) {
    return { success: false, error: "User not in event", data: [] };
  }

  const wishLists = await getFirestore()
    .collection("wishList")
    .where("exchangeEvent", "==", req.data.exchangeEvent)
    .get();

  if (wishLists.empty) {
    return { success: false, error: "No wish lists found", data: [] };
  }
  return {
    success: true,
    data: wishLists.docs.map(
      (d) =>
        ({
          ...d.data(),
          docId: d.id,
        } as unknown as ChristmasList)
    ),
  };
});
