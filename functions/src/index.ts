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
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const app = express();

// Add middleware to authenticate requests
// app.use();

// build multiple CRUD interfaces:
app.get('/health', (req, res) => res.send('OK'));
app.post('/createWishList', async (req, res) => {
  const data = req.body;
  console.log('data', data);
  const newDoc = await getFirestore()
      .collection("wishList").doc();
  const writeResult = newDoc.set(data);
  return res.send(writeResult);
});
// app.put('/:id', (req, res) => res.send(Widgets.update(req.params.id, req.body)));
// app.delete('/:id', (req, res) => res.send(Widgets.delete(req.params.id)));
// app.get('/', (req, res) => res.send(Widgets.list()));

// Expose Express API as a single Cloud Function:
exports.api = onRequest(app);