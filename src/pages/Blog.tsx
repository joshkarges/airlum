import { AppBar, Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { blue } from "@mui/material/colors";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import { GifterBlog } from "./GifterBlog";
import { TattooBlog } from "./TattooBlog";
import { SplendorBlog } from "./SplendorBlog";
import { PlansBlog } from "./PlansBlog";

const useStyles = makeStyles((theme: Theme) => ({
  homeContainer: {
    position: "relative",
    overflowY: "auto",
    background: blue[50],
    height: "calc(100vh - 64px)",
    marginTop: 64,
    flexDirection: "column",
    alignItems: "center",
    display: "flex",
  },
  appBar: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    justifyContent: "center",
    alignItems: "center",
    height: 64,
  },
}));

export const Blog = () => {
  const classes = useStyles();
  return (
    <div>
      <a href="/">
        <AppBar className={classes.appBar}>
          <Typography variant="h4">Josh Karges</Typography>
        </AppBar>
      </a>
      <div className={classes.homeContainer}>
        <Router>
          <Switch>
            <Route path="/blog/gifter">
              <GifterBlog />
            </Route>
            <Route path="/blog/tattoo">
              <TattooBlog />
            </Route>
            <Route path="/blog/splendor">
              <SplendorBlog />
            </Route>
            <Route path="/blog/cbre-plans">
              <PlansBlog />
            </Route>
          </Switch>
        </Router>
      </div>
    </div>
  );
};
