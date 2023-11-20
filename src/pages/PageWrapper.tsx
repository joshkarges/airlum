import { AppBar, Toolbar, Typography } from "@mui/material";
import React, { PropsWithChildren } from "react";
import { Route, Router, Switch } from "react-router-dom";
import { EditMyList } from "../components/modals/EditMyList";

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
              <Typography variant="h6">Christmas List</Typography>
            </Route>
            <Route path="/tattoo">
              <Typography variant="h6">Tattoo</Typography>
            </Route>
            <Route path="/">
              <Typography variant="h6">AirLum</Typography>
            </Route>
          </Switch>
        </Toolbar>
      </AppBar>
      {children}
      <EditMyList/>
    </div>
  );
};

export default PageWrapper;
