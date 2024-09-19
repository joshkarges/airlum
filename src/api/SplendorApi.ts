import { getFunctions, httpsCallable } from "firebase/functions";
import {
  UpsertTimedTeamRequest,
  UpsertTimedTeamResponse,
  DeleteMemberRequest,
  DeleteMemberResponse,
  FinishTimedTeamRequest,
  FinishTimedTeamResponse,
  GameRecord,
  GetTimedTeamRequest,
  GetTimedTeamResponse,
  JoinTimedTeamRequest,
  JoinTimedTeamResponse,
  StartTimedTeamRequest,
  StartTimedTeamResponse,
  WriteGameRequest,
  WriteGameResponse,
  ResetTimedTeamRequest,
  ResetTimedTeamResponse,
  EditMemberNameRequest,
  EditMemberNameResponse,
} from "../models/functions";
import { app } from "./firebaseApp";

const isDev = process.env.NODE_ENV === "development";

const functions = isDev
  ? getFunctions(app, "http://localhost:5001/")
  : getFunctions(app);

const makeFunctionsCall = <Req, Res>(name: string) => {
  const callable = httpsCallable<Req, Res>(
    functions,
    `${isDev ? "airlum/us-central1/" : ""}${name}`
  );
  const result = async (req: Req) => {
    console.log(`${name} Request`, req);
    const response = await callable(req);
    console.log(`${name} Response`, response);
    return response.data;
  };
  result.displayName = name;
  return result;
};

export const writeSplendorGame = makeFunctionsCall<
  WriteGameRequest,
  WriteGameResponse
>("writeSplendorGame");

export const getAllSpendorGames = makeFunctionsCall<void, GameRecord[]>(
  "getAllSplendorGames"
);

export const upsertTimedTeam = makeFunctionsCall<
  UpsertTimedTeamRequest,
  UpsertTimedTeamResponse
>("upsertTimedTeam");

export const getTimedTeam = makeFunctionsCall<
  GetTimedTeamRequest,
  GetTimedTeamResponse
>("getTimedTeam");

export const joinTimedTeam = makeFunctionsCall<
  JoinTimedTeamRequest,
  JoinTimedTeamResponse
>("joinTimedTeam");

export const deleteMember = makeFunctionsCall<
  DeleteMemberRequest,
  DeleteMemberResponse
>("deleteMemberFromTimedTeam");

export const startTimedTeam = makeFunctionsCall<
  StartTimedTeamRequest,
  StartTimedTeamResponse
>("startTimedTeam");

export const finishTimedTeam = makeFunctionsCall<
  FinishTimedTeamRequest,
  FinishTimedTeamResponse
>("finishTimedTeam");

export const resetTimedTeam = makeFunctionsCall<
  ResetTimedTeamRequest,
  ResetTimedTeamResponse
>("resetTimedTeam");

export const editMemberName = makeFunctionsCall<
  EditMemberNameRequest,
  EditMemberNameResponse
>("editMemberName");
