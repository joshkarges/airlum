import { AppBar, Toolbar, Typography } from "@mui/material";
import React from "react";

const PageWrapper: React.FC = ({ children }) => {
  return (
    <div>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6">AirLum</Typography>
        </Toolbar>
      </AppBar>
      {children}
    </div>
  );
};

export default PageWrapper;
