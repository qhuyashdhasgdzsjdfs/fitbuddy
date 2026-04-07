import { db } from "@/constants/firebase";
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore";

export const getLatestActivity = async (userId: string) => {
  try {
    const q = query(
      collection(db, "activities"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.log("❌ Get activity error:", error);
    return null;
  }
};
