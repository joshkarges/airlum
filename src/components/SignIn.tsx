import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { ReactNode, useEffect, useMemo, useState } from "react";

// Configure FirebaseUI.
const initialUiConfig: firebaseui.auth.Config = {
  // Popup signin flow rather than redirect flow.
  signInFlow: "popup",
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: "/christmas-list",
  // We will display Google as an auth provider.
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
};

type SignInProps = {
  signInSuccessUrl: string;
};

export const SignIn = ({ signInSuccessUrl }: SignInProps) => {
  const uiConfig = useMemo(() => {
    return {
      ...initialUiConfig,
      signInSuccessUrl,
    };
  }, [signInSuccessUrl]);
  const firbaseAuth = firebase.auth();

  const [widget, setWidget] = useState<ReactNode>(null);

  useEffect(() => {
    setWidget(
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firbaseAuth} />
    );
  }, [uiConfig, firbaseAuth]);
  return (
    <div>
      <p>Please sign-in:</p>
      {widget}
    </div>
  );
};
