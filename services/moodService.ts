import { auth, db } from "@/constants/firebase";
import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore";

export const saveMood = async (mood: string, period: string) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.log("❌ Chưa đăng nhập");
      return;
    }

    const today = new Date().toDateString();

    // 🔍 kiểm tra đã lưu chưa
    const q = query(
      collection(db, "moods"),
      where("userId", "==", user.uid),
      where("date", "==", today),
      where("period", "==", period),
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log("⚠️ Đã lưu mood hôm nay rồi");
      return;
    }

    // ✅ lưu mới
    await addDoc(collection(db, "moods"), {
      userId: user.uid,
      mood,
      period, // sáng hoặc tối
      date: today,
      createdAt: new Date(),
    });

    console.log("✅ Mood saved:", mood, period);
  } catch (error) {
    console.log("❌ Save mood error:", error);
  }
};
export const getLatestMood = async (userId: string) => {
  try {
    const q = query(
      collection(db, "moods"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return snapshot.docs[0].data();
  } catch (error) {
    console.log("❌ Get mood error:", error);
    return null;
  }
};
