import {
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  ListItemText,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Slider,
  type SelectChangeEvent,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Toolbar,
  Typography,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Autocomplete,
  Snackbar,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShareIcon from "@mui/icons-material/Share";
import { makeStyles } from "@mui/styles";
import { blue } from "@mui/material/colors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { parseReceiptImage } from "../api/ReceiptApi";
import {
  createReceiptSplit,
  flushDebouncedReceiptUpdate,
  patchLineFieldsDebounced,
  removeLineDoc,
  setLineDoc,
  subscribeReceiptSplit,
  syncAssigneesToServer,
  updateReceiptFieldsImmediate,
  updateReceiptFieldsDebounced,
} from "../api/ReceiptSplitDb";
import { Flex } from "../components/Flex";
import { resizeImageFileToJpegBase64 } from "../utils/receiptImage";
import { parseLooseReceiptText } from "../utils/receiptParse";
import { ocrReceiptImageToText } from "../utils/receiptTesseract";
import { getCroppedImageBlob } from "../utils/getCroppedImage";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Close } from "@mui/icons-material";
import { DocTitle } from "../utils/useDocTitleEffect";

type ReceiptLine = {
  id: string;
  description: string;
  amount: number;
  /** People splitting this line; amount is divided equally among them. */
  assignees: string[];
};

/** Couples/families paying together; display-only layer on top of per-person totals. */
type PaymentGroup = {
  id: string;
  name: string;
  members: string[];
};

/** Stored under `linesById` and in Firestore `lines` map (no `id` field). */
type LineBody = {
  description: string;
  amount: number;
  assignees: string[];
};

const selfNameStorageKey = (receiptId: string) =>
  `receiptSplitSelf:${receiptId}`;

/** Split `amount` in cents across `names` so the parts sum exactly (no float drift). */
function addEqualSplitToMap(
  map: Record<string, number>,
  amount: number,
  names: string[]
) {
  if (names.length === 0) {
    return;
  }
  const cents = Math.round(amount * 100);
  const n = names.length;
  const base = Math.floor(cents / n);
  const remainder = cents - base * n;
  names.forEach((name, i) => {
    const shareCents = base + (i < remainder ? 1 : 0);
    map[name] = (map[name] || 0) + shareCents / 100;
  });
}

/**
 * Split `amount` dollars across keys proportionally to positive weights; sums to `amount` in cents.
 * Keys with weight 0 receive 0. If total weight is 0, returns empty (caller should handle fallback).
 */
function splitProportionalByWeights(
  amount: number,
  weights: Record<string, number>
): Record<string, number> {
  const keys = Object.keys(weights).filter((k) => weights[k] > 0);
  const sumW = keys.reduce((s, k) => s + weights[k], 0);
  const cents = Math.round(amount * 100);
  if (sumW <= 0 || cents === 0 || keys.length === 0) {
    return {};
  }
  const floorCents = keys.map((k) => ({
    k,
    c: Math.floor((cents * weights[k]) / sumW),
  }));
  const assignedSum = floorCents.reduce((s, x) => s + x.c, 0);
  let remainder = cents - assignedSum;
  const fracs = keys.map((k) => {
    const exact = (cents * weights[k]) / sumW;
    return { k, frac: exact - Math.floor(exact) };
  });
  fracs.sort((a, b) => b.frac - a.frac);
  const outCents: Record<string, number> = {};
  for (const { k, c } of floorCents) {
    outCents[k] = c;
  }
  for (let i = 0; i < remainder; i++) {
    const k = fracs[i].k;
    outCents[k] += 1;
  }
  return Object.fromEntries(
    Object.entries(outCents).map(([k, v]) => [k, v / 100])
  );
}

const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
  },
  link: {
    color: "inherit",
    textDecoration: "none",
    marginRight: theme.spacing(2),
    "&:hover": { textDecoration: "underline" },
  },
  section: {
    marginTop: theme.spacing(3),
  },
  itemColumn: {
    minWidth: 220,
    verticalAlign: "top",
  },
  preview: {
    maxWidth: "100%",
    maxHeight: 360,
    objectFit: "contain",
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "USD", label: "$" },
  { value: "EUR", label: "€" },
  { value: "BTC", label: "฿" },
  { value: "JPY", label: "¥" },
];

const CURRENCY_BY_VALUE = Object.fromEntries(
  CURRENCY_OPTIONS.map((c) => [c.value, c.label])
);

const CURRENCY_BY_LABEL = Object.fromEntries(
  CURRENCY_OPTIONS.map((c) => [c.label, c.value])
);

const getCurrencyCode = (currency: string) =>
  CURRENCY_BY_LABEL[currency] ?? currency;

const getCurrencyFractionDigits = (currency: string) => {
  const currencyCode = getCurrencyCode(currency);
  if (currencyCode === "BTC") {
    return 8;
  }
  try {
    return (
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch (e) {
    return 2;
  }
};

const formatCurrencyNumber = (n: number, currency: string) =>
  n.toFixed(getCurrencyFractionDigits(currency));

const getCurrencyStep = (currency: string) =>
  1 / 10 ** getCurrencyFractionDigits(currency);

const getAmountInputWidth = (currency: string, amountText: string) => {
  const currencyText = CURRENCY_BY_VALUE[currency] ?? currency;
  const chars = currencyText.length + amountText.length + 4;
  return `max(150px, calc(${chars}ch + 48px))`;
};

const roundCurrencyAmount = (n: number, currency: string) => {
  const multiplier = 10 ** getCurrencyFractionDigits(currency);
  return Math.round(n * multiplier) / multiplier;
};

const formatMoney = (n: number, currency: string) => {
  try {
    const fractionDigits = getCurrencyFractionDigits(currency);
    return n.toLocaleString(undefined, {
      style: "currency",
      currency: getCurrencyCode(currency),
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  } catch (e) {
    return `${CURRENCY_BY_VALUE[currency] ?? currency} ${formatCurrencyNumber(
      n,
      currency
    )}`;
  }
};

const amountFromPercent = (percent: number, subtotal: number) =>
  subtotal * (percent / 100);

const percentFromAmount = (amount: number, subtotal: number) =>
  subtotal > 0 ? (amount / subtotal) * 100 : 0;

function updatePaymentGroupMembers(
  groups: PaymentGroup[],
  groupId: string,
  newMembers: string[]
): PaymentGroup[] {
  const taken = new Set(newMembers);
  return groups.map((g) => {
    if (g.id === groupId) {
      return { ...g, members: newMembers };
    }
    return { ...g, members: g.members.filter((m) => !taken.has(m)) };
  });
}

export const ReceiptSplitPage = () => {
  const classes = useStyles();
  const { receiptId } = useParams<{ receiptId?: string }>();
  const history = useHistory();
  const isShared = Boolean(receiptId);

  const skipNextMetaPush = useRef(false);
  const hasHydratedShared = useRef(false);

  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState("");
  const [lineOrder, setLineOrder] = useState<string[]>([]);
  const [linesById, setLinesById] = useState<Record<string, LineBody>>({});
  const [pasteText, setPasteText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<false | "ai" | "ocr">(false);
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  /** When true, `error` is a soft warning (e.g. OCR text needs manual cleanup). */
  const [errorIsWarning, setErrorIsWarning] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  /** 0 = receipt photo, 1 = paste text */
  const [inputTab, setInputTab] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxMode, setTaxMode] = useState<"amount" | "percent">("amount");
  const [taxPercent, setTaxPercent] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipMode, setTipMode] = useState<"amount" | "percent">("amount");
  const [tipPercent, setTipPercent] = useState(0);
  const [lineAmountDrafts, setLineAmountDrafts] = useState<
    Record<string, string>
  >({});
  const [taxAmountDraft, setTaxAmountDraft] = useState<string | null>(null);
  const [tipAmountDraft, setTipAmountDraft] = useState<string | null>(null);
  const [paymentGroups, setPaymentGroups] = useState<PaymentGroup[]>([]);
  /** Totals read from the receipt by Parse with Gemini (not from OCR/paste). */
  const [receiptTotalsFromImage, setReceiptTotalsFromImage] = useState<{
    subtotal: number | null;
    tax: number | null;
    tip: number | null;
    grandTotal: number | null;
  } | null>(null);
  const [convertCurrency, setConvertCurrency] = useState(false);
  const [fromCurrency, setFromCurrency] = useState<string>("$");
  const [toCurrency, setToCurrency] = useState<string>("$");
  const [fromCurrencyRate, setFromCurrencyRate] = useState<string>("1");
  const [toCurrencyRate, setToCurrencyRate] = useState<string>("1");
  const fromCurrencyRateNumber = parseFloat(fromCurrencyRate) || 1;
  const toCurrencyRateNumber = parseFloat(toCurrencyRate) || 1;

  const [sharedNotFound, setSharedNotFound] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareSnackOpen, setShareSnackOpen] = useState(false);
  const [selfName, setSelfName] = useState("");

  const lines: ReceiptLine[] = useMemo(
    () =>
      lineOrder.map((id) => {
        const row = linesById[id];
        return {
          id,
          description: row?.description ?? "",
          amount: row?.amount ?? 0,
          assignees: row?.assignees ?? [],
        };
      }),
    [lineOrder, linesById]
  );

  const newPersonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!receiptId) {
      setSelfName("");
      return;
    }
    try {
      setSelfName(localStorage.getItem(selfNameStorageKey(receiptId)) ?? "");
    } catch {
      setSelfName("");
    }
  }, [receiptId]);

  useEffect(() => {
    if (!receiptId || !selfName) {
      return;
    }
    try {
      localStorage.setItem(selfNameStorageKey(receiptId), selfName);
    } catch {
      // ignore
    }
  }, [receiptId, selfName]);

  useEffect(() => {
    if (!receiptId) {
      setSharedNotFound(false);
      hasHydratedShared.current = false;
      return undefined;
    }
    setSharedNotFound(false);
    hasHydratedShared.current = false;
    const unsub = subscribeReceiptSplit(
      receiptId,
      (data) => {
        if (!data) {
          setSharedNotFound(true);
          hasHydratedShared.current = false;
          return;
        }
        hasHydratedShared.current = true;
        skipNextMetaPush.current = true;
        setPeople(data.people ?? []);
        const linesMap = data.lines ?? {};
        const order =
          data.lineOrder && data.lineOrder.length > 0
            ? data.lineOrder
            : Object.keys(linesMap);
        setLineOrder(order);
        setLinesById(linesMap);
        setPaymentGroups(data.paymentGroups ?? []);
        setTaxMode(data.tax?.mode ?? "amount");
        setTaxAmount(data.tax?.amount ?? 0);
        setTaxPercent(data.tax?.percent ?? 0);
        setTipMode(data.tip?.mode ?? "amount");
        setTipAmount(data.tip?.amount ?? 0);
        setTipPercent(data.tip?.percent ?? 0);
        setConvertCurrency(data.currency?.convert ?? false);
        setFromCurrency(data.currency?.from ?? "$");
        setToCurrency(data.currency?.to ?? "$");
        setFromCurrencyRate(data.currency?.fromRate ?? "1");
        setToCurrencyRate(data.currency?.toRate ?? "1");
        setReceiptTotalsFromImage(data.receiptTotalsFromImage ?? null);
      },
      (err) => {
        setError(err.message);
      }
    );
    return () => {
      hasHydratedShared.current = false;
      flushDebouncedReceiptUpdate(receiptId);
      unsub();
    };
  }, [receiptId]);

  useEffect(() => {
    if (!receiptId || sharedNotFound || !hasHydratedShared.current) {
      return undefined;
    }
    if (skipNextMetaPush.current) {
      skipNextMetaPush.current = false;
      return undefined;
    }
    void updateReceiptFieldsDebounced(receiptId, {
      people,
      paymentGroups,
      tax: {
        mode: taxMode,
        amount: taxAmount,
        percent: taxPercent,
      },
      tip: {
        mode: tipMode,
        amount: tipAmount,
        percent: tipPercent,
      },
      currency: {
        convert: convertCurrency,
        from: fromCurrency,
        to: toCurrency,
        fromRate: fromCurrencyRate,
        toRate: toCurrencyRate,
      },
      receiptTotalsFromImage,
    });
  }, [
    receiptId,
    sharedNotFound,
    people,
    paymentGroups,
    taxMode,
    taxAmount,
    taxPercent,
    tipMode,
    tipAmount,
    tipPercent,
    convertCurrency,
    fromCurrency,
    toCurrency,
    fromCurrencyRate,
    toCurrencyRate,
    receiptTotalsFromImage,
  ]);

  const newPersonIsDuplicate = useMemo(() => {
    const t = newPerson.trim();
    if (!t) {
      return false;
    }
    return people.some((p) => p.toLowerCase() === t.toLowerCase());
  }, [newPerson, people]);

  const totalsByPerson = useMemo(() => {
    const map: Record<string, number> = {};
    let unassigned = 0;
    for (const line of lines) {
      if (line.assignees.length === 0) {
        unassigned += line.amount;
        continue;
      }
      addEqualSplitToMap(map, line.amount, line.assignees);
    }
    return { map, unassigned };
  }, [lines]);

  const lineSubtotal = useMemo(
    () => lines.reduce((s, l) => s + l.amount, 0),
    [lines]
  );

  useEffect(() => {
    if (taxMode === "amount") {
      setTaxPercent(percentFromAmount(taxAmount, lineSubtotal));
    }
  }, [taxAmount, taxMode, lineSubtotal]);

  useEffect(() => {
    if (taxMode === "percent") {
      setTaxAmount(amountFromPercent(taxPercent, lineSubtotal));
    }
  }, [taxPercent, taxMode, lineSubtotal]);

  useEffect(() => {
    if (tipMode === "amount") {
      setTipPercent(percentFromAmount(tipAmount, lineSubtotal));
    }
  }, [tipAmount, tipMode, lineSubtotal]);

  useEffect(() => {
    if (tipMode === "percent") {
      setTipAmount(amountFromPercent(tipPercent, lineSubtotal));
    }
  }, [tipPercent, tipMode, lineSubtotal]);

  const effectiveTaxAmount = useMemo(() => {
    if (taxMode === "percent") {
      return amountFromPercent(taxPercent, lineSubtotal);
    }
    return taxAmount;
  }, [taxMode, taxPercent, taxAmount, lineSubtotal]);

  const effectiveTipAmount = useMemo(() => {
    if (tipMode === "percent") {
      return amountFromPercent(tipPercent, lineSubtotal);
    }
    return tipAmount;
  }, [tipMode, tipPercent, tipAmount, lineSubtotal]);

  const proportionalWeights = useMemo(() => {
    const weights: Record<string, number> = {};
    for (const name of people) {
      const w = totalsByPerson.map[name] || 0;
      if (w > 0) {
        weights[name] = w;
      }
    }
    if (totalsByPerson.unassigned > 0) {
      weights.__unassigned = totalsByPerson.unassigned;
    }
    return weights;
  }, [people, totalsByPerson]);

  const taxSplit = useMemo(() => {
    if (effectiveTaxAmount <= 0) {
      return {};
    }
    if (lineSubtotal > 0) {
      return splitProportionalByWeights(
        effectiveTaxAmount,
        proportionalWeights
      );
    }
    if (people.length > 0) {
      const m: Record<string, number> = {};
      addEqualSplitToMap(m, effectiveTaxAmount, people);
      return m;
    }
    return {};
  }, [effectiveTaxAmount, lineSubtotal, proportionalWeights, people]);

  const tipSplit = useMemo(() => {
    if (effectiveTipAmount <= 0) {
      return {};
    }
    if (lineSubtotal > 0) {
      return splitProportionalByWeights(
        effectiveTipAmount,
        proportionalWeights
      );
    }
    if (people.length > 0) {
      const m: Record<string, number> = {};
      addEqualSplitToMap(m, effectiveTipAmount, people);
      return m;
    }
    return {};
  }, [effectiveTipAmount, lineSubtotal, proportionalWeights, people]);

  const perPersonTotalsConverted = useMemo(() => {
    const out: Record<
      string,
      { items: number; tax: number; tip: number; grand: number }
    > = {};
    for (const name of people) {
      const items =
        ((totalsByPerson.map[name] || 0) * toCurrencyRateNumber) /
        fromCurrencyRateNumber;
      const tx =
        ((taxSplit[name] || 0) * toCurrencyRateNumber) / fromCurrencyRateNumber;
      const tp =
        ((tipSplit[name] || 0) * toCurrencyRateNumber) / fromCurrencyRateNumber;
      out[name] = { items, tax: tx, tip: tp, grand: items + tx + tp };
    }
    return out;
  }, [
    people,
    totalsByPerson.map,
    taxSplit,
    tipSplit,
    toCurrencyRateNumber,
    fromCurrencyRateNumber,
  ]);

  const peopleInPaymentGroups = useMemo(() => {
    const s = new Set<string>();
    for (const g of paymentGroups) {
      for (const m of g.members) {
        s.add(m);
      }
    }
    return s;
  }, [paymentGroups]);

  const ungroupedPeople = useMemo(
    () => people.filter((p) => !peopleInPaymentGroups.has(p)),
    [people, peopleInPaymentGroups]
  );

  const addPaymentGroup = useCallback(() => {
    setPaymentGroups((g) => [...g, { id: uuidv4(), name: "", members: [] }]);
  }, []);

  const removePaymentGroup = useCallback((id: string) => {
    setPaymentGroups((g) => g.filter((x) => x.id !== id));
  }, []);

  const computedGrandTotal = useMemo(
    () => lineSubtotal + effectiveTaxAmount + effectiveTipAmount,
    [lineSubtotal, effectiveTaxAmount, effectiveTipAmount]
  );

  const parsedGrandTotalFromImage = receiptTotalsFromImage?.grandTotal;
  const grandTotalDiscrepancy = useMemo(() => {
    const parsed = parsedGrandTotalFromImage;
    if (parsed == null || !Number.isFinite(parsed)) {
      return null;
    }
    const computedCents = Math.round(computedGrandTotal * 100);
    const parsedCents = Math.round(parsed * 100);
    if (Math.abs(computedCents - parsedCents) <= 1) {
      return null;
    }
    return {
      computed: computedGrandTotal,
      parsed,
      diff: Math.abs(computedGrandTotal - parsed),
    };
  }, [parsedGrandTotalFromImage, computedGrandTotal]);

  const onPickFile = useCallback((file: File | null) => {
    setError(null);
    setErrorIsWarning(false);
    setReceiptTotalsFromImage(null);
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);

  const openCropDialog = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  }, []);

  const closeCropDialog = useCallback(() => {
    setCropOpen(false);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!previewUrl || !croppedAreaPixels) {
      return;
    }
    try {
      const blob = await getCroppedImageBlob(previewUrl, croppedAreaPixels);
      const file = new File([blob], "receipt-cropped.jpg", {
        type: "image/jpeg",
      });
      setSelectedFile(file);
      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(blob);
      });
      setCropOpen(false);
      setError(null);
      setErrorIsWarning(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not crop image.";
      setError(msg);
    }
  }, [previewUrl, croppedAreaPixels]);

  const addPerson = useCallback(
    (
      evt:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLDivElement>
    ) => {
      const name = newPerson.trim();
      if (!name || people.some((p) => p.toLowerCase() === name.toLowerCase())) {
        queueMicrotask(() => newPersonRef.current?.focus());
        return;
      }
      setPeople((p) => [...p, name]);
      setNewPerson("");
      queueMicrotask(() => newPersonRef.current?.focus());
    },
    [newPerson, people]
  );

  const removePerson = useCallback(
    (name: string) => {
      const nextPeople = people.filter((x) => x !== name);
      const nextLinesById: Record<string, LineBody> = {};
      for (const id of Object.keys(linesById)) {
        const row = linesById[id];
        if (!row) {
          continue;
        }
        nextLinesById[id] = {
          ...row,
          assignees: row.assignees.filter((x) => x !== name),
        };
      }
      const nextGroups = paymentGroups
        .map((g) => ({
          ...g,
          members: g.members.filter((m) => m !== name),
        }))
        .filter((g) => g.members.length > 0);

      setPeople(nextPeople);
      setLinesById(nextLinesById);
      setPaymentGroups(nextGroups);

      if (receiptId) {
        skipNextMetaPush.current = true;
        const fields: Record<string, unknown> = {
          people: nextPeople,
          paymentGroups: nextGroups,
        };
        for (const id of Object.keys(nextLinesById)) {
          fields[`lines.${id}.assignees`] = nextLinesById[id].assignees;
        }
        void updateReceiptFieldsImmediate(receiptId, fields);
      }
    },
    [people, linesById, paymentGroups, receiptId]
  );

  const parseFromImage = useCallback(async () => {
    if (!selectedFile) {
      setError("Choose a receipt photo first.");
      return;
    }
    setLoading("ai");
    setError(null);
    setErrorIsWarning(false);
    setOcrStatus("");
    try {
      const { base64, mimeType } = await resizeImageFileToJpegBase64(
        selectedFile
      );
      const result = await parseReceiptImage({
        imageBase64: base64,
        mimeType,
      });
      const { items } = result;
      const newLines: ReceiptLine[] = items.map((item) => ({
        id: uuidv4(),
        description: item.description,
        amount: item.amount,
        assignees: [],
      }));
      const order = newLines.map((l) => l.id);
      const byId = Object.fromEntries(
        newLines.map((l) => [
          l.id,
          {
            description: l.description,
            amount: l.amount,
            assignees: l.assignees,
          },
        ])
      );
      setLineOrder(order);
      setLinesById(byId);
      setLineAmountDrafts({});
      const nextTotals = {
        subtotal: result.subtotal ?? null,
        tax: result.tax ?? null,
        tip: result.tip ?? null,
        grandTotal: result.grandTotal ?? null,
      };
      setReceiptTotalsFromImage(nextTotals);
      const nextSubtotal = newLines.reduce((s, l) => s + l.amount, 0);
      let nextTax = { mode: taxMode, amount: taxAmount, percent: taxPercent };
      let nextTip = { mode: tipMode, amount: tipAmount, percent: tipPercent };
      if (result.tax != null && Number.isFinite(result.tax)) {
        nextTax = {
          mode: "amount",
          amount: result.tax,
          percent: percentFromAmount(result.tax, nextSubtotal),
        };
        setTaxMode("amount");
        setTaxAmount(result.tax);
      }
      if (result.tip != null && Number.isFinite(result.tip)) {
        nextTip = {
          mode: "amount",
          amount: result.tip,
          percent: percentFromAmount(result.tip, nextSubtotal),
        };
        setTipMode("amount");
        setTipAmount(result.tip);
      }
      if (receiptId) {
        skipNextMetaPush.current = true;
        void updateReceiptFieldsImmediate(receiptId, {
          lines: byId,
          lineOrder: order,
          receiptTotalsFromImage: nextTotals,
          tax: nextTax,
          tip: nextTip,
        });
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Could not parse receipt.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    selectedFile,
    receiptId,
    taxMode,
    taxAmount,
    taxPercent,
    tipMode,
    tipAmount,
    tipPercent,
  ]);

  const parseFromImageOcr = useCallback(async () => {
    if (!selectedFile) {
      setError("Choose a receipt photo first.");
      return;
    }
    setLoading("ocr");
    setError(null);
    setErrorIsWarning(false);
    setReceiptTotalsFromImage(null);
    setOcrStatus("Starting OCR…");
    try {
      const text = await ocrReceiptImageToText(
        selectedFile,
        ({ percent, status }) => {
          setOcrStatus(`${status} (${percent}%)`);
        }
      );
      const items = parseLooseReceiptText(text);
      if (items.length === 0) {
        setPasteText(text);
        setInputTab(1);
        setErrorIsWarning(true);
        setError(
          'OCR did not find lines that look like "item 12.50". Raw text was copied to the Paste text tab — fix it and click "Parse pasted lines", or edit lines by hand.'
        );
        return;
      }
      const newLines: ReceiptLine[] = items.map((item) => ({
        id: uuidv4(),
        description: item.description,
        amount: item.amount,
        assignees: [],
      }));
      const order = newLines.map((l) => l.id);
      const byId = Object.fromEntries(
        newLines.map((l) => [
          l.id,
          {
            description: l.description,
            amount: l.amount,
            assignees: l.assignees,
          },
        ])
      );
      setLineOrder(order);
      setLinesById(byId);
      setLineAmountDrafts({});
      if (receiptId) {
        skipNextMetaPush.current = true;
        void updateReceiptFieldsImmediate(receiptId, {
          lines: byId,
          lineOrder: order,
        });
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "OCR failed.";
      setError(msg);
    } finally {
      setLoading(false);
      setOcrStatus("");
    }
  }, [selectedFile, receiptId]);

  const parseFromPaste = useCallback(() => {
    setError(null);
    setErrorIsWarning(false);
    setReceiptTotalsFromImage(null);
    const items = parseLooseReceiptText(pasteText);
    if (items.length === 0) {
      setError(
        'No lines matched. Use one line per item with the price at the end (e.g. "Burger 12.50").'
      );
      return;
    }
    const newLines: ReceiptLine[] = items.map((item) => ({
      id: uuidv4(),
      description: item.description,
      amount: item.amount,
      assignees: [],
    }));
    const order = newLines.map((l) => l.id);
    const byId = Object.fromEntries(
      newLines.map((l) => [
        l.id,
        {
          description: l.description,
          amount: l.amount,
          assignees: l.assignees,
        },
      ])
    );
    setLineOrder(order);
    setLinesById(byId);
    setLineAmountDrafts({});
    if (receiptId) {
      skipNextMetaPush.current = true;
      void updateReceiptFieldsImmediate(receiptId, {
        lines: byId,
        lineOrder: order,
      });
    }
  }, [pasteText, receiptId]);

  const updateLine = useCallback(
    (id: string, patch: Partial<Omit<ReceiptLine, "id">>) => {
      setLinesById((prev) => {
        const cur = prev[id] ?? {
          description: "",
          amount: 0,
          assignees: [] as string[],
        };
        const merged: LineBody = { ...cur, ...patch };

        if (receiptId) {
          if (patch.assignees !== undefined) {
            void syncAssigneesToServer(receiptId, id, merged.assignees);
          }
          if (patch.description !== undefined || patch.amount !== undefined) {
            void patchLineFieldsDebounced(receiptId, id, {
              description: merged.description,
              amount: merged.amount,
            });
          }
        }

        return { ...prev, [id]: merged };
      });
    },
    [receiptId]
  );

  const removeLine = useCallback(
    (id: string) => {
      setLineOrder((order) => {
        const nextOrder = order.filter((x) => x !== id);
        setLinesById((prev) => {
          const { [id]: _removed, ...rest } = prev;
          if (receiptId) {
            void removeLineDoc(receiptId, id, nextOrder);
          }
          return rest;
        });
        return nextOrder;
      });
      setLineAmountDrafts((drafts) => {
        const { [id]: _removed, ...rest } = drafts;
        return rest;
      });
    },
    [receiptId]
  );

  const addBlankLine = useCallback(() => {
    const id = uuidv4();
    const line: LineBody = {
      description: "",
      amount: 0,
      assignees: [],
    };
    setLineOrder((order) => {
      const nextOrder = [...order, id];
      setLinesById((prev) => {
        const next = { ...prev, [id]: line };
        if (receiptId) {
          void setLineDoc(receiptId, id, line, nextOrder);
        }
        return next;
      });
      return nextOrder;
    });
  }, [receiptId]);

  const toggleMeOnLine = useCallback(
    (lineId: string) => {
      if (!selfName || !people.includes(selfName)) {
        return;
      }
      const row = linesById[lineId];
      if (!row) {
        return;
      }
      const nextAssignees = row.assignees.includes(selfName)
        ? row.assignees.filter((x) => x !== selfName)
        : [...row.assignees, selfName];
      updateLine(lineId, { assignees: nextAssignees });
    },
    [selfName, people, linesById, updateLine]
  );

  const onShareReceipt = useCallback(async () => {
    if (isShared) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareSnackOpen(true);
      } catch {
        setError("Could not copy link to clipboard.");
      }
      return;
    }
    setShareBusy(true);
    setError(null);
    try {
      const order = lineOrder;
      const byId = linesById;
      const id = await createReceiptSplit({
        people,
        lineOrder: order,
        lines: byId,
        paymentGroups,
        tax: {
          mode: taxMode,
          amount: taxAmount,
          percent: taxPercent,
        },
        tip: {
          mode: tipMode,
          amount: tipAmount,
          percent: tipPercent,
        },
        currency: {
          convert: convertCurrency,
          from: fromCurrency,
          to: toCurrency,
          fromRate: fromCurrencyRate,
          toRate: toCurrencyRate,
        },
        receiptTotalsFromImage,
      });
      history.push(`/receipt-split/${id}`);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Could not create shared receipt.";
      setError(msg);
    } finally {
      setShareBusy(false);
    }
  }, [
    isShared,
    lineOrder,
    linesById,
    people,
    paymentGroups,
    taxMode,
    taxAmount,
    taxPercent,
    tipMode,
    tipAmount,
    tipPercent,
    convertCurrency,
    fromCurrency,
    toCurrency,
    fromCurrencyRate,
    toCurrencyRate,
    receiptTotalsFromImage,
    history,
  ]);

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <DocTitle
        title={
          isShared && receiptId
            ? `Receipt split · ${receiptId}`
            : "Receipt Split"
        }
      />
      <AppBar position="static" className={classes.appBar}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Receipt split
          </Typography>
          <Button
            color="inherit"
            size="small"
            startIcon={<ShareIcon />}
            onClick={() => void onShareReceipt()}
            disabled={shareBusy}
          >
            {isShared ? "Copy link" : "Share"}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, py: 3, overflow: "auto" }}>
        {isShared && sharedNotFound ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            No receipt found at this link. Double-check the URL or ask for a new
            share link from whoever created it.
          </Alert>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" paragraph>
              Use the <strong>Receipt photo</strong> tab to upload a picture and
              run <strong>Parse with OCR</strong> (free in-browser; accuracy
              varies) or <strong>Parse with Gemini</strong> (slower but more
              accurate). Use <strong>Paste text</strong> to paste receipt lines
              instead. Then assign each line to one or more people (shared lines
              are split evenly). Enter tax and tip (each as an amount or a % of
              subtotal) below the lines; each is split in proportion to each
              person’s share of the line-item subtotal (including unassigned
              items). You can also add rows by hand.
              {isShared && (
                <>
                  {" "}
                  <strong>Shared:</strong> everyone with the link sees edits in
                  real time. Use <strong>Copy link</strong> in the bar above to
                  share the URL. Pick <strong>Your name</strong> below, then use{" "}
                  <strong>+ Me</strong> on a line to assign yourself quickly.
                </>
              )}
            </Typography>

            {error && (
              <Alert
                severity={errorIsWarning ? "warning" : "error"}
                sx={{ mb: 2 }}
                onClose={() => {
                  setError(null);
                  setErrorIsWarning(false);
                }}
              >
                {error}
              </Alert>
            )}

            <Paper sx={{ p: 2 }} className={classes.section}>
              <Tabs
                value={inputTab}
                onChange={(_, v) => setInputTab(v)}
                aria-label="How to enter receipt"
                variant="fullWidth"
              >
                <Tab label="Receipt photo" id="receipt-input-tab-0" />
                <Tab label="Paste text" id="receipt-input-tab-1" />
              </Tabs>

              {inputTab === 0 && (
                <Box
                  role="tabpanel"
                  id="receipt-input-panel-0"
                  aria-labelledby="receipt-input-tab-0"
                  sx={{ pt: 2 }}
                >
                  <Flex gap={2} flexWrap="wrap" alignItems="center">
                    <Button variant="contained" component="label">
                      Choose photo
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          onPickFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={openCropDialog}
                      disabled={!previewUrl || !!loading}
                    >
                      Crop
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={parseFromImageOcr}
                      disabled={!selectedFile || !!loading}
                    >
                      {loading === "ocr" ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : (
                        "Parse with OCR"
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={parseFromImage}
                      disabled={!selectedFile || !!loading}
                    >
                      {loading === "ai" ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : (
                        "Parse with Gemini"
                      )}
                    </Button>
                    {selectedFile && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedFile.name}
                      </Typography>
                    )}
                  </Flex>
                  {loading === "ocr" && ocrStatus && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mt={1}
                    >
                      {ocrStatus}
                    </Typography>
                  )}
                  {previewUrl && (
                    <Box mt={2}>
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className={classes.preview}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {inputTab === 1 && (
                <Box
                  role="tabpanel"
                  id="receipt-input-panel-1"
                  aria-labelledby="receipt-input-tab-1"
                  sx={{ pt: 2 }}
                >
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder={
                      "Example:\nCheeseburger 12.50\nFries 4.00\nSoda 2.50"
                    }
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                  />
                  <Box mt={1}>
                    <Button variant="outlined" onClick={parseFromPaste}>
                      Parse pasted lines
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>

            {isShared && receiptId && !sharedNotFound && (
              <Paper sx={{ p: 2 }} className={classes.section}>
                <Typography variant="subtitle1" gutterBottom>
                  You are
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  paragraph
                  sx={{ mt: -0.5 }}
                >
                  Choose the name that matches you in the list below so you can
                  use <strong>+ Me</strong> on each line. Names are added under{" "}
                  <strong>People splitting the bill</strong>.
                </Typography>
                <FormControl fullWidth size="small">
                  <Select<string>
                    labelId="receipt-split-self-label"
                    placeholder={undefined}
                    value={selfName}
                    displayEmpty
                    onChange={(e) => setSelfName(e.target.value)}
                    inputProps={{
                      shrink: true,
                    }}
                  >
                    <MenuItem value="">
                      <em>Select your name…</em>
                    </MenuItem>
                    {people.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Required for the <strong>+ Me</strong> shortcut on line
                    items.
                  </FormHelperText>
                </FormControl>
              </Paper>
            )}

            <Paper sx={{ p: 2 }} className={classes.section}>
              <Typography variant="subtitle1" gutterBottom>
                People splitting the bill
              </Typography>
              <Flex gap={1} flexWrap="wrap" alignItems="center">
                <TextField
                  inputRef={newPersonRef}
                  size="small"
                  label="Name"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPerson(e)}
                  error={newPersonIsDuplicate}
                  helperText={
                    newPersonIsDuplicate
                      ? "That name is already in the list"
                      : ""
                  }
                />
                <Button
                  variant="outlined"
                  onClick={addPerson}
                  disabled={!newPerson.trim() || newPersonIsDuplicate}
                >
                  Add
                </Button>
              </Flex>
              <Flex gap={1} flexWrap="wrap" mt={1}>
                {people.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    onDelete={() => removePerson(name)}
                    deleteIcon={<Close />}
                  />
                ))}
              </Flex>
            </Paper>

            <Paper sx={{ p: 2 }} className={classes.section}>
              <Flex justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Line items</Typography>
                <Button size="small" onClick={addBlankLine}>
                  Add line
                </Button>
              </Flex>

              {receiptTotalsFromImage &&
                (receiptTotalsFromImage.subtotal != null ||
                  receiptTotalsFromImage.tax != null ||
                  receiptTotalsFromImage.tip != null ||
                  receiptTotalsFromImage.grandTotal != null) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    <strong>From receipt (Gemini):</strong> Subtotal{" "}
                    {receiptTotalsFromImage.subtotal != null
                      ? formatMoney(
                          receiptTotalsFromImage.subtotal,
                          fromCurrency
                        )
                      : "—"}{" "}
                    · Tax{" "}
                    {receiptTotalsFromImage.tax != null
                      ? formatMoney(receiptTotalsFromImage.tax, fromCurrency)
                      : "—"}{" "}
                    · Tip{" "}
                    {receiptTotalsFromImage.tip != null
                      ? formatMoney(receiptTotalsFromImage.tip, fromCurrency)
                      : "—"}{" "}
                    · Grand total{" "}
                    {receiptTotalsFromImage.grandTotal != null
                      ? formatMoney(
                          receiptTotalsFromImage.grandTotal,
                          fromCurrency
                        )
                      : "—"}
                  </Typography>
                )}

              {grandTotalDiscrepancy && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  Line items + tax + tip (
                  {formatMoney(grandTotalDiscrepancy.computed, fromCurrency)})
                  don’t match the grand total read from the receipt (
                  {formatMoney(grandTotalDiscrepancy.parsed, fromCurrency)}).
                  Off by {formatMoney(grandTotalDiscrepancy.diff, fromCurrency)}{" "}
                  — check lines, tax, tip, or receipt rounding.
                </Alert>
              )}

              {lines.length === 0 ? (
                <Typography color="text.secondary">
                  No lines yet — parse a photo, paste text, or add a line.
                </Typography>
              ) : (
                <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
                  <Table
                    size="small"
                    sx={{
                      width: "max-content",
                      minWidth: "100%",
                      tableLayout: "auto",
                    }}
                  >
                    <colgroup>
                      <col style={{ minWidth: 220 }} />
                      <col style={{ minWidth: 150 }} />
                      <col style={{ minWidth: 220 }} />
                      <col style={{ minWidth: 48 }} />
                    </colgroup>
                    <TableHead>
                      <TableRow>
                        <TableCell className={classes.itemColumn}>
                          Item
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          Amount
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          Split between
                        </TableCell>
                        <TableCell padding="checkbox" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className={classes.itemColumn}>
                            <TextField
                              fullWidth
                              size="small"
                              value={row.description}
                              onChange={(e) =>
                                updateLine(row.id, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              sx={{
                                width: (() => {
                                  const draftText =
                                    lineAmountDrafts[row.id] ?? "";
                                  const formattedText = formatCurrencyNumber(
                                    row.amount,
                                    fromCurrency
                                  );
                                  const widerText =
                                    draftText.length > formattedText.length
                                      ? draftText
                                      : formattedText;
                                  return getAmountInputWidth(
                                    fromCurrency,
                                    widerText
                                  );
                                })(),
                              }}
                              inputProps={{
                                min: 0,
                                step: getCurrencyStep(fromCurrency),
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    {CURRENCY_BY_VALUE[fromCurrency] ??
                                      fromCurrency}
                                  </InputAdornment>
                                ),
                              }}
                              value={
                                lineAmountDrafts[row.id] ??
                                formatCurrencyNumber(row.amount, fromCurrency)
                              }
                              onFocus={() =>
                                setLineAmountDrafts((drafts) => ({
                                  ...drafts,
                                  [row.id]:
                                    row.amount === 0 ? "" : String(row.amount),
                                }))
                              }
                              onChange={(e) => {
                                const nextValue = e.target.value;
                                setLineAmountDrafts((drafts) => ({
                                  ...drafts,
                                  [row.id]: nextValue,
                                }));
                                updateLine(row.id, {
                                  amount: parseFloat(nextValue) || 0,
                                });
                              }}
                              onBlur={() => {
                                const roundedAmount = roundCurrencyAmount(
                                  row.amount,
                                  fromCurrency
                                );
                                updateLine(row.id, { amount: roundedAmount });
                                setLineAmountDrafts((drafts) => {
                                  const { [row.id]: _removed, ...rest } =
                                    drafts;
                                  return rest;
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Flex
                              gap={1}
                              alignItems="center"
                              sx={{ minWidth: 0 }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Select
                                  fullWidth
                                  multiple
                                  displayEmpty
                                  size="small"
                                  value={row.assignees}
                                  onChange={(
                                    e: SelectChangeEvent<string[]>
                                  ) => {
                                    const v = e.target.value;
                                    updateLine(row.id, {
                                      assignees:
                                        typeof v === "string"
                                          ? v.split(",")
                                          : v,
                                    });
                                  }}
                                  input={<OutlinedInput size="small" />}
                                  MenuProps={{
                                    autoFocus: false,
                                    disableAutoFocusItem: true,
                                  }}
                                  renderValue={(selected) => {
                                    const names = selected as string[];
                                    if (names.length === 0) {
                                      return (
                                        <Typography
                                          component="span"
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          Unassigned
                                        </Typography>
                                      );
                                    }
                                    return (
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: 0.5,
                                          py: 0.25,
                                        }}
                                      >
                                        {names.map((name) => (
                                          <Chip
                                            key={name}
                                            label={name}
                                            size="small"
                                          />
                                        ))}
                                      </Box>
                                    );
                                  }}
                                >
                                  <ListSubheader
                                    sx={{
                                      px: 1,
                                      py: 1,
                                      lineHeight: 1.2,
                                      bgcolor: "background.paper",
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Flex gap={0.5} flexWrap="wrap">
                                      <Button
                                        size="small"
                                        disabled={people.length === 0}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          updateLine(row.id, {
                                            assignees: [...people],
                                          });
                                        }}
                                      >
                                        Select all
                                      </Button>
                                      <Button
                                        size="small"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          updateLine(row.id, { assignees: [] });
                                        }}
                                      >
                                        Deselect all
                                      </Button>
                                    </Flex>
                                  </ListSubheader>
                                  {people.map((name) => (
                                    <MenuItem key={name} value={name}>
                                      <Checkbox
                                        size="small"
                                        checked={row.assignees.includes(name)}
                                      />
                                      <ListItemText primary={name} />
                                    </MenuItem>
                                  ))}
                                </Select>
                              </Box>
                              {isShared &&
                                selfName &&
                                people.includes(selfName) && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{ flexShrink: 0 }}
                                    onClick={() => toggleMeOnLine(row.id)}
                                  >
                                    {row.assignees.includes(selfName)
                                      ? "− Me"
                                      : "+ Me"}
                                  </Button>
                                )}
                            </Flex>
                          </TableCell>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              aria-label="Remove line"
                              onClick={() => removeLine(row.id)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className={classes.itemColumn}>
                          <Typography variant="body2" fontWeight={500}>
                            Subtotal
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>
                            {formatMoney(lineSubtotal, fromCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={2}>
                          <Typography variant="caption" color="text.secondary">
                            Sum of line items
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className={classes.itemColumn}>
                          <Box
                            display="flex"
                            gap={1}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Typography variant="body2" fontWeight={500}>
                              Tax
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <Select
                                value={taxMode}
                                onChange={(
                                  e: SelectChangeEvent<"amount" | "percent">
                                ) => {
                                  setTaxMode(
                                    e.target.value as "amount" | "percent"
                                  );
                                  if (e.target.value === "amount") {
                                    setTaxAmount(
                                      roundCurrencyAmount(
                                        taxAmount,
                                        fromCurrency
                                      )
                                    );
                                  } else {
                                    setTaxPercent(
                                      Math.round(taxPercent * 1000) / 1000
                                    );
                                  }
                                  setTaxAmountDraft(null);
                                }}
                              >
                                <MenuItem value="amount">Amount</MenuItem>
                                <MenuItem value="percent">
                                  % of subtotal
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            sx={{
                              width: (() => {
                                if (taxMode === "amount") {
                                  const draftText = taxAmountDraft ?? "";
                                  const formattedText = formatCurrencyNumber(
                                    taxAmount,
                                    fromCurrency
                                  );
                                  const widerText =
                                    draftText.length > formattedText.length
                                      ? draftText
                                      : formattedText;
                                  return getAmountInputWidth(
                                    fromCurrency,
                                    widerText
                                  );
                                }
                                const percentText = taxPercent
                                  ? String(taxPercent)
                                  : "0";
                                const chars = percentText.length + 5;
                                return `max(150px, calc(${chars}ch + 48px))`;
                              })(),
                            }}
                            inputProps={{
                              min: 0,
                              step:
                                taxMode === "amount"
                                  ? getCurrencyStep(fromCurrency)
                                  : 0.01,
                            }}
                            InputProps={{
                              ...(taxMode === "amount"
                                ? {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        {CURRENCY_BY_VALUE[fromCurrency] ??
                                          fromCurrency}
                                      </InputAdornment>
                                    ),
                                  }
                                : {
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        %
                                      </InputAdornment>
                                    ),
                                  }),
                            }}
                            value={
                              taxMode === "amount"
                                ? taxAmountDraft ??
                                  formatCurrencyNumber(taxAmount, fromCurrency)
                                : taxPercent || ""
                            }
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              const value = parseFloat(nextValue) || 0;
                              if (taxMode === "amount") {
                                setTaxAmountDraft(nextValue);
                                setTaxAmount(value);
                                setTaxPercent(
                                  percentFromAmount(value, lineSubtotal)
                                );
                                return;
                              }
                              setTaxPercent(value);
                              setTaxAmount(
                                amountFromPercent(value, lineSubtotal)
                              );
                            }}
                            onFocus={() => {
                              if (taxMode === "amount") {
                                setTaxAmountDraft(
                                  taxAmount === 0 ? "" : String(taxAmount)
                                );
                              }
                            }}
                            onBlur={() => {
                              if (taxMode !== "amount") {
                                return;
                              }
                              const roundedAmount = roundCurrencyAmount(
                                taxAmount,
                                fromCurrency
                              );
                              setTaxAmount(roundedAmount);
                              setTaxPercent(
                                percentFromAmount(roundedAmount, lineSubtotal)
                              );
                              setTaxAmountDraft(null);
                            }}
                            helperText={
                              taxMode === "percent"
                                ? `${
                                    CURRENCY_BY_VALUE[fromCurrency] ??
                                    fromCurrency
                                  }${formatCurrencyNumber(
                                    taxAmount,
                                    fromCurrency
                                  )}`
                                : undefined
                            }
                          />
                        </TableCell>
                        <TableCell colSpan={2}>
                          <Typography variant="caption" color="text.secondary">
                            Split by share of subtotal (
                            {formatMoney(lineSubtotal, fromCurrency)})
                            {taxMode === "percent" && (
                              <>
                                {" "}
                                · Tax amount:{" "}
                                {formatMoney(effectiveTaxAmount, fromCurrency)}
                              </>
                            )}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className={classes.itemColumn}>
                          <Box
                            display="flex"
                            gap={1}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Typography variant="body2" fontWeight={500}>
                              Tip
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <Select
                                value={tipMode}
                                onChange={(
                                  e: SelectChangeEvent<"amount" | "percent">
                                ) => {
                                  setTipMode(
                                    e.target.value as "amount" | "percent"
                                  );
                                  if (e.target.value === "amount") {
                                    setTipAmount(
                                      roundCurrencyAmount(
                                        tipAmount,
                                        fromCurrency
                                      )
                                    );
                                  } else {
                                    setTipPercent(
                                      Math.round(tipPercent * 1000) / 1000
                                    );
                                  }
                                  setTipAmountDraft(null);
                                }}
                              >
                                <MenuItem value="amount">Amount</MenuItem>
                                <MenuItem value="percent">
                                  % of subtotal
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            sx={{
                              width: (() => {
                                if (tipMode === "amount") {
                                  const draftText = tipAmountDraft ?? "";
                                  const formattedText = formatCurrencyNumber(
                                    tipAmount,
                                    fromCurrency
                                  );
                                  const widerText =
                                    draftText.length > formattedText.length
                                      ? draftText
                                      : formattedText;
                                  return getAmountInputWidth(
                                    fromCurrency,
                                    widerText
                                  );
                                }
                                const percentText = tipPercent
                                  ? String(tipPercent)
                                  : "0";
                                const chars = percentText.length + 5;
                                return `max(150px, calc(${chars}ch + 48px))`;
                              })(),
                            }}
                            inputProps={{
                              min: 0,
                              step:
                                tipMode === "amount"
                                  ? getCurrencyStep(fromCurrency)
                                  : 0.01,
                            }}
                            InputProps={{
                              ...(tipMode === "amount"
                                ? {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        {CURRENCY_BY_VALUE[fromCurrency] ??
                                          fromCurrency}
                                      </InputAdornment>
                                    ),
                                  }
                                : {
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        %
                                      </InputAdornment>
                                    ),
                                  }),
                            }}
                            value={
                              tipMode === "amount"
                                ? tipAmountDraft ??
                                  formatCurrencyNumber(tipAmount, fromCurrency)
                                : tipPercent || ""
                            }
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              const value = parseFloat(nextValue) || 0;
                              if (tipMode === "amount") {
                                setTipAmountDraft(nextValue);
                                setTipAmount(value);
                                setTipPercent(
                                  percentFromAmount(value, lineSubtotal)
                                );
                                return;
                              }
                              setTipPercent(value);
                              setTipAmount(
                                amountFromPercent(value, lineSubtotal)
                              );
                            }}
                            onFocus={() => {
                              if (tipMode === "amount") {
                                setTipAmountDraft(
                                  tipAmount === 0 ? "" : String(tipAmount)
                                );
                              }
                            }}
                            onBlur={() => {
                              if (tipMode !== "amount") {
                                return;
                              }
                              const roundedAmount = roundCurrencyAmount(
                                tipAmount,
                                fromCurrency
                              );
                              setTipAmount(roundedAmount);
                              setTipPercent(
                                percentFromAmount(roundedAmount, lineSubtotal)
                              );
                              setTipAmountDraft(null);
                            }}
                            helperText={
                              tipMode === "percent"
                                ? `${
                                    CURRENCY_BY_VALUE[fromCurrency] ??
                                    fromCurrency
                                  }${formatCurrencyNumber(
                                    tipAmount,
                                    fromCurrency
                                  )}`
                                : undefined
                            }
                          />
                        </TableCell>
                        <TableCell colSpan={2}>
                          <Typography variant="caption" color="text.secondary">
                            Split by share of subtotal (
                            {formatMoney(lineSubtotal, fromCurrency)})
                            {tipMode === "percent" && (
                              <>
                                {" "}
                                · Tip amount:{" "}
                                {formatMoney(effectiveTipAmount, fromCurrency)}
                              </>
                            )}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={convertCurrency}
                  onChange={(e) => setConvertCurrency(e.target.checked)}
                />
              }
              label="Convert currency"
            />

            {convertCurrency && (
              <Paper
                sx={{
                  p: 2,
                  gridGap: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                className={classes.section}
              >
                <Flex gap="8px" flexWrap="nowrap" alignItems="center">
                  <Autocomplete
                    sx={{
                      minWidth: 100,
                    }}
                    freeSolo
                    options={CURRENCY_OPTIONS}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="From"
                        sx={{
                          "& .MuiInputBase-input": { textAlign: "right" },
                        }}
                      />
                    )}
                    onInputChange={(e, value) => setFromCurrency(value.trim())}
                    value={fromCurrency}
                    disableClearable
                  />
                  <TextField
                    sx={{
                      minWidth: 100,
                    }}
                    label="Amount"
                    value={fromCurrencyRate}
                    onChange={(e) => setFromCurrencyRate(e.target.value.trim())}
                  />
                </Flex>
                <Flex justifyContent="center">
                  <Typography variant="h3" color="text.secondary">
                    =
                  </Typography>
                </Flex>
                <Flex
                  gap="8px"
                  flexWrap="nowrap"
                  alignItems="center"
                  justifyContent="flex-end"
                >
                  <Autocomplete
                    sx={{
                      minWidth: 100,
                    }}
                    freeSolo
                    options={CURRENCY_OPTIONS}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="To"
                        sx={{
                          "& .MuiInputBase-input": { textAlign: "right" },
                        }}
                      />
                    )}
                    onInputChange={(e, value) => {
                      setToCurrency(value.trim());
                    }}
                    value={toCurrency}
                    disableClearable
                  />
                  <TextField
                    sx={{
                      minWidth: 100,
                    }}
                    label="Amount"
                    value={toCurrencyRate}
                    onChange={(e) => setToCurrencyRate(e.target.value.trim())}
                  />
                </Flex>
              </Paper>
            )}
            {lines.length > 0 && (
              <Paper
                sx={{ p: 2, bgcolor: blue[50] }}
                className={classes.section}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Totals
                </Typography>
                {people.length > 0 && (
                  <Box
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Combine totals for payment
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 1 }}
                    >
                      Optional: group people paying on one check. Line items
                      stay assigned to individuals; only these totals combine.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={addPaymentGroup}
                      sx={{ mb: 1 }}
                    >
                      Add payment group
                    </Button>
                    {paymentGroups.map((group) => (
                      <Paper
                        key={group.id}
                        variant="outlined"
                        sx={{ p: 1.5, mt: 1 }}
                      >
                        <Flex
                          gap={1}
                          alignItems="flex-start"
                          justifyContent="space-between"
                        >
                          <TextField
                            size="small"
                            fullWidth
                            label="Group name (optional)"
                            placeholder="e.g. Smith family"
                            value={group.name}
                            onChange={(e) =>
                              setPaymentGroups((rows) =>
                                rows.map((g) =>
                                  g.id === group.id
                                    ? { ...g, name: e.target.value }
                                    : g
                                )
                              )
                            }
                          />
                          <IconButton
                            size="small"
                            aria-label="Remove payment group"
                            onClick={() => removePaymentGroup(group.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Flex>
                        <Select
                          fullWidth
                          multiple
                          displayEmpty
                          size="small"
                          sx={{ mt: 1 }}
                          value={group.members}
                          onChange={(e: SelectChangeEvent<string[]>) => {
                            const v = e.target.value;
                            const next =
                              typeof v === "string" ? v.split(",") : v;
                            setPaymentGroups((rows) =>
                              updatePaymentGroupMembers(rows, group.id, next)
                            );
                          }}
                          input={<OutlinedInput size="small" />}
                          renderValue={(selected) => {
                            const names = selected as string[];
                            if (names.length === 0) {
                              return (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Select who pays together
                                </Typography>
                              );
                            }
                            return (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  py: 0.25,
                                }}
                              >
                                {names.map((name) => (
                                  <Chip key={name} label={name} size="small" />
                                ))}
                              </Box>
                            );
                          }}
                        >
                          {people.map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox
                                size="small"
                                checked={group.members.includes(name)}
                              />
                              <ListItemText primary={name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </Paper>
                    ))}
                  </Box>
                )}
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Amount due
                </Typography>
                {(() => {
                  const activeGroups = paymentGroups.filter(
                    (g) => g.members.length > 0
                  );
                  const hasGroupedPayers = activeGroups.length > 0;
                  const showBreakdown =
                    effectiveTaxAmount > 0 || effectiveTipAmount > 0;

                  const renderPersonRow = (name: string) => {
                    const t = perPersonTotalsConverted[name];
                    if (!t) {
                      return null;
                    }
                    const { items, tax: tx, tip: tp, grand } = t;
                    const isYou =
                      isShared &&
                      selfName &&
                      name === selfName &&
                      selfName !== "";
                    return (
                      <Box key={name} sx={{ mb: showBreakdown ? 0.5 : 0 }}>
                        <Typography
                          sx={
                            isYou
                              ? { fontWeight: 700, color: "primary.dark" }
                              : undefined
                          }
                        >
                          {name}
                          {isYou ? " (you)" : ""}:{" "}
                          {formatMoney(grand, toCurrency)}
                        </Typography>
                        {showBreakdown && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ pl: 1 }}
                          >
                            {formatMoney(items, toCurrency)} items
                            {effectiveTaxAmount > 0 && (
                              <> + {formatMoney(tx, toCurrency)} tax</>
                            )}
                            {effectiveTipAmount > 0 && (
                              <> + {formatMoney(tp, toCurrency)} tip</>
                            )}
                          </Typography>
                        )}
                      </Box>
                    );
                  };

                  if (!hasGroupedPayers) {
                    return people.map((name) => renderPersonRow(name));
                  }

                  return (
                    <>
                      {activeGroups.map((group) => {
                        const combined = group.members.reduce(
                          (sum, m) =>
                            sum + (perPersonTotalsConverted[m]?.grand ?? 0),
                          0
                        );
                        const title =
                          group.name.trim() ||
                          group.members.join(" + ") ||
                          "Payment group";
                        const memberParts = group.members.map((m) => {
                          const g = perPersonTotalsConverted[m]?.grand ?? 0;
                          return `${m} ${formatMoney(g, toCurrency)}`;
                        });
                        return (
                          <Box
                            key={group.id}
                            sx={{ mb: showBreakdown ? 0.5 : 0 }}
                          >
                            <Typography>
                              {title}: {formatMoney(combined, toCurrency)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ pl: 1 }}
                            >
                              {memberParts.join(" + ")}
                            </Typography>
                            {showBreakdown &&
                              group.members.map((m) => {
                                const t = perPersonTotalsConverted[m];
                                if (!t) {
                                  return null;
                                }
                                return (
                                  <Typography
                                    key={m}
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    sx={{ pl: 1, mt: 0.25 }}
                                  >
                                    {m}: {formatMoney(t.items, toCurrency)}{" "}
                                    items
                                    {effectiveTaxAmount > 0 && (
                                      <>
                                        {" "}
                                        + {formatMoney(t.tax, toCurrency)} tax
                                      </>
                                    )}
                                    {effectiveTipAmount > 0 && (
                                      <>
                                        {" "}
                                        + {formatMoney(t.tip, toCurrency)} tip
                                      </>
                                    )}
                                  </Typography>
                                );
                              })}
                          </Box>
                        );
                      })}
                      {ungroupedPeople.map((name) => renderPersonRow(name))}
                    </>
                  );
                })()}
                {(totalsByPerson.unassigned > 0 ||
                  (taxSplit.__unassigned ?? 0) > 0 ||
                  (tipSplit.__unassigned ?? 0) > 0) && (
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Unassigned:{" "}
                    {formatMoney(
                      (totalsByPerson.unassigned * toCurrencyRateNumber) /
                        fromCurrencyRateNumber,
                      toCurrency
                    )}{" "}
                    items
                    {effectiveTaxAmount > 0 && (
                      <>
                        {" "}
                        +{" "}
                        {formatMoney(
                          ((taxSplit.__unassigned ?? 0) *
                            toCurrencyRateNumber) /
                            fromCurrencyRateNumber,
                          toCurrency
                        )}{" "}
                        tax
                      </>
                    )}
                    {effectiveTipAmount > 0 && (
                      <>
                        {" "}
                        +{" "}
                        {formatMoney(
                          ((tipSplit.__unassigned ?? 0) *
                            toCurrencyRateNumber) /
                            fromCurrencyRateNumber,
                          toCurrency
                        )}{" "}
                        tip
                      </>
                    )}
                  </Typography>
                )}
                {effectiveTaxAmount > 0 &&
                  lineSubtotal === 0 &&
                  people.length === 0 &&
                  lines.length > 0 && (
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mt: 1 }}
                    >
                      Add people (or assign lines) to split tax; otherwise it is
                      not allocated.
                    </Typography>
                  )}
                {effectiveTipAmount > 0 &&
                  lineSubtotal === 0 &&
                  people.length === 0 &&
                  lines.length > 0 && (
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mt: 0.5 }}
                    >
                      Add people (or assign lines) to split tip; otherwise it is
                      not allocated.
                    </Typography>
                  )}
                <Typography sx={{ mt: 1, fontWeight: 600 }}>
                  Receipt total:{" "}
                  {formatMoney(
                    ((lineSubtotal + effectiveTaxAmount + effectiveTipAmount) *
                      toCurrencyRateNumber) /
                      fromCurrencyRateNumber,
                    toCurrency
                  )}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Container>

      <Snackbar
        open={shareSnackOpen}
        autoHideDuration={4000}
        onClose={() => setShareSnackOpen(false)}
        message="Link copied to clipboard"
      />

      <Dialog
        open={cropOpen}
        onClose={closeCropDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="receipt-crop-dialog-title"
      >
        <DialogTitle id="receipt-crop-dialog-title">Crop receipt</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Drag to frame the receipt. Pinch or use the slider to zoom.
          </Typography>
          {previewUrl && (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 380,
                bgcolor: "grey.900",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) =>
                  setCroppedAreaPixels(areaPixels)
                }
              />
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            aria-label="Crop zoom"
            onChange={(_, v) => setZoom(v as number)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCropDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void applyCrop()}
            disabled={!croppedAreaPixels}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
