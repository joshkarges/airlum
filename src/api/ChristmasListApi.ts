import firebase from "firebase/compat/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  SetWishListRequest,
  SetWishListResponse,
  GetExchangeEventRequest,
  GetExchangeEventResponse,
  GetAllWishListsRequest,
  GetAllWishListsResponse,
} from "../models/functions";

var firebaseConfig = {
  apiKey: process.env.REACT_FIREBASE_API_KEY,
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

const setWishList = httpsCallable<SetWishListRequest, SetWishListResponse>(
  functions,
  `${isDev ? "airlum/us-central1/" : ""}setWishList`
);

export const setWishListOnServer = async (request: SetWishListRequest) => {
  console.log("Set List Request", request.ideas);
  const response = await setWishList(request);
  console.log("Set List Response", response);
  return response.data;
};

const getExchangeEvent = httpsCallable<
  GetExchangeEventRequest,
  GetExchangeEventResponse
>(functions, `${isDev ? "airlum/us-central1/" : ""}getExchangeEvent`);

export const getExchangeEventFromServer = async (exchangeEvent: string) => {
  console.log("Get Exchange Event Request");
  const response = await getExchangeEvent({ exchangeEvent });
  console.log("Get Exchange Event Response", response);
  return response.data;
};

const getAllWishLists = httpsCallable<
  GetAllWishListsRequest,
  GetAllWishListsResponse
>(functions, `${isDev ? "airlum/us-central1/" : ""}getAllWishLists`);

export const getAllWishListsFromServer = async (exchangeEvent: string) => {
  console.log("Get All Wish Lists Request", exchangeEvent);
  const response = await getAllWishLists({ exchangeEvent });
  console.log("Get All Wish Lists Response", response);
  return response.data;
};
