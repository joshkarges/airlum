import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Toolbar,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { makeStyles } from "@mui/styles";
import { blue } from "@mui/material/colors";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { parseReceiptImage } from "../api/ReceiptApi";
import { Flex } from "../components/Flex";
import { resizeImageFileToJpegBase64 } from "../utils/receiptImage";
import { parseLooseReceiptText } from "../utils/receiptParse";
import { ocrReceiptImageToText } from "../utils/receiptTesseract";

type ReceiptLine = {
  id: string;
  description: string;
  amount: number;
  assignee: string;
};

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
  table: {
    minWidth: 480,
  },
  preview: {
    maxWidth: "100%",
    maxHeight: 360,
    objectFit: "contain",
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

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

  const totalsByPerson = useMemo(() => {
    const map: Record<string, number> = {};
    let unassigned = 0;
    for (const line of lines) {
      if (!line.assignee) {
        unassigned += line.amount;
        continue;
      }
      map[line.assignee] = (map[line.assignee] || 0) + line.amount;
    }
    return { map, unassigned };
  }, [lines]);

  const onPickFile = useCallback((file: File | null) => {
    setError(null);
    setErrorIsWarning(false);
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);

  const addPerson = useCallback(() => {
    const name = newPerson.trim();
    if (!name || people.includes(name)) {
      return;
    }
    setPeople((p) => [...p, name]);
    setNewPerson("");
  }, [newPerson, people]);

  const removePerson = useCallback((name: string) => {
    setPeople((p) => p.filter((x) => x !== name));
    setLines((rows) =>
      rows.map((row) =>
        row.assignee === name ? { ...row, assignee: "" } : row
      )
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
      const { items } = await parseReceiptImage({ imageBase64: base64, mimeType });
      setLines(
        items.map((item) => ({
          id: uuidv4(),
          description: item.description,
          amount: item.amount,
          assignee: "",
        }))
      );
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
    setOcrStatus("Starting OCR…");
    try {
      const text = await ocrReceiptImageToText(selectedFile, ({ percent, status }) => {
        setOcrStatus(`${status} (${percent}%)`);
      });
      const items = parseLooseReceiptText(text);
      if (items.length === 0) {
        setPasteText(text);
        setErrorIsWarning(true);
        setError(
          "OCR did not find lines that look like \"item 12.50\". Raw text was copied to the box below — fix it and click \"Parse pasted lines\", or edit lines by hand."
        );
        return;
      }
      setLines(
        items.map((item) => ({
          id: uuidv4(),
          description: item.description,
          amount: item.amount,
          assignee: "",
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
    const items = parseLooseReceiptText(pasteText);
    if (items.length === 0) {
      setError(
        "No lines matched. Use one line per item with the price at the end (e.g. \"Burger 12.50\")."
      );
      return;
    }
    setLines(
      items.map((item) => ({
        id: uuidv4(),
        description: item.description,
        amount: item.amount,
        assignee: "",
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
        assignee: "",
      },
    ]);
  }, []);

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Link to="/" className={classes.link}>
            Home
          </Link>
          <Typography variant="h6" component="h1">
            Receipt split
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, py: 3, overflow: "auto" }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload a restaurant receipt photo. Use{" "}
          <strong>Parse with OCR</strong> for free in-browser text recognition
          (accuracy varies), or <strong>Parse with AI</strong> if you have OpenAI
          billing set up. Then assign each line to someone splitting the bill.
          You can also paste plain text or add rows by hand.
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
          <Typography variant="subtitle1" gutterBottom>
            Receipt photo
          </Typography>
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
                "Parse with AI"
              )}
            </Button>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                {selectedFile.name}
              </Typography>
            )}
          </Flex>
          {loading === "ocr" && ocrStatus && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
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
        </Paper>

        <Paper sx={{ p: 2 }} className={classes.section}>
          <Typography variant="subtitle1" gutterBottom>
            Or paste receipt text
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder={'Example:\nCheeseburger 12.50\nFries 4.00\nSoda 2.50'}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <Box mt={1}>
            <Button variant="outlined" onClick={parseFromPaste}>
              Parse pasted lines
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }} className={classes.section}>
          <Typography variant="subtitle1" gutterBottom>
            People splitting the bill
          </Typography>
          <Flex gap={1} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              label="Name"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson()}
            />
            <Button variant="outlined" onClick={addPerson}>
              Add
            </Button>
          </Flex>
          <Flex gap={1} flexWrap="wrap" mt={1}>
            {people.map((name) => (
              <Chip
                key={name}
                label={name}
                onDelete={() => removePerson(name)}
                deleteIcon={<DeleteOutlineIcon />}
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

          {lines.length === 0 ? (
            <Typography color="text.secondary">
              No lines yet — parse a photo, paste text, or add a line.
            </Typography>
          ) : (
            <Table size="small" className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right" width={120}>
                    Amount
                  </TableCell>
                  <TableCell width={180}>Assigned to</TableCell>
                  <TableCell width={56} />
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={row.description}
                        onChange={(e) =>
                          updateLine(row.id, { description: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
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
                        size="small"
                        displayEmpty
                        value={row.assignee}
                        onChange={(e) =>
                          updateLine(row.id, {
                            assignee: e.target.value as string,
                          })
                        }
                      >
                        <MenuItem value="">
                          <em>Unassigned</em>
                        </MenuItem>
                        {people.map((name) => (
                          <MenuItem key={name} value={name}>
                            {name}
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
              </TableBody>
            </Table>
          )}
        </Paper>

        {lines.length > 0 && (
          <Paper
            sx={{ p: 2, bgcolor: blue[50] }}
            className={classes.section}
          >
            <Typography variant="subtitle1" gutterBottom>
              Totals
            </Typography>
            {people.map((name) => (
              <Typography key={name}>
                {name}: {formatMoney(totalsByPerson.map[name] || 0)}
              </Typography>
            ))}
            {totalsByPerson.unassigned > 0 && (
              <Typography color="text.secondary">
                Unassigned: {formatMoney(totalsByPerson.unassigned)}
              </Typography>
            )}
            <Typography sx={{ mt: 1, fontWeight: 600 }}>
              Receipt total:{" "}
              {formatMoney(
                lines.reduce((s, l) => s + l.amount, 0)
              )}
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};
