/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  describe,
  test,
  beforeEach,
  beforeAll,
  afterAll,
  expect,
} from "@jest/globals";
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext,
} from "@firebase/rules-unit-testing";
import {
  expectFirestorePermissionDenied,
  expectFirestorePermissionUpdateSucceeds,
  expectPermissionGetSucceeds,
  expectFirestorePermissionCreateSucceeds,
  getFirestoreCoverageMeta,
} from "./utils";
import { readFileSync, createWriteStream } from "fs";
import { get } from "http";
import { resolve } from "path";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  setLogLevel,
  Firestore,
} from "firebase/firestore";

let testEnv: RulesTestEnvironment;
const PROJECT_ID = "airlum";
const FIREBASE_JSON = resolve(__dirname, "../firebase.json");

let unauthedDb: ReturnType<RulesTestContext["firestore"]>;
let authedDb: ReturnType<RulesTestContext["firestore"]>;

const JOSH_AUTHORED_EXCHANGE_EVENT = "joshAuthoredExchangeEvent";
const JOSH_AUTHORED_EXCHANGE_EVENT_TO_DELETE =
  "joshAuthoredExchangeEventToDelete";
const NOT_JOSH_AUTHORED_EXCHANGE_EVENT = "notJoshAuthoredExchangeEvent";
const NOT_JOSH_AUTHORED_EXCHANGE_EVENT_WITH_JOSH =
  "notJoshAuthoredExchangeEventWithJosh";
const JOSH_AUTHORED_WISH_LIST = "joshAuthoredWishList";
const NOT_JOSH_AUTHORED_WISH_LIST = "notJoshAuthoredWishList";
const ALICE_AUTHORED_WISH_LIST = "aliceAuthoredWishList";
const EXTRA_ALICE_AUTHORED_WISH_LIST = "extraAliceAuthoredWishList";
const EXTRA_JOSH_AUTHORED_WISH_LIST = "extraJoshQuthoredWishList";
const OTHER_EVENT_NOT_JOSH_WISH_LIST = "otherEventNotJoshWishList";

beforeAll(async () => {
  // Silence expected rules rejections from Firestore SDK. Unexpected rejections
  // will still bubble up and will be thrown as an error (failing the tests).
  setLogLevel("error");
  const { host, port } = getFirestoreCoverageMeta(PROJECT_ID, FIREBASE_JSON);
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  authedDb = testEnv
    .authenticatedContext("josh", {
      email: "joshkarges@gmail.com",
    })
    .firestore();
  unauthedDb = testEnv.unauthenticatedContext().firestore();
  createFakeExchangeEvent("josh", JOSH_AUTHORED_EXCHANGE_EVENT);
  createFakeExchangeEvent("josh", JOSH_AUTHORED_EXCHANGE_EVENT_TO_DELETE);
  createFakeExchangeEvent("notJosh", NOT_JOSH_AUTHORED_EXCHANGE_EVENT, {});
  createFakeExchangeEvent(
    "notJosh",
    NOT_JOSH_AUTHORED_EXCHANGE_EVENT_WITH_JOSH
  );
  createFakeWishList(
    "josh",
    JOSH_AUTHORED_WISH_LIST,
    JOSH_AUTHORED_EXCHANGE_EVENT,
    false
  );
  createFakeWishList(
    "alice",
    ALICE_AUTHORED_WISH_LIST,
    JOSH_AUTHORED_EXCHANGE_EVENT,
    false
  );
  createFakeWishList(
    "alice",
    EXTRA_ALICE_AUTHORED_WISH_LIST,
    JOSH_AUTHORED_EXCHANGE_EVENT,
    true
  );
  createFakeWishList(
    "josh",
    EXTRA_JOSH_AUTHORED_WISH_LIST,
    JOSH_AUTHORED_EXCHANGE_EVENT,
    true
  );
  createFakeWishList(
    "notJosh",
    OTHER_EVENT_NOT_JOSH_WISH_LIST,
    NOT_JOSH_AUTHORED_EXCHANGE_EVENT,
    false
  );
});

// afterAll(async () => {
//   // Write the coverage report to a file
//   const { coverageUrl } = getFirestoreCoverageMeta(PROJECT_ID, FIREBASE_JSON);
//   const coverageFile = "./firestore-coverage.html";
//   const fstream = createWriteStream(coverageFile);
//   get(coverageUrl, (res) => {
//     res.pipe(fstream, { end: true });
//     res.on("end", () => {});
//     res.on("error", () => {});
//   });
// });

// beforeEach(async () => {
//   await testEnv.clearFirestore();
// });

// If you want to define global variables for Rules Test Contexts to save some
// typing, make sure to initialize them for *every test* to avoid cache issues.
//
//     let unauthedDb;
//     beforeEach(() => {
//       unauthedDb = testEnv.unauthenticatedContext().database();
//     });
//
// Or you can just create them inline to make tests self-contained like below.

function createFakeExchangeEvent(
  uid: string,
  docId: string,
  users: any = {
    "joshkarges@gmail.com": {
      uid: "josh",
      email: "joshkarges@gmail.com",
      joinedAt: Date.now(),
    },
    "alice@gmail.com": {
      uid: "alice",
      email: "alice@gmail.com",
      joinedAt: Date.now(),
    },
  }
) {
  return testEnv.withSecurityRulesDisabled((context) =>
    context.firestore().collection("exchangeEvent").doc(docId).set({
      title: "Title",
      description: "description",
      author: { uid },
      users,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: docId,
    })
  );
}

function createFakeWishList(
  uid: string,
  docId: string,
  exchangeEvent: string,
  isExtra: boolean
) {
  return testEnv.withSecurityRulesDisabled((context) =>
    context
      .firestore()
      .collection("wishList")
      .doc(docId)
      .set({
        title: "WishList Title",
        notes: "These are notes",
        ideas: {
          idea1: {
            title: "Pony",
            description: "A small horse",
            mark: null,
            comments: {},
            user: {
              uid,
              email: "joshkarges@gmail.com",
              displayName: "Josh Karges",
            },
          },
        },
        exchangeEvent,
        isExtra,
        author: { uid },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        id: docId,
      })
  );
}

const testFilter = (
  str: string,
  fn: Parameters<typeof test>[1],
  run = true
) => {
  if (run) {
    test(str, fn);
  }
};

describe("Exchange Event Access", () => {
  testFilter(
    "A user can list exchangeEvents that they've authored",
    async () => {
      // This fails if the list returned is empty?
      await expectFirestorePermissionDenied(
        authedDb
          .collection("exchangeEvent")
          .where("author.uid", "==", "noone")
          .get()
      );

      // Can list all exchangeEvent docs that the user authored.
      await expectPermissionGetSucceeds(
        authedDb
          .collection("exchangeEvent")
          .where("author.uid", "==", "josh")
          .get()
      );

      // Cannot list all the exchangeEvents that the user did not author.
      await expectFirestorePermissionDenied(
        authedDb
          .collection("exchangeEvent")
          .where("author.uid", "==", "notJosh")
          .get()
      );
    }
  );

  testFilter(
    "A user can create an exchange event if they define themselves as the author",
    async () => {
      // A user can create an exchange event if they define themselves as the author
      await expectFirestorePermissionCreateSucceeds(
        authedDb.collection("exchangeEvent").add({
          title: "Title",
          description: "description",
          author: { uid: "josh" },
          users: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      // Can't create a doc with a different author
      await expectFirestorePermissionDenied(
        authedDb.collection("exchangeEvent").add({
          title: "Title",
          description: "description",
          author: { uid: "notJosh" },
          users: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
    }
  );

  testFilter("A user can update an exchangeEvent", async () => {
    // Can't update non-existent doc
    await expectFirestorePermissionDenied(
      authedDb.collection("exchangeEvent").doc("nonExistentDoc").update({
        title: "New Title",
        updatedAt: Date.now(),
      })
    );

    // Update existing doc
    await expectFirestorePermissionUpdateSucceeds(
      authedDb
        .collection("exchangeEvent")
        .doc(JOSH_AUTHORED_EXCHANGE_EVENT)
        .update({
          title: "New Title",
          updatedAt: Date.now(),
        })
    );

    // Can't update doc that the user didn't author.
    await expectFirestorePermissionDenied(
      authedDb
        .collection("exchangeEvent")
        .doc(NOT_JOSH_AUTHORED_EXCHANGE_EVENT)
        .update({
          title: "New Title",
          updatedAt: Date.now(),
        })
    );
  });

  // Somehow this test breaks the one after it.  So we're placing it at the end?
  testFilter("A user can get a specific exchangeEvent", async () => {
    await expectPermissionGetSucceeds(
      authedDb
        .collection("exchangeEvent")
        .doc(JOSH_AUTHORED_EXCHANGE_EVENT)
        .get()
    );
  });

  testFilter("A user can delete an exchangeEvent", async () => {
    // Can't delete a non-existent doc
    await expectFirestorePermissionDenied(
      authedDb.collection("exchangeEvent").doc("nonExistent").delete()
    );

    // Can't delete a doc that they didn't author.
    await expectFirestorePermissionDenied(
      authedDb
        .collection("exchangeEvent")
        .doc(NOT_JOSH_AUTHORED_EXCHANGE_EVENT)
        .delete()
    );

    // User can delete a doc that they authored
    await expectFirestorePermissionUpdateSucceeds(
      authedDb
        .collection("exchangeEvent")
        .doc(JOSH_AUTHORED_EXCHANGE_EVENT_TO_DELETE)
        .delete()
    );
  });
});

describe("Wish Lists", () => {
  testFilter(
    "A user can list all the wishLists from the exchangeEvent that they belong to, even if the list is empty.",
    async () => {
      // User can list all the wishLists from an exchange event they authored.
      await expectPermissionGetSucceeds(
        authedDb
          .collection("wishList")
          .where("exchangeEvent", "==", JOSH_AUTHORED_EXCHANGE_EVENT)
          .get()
      );

      // User can list all the wishLists from an exchange event they belong to.
      await expectPermissionGetSucceeds(
        authedDb
          .collection("wishList")
          .where(
            "exchangeEvent",
            "==",
            NOT_JOSH_AUTHORED_EXCHANGE_EVENT_WITH_JOSH
          )
          .get()
      );

      // User can't list wishlists from a non-existent event
      await expectFirestorePermissionDenied(
        authedDb
          .collection("wishList")
          .where("exchangeEvent", "==", "nonExistentEvent")
          .get()
      );

      // User can't list wishLists from an event they don't belong to
      await expectFirestorePermissionDenied(
        authedDb
          .collection("wishList")
          .where("exchangeEvent", "==", NOT_JOSH_AUTHORED_EXCHANGE_EVENT)
          .get()
      );
    }
  );

  testFilter(
    "A user can create a wishList if they set the author to themselves",
    async () => {
      // A user can create a wishList if they set the author to themselves
      await expectFirestorePermissionCreateSucceeds(
        authedDb.collection("wishList").add({
          title: "WishList Title",
          notes: "These are notes",
          ideas: {},
          exchangeEvent: JOSH_AUTHORED_EXCHANGE_EVENT,
          isExtra: false,
          author: { uid: "josh" },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      // A user can't create a wishList with a different author uid.
      await expectFirestorePermissionDenied(
        authedDb.collection("wishList").add({
          title: "WishList Title",
          notes: "These are notes",
          ideas: {},
          exchangeEvent: JOSH_AUTHORED_EXCHANGE_EVENT,
          isExtra: false,
          author: { uid: "alice" },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      // A user can't create a wishList for an event they don't belong to.
      await expectFirestorePermissionDenied(
        authedDb.collection("wishList").add({
          title: "",
        })
      );
    }
  );

  testFilter(
    "A user can update a wishList if they're apart of the exchangeEvent",
    async () => {
      // User can update wishList metadata if they authored it.
      await expectFirestorePermissionUpdateSucceeds(
        authedDb.collection("wishList").doc(JOSH_AUTHORED_WISH_LIST).update({
          title: "Some other title",
        })
      );

      // A User can add a comment to the wishList of another user if they're apart of the exchangeEvent
      await expectFirestorePermissionUpdateSucceeds(
        authedDb
          .collection("wishList")
          .doc(ALICE_AUTHORED_WISH_LIST)
          .update({
            [`ideas.idea1.comments.comment1`]: {
              text: "This is a comment",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              author: { uid: "josh" },
              id: "comment1",
            },
            [`ideas.idea1.updatedAt`]: Date.now(),
            updatedAt: Date.now(),
          })
      );
    }
  );

  testFilter(
    "A user can delete a wishList if they are the author and it is an extra wishList",
    async () => {
      await expectFirestorePermissionUpdateSucceeds(
        authedDb
          .collection("wishList")
          .doc(EXTRA_JOSH_AUTHORED_WISH_LIST)
          .delete()
      );

      // Can't delete a non-extra wishList
      await expectFirestorePermissionDenied(
        authedDb.collection("wishList").doc(JOSH_AUTHORED_WISH_LIST).delete()
      );

      // Can't delete someone elses wishList
      await expectFirestorePermissionDenied(
        authedDb.collection("wishList").doc(ALICE_AUTHORED_WISH_LIST).delete()
      );

      // Can't delete someone elses extra wishList
      await expectFirestorePermissionDenied(
        authedDb
          .collection("wishList")
          .doc(EXTRA_ALICE_AUTHORED_WISH_LIST)
          .delete()
      );
    }
  );
});
