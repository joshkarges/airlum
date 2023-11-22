import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { useMemo } from 'react';

var firebaseConfig = {
  apiKey: "AIzaSyAzSO8pByh5RcpfmwksHOHdh-IMjFetutQ",
  authDomain: "airlum.firebaseapp.com",
  projectId: "airlum",
  storageBucket: "airlum.appspot.com",
  messagingSenderId: "1002201936954",
  appId: "1:1002201936954:web:a17f309ae03b868557f103",
  measurementId: "G-FZ88CGSCH7"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Configure FirebaseUI.
const initialUiConfig: firebaseui.auth.Config = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'redirect',
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: '/christmas-list',
  // We will display Google as an auth provider.
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  ],
};

type SignInProps = {
  signInSuccessUrl: string,
};

export const SignIn = ({signInSuccessUrl}: SignInProps) => {
  const uiConfig = useMemo(() => {
    return {
      ...initialUiConfig,
      signInSuccessUrl,
    };
  }, [signInSuccessUrl])
  return (
    <div>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </div>
  );
};
