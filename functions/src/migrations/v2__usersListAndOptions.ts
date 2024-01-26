import * as admin from "firebase-admin";
import {
  getFirestore as getFirestoreAdmin,
  Filter,
  FieldValue,
  UpdateData,
} from "firebase-admin/firestore";
import { map } from "lodash";
import { ExchangeEvent } from "../models";

const appAdmin = admin.initializeApp({
  projectId: "airlum",
  storageBucket: "airlum.appspot.com",
});

const dbAdmin = getFirestoreAdmin(appAdmin);

dbAdmin.listCollections().then((collections) => {
  collections.forEach((collection) => {
    console.log(`db has collection ${collection.path}`);
  });
});

type OldExchangeEvent = Omit<ExchangeEvent, "users"> & {
  users: {
    uid: string;
    email: string;
    joinedAt: number;
  }[];
};

const migrate = async () => {
  const result = await dbAdmin.runTransaction(async (transaction) => {
    const exchangeEventsRef = dbAdmin.collection(
      "exchangeEvent"
    ) as admin.firestore.CollectionReference<OldExchangeEvent>;
    const exchangeEvents = await transaction.get(exchangeEventsRef);
    exchangeEvents.forEach((exchangeEvent) => {
      const data = exchangeEvent.data();
      const newRef =
        exchangeEvent.ref as unknown as admin.firestore.DocumentReference<ExchangeEvent>;
      transaction.update(newRef, {
        users: map(data.users, "email"),
      });
    });
    return exchangeEvents.docs.map((doc) => doc.id);
  });
  console.log(result);
  return result;
};

migrate();
