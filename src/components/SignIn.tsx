import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAllAction,
  userAuthChange,
  userAuthPending,
} from "../redux/slices/user";
import { User } from "../models/functions";
import { Button, Theme } from "@mui/material";
import { FetchedComponent } from "./fetchers/FetchedComponent";
import { State } from "../redux/rootReducer";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme: Theme) => ({
  signInContainer: {
    "& svg": {
      color: theme.palette.primary.contrastText,
    },
  },
}));

var provider = new firebase.auth.GoogleAuthProvider();

const GoogleSignInButton = ({ userExists }: { userExists?: boolean }) => {
  const dispatch = useDispatch();
  return userExists ? (
    <Button
      onClick={async () => {
        try {
          dispatch(userAuthPending());
          await firebase.auth().signOut();
          dispatch(clearAllAction.creator());
        } catch (error) {
          console.error("Log out error: ", error);
        }
      }}
      color="inherit"
    >
      Sign Out
    </Button>
  ) : (
    <Button
      color="inherit"
      onClick={() => {
        try {
          dispatch(userAuthPending());
          firebase.auth().signInWithPopup(provider);
        } catch (error) {
          console.error("Log in error: ", error);
        }
      }}
    >
      Sign In
    </Button>
  );
};

export const SignIn = () => {
  const classes = useStyles();
  const user = useSelector((state: State) => state.user);
  const dispatch = useDispatch();
  useEffect(() => {
    firebase.auth().onAuthStateChanged((authUser) => {
      dispatch(userAuthChange((authUser?.toJSON() ?? null) as User | null));
    });
  }, [dispatch]);
  return (
    <div>
      <FetchedComponent
        resource={user}
        IdleComponent={GoogleSignInButton as any}
        circularLoading
        loadingClassName={classes.signInContainer}
      >
        {(data) => <GoogleSignInButton userExists={!!data} />}
      </FetchedComponent>
    </div>
  );
};
