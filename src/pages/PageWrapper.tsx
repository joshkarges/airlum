import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import React, { PropsWithChildren } from "react";
import { Route, Switch } from "react-router-dom";
import { Flex } from "../components/Flex";
import firebase from "firebase/compat/app";

const PageWrapper = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <AppBar position="sticky">
        <Toolbar>
          <Switch>
            <Route path="/splendor">
              <Typography variant="h6">Splendor</Typography>
            </Route>
            <Route path="/christmas-list">
              <Flex justifyContent="space-between">
                <Typography variant="h6">Christmas List</Typography>
                <Button onClick={() => firebase.auth().signOut()}>
                  Sign Out
                </Button>
              </Flex>
            </Route>
            <Route path="/tattoo">
              <Typography variant="h6">Tattoo</Typography>
            </Route>
            <Route path="/exchange-events">
              <Typography variant="h6">Exchange Events</Typography>
            </Route>
            <Route path="/">
              <Typography variant="h6">AirLum</Typography>
            </Route>
          </Switch>
        </Toolbar>
      </AppBar>
      {children}
    </div>
  );
};

export default PageWrapper;
