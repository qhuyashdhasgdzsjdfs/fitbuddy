import { auth, db } from "@/constants/firebase";
import { Redirect } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirebase();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔥 đang load → show loading
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🔥 đã login
  if (user) {
    return (
      <View>
        <Text>Logged in</Text>
      </View>
    );
  }

  // 🔥 chưa login
  return <Redirect href="/login" />;
}
