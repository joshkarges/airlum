import { getFunctions, httpsCallable } from "firebase/functions";
import { WriteGameRequest, WriteGameResponse } from "../models/functions";
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
