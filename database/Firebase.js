import firebase from "firebase/app";

import "firebase/firestore";
import "firebase/auth";

var firebaseConfig = {
  apiKey: "AIzaSyCN5SZC70bz9nk8l-OHm3IqQR--783CgLA",
  authDomain: "riego-9d8f7.firebaseapp.com",
  databaseURL: "https://riego-9d8f7-default-rtdb.firebaseio.com",
  projectId: "riego-9d8f7",
  storageBucket: "riego-9d8f7.appspot.com",
  messagingSenderId: "375384614333",
  appId: "1:375384614333:web:428181b7eea889a92d1ed4",
  measurementId: "G-H5JRDPL7SL",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

export default {
  firebase,
  db,
  auth,
};
