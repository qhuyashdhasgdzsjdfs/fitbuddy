// app/(tabs)/index.tsx

import { auth } from "@/constants/firebase";
import { useGoals } from "@/hooks/useGoals";
import { usePedometer } from "@/hooks/usePedometer";
import { getLatestActivity } from "@/services/activityService";
import { getLatestMood } from "@/services/moodService";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useFocusEffect } from "expo-router";
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
import { router } from "expo-router";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function moodEmoji(m?: string) {
  if (m === "Happy")    return { emoji: "😄", label: "Vui vẻ",   color: "#22C55E" };
  if (m === "Neutral")  return { emoji: "😐", label: "Bình thường", color: "#F59E0B" };
  if (m === "Stressed") return { emoji: "😰", label: "Căng thẳng", color: "#EF4444" };
  return { emoji: "--", label: "Chưa ghi", color: "#9CA3AF" };
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function HomeCard({
  icon, label, value, sub, color, progress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string; sub: string;
  color: string; progress: number;
}) {
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={[hc.card, { borderLeftColor: color }]}>
      <View style={[hc.iconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={hc.info}>
        <Text style={hc.label}>{label}</Text>
        <Text style={[hc.value, { color }]}>{value}</Text>
        <View style={hc.barBg}>
          <View style={[hc.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        </View>
        <Text style={hc.sub}>{sub}</Text>
      </View>
      <Text style={[hc.pct, { color }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const hc = StyleSheet.create({
  card:    { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, gap: 12 },
  iconWrap:{ width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  info:    { flex: 1 },
  label:   { fontSize: 12, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 },
  value:   { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  barBg:   { height: 4, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 3 },
  barFill: { height: "100%", borderRadius: 4 },
  sub:     { fontSize: 11, color: "#9CA3AF" },
  pct:     { fontSize: 13, fontWeight: "700" },
});

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const level =
    score >= 90 ? { lv: 5, label: "Xuất sắc 🏆",  color: "#22C55E" } :
    score >= 70 ? { lv: 4, label: "Rất tốt 💪",    color: "#3B82F6" } :
    score >= 50 ? { lv: 3, label: "Tốt 👍",         color: "#F59E0B" } :
    score >= 30 ? { lv: 2, label: "Khá 🙂",         color: "#F97316" } :
                  { lv: 1, label: "Cần cố thêm 💫", color: "#EF4444" };

  return (
    <View style={sr.card}>
      <View style={sr.left}>
        <Text style={sr.greeting}>{greet()} 👋</Text>
        <Text style={sr.levelLabel}>{level.label}</Text>
        <Text style={[sr.score, { color: level.color }]}>{score}</Text>
        <Text style={sr.scoreSub}>điểm sức khỏe</Text>
      </View>
      <View style={sr.right}>
        <View style={[sr.ring, { borderColor: level.color + "30" }]}>
          <View style={[sr.ringFill, { borderColor: level.color }]} />
          <Text style={[sr.lv, { color: level.color }]}>Lv{level.lv}</Text>
        </View>
        <View style={sr.bar}>
          <View style={[sr.barFill, { width: `${score}%`, backgroundColor: level.color }]} />
        </View>
      </View>
    </View>
  );
}

const sr = StyleSheet.create({
  card:       { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 },
  left:       { flex: 1 },
  greeting:   { fontSize: 14, color: "#6B7280", marginBottom: 4 },
  levelLabel: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  score:      { fontSize: 44, fontWeight: "900" },
  scoreSub:   { fontSize: 12, color: "#9CA3AF" },
  right:      { alignItems: "center", gap: 8 },
  ring:       { width: 80, height: 80, borderRadius: 40, borderWidth: 10, justifyContent: "center", alignItems: "center" },
  ringFill:   { position: "absolute", width: 80, height: 80, borderRadius: 40, borderWidth: 10, borderTopColor: "transparent", borderRightColor: "transparent", borderBottomColor: "transparent" },
  lv:         { fontSize: 18, fontWeight: "800" },
  bar:        { width: 80, height: 6, backgroundColor: "#F3F4F6", borderRadius: 6, overflow: "hidden" },
  barFill:    { height: "100%", borderRadius: 6 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [user,        setUser]        = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mood,        setMood]        = useState<any>(null);
  const [activity,    setActivity]    = useState<any>(null);
  const [water,       setWater]       = useState(0);
  const [refreshing,  setRefreshing]  = useState(false);

  const { steps, distanceKm, calories } = usePedometer();
  const { goals }                       = useGoals();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
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
    } catch (e) { console.warn("HomeScreen:", e); }
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (authLoading) return <View style={s.center}><ActivityIndicator size="large" color="#22C55E" /></View>;
  if (!user) return <Redirect href="/login" />;

  const displayName  = user.displayName ?? user.email?.split("@")[0] ?? "bạn";
  const displaySteps = Math.max(steps, activity?.steps ?? 0);
  const moodData     = moodEmoji(mood?.mood);
  const score        = Math.min(
    Math.round((displaySteps / goals.steps) * 60) +
    (mood?.mood === "Happy" ? 30 : mood?.mood === "Neutral" ? 20 : mood?.mood === "Stressed" ? 5 : 10),
    100
  );

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} tintColor="#22C55E" />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.appName}>FitBuddy</Text>
          <Text style={s.name}>Xin chào, {displayName} 👋</Text>
        </View>
        <TouchableOpacity style={s.avatarBtn} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={s.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Score */}
      <ScoreRing score={score} />

      {/* Stats */}
      <Text style={s.sectionTitle}>Hôm nay</Text>

      <HomeCard
        icon="walk" label="Bước chân" color="#22C55E"
        value={displaySteps.toLocaleString()}
        progress={displaySteps / goals.steps}
        sub={`Mục tiêu ${goals.steps.toLocaleString()} bước`}
      />
      <HomeCard
        icon="water" label="Uống nước" color="#38bdf8"
        value={`${activity?.glasses ?? 0} ly`}
        progress={(activity?.glasses ?? 0) / goals.waterGlasses}
        sub={`Mục tiêu ${goals.waterGlasses} ly / ngày`}
      />
      <HomeCard
        icon="flame" label="Calories" color="#F59E0B"
        value={`${calories} kcal`}
        progress={calories / goals.calories}
        sub={`Mục tiêu ${goals.calories} kcal`}
      />
      <HomeCard
        icon="moon" label="Giấc ngủ" color="#8B5CF6"
        value="-- giờ"
        progress={0}
        sub={`Mục tiêu ${goals.sleepHours} giờ / đêm`}
      />

      {/* Mood */}
      <Text style={s.sectionTitle}>Tâm trạng</Text>
      <TouchableOpacity style={s.moodCard} onPress={() => router.push("/(tabs)/mood")}>
        <Text style={s.moodEmoji}>{moodData.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.moodLabel}>{moodData.label}</Text>
          <Text style={s.moodSub}>{mood ? "Đã ghi hôm nay" : "Nhấn để ghi tâm trạng"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </TouchableOpacity>

      <Text style={s.hint}>Kéo xuống để làm mới • Chỉnh mục tiêu tại Hồ sơ</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: "#F8FAFC" },
  content:      { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  center:       { flex: 1, justifyContent: "center", alignItems: "center" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  appName:      { fontSize: 13, fontWeight: "700", color: "#22C55E", letterSpacing: 1 },
  name:         { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 2 },
  avatarBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  avatarText:   { fontSize: 18, fontWeight: "800", color: "#fff" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12, marginTop: 4 },
  moodCard:     { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, gap: 12 },
  moodEmoji:    { fontSize: 32 },
  moodLabel:    { fontSize: 16, fontWeight: "700", color: "#111827" },
  moodSub:      { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  hint:         { textAlign: "center", fontSize: 11, color: "#C4C9D4", marginTop: 16, marginBottom: 4 },
});