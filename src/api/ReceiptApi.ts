import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebaseApp";

export type ParseReceiptImageRequest = {
  imageBase64: string;
  mimeType?: string;
};

export type ParseReceiptLineItem = {
  description: string;
  amount: number;
};

export type ParseReceiptImageResponse = {
  items: ParseReceiptLineItem[];
};

const isDev = process.env.NODE_ENV === "development";

const functions = isDev
  ? getFunctions(app, "http://localhost:5001/")
  : getFunctions(app);

const parseReceiptImageCallable = httpsCallable<
  ParseReceiptImageRequest,
  ParseReceiptImageResponse
>(
  functions,
  `${isDev ? "airlum/us-central1/" : ""}parseReceiptImage`
);

export const parseReceiptImage = async (
  req: ParseReceiptImageRequest
): Promise<ParseReceiptImageResponse> => {
  const response = await parseReceiptImageCallable(req);
  return response.data;
};
