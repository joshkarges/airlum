import firebase from "firebase/compat/app";
// Registers Auth; enable Google in Firebase Console → Authentication → Sign-in method.
import "firebase/compat/auth";
var firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  // Use the app's own hosted domain so OAuth /__/auth/handler is first-party
  // (avoids iOS Safari/Chrome third-party storage partitioning that silently
  // drops the credential on signInWithRedirect). Firebase Hosting auto-serves
  // /__/auth/handler from any *.web.app / *.firebaseapp.com domain.
  authDomain: "joshkarges.com",
  projectId: "airlum",
  storageBucket: "airlum.firebasestorage.app",
  messagingSenderId: "1002201936954",
  appId: "1:1002201936954:web:a17f309ae03b868557f103",
  measurementId: "G-FZ88CGSCH7",
};

// Initialize Firebase
export const app = firebase.initializeApp(firebaseConfig);
