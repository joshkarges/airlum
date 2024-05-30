import firebase from "firebase/compat/app";
var firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "airlum.firebaseapp.com",
  projectId: "airlum",
  storageBucket: "airlum.appspot.com",
  messagingSenderId: "1002201936954",
  appId: "1:1002201936954:web:a17f309ae03b868557f103",
  measurementId: "G-FZ88CGSCH7",
};
// Initialize Firebase
export const app = firebase.initializeApp(firebaseConfig);
