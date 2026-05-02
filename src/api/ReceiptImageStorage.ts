import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "./firebaseApp";

const storage = firebase.storage();

if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  try {
    storage.useEmulator("localhost", 9199);
  } catch {
    // Emulator already configured.
  }
}

const receiptImagePath = (receiptId: string) =>
  `receiptSplits/${receiptId}/receipt.jpg`;

/** Best-effort delete (ignores missing object). */
export const deleteReceiptImageForReceiptId = async (
  receiptId: string
): Promise<void> => {
  try {
    await storage.ref(receiptImagePath(receiptId)).delete();
  } catch {
    // Object may not exist; ignore.
  }
};

/** Upload base64 JPEG (or other image) bytes; returns Storage path for Firestore. */
export const uploadReceiptImage = async (
  receiptId: string,
  base64: string,
  mimeType: string
): Promise<string> => {
  const path = receiptImagePath(receiptId);
  const ref = storage.ref(path);
  await ref.putString(base64, "base64", { contentType: mimeType });
  return path;
};

export const getReceiptImageDownloadUrl = async (
  path: string
): Promise<string> => {
  const ref = storage.ref(path);
  return ref.getDownloadURL();
};
