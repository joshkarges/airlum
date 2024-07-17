import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";

export const useStyles = makeStyles((theme: Theme) => ({
  header: {
    textAlign: "center",
  },
  bodyContainer: {
    padding: 16,
    maxWidth: "min(calc(100vw - 16px), 800px)",
  },
  img: {
    maxWidth: "100%",
    maxHeight: 300,
  },
  video: {
    maxWidth: "100%",
    maxHeight: 300,
  },
}));
