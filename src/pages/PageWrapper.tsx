import { AppBar, Theme, Toolbar, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { PropsWithChildren } from "react";
import { Route, Switch } from "react-router-dom";
import { Flex } from "../components/Flex";
import { MyClaimsModal } from "../components/modals/MyClaimsModal";
import { SignIn } from "../components/SignIn";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
}));

const PageWrapper = ({ children }: PropsWithChildren) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="sticky">
        <Toolbar>
          <Switch>
            <Route path="/splendor">
              <Typography variant="h6">Splendor</Typography>
            </Route>
            <Route path="/gift-exchange-event">
              <Flex
                justifyContent="space-between"
                flexGrow={1}
                alignItems="center"
              >
                <Typography variant="h6">Gifter</Typography>
                <SignIn />
              </Flex>
            </Route>
            <Route path="/tattoo">
              <Typography variant="h6">Tattoo</Typography>
            </Route>
            <Route path="/exchange-events">
              <Flex
                justifyContent="space-between"
                flexGrow={1}
                alignItems="center"
              >
                <Typography variant="h6">Exchange Events</Typography>
                <SignIn />
              </Flex>
            </Route>
            <Route path="/">
              <Typography variant="h6">AirLum</Typography>
            </Route>
          </Switch>
        </Toolbar>
      </AppBar>
      {children}
      <MyClaimsModal />
    </div>
  );
};

export default PageWrapper;
