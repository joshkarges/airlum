import { expect as expectChai } from "chai";
const admin = require("firebase-admin");

// Initialize the firebase-functions-test SDK using environment variables.
// These variables are automatically set by firebase emulators:exec
//
// This configuration will be used to initialize the Firebase Admin SDK, so
// when we use the Admin SDK in the tests below we can be confident it will
// communicate with the emulators, not production.
const testEnv = require("firebase-functions-test")({
  projectId: process.env.GCLOUD_PROJECT,
});

// Import the exported function definitions from our functions/index.js file
const myFunctions = require("../functions/src/index");

afterAll(() => {
  testEnv.cleanup();
});

describe("Unit tests", () => {
  test("health", async () => {
    const wrapped = testEnv.wrap(myFunctions.health);
    const result = await wrapped();
    expect(result).toBe("OK");
  });

  // test("tests a simple callable function", async () => {
  //   const wrapped = testEnv.wrap(myFunctions.simpleCallable);

  //   const data = {
  //     a: 1,
  //     b: 2,
  //   };

  //   // Call the wrapped function with data and context
  //   const result = await wrapped(data);

  //   // Check that the result looks like we expected.
  //   expectChai(result).to.eql({
  //     c: 3,
  //   });
  // });

  // test("tests a Cloud Firestore function", async () => {
  //   const wrapped = testEnv.wrap(myFunctions.firestoreUppercase);

  //   // Make a fake document snapshot to pass to the function
  //   const after = testEnv.firestore.makeDocumentSnapshot(
  //     {
  //       text: "hello world",
  //     },
  //     "/lowercase/foo"
  //   );

  //   // Call the function
  //   await wrapped(after);

  //   // Check the data in the Firestore emulator
  //   const snap = await admin.firestore().doc("/uppercase/foo").get();
  //   expectChai(snap.data()).to.eql({
  //     text: "HELLO WORLD",
  //   });
  // });

  // test("tests an Auth function that interacts with Firestore", async () => {
  //   const wrapped = testEnv.wrap(myFunctions.userSaver);

  //   // Make a fake user to pass to the function
  //   const uid = `${new Date().getTime()}`;
  //   const email = `user-${uid}@example.com`;
  //   const user = testEnv.auth.makeUserRecord({
  //     uid,
  //     email,
  //   });

  //   // Call the function
  //   await wrapped(user);

  //   // Check the data was written to the Firestore emulator
  //   const snap = await admin.firestore().collection("users").doc(uid).get();
  //   const data = snap.data();

  //   expectChai(data.uid).to.eql(uid);
  //   expectChai(data.email).to.eql(email);
  // });
});
