import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔥 IMPORT ĐÚNG CHO REACT NATIVE
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

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

// 🔥 FIRESTORE
export const db = getFirestore(app);

// 🔥 AUTH CÓ PERSISTENCE (QUAN TRỌNG NHẤT)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
