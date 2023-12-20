import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
const fs = require("fs");

const runTests = async () => {
  let testEnv = await initializeTestEnvironment({
    projectId: "demo-project-1234",
    firestore: {
      rules: fs.readFileSync("../firestore.rules", "utf8"),
    },
  });

  const josh = testEnv.authenticatedContext("AVI2SncYDJeipOLE3sw1gt7SjWh2", {
    email: "joshkarges@gmail.com",
    displayName: "Josh Karges",
  });
  // Use the Firestore instance associated with this context
  // await assertSucceeds(setDoc(alice.firestore(), '/users/alice'), { ... });

  const db = josh.firestore();
  const test0 = async () => {
    assertSucceeds(
      db.collection("exchangeEvent").add({
        author: {
          uid: "AVI2SncYDJeipOLE3sw1gt7SjWh2",
        },
      })
    );
  };

  const test1 = async () => {
    assertSucceeds(
      db
        .collection("exchangeEvent")
        .where("author.uid", "==", "AVI2SncYDJeipOLE3sw1gt7SjWh2")
        .get()
    );
  };
  test0();
  test1();
};

runTests();
