import firebase from "firebase/compat/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  GetExchangeEventRequest,
  GetExchangeEventResponse,
  GetAllWishListsRequest,
  GetAllWishListsResponse,
  AddCommentRequest,
  AddCommentResponse,
  AddIdeaRequest,
  AddIdeaResponse,
  CreateWishListRequest,
  CreateWishListResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
  DeleteExtraWishListRequest,
  DeleteExtraWishListResponse,
  DeleteIdeaRequest,
  DeleteIdeaResponse,
  MarkIdeaRequest,
  MarkIdeaResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  UpdateIdeaMetadataRequest,
  UpdateIdeaMetadataResponse,
  UpdateWishListMetadataRequest,
  UpdateWishListMetadataResponse,
} from "../models/functions";

var firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "airlum.firebaseapp.com",
  projectId: "airlum",
  storageBucket: "airlum.appspot.com",
  messagingSenderId: "1002201936954",
  appId: "1:1002201936954:web:a17f309ae03b868557f103",
  measurementId: "G-FZ88CGSCH7",
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

const isDev = process.env.NODE_ENV === "development";

const functions = isDev
  ? getFunctions(app, "http://localhost:5001/")
  : getFunctions(app);

const getHealth = httpsCallable<undefined, "OK">(
  functions,
  `${isDev ? "airlum/us-central1/" : ""}getHealth`
);

export const checkHealth = async () => {
  console.log("Check Health Request");
  const response = await getHealth();
  console.log("Check Health Response", response);
  return response.data;
};

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

export const createWishListOnServer = makeFunctionsCall<
  CreateWishListRequest,
  CreateWishListResponse
>("createWishList");
export const deleteExtraWishListOnServer = makeFunctionsCall<
  DeleteExtraWishListRequest,
  DeleteExtraWishListResponse
>("deleteExtraWishList");
export const updateWishListMetadataOnServer = makeFunctionsCall<
  UpdateWishListMetadataRequest,
  UpdateWishListMetadataResponse
>("updateWishListMetadata");
export const addIdeaOnServer = makeFunctionsCall<
  AddIdeaRequest,
  AddIdeaResponse
>("addIdea");
export const deleteIdeaOnServer = makeFunctionsCall<
  DeleteIdeaRequest,
  DeleteIdeaResponse
>("deleteIdea");
export const markIdeaOnServer = makeFunctionsCall<
  MarkIdeaRequest,
  MarkIdeaResponse
>("markIdea");
export const updateIdeaMetadataOnServer = makeFunctionsCall<
  UpdateIdeaMetadataRequest,
  UpdateIdeaMetadataResponse
>("updateIdeaMetadata");
export const addCommentOnServer = makeFunctionsCall<
  AddCommentRequest,
  AddCommentResponse
>("addComment");
export const deleteCommentOnServer = makeFunctionsCall<
  DeleteCommentRequest,
  DeleteCommentResponse
>("deleteComment");
export const updateCommentOnServer = makeFunctionsCall<
  UpdateCommentRequest,
  UpdateCommentResponse
>("updateComment");

export const getExchangeEventFromServer = makeFunctionsCall<
  GetExchangeEventRequest,
  GetExchangeEventResponse
>("getExchangeEvent");

export const getAllWishListsFromServer = makeFunctionsCall<
  GetAllWishListsRequest,
  GetAllWishListsResponse
>("getAllWishLists");
