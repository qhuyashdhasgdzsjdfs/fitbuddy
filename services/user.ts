import { db } from "@/constants/firebase";
import { doc, setDoc } from "firebase/firestore";

export const createUserProfile = async (userId: string, email: string) => {
  await setDoc(doc(db, "users", userId), {
    email,
    createdAt: new Date(),
    dailyGoal: {
      steps: 8000,
      water: 2000,
      sleep: 8,
    },
  });
};
