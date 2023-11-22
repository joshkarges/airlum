/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

import express = require('express');

// The Firebase Admin SDK to access Firestore.
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();

const app = express();

// Add middleware to authenticate requests
// app.use();

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = async (req: any, res: any, next: any) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized: Bearer token missing');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch(e) {
    res.status(403).send(`Unauthorized: ${e}`);
    return;
  }
};

app.use(authenticate);

// build multiple CRUD interfaces:
app.get('/health', (req, res) => res.send('OK'));
app.post('/setWishList', async (req, res) => {
  const data = req.body;
  const user = (req as any).user as admin.auth.DecodedIdToken;
  console.log('setWishList user', user)
  const wishListCollection = getFirestore()
      .collection("wishList");
  const newDoc = data.docId ? wishListCollection.doc(data.docId) : wishListCollection.doc();
  const newData = {
    ...data,
    user: {
      displayName: user.name,
      uid: user.uid,
      email: user.email,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  console.log('setWishList newData', newData);
  const writeResult = await newDoc.set(newData);
  return res.send(writeResult);
});
// app.put('/:id', (req, res) => res.send(Widgets.update(req.params.id, req.body)));
// app.delete('/:id', (req, res) => res.send(Widgets.delete(req.params.id)));
app.get('/getWishList', async (req, res) => {
  const user = (req as any).user as admin.auth.DecodedIdToken;
  if (!user || !('uid' in user) || !user.uid) return res.send({success: false, error: 'No user found', data: null});
  const result = await getFirestore()
      .collection("wishList").doc(user.uid).get();
  if (!result.exists) return res.send({success: false, error: 'No data found', data: null});
  return res.send({success: true, data: result.data()});
});

// Must match the airlum models type.
type ExchangeEvent = {
  createdAt: number;
  updatedAt: number;
  name: string;
  description: string;
  ledger: {
    [uid: string]: {
      [ideaId: string]: {
        completedBy: string;
        completedAt: number;
        ideaTimestamp: number;
      },
    },
  }[],
  users: {
    email: string;
    joinedAt: number;
    uid: string;
  }[]
};

app.get('/getExchangeEvent/:exchangeEvent', async (req, res) => {
  const user = (req as any).user as admin.auth.DecodedIdToken;
  if (!user || !('uid' in user) || !user.uid) return res.send({success: false, error: 'No user found', data: null});
  const result = await getFirestore()
      .collection("exchangeEvent").doc(req.params.exchangeEvent).get();
  if (!result.exists) return res.send({success: false, error: 'No event found', data: null});

  const event = result.data() as ExchangeEvent;

  if (!event.users.find(u => u.email === user.email)) return res.send({success: false, error: 'User not in event', data: null});

  return res.send({success: true, data: event});
});

app.get('/getAllWishLists/:exchangeEvent', async (req, res) => {
  const user = (req as any).user as admin.auth.DecodedIdToken;
  if (!user || !('uid' in user) || !user.uid) return res.send({success: false, error: 'No user found', data: []});
  const result = await getFirestore()
      .collection("exchangeEvent").doc(req.params.exchangeEvent).get();
  if (!result.exists) return res.send({success: false, error: 'No event found', data: []});
  const event = result.data() as ExchangeEvent;
  if (!event.users.find(u => u.email === user.email)) return res.send({success: false, error: 'User not in event', data: []});

  const wishLists = await getFirestore().collection("wishList").where('exchangeEvent', '==', req.params.exchangeEvent).get();

  if (wishLists.empty) return res.send({success: false, error: 'No wish lists found', data: []});

  return res.send({success: true, data: wishLists.docs.map(d => ({
    ...d.data(),
    id: d.id,
  }))});
});

// Expose Express API as a single Cloud Function:
exports.api = onRequest(app);