import { db } from "@/constants/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Lấy ngày hôm nay
const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

// Lưu dữ liệu
export const saveDailyLog = async (userId: string, data: any) => {
  const today = getToday();

  await setDoc(doc(db, "users", userId, "daily_logs", today), data, {
    merge: true,
  });
};

// Lấy dữ liệu
export const getDailyLog = async (userId: string) => {
  const today = getToday();

  const docRef = doc(db, "users", userId, "daily_logs", today);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return snapshot.data();
  } else {
    return null;
  }
};
