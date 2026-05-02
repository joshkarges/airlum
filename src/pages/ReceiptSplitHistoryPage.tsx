import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  Theme,
} from "@mui/material";
import Google from "@mui/icons-material/Google";
import ArrowBack from "@mui/icons-material/ArrowBack";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { makeStyles } from "@mui/styles";
import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
} from "react";
import { useHistory } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import {
  deleteReceiptSplit,
  subscribeMyReceiptSplits,
  updateReceiptTitle,
  type ReceiptSplitDoc,
} from "../api/ReceiptSplitDb";
import { DocTitle } from "../utils/useDocTitleEffect";

const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
  },
}));

function lineSubtotal(doc: ReceiptSplitDoc): number {
  const lines = doc.lines ?? {};
  const order =
    doc.lineOrder && doc.lineOrder.length > 0
      ? doc.lineOrder
      : Object.keys(lines);
  return order.reduce((s, id) => s + (lines[id]?.amount ?? 0), 0);
}

function displayTotalLabel(doc: ReceiptSplitDoc): string {
  const sym = doc.currency?.to ?? "$";
  const g = doc.receiptTotalsFromImage?.grandTotal;
  const n =
    g != null && Number.isFinite(g) ? g : lineSubtotal(doc);
  return `${sym}${n.toFixed(2)}`;
}

function formatUpdatedAt(doc: ReceiptSplitDoc): string {
  const ts = doc.updatedAt;
  if (!ts || typeof ts.toDate !== "function") {
    return "—";
  }
  try {
    return ts.toDate().toLocaleString();
  } catch {
    return "—";
  }
}

function lineCount(doc: ReceiptSplitDoc): number {
  const lines = doc.lines ?? {};
  const order =
    doc.lineOrder && doc.lineOrder.length > 0
      ? doc.lineOrder
      : Object.keys(lines);
  return order.length;
}

export const ReceiptSplitHistoryPage = () => {
  const classes = useStyles();
  const history = useHistory();
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm")
  );

  const [authUser, setAuthUser] = useState<firebase.User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptSplitDoc[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  /** Title drafts while typing so Firestore snapshots do not overwrite input. */
  const [localTitles, setLocalTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = firebase.auth().onAuthStateChanged((user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady || !authUser) {
      setReceipts([]);
      setListError(null);
      return undefined;
    }
    const unsub = subscribeMyReceiptSplits(
      authUser.uid,
      (docs) => {
        setListError(null);
        setReceipts(docs);
      },
      (e) => {
        setListError(e.message ?? "Could not load receipts.");
      }
    );
    return unsub;
  }, [authReady, authUser]);

  const onSignInWithGoogle = useCallback(async () => {
    setActionError(null);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed.";
      setActionError(msg);
    }
  }, []);

  const onSignOut = useCallback(async () => {
    try {
      await firebase.auth().signOut();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign out failed.";
      setActionError(msg);
    }
  }, []);

  const openDeleteConfirm = useCallback((e: MouseEvent<HTMLElement>, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTargetId) {
      return;
    }
    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteReceiptSplit(deleteTargetId);
      setDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not delete receipt.";
      setActionError(msg);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTargetId]);

  const displayTitle = useCallback(
    (doc: ReceiptSplitDoc) => localTitles[doc.id] ?? doc.title ?? "",
    [localTitles]
  );

  const onTitleBlurInline = useCallback(
    async (id: string, value: string) => {
      const doc = receipts.find((r) => r.id === id);
      const serverTitle = doc?.title ?? "";
      setLocalTitles((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (!doc || serverTitle === value) {
        return;
      }
      try {
        await updateReceiptTitle(id, value);
      } catch {
        // Non-blocking; list will refresh on next snapshot if write succeeded
      }
    },
    [receipts]
  );

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <DocTitle title="Receipt split · My receipts" />
      <AppBar position="static" className={classes.appBar}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Back to receipt split"
            onClick={() => history.push("/receipt-split")}
            size="small"
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            My receipts
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minHeight: 40,
            }}
          >
            {!authReady ? (
              <CircularProgress color="inherit" size={22} />
            ) : authUser ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => void onSignOut()}
              >
                Sign out
              </Button>
            ) : (
              <Button
                color="inherit"
                size="small"
                startIcon={<Google />}
                onClick={() => void onSignInWithGoogle()}
              >
                Sign in with Google
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, py: 3, overflow: "auto" }}>
        {actionError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {actionError}
          </Typography>
        )}

        {!authReady ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : !authUser ? (
          <Paper sx={{ p: 3 }}>
            <Typography paragraph>
              Sign in with Google to see receipts you created.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Google />}
              onClick={() => void onSignInWithGoogle()}
            >
              Sign in with Google
            </Button>
          </Paper>
        ) : listError ? (
          <Typography color="error">{listError}</Typography>
        ) : receipts.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography paragraph>
              You don&apos;t have any saved receipts yet. Create one from the
              main receipt split page and use <strong>Share</strong> while
              signed in.
            </Typography>
            <Button
              variant="contained"
              onClick={() => history.push("/receipt-split")}
            >
              New receipt
            </Button>
          </Paper>
        ) : isMobile ? (
          <Box display="flex" flexDirection="column" gap={2}>
            {receipts.map((doc) => (
              <Paper
                key={doc.id}
                sx={{ p: 2, cursor: "pointer" }}
                onClick={() => history.push(`/receipt-split/${doc.id}`)}
              >
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <Box flex={1} minWidth={0}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Title"
                      value={displayTitle(doc)}
                      placeholder="Untitled receipt"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLocalTitles((prev) => ({ ...prev, [doc.id]: v }));
                      }}
                      onBlur={(e) =>
                        void onTitleBlurInline(doc.id, e.target.value)
                      }
                    />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {formatUpdatedAt(doc)} · {displayTotalLabel(doc)} ·{" "}
                      {(doc.people ?? []).length} people · {lineCount(doc)}{" "}
                      lines
                    </Typography>
                  </Box>
                  <IconButton
                    aria-label="Delete receipt"
                    size="small"
                    onClick={(e) => openDeleteConfirm(e, doc.id)}
                  >
                    <DeleteOutline />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">People</TableCell>
                  <TableCell align="right">Lines</TableCell>
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {receipts.map((doc) => (
                  <TableRow
                    key={doc.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => history.push(`/receipt-split/${doc.id}`)}
                  >
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        value={displayTitle(doc)}
                        placeholder="Untitled receipt"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLocalTitles((prev) => ({ ...prev, [doc.id]: v }));
                        }}
                        onBlur={(e) =>
                          void onTitleBlurInline(doc.id, e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>{formatUpdatedAt(doc)}</TableCell>
                    <TableCell align="right">
                      {displayTotalLabel(doc)}
                    </TableCell>
                    <TableCell align="right">
                      {(doc.people ?? []).length}
                    </TableCell>
                    <TableCell align="right">{lineCount(doc)}</TableCell>
                    <TableCell padding="checkbox" align="right">
                      <IconButton
                        size="small"
                        aria-label="Delete receipt"
                        onClick={(e) => openDeleteConfirm(e, doc.id)}
                      >
                        <DeleteOutline />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={deleteOpen} onClose={() => !deleteBusy && setDeleteOpen(false)}>
          <DialogTitle>Delete receipt?</DialogTitle>
          <DialogContent>
            <Typography>
              This removes the receipt for everyone and deletes the stored
              image. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button disabled={deleteBusy} onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={deleteBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteBusy ? <CircularProgress size={22} /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};
