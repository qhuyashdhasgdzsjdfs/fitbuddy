import { addDoc, collection } from "firebase/firestore";
import { db } from "../constants/firebase";

export const testFirebase = async () => {
  try {
    await addDoc(collection(db, "test"), {
      message: "Hello Firebase",
      time: new Date(),
    });
    console.log("✅ Firebase OK");
  } catch (error) {
    console.log("❌ Firebase lỗi:", error);
  }
};
