// firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBq6moSs0l_xoWSE-DNVqOcSRqcBsKexRk",
  authDomain: "fitbuddy-c1c7f.firebaseapp.com",
  projectId: "fitbuddy-c1c7f",
  storageBucket: "fitbuddy-c1c7f.firebasestorage.app",
  messagingSenderId: "883816767454",
  appId: "1:883816767454:web:6dd85f997bfcdcf1fd074f",
  measurementId: "G-0LDC1PHK5H",
};

const app = initializeApp(firebaseConfig);
console.log("Firebase connected:", app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
