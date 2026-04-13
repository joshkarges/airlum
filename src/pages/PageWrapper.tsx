import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { useDocTitleEffect } from "../utils/useDocTitleEffect";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  splendor: {},
}));

const PageWrapper = ({ children }: PropsWithChildren) => {
  const classes = useStyles();
  return <div className={classes.root}>{children}</div>;
};

export default PageWrapper;
