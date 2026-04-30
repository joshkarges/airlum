import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "./firebaseApp";

const db = firebase.firestore();

if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  try {
    db.useEmulator("localhost", 8080);
  } catch {
    // Emulator already configured (e.g. another module called useEmulator).
  }
}

const RECEIPT_SPLITS = "receiptSplits";

const chars =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const generateReceiptId = (): string => {
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export type ReceiptSplitLineStored = {
  description: string;
  amount: number;
  assignees: string[];
};

export type ReceiptSplitDoc = {
  id: string;
  createdAt: firebase.firestore.Timestamp | null;
  updatedAt: firebase.firestore.Timestamp | null;
  people: string[];
  lineOrder: string[];
  lines: Record<string, ReceiptSplitLineStored>;
  paymentGroups: { id: string; name: string; members: string[] }[];
  tax: { mode: "amount" | "percent"; amount: number; percent: number };
  tip: { mode: "amount" | "percent"; amount: number; percent: number };
  currency: {
    convert: boolean;
    from: string;
    to: string;
    fromRate: string;
    toRate: string;
  };
  receiptTotalsFromImage: {
    subtotal: number | null;
    tax: number | null;
    tip: number | null;
    grandTotal: number | null;
  } | null;
};

const defaultDoc = (id: string): ReceiptSplitDoc => ({
  id,
  createdAt: null,
  updatedAt: null,
  people: [],
  lineOrder: [],
  lines: {},
  paymentGroups: [],
  tax: { mode: "amount", amount: 0, percent: 0 },
  tip: { mode: "amount", amount: 0, percent: 0 },
  currency: {
    convert: false,
    from: "$",
    to: "$",
    fromRate: "1",
    toRate: "1",
  },
  receiptTotalsFromImage: null,
});

/** Build payload for setDoc (Firestore-compatible; no undefined values). */
export const buildReceiptSplitPayload = (
  id: string,
  partial: Partial<Omit<ReceiptSplitDoc, "id" | "createdAt" | "updatedAt">>
): Record<string, unknown> => {
  const base = defaultDoc(id);
  const merged: ReceiptSplitDoc = {
    ...base,
    ...partial,
    id,
    tax: { ...base.tax, ...partial.tax },
    tip: { ...base.tip, ...partial.tip },
    currency: { ...base.currency, ...partial.currency },
  };
  return {
    id: merged.id,
    people: merged.people,
    lineOrder: merged.lineOrder,
    lines: merged.lines,
    paymentGroups: merged.paymentGroups,
    tax: merged.tax,
    tip: merged.tip,
    currency: merged.currency,
    receiptTotalsFromImage: merged.receiptTotalsFromImage,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
};

export const createReceiptSplit = async (
  partial: Partial<Omit<ReceiptSplitDoc, "id" | "createdAt" | "updatedAt">>
): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateReceiptId();
    const ref = db.collection(RECEIPT_SPLITS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set(buildReceiptSplitPayload(id, partial));
      return id;
    }
  }
  throw new Error("Could not allocate a receipt id");
};

export const subscribeReceiptSplit = (
  id: string,
  onData: (data: ReceiptSplitDoc | null) => void,
  onError?: (e: Error) => void
): (() => void) =>
  db.collection(RECEIPT_SPLITS).doc(id).onSnapshot(
    (snap) => {
      if (!snap.exists) {
        onData(null);
        return;
      }
      onData(snap.data() as ReceiptSplitDoc);
    },
    (err) => {
      onError?.(err);
    }
  );

const debouncers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingMergedFields = new Map<string, Record<string, unknown>>();
const debounceResolvers = new Map<
  string,
  Array<{ resolve: () => void; reject: (e: unknown) => void }>
>();

const flushMergedUpdate = async (receiptId: string): Promise<void> => {
  const fields = pendingMergedFields.get(receiptId);
  pendingMergedFields.delete(receiptId);
  const waiters = debounceResolvers.get(receiptId) ?? [];
  debounceResolvers.delete(receiptId);
  if (!fields || Object.keys(fields).length === 0) {
    waiters.forEach(({ resolve }) => resolve());
    return;
  }
  try {
    await db
      .collection(RECEIPT_SPLITS)
      .doc(receiptId)
      .update({
        ...fields,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    waiters.forEach(({ resolve }) => resolve());
  } catch (e) {
    waiters.forEach(({ reject }) => reject(e));
  }
};

export const flushDebouncedReceiptUpdate = (receiptId: string): void => {
  const t = debouncers.get(receiptId);
  if (t != null) {
    clearTimeout(t);
    debouncers.delete(receiptId);
  }
  void flushMergedUpdate(receiptId);
};

export const updateReceiptFieldsDebounced = (
  receiptId: string,
  fields: Record<string, unknown>,
  delayMs = 400
): Promise<void> =>
  new Promise((resolve, reject) => {
    const prev = pendingMergedFields.get(receiptId) ?? {};
    pendingMergedFields.set(receiptId, { ...prev, ...fields });
    const list = debounceResolvers.get(receiptId) ?? [];
    list.push({ resolve, reject });
    debounceResolvers.set(receiptId, list);

    const existing = debouncers.get(receiptId);
    if (existing != null) {
      clearTimeout(existing);
    }
    const t = setTimeout(() => {
      debouncers.delete(receiptId);
      void flushMergedUpdate(receiptId);
    }, delayMs);
    debouncers.set(receiptId, t);
  });

export const updateReceiptFieldsImmediate = async (
  receiptId: string,
  fields: Record<string, unknown>
): Promise<void> => {
  await db
    .collection(RECEIPT_SPLITS)
    .doc(receiptId)
    .update({
      ...fields,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const patchLineFieldsDebounced = (
  receiptId: string,
  lineId: string,
  patch: Partial<Pick<ReceiptSplitLineStored, "description" | "amount">>,
  delayMs = 400
): Promise<void> => {
  const fields: Record<string, unknown> = {};
  if (patch.description !== undefined) {
    fields[`lines.${lineId}.description`] = patch.description;
  }
  if (patch.amount !== undefined) {
    fields[`lines.${lineId}.amount`] = patch.amount;
  }
  if (Object.keys(fields).length === 0) {
    return Promise.resolve();
  }
  return updateReceiptFieldsDebounced(receiptId, fields, delayMs);
};

export const setLineDoc = async (
  receiptId: string,
  lineId: string,
  line: ReceiptSplitLineStored,
  lineOrder: string[]
): Promise<void> => {
  await db
    .collection(RECEIPT_SPLITS)
    .doc(receiptId)
    .update({
      [`lines.${lineId}`]: line,
      lineOrder,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const removeLineDoc = async (
  receiptId: string,
  lineId: string,
  lineOrder: string[]
): Promise<void> => {
  await db
    .collection(RECEIPT_SPLITS)
    .doc(receiptId)
    .update({
      [`lines.${lineId}`]: firebase.firestore.FieldValue.delete(),
      lineOrder,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const addAssignee = async (
  receiptId: string,
  lineId: string,
  name: string
): Promise<void> => {
  await db
    .collection(RECEIPT_SPLITS)
    .doc(receiptId)
    .update({
      [`lines.${lineId}.assignees`]:
        firebase.firestore.FieldValue.arrayUnion(name),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const removeAssignee = async (
  receiptId: string,
  lineId: string,
  name: string
): Promise<void> => {
  await db
    .collection(RECEIPT_SPLITS)
    .doc(receiptId)
    .update({
      [`lines.${lineId}.assignees`]:
        firebase.firestore.FieldValue.arrayRemove(name),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const syncAssigneesToServer = async (
  receiptId: string,
  lineId: string,
  assignees: string[]
): Promise<void> => {
  await db
    .collection(RECEIPT_SPLITS)
    .doc(receiptId)
    .update({
      [`lines.${lineId}.assignees`]: assignees,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};
