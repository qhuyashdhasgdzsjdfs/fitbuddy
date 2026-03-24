import StatCard from "@/components/home/StatCard";
import { auth } from "@/constants/firebase";
import { getDailyLog } from "@/services/dailyLog";
import { Redirect } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 LẤY USER CHUẨN (fix auto login)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔥 LOAD DATA SAU KHI CÓ USER
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const res = await getDailyLog(user.uid);
        setData(res);

        console.log("USER:", user.uid);
        console.log("DATA:", res);
      } catch (err) {
        console.log("ERROR:", err);
      }
    };

    loadData();
  }, [user]);

  // 🔥 ĐANG LOAD AUTH
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🔥 CHƯA LOGIN → VỀ LOGIN
  if (!user) {
    return <Redirect href="/login" />;
  }

  // 🔥 UI CHÍNH
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>FitBuddy</Text>
      <Text style={styles.subtitle}>Chào bạn 👋</Text>

      {/* Health Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Điểm sức khỏe</Text>
        <Text style={styles.score}>250</Text>
        <Text style={styles.level}>Level 3</Text>
      </View>

      {/* Stats */}
      <StatCard
        title="Bước chân"
        value={data?.steps || 0}
        progress={(data?.steps || 0) / 10000}
        icon="walk"
        color="#22C55E"
      />

      <StatCard
        title="Nước uống"
        value={`${data?.water || 0} ml`}
        progress={(data?.water || 0) / 2000}
        icon="water"
        color="#3B82F6"
      />

      <StatCard
        title="Giấc ngủ"
        value={`${data?.sleepHours || 0}h`}
        progress={(data?.sleepHours || 0) / 8}
        icon="moon"
        color="#8B5CF6"
      />

      <StatCard
        title="Năng lượng"
        value={`${data?.calories || 0} kcal`}
        progress={(data?.calories || 0) / 500}
        icon="flash"
        color="#F59E0B"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F7",
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: 20,
  },

  scoreCard: {
    backgroundColor: "#16A34A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  scoreLabel: { color: "white", opacity: 0.9 },

  score: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
    marginVertical: 6,
  },

  level: { color: "white", opacity: 0.9 },
});
