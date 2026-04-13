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
  Autocomplete,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { makeStyles } from "@mui/styles";
import { blue } from "@mui/material/colors";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { parseReceiptImage } from "../api/ReceiptApi";
import { Flex } from "../components/Flex";
import { resizeImageFileToJpegBase64 } from "../utils/receiptImage";
import { parseLooseReceiptText } from "../utils/receiptParse";
import { ocrReceiptImageToText } from "../utils/receiptTesseract";
import { getCroppedImageBlob } from "../utils/getCroppedImage";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { ArrowForward, Close } from "@mui/icons-material";

type ReceiptLine = {
  id: string;
  description: string;
  amount: number;
  /** People splitting this line; amount is divided equally among them. */
  assignees: string[];
};

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

const formatMoney = (n: number, currency: string) => {
  try {
    return n.toLocaleString(undefined, {
      style: "currency",
      currency: CURRENCY_BY_LABEL[currency] ?? currency,
    });
  } catch (e) {
    return `${CURRENCY_BY_VALUE[currency] ?? currency} ${(
      Math.round(n * 100) / 100
    ).toFixed(2)}`;
  }
};

export const ReceiptSplitPage = () => {
  const classes = useStyles();
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState("");
  const [lines, setLines] = useState<ReceiptLine[]>([]);
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
  const [tipAmount, setTipAmount] = useState(0);
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

  const newPersonRef = useRef<HTMLInputElement>(null);

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
    if (taxAmount <= 0) {
      return {};
    }
    if (lineSubtotal > 0) {
      return splitProportionalByWeights(taxAmount, proportionalWeights);
    }
    if (people.length > 0) {
      const m: Record<string, number> = {};
      addEqualSplitToMap(m, taxAmount, people);
      return m;
    }
    return {};
  }, [taxAmount, lineSubtotal, proportionalWeights, people]);

  const tipSplit = useMemo(() => {
    if (tipAmount <= 0) {
      return {};
    }
    if (lineSubtotal > 0) {
      return splitProportionalByWeights(tipAmount, proportionalWeights);
    }
    if (people.length > 0) {
      const m: Record<string, number> = {};
      addEqualSplitToMap(m, tipAmount, people);
      return m;
    }
    return {};
  }, [tipAmount, lineSubtotal, proportionalWeights, people]);

  const computedGrandTotal = useMemo(
    () => lineSubtotal + taxAmount + tipAmount,
    [lineSubtotal, taxAmount, tipAmount]
  );

  const grandTotalDiscrepancy = useMemo(() => {
    const parsed = receiptTotalsFromImage?.grandTotal;
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
  }, [receiptTotalsFromImage?.grandTotal, computedGrandTotal]);

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

  const removePerson = useCallback((name: string) => {
    setPeople((p) => p.filter((x) => x !== name));
    setLines((rows) =>
      rows.map((row) => ({
        ...row,
        assignees: row.assignees.filter((x) => x !== name),
      }))
    );
  }, []);

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
      setLines(
        items.map((item) => ({
          id: uuidv4(),
          description: item.description,
          amount: item.amount,
          assignees: [],
        }))
      );
      setReceiptTotalsFromImage({
        subtotal: result.subtotal ?? null,
        tax: result.tax ?? null,
        tip: result.tip ?? null,
        grandTotal: result.grandTotal ?? null,
      });
      if (result.tax != null && Number.isFinite(result.tax)) {
        setTaxAmount(result.tax);
      }
      if (result.tip != null && Number.isFinite(result.tip)) {
        setTipAmount(result.tip);
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
  }, [selectedFile]);

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
      setLines(
        items.map((item) => ({
          id: uuidv4(),
          description: item.description,
          amount: item.amount,
          assignees: [],
        }))
      );
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
  }, [selectedFile]);

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
    setLines(
      items.map((item) => ({
        id: uuidv4(),
        description: item.description,
        amount: item.amount,
        assignees: [],
      }))
    );
  }, [pasteText]);

  const updateLine = useCallback(
    (id: string, patch: Partial<Omit<ReceiptLine, "id">>) => {
      setLines((rows) =>
        rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
      );
    },
    []
  );

  const removeLine = useCallback((id: string) => {
    setLines((rows) => rows.filter((row) => row.id !== id));
  }, []);

  const addBlankLine = useCallback(() => {
    setLines((rows) => [
      ...rows,
      {
        id: uuidv4(),
        description: "",
        amount: 0,
        assignees: [],
      },
    ]);
  }, []);

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" component="h1">
            Receipt split
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, py: 3, overflow: "auto" }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          Use the <strong>Receipt photo</strong> tab to upload a picture and run{" "}
          <strong>Parse with OCR</strong> (free in-browser; accuracy varies) or{" "}
          <strong>Parse with Gemini</strong> (slower but more accurate). Use{" "}
          <strong>Paste text</strong> to paste receipt lines instead. Then
          assign each line to one or more people (shared lines are split
          evenly). Enter tax and tip below the lines; each is split in
          proportion to each person’s share of the line-item subtotal (including
          unassigned items). You can also add rows by hand.
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
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
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
                newPersonIsDuplicate ? "That name is already in the list" : ""
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
              {formatMoney(grandTotalDiscrepancy.computed, fromCurrency)}) don’t
              match the grand total read from the receipt (
              {formatMoney(grandTotalDiscrepancy.parsed, fromCurrency)}). Off by{" "}
              {formatMoney(grandTotalDiscrepancy.diff, fromCurrency)} — check
              lines, tax, tip, or receipt rounding.
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
                  <col style={{ width: 150 }} />
                  <col style={{ minWidth: 220 }} />
                  <col style={{ minWidth: 48 }} />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.itemColumn}>Item</TableCell>
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
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {CURRENCY_BY_VALUE[fromCurrency] ??
                                  fromCurrency}
                              </InputAdornment>
                            ),
                          }}
                          value={row.amount || ""}
                          onChange={(e) =>
                            updateLine(row.id, {
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          fullWidth
                          multiple
                          displayEmpty
                          size="small"
                          value={row.assignees}
                          onChange={(e: SelectChangeEvent<string[]>) => {
                            const v = e.target.value;
                            updateLine(row.id, {
                              assignees:
                                typeof v === "string" ? v.split(",") : v,
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
                                  <Chip key={name} label={name} size="small" />
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
                        Tax
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {CURRENCY_BY_VALUE[fromCurrency] ?? fromCurrency}
                            </InputAdornment>
                          ),
                        }}
                        value={taxAmount || ""}
                        onChange={(e) =>
                          setTaxAmount(parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell colSpan={2}>
                      <Typography variant="caption" color="text.secondary">
                        Split by share of subtotal (
                        {formatMoney(lineSubtotal, fromCurrency)})
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.itemColumn}>
                      <Typography variant="body2" fontWeight={500}>
                        Tip
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {CURRENCY_BY_VALUE[fromCurrency] ?? fromCurrency}
                            </InputAdornment>
                          ),
                        }}
                        value={tipAmount || ""}
                        onChange={(e) =>
                          setTipAmount(parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell colSpan={2}>
                      <Typography variant="caption" color="text.secondary">
                        Split by share of subtotal (
                        {formatMoney(lineSubtotal, fromCurrency)})
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
          <Paper sx={{ p: 2, bgcolor: blue[50] }} className={classes.section}>
            <Typography variant="subtitle1" gutterBottom>
              Totals
            </Typography>
            {people.map((name) => {
              const items =
                ((totalsByPerson.map[name] || 0) * toCurrencyRateNumber) /
                fromCurrencyRateNumber;
              const tx =
                ((taxSplit[name] || 0) * toCurrencyRateNumber) /
                fromCurrencyRateNumber;
              const tp =
                ((tipSplit[name] || 0) * toCurrencyRateNumber) /
                fromCurrencyRateNumber;
              const grand = items + tx + tp;
              const showBreakdown = taxAmount > 0 || tipAmount > 0;
              return (
                <Box key={name} sx={{ mb: showBreakdown ? 0.5 : 0 }}>
                  <Typography>
                    {name}: {formatMoney(grand, toCurrency)}
                  </Typography>
                  {showBreakdown && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ pl: 1 }}
                    >
                      {formatMoney(items, toCurrency)} items
                      {taxAmount > 0 && (
                        <> + {formatMoney(tx, toCurrency)} tax</>
                      )}
                      {tipAmount > 0 && (
                        <> + {formatMoney(tp, toCurrency)} tip</>
                      )}
                    </Typography>
                  )}
                </Box>
              );
            })}
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
                {taxAmount > 0 && (
                  <>
                    {" "}
                    +{" "}
                    {formatMoney(
                      ((taxSplit.__unassigned ?? 0) * toCurrencyRateNumber) /
                        fromCurrencyRateNumber,
                      toCurrency
                    )}{" "}
                    tax
                  </>
                )}
                {tipAmount > 0 && (
                  <>
                    {" "}
                    +{" "}
                    {formatMoney(
                      ((tipSplit.__unassigned ?? 0) * toCurrencyRateNumber) /
                        fromCurrencyRateNumber,
                      toCurrency
                    )}{" "}
                    tip
                  </>
                )}
              </Typography>
            )}
            {taxAmount > 0 &&
              lineSubtotal === 0 &&
              people.length === 0 &&
              lines.length > 0 && (
                <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                  Add people (or assign lines) to split tax; otherwise it is not
                  allocated.
                </Typography>
              )}
            {tipAmount > 0 &&
              lineSubtotal === 0 &&
              people.length === 0 &&
              lines.length > 0 && (
                <Typography
                  variant="body2"
                  color="warning.main"
                  sx={{ mt: 0.5 }}
                >
                  Add people (or assign lines) to split tip; otherwise it is not
                  allocated.
                </Typography>
              )}
            <Typography sx={{ mt: 1, fontWeight: 600 }}>
              Receipt total:{" "}
              {formatMoney(
                ((lineSubtotal + taxAmount + tipAmount) *
                  toCurrencyRateNumber) /
                  fromCurrencyRateNumber,
                toCurrency
              )}
            </Typography>
          </Paper>
        )}
      </Container>

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
