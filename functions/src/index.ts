/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  getFirestore as getFirestoreAdmin,
  FieldValue,
} from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

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

const generateSixDigitAlphaNumericCode = () => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 6; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
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
