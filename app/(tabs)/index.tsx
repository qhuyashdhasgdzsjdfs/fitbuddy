// app/(tabs)/index.tsx
import { auth } from "@/constants/firebase";
import { useGoalsContext } from "@/context/GoalsContext";
import { usePedometer } from "@/hooks/usePedometer";
import { getLatestActivity } from "@/services/activityService";
import { getLatestMood } from "@/services/moodService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router, useFocusEffect } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function moodInfo(m?: string) {
  if (m === "Happy") return { emoji: "😄", label: "Happy", color: "#22C55E" };
  if (m === "Neutral")
    return { emoji: "😐", label: "Neutral", color: "#F59E0B" };
  if (m === "Stressed")
    return { emoji: "😰", label: "Stressed", color: "#EF4444" };
  return { emoji: "—", label: "Not logged", color: "#9CA3AF" };
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  progress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub: string;
  color: string;
  progress: number;
}) {
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={[sc.card, { borderLeftColor: color }]}>
      <View style={[sc.iconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={sc.info}>
        <Text style={sc.label}>{label}</Text>
        <Text style={[sc.value, { color }]}>{value}</Text>
        <View style={sc.barBg}>
          <View
            style={[
              sc.barFill,
              { width: `${pct * 100}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={sc.sub}>{sub}</Text>
      </View>
      <Text style={[sc.pct, { color }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  label: { fontSize: 12, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 },
  value: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  barBg: {
    height: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 3,
  },
  barFill: { height: "100%", borderRadius: 4 },
  sub: { fontSize: 11, color: "#9CA3AF" },
  pct: { fontSize: 13, fontWeight: "700" },
});

function ScoreCard({ score, name }: { score: number; name: string }) {
  const cfg =
    score >= 90
      ? { lv: 5, label: "Excellent 🏆", color: "#22C55E" }
      : score >= 70
        ? { lv: 4, label: "Great 💪", color: "#3B82F6" }
        : score >= 50
          ? { lv: 3, label: "Good 👍", color: "#F59E0B" }
          : score >= 30
            ? { lv: 2, label: "Fair 🙂", color: "#F97316" }
            : { lv: 1, label: "Keep going 💫", color: "#EF4444" };
  return (
    <View style={hd.card}>
      <View>
        <Text style={hd.greet}>
          {greet()}, {name} 👋
        </Text>
        <Text style={hd.lvLabel}>{cfg.label}</Text>
        <Text style={[hd.score, { color: cfg.color }]}>{score}</Text>
        <Text style={hd.scoreSub}>health score</Text>
      </View>
      <View style={hd.right}>
        <View style={[hd.ring, { borderColor: cfg.color + "30" }]}>
          <Text style={[hd.lv, { color: cfg.color }]}>Lv{cfg.lv}</Text>
        </View>
        <View style={hd.barBg}>
          <View
            style={[
              hd.barFill,
              { width: `${score}%`, backgroundColor: cfg.color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const hd = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  greet: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  lvLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  score: { fontSize: 44, fontWeight: "900" },
  scoreSub: { fontSize: 12, color: "#9CA3AF" },
  right: { alignItems: "center", gap: 8 },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  lv: { fontSize: 17, fontWeight: "800" },
  barBg: {
    width: 76,
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 6 },
});

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [authDone, setAuthDone] = useState(false);
  const [mood, setMood] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [localGlasses, setLocalGlasses] = useState(0);
  const { steps, calories } = usePedometer();
  const { goals } = useGoalsContext();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setMood(null);
      setActivity(null);
      setLocalGlasses(0);
      setUser(u);
      setAuthDone(true);
      if (u) {
        setMood(null);
        setActivity(null);
        setLocalGlasses(0);
      }
    });
    return unsub;
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [m, a] = await Promise.all([
        getLatestMood(user.uid),
        getLatestActivity(user.uid),
      ]);
      setMood(m);
      setActivity(a);
    } catch (e) {
      console.warn(e);
    }
  }, [user]);

  // SỬA LẠI CHỖ NÀY: Thêm AsyncStorage.getItem
  useFocusEffect(
    useCallback(() => {
      loadData();
      if (!user) return;
      // 👈 THÊM ĐOẠN NÀY ĐỂ ĐỌC DATA TỪ MÁY KHI MỞ TRANG CHỦ
      // Đọc số nước từ đúng key chứa UID của người đó
      AsyncStorage.getItem(`water_${user.uid}`).then((val) => {
        if (val) setLocalGlasses(Number(val));
      });
    }, [loadData, user]),
  );

  if (!authDone)
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  if (!user) return <Redirect href="/login" />;

  const displayName = user.displayName ?? user.email?.split("@")[0] ?? "there";
  const displaySteps = Math.max(steps, activity?.steps ?? 0);

  // SỬA LẠI CHỖ NÀY: Dùng Math.max để so sánh local và mạng
  // 👈 SỬA THÀNH NHƯ SAU:
  const glasses = Math.max(localGlasses, activity?.glasses ?? 0);

  const moodData = moodInfo(mood?.mood);
  const score = Math.min(
    Math.round((displaySteps / goals.steps) * 55) +
      (mood?.mood === "Happy"
        ? 30
        : mood?.mood === "Neutral"
          ? 20
          : mood?.mood === "Stressed"
            ? 5
            : 10) +
      Math.min(Math.round((glasses / goals.waterGlasses) * 15), 15),
    100,
  );

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadData();
            setRefreshing(false);
          }}
          tintColor="#22C55E"
        />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.appName}>FitBuddy</Text>
        <TouchableOpacity
          style={s.avatar}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={s.avatarTxt}>{displayName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScoreCard score={score} name={displayName} />

      <Text style={s.section}>Today Progress</Text>

      <StatCard
        icon="walk"
        label="Steps"
        color="#22C55E"
        value={displaySteps.toLocaleString()}
        progress={displaySteps / goals.steps}
        sub={`Goal: ${goals.steps.toLocaleString()} steps`}
      />
      <StatCard
        icon="water"
        label="Water"
        color="#38bdf8"
        value={`${glasses} glasses`}
        progress={glasses / goals.waterGlasses}
        sub={`Goal: ${goals.waterGlasses} glasses / day`}
      />
      <StatCard
        icon="flame"
        label="Calories"
        color="#F59E0B"
        value={`${calories} kcal`}
        progress={calories / goals.calories}
        sub={`Goal: ${goals.calories} kcal`}
      />

      <Text style={[s.section, { marginTop: 4 }]}>Mood</Text>
      <TouchableOpacity
        style={s.moodCard}
        onPress={() => router.push("/(tabs)/mood")}
      >
        <Text style={s.moodEmoji}>{moodData.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.moodLabel, { color: moodData.color }]}>
            {moodData.label}
          </Text>
          <Text style={s.moodSub}>
            {mood ? "Logged today" : "Tap to log your mood"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </TouchableOpacity>

      <Text style={s.hint}>Pull to refresh • Edit goals in Profile</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#22C55E",
    letterSpacing: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 18, fontWeight: "800", color: "#fff" },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 4,
  },
  moodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 12,
  },
  moodEmoji: { fontSize: 32 },
  moodLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  moodSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  hint: { textAlign: "center", fontSize: 11, color: "#C4C9D4", marginTop: 16 },
});
