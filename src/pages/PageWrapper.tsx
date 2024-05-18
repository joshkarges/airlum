import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { MyClaimsModal } from "../components/modals/MyClaimsModal";
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
  const path = useLocation().pathname;
  const docTitle = path === "/" ? "AirLum" : path.slice(1).replace(/-/g, " ");
  useDocTitleEffect(docTitle);
  return (
    <div className={classes.root}>
      {children}
      <MyClaimsModal />
    </div>
  );
};

export default PageWrapper;
