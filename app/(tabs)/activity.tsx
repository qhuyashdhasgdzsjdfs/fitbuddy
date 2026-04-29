// app/(tabs)/activity.tsx
// ✅ Steps + Water + Save + Reminders

import { useGoalsContext } from "@/context/GoalsContext";
import { usePedometer } from "@/hooks/usePedometer";
import { saveActivity } from "@/services/activityService";
import { saveLeaderboardEntry } from "@/services/leaderboardService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Notification helpers (safe — no crash in Expo Go) ───────────────────────

async function requestPermission(): Promise<boolean> {
  try {
    const N = require("expo-notifications");
    const { status } = await N.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

async function scheduleRepeat(
  id: string,
  title: string,
  body: string,
  hours: number,
) {
  try {
    const N = require("expo-notifications");
    await N.cancelScheduledNotificationAsync(id).catch(() => {});
    await N.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: true },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: hours * 3600,
        repeats: true,
      },
    });
  } catch (e) {
    console.warn("scheduleRepeat:", e);
  }
}

async function cancelNotif(id: string) {
  try {
    await require("expo-notifications").cancelScheduledNotificationAsync(id);
  } catch {}
}

const STEP_ID = "remind_steps";
const WATER_ID = "remind_water";
const STEP_PREF = "remind_steps_on";
const WATER_PREF = "remind_water_on";

// ─── Firestore / Storage ─────────────────────────────────────────────────────

const ML_PER_GLASS = 250;
const getWaterKey = (uid: string) => `water_${uid}`;
const getDateKey = (uid: string) => `date_${uid}`;

function uid() {
  try {
    return getAuth(getApp()).currentUser?.uid ?? "guest";
  } catch {
    return "guest";
  }
}
function getDb() {
  return getFirestore(getApp());
}
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

async function saveWater(userId: string, glasses: number) {
  await setDoc(doc(getDb(), "water_logs", `${userId}_${todayStr()}`), {
    userId,
    date: todayStr(),
    glasses,
    ml: glasses * ML_PER_GLASS,
    updatedAt: Date.now(),
  });
}

async function loadWaterFirestore(userId: string): Promise<number> {
  const snap = await getDocs(
    query(collection(getDb(), "water_logs"), where("userId", "==", userId)),
  );
  return (
    snap.docs
      .map((d) => d.data() as any)
      .find((e: any) => e.date === todayStr())?.glasses ?? 0
  );
}

// ─── Step Ring ────────────────────────────────────────────────────────────────

function StepRing({ steps, goal }: { steps: number; goal: number }) {
  const pct = Math.min(steps / goal, 1);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: pct,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [steps]);
  const color =
    pct >= 1
      ? "#22C55E"
      : pct >= 0.6
        ? "#3B82F6"
        : pct >= 0.3
          ? "#F59E0B"
          : "#EF4444";
  return (
    <View style={sr.card}>
      <View style={sr.circleWrap}>
        <View style={[sr.circleBg, { borderColor: color + "25" }]} />
        <View style={sr.center}>
          <Text style={[sr.num, { color }]}>{steps.toLocaleString()}</Text>
          <Text style={sr.sub}>steps</Text>
          <Text style={sr.goal}>/ {goal.toLocaleString()}</Text>
        </View>
      </View>
      <View style={sr.barBg}>
        <Animated.View
          style={[
            sr.barFill,
            {
              width: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[sr.pctTxt, { color }]}>
        {pct >= 1
          ? "✅ Goal reached!"
          : `${Math.round(pct * 100)}%  ·  ${(goal - steps).toLocaleString()} steps left`}
      </Text>
    </View>
  );
}
const sr = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  circleWrap: {
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  circleBg: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 14,
  },
  center: { alignItems: "center" },
  num: { fontSize: 36, fontWeight: "900" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: -2 },
  goal: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  barBg: {
    width: "100%",
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 10 },
  pctTxt: { fontSize: 13, marginTop: 10, fontWeight: "600" },
});

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={[sb.card, { borderTopColor: color }]}>
      <View style={[sb.iconWrap, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[sb.value, { color }]}>{value}</Text>
      <Text style={sb.unit}>{unit}</Text>
      <Text style={sb.label}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  value: { fontSize: 22, fontWeight: "900" },
  unit: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  label: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginTop: 4 },
});

// ─── Water Section ────────────────────────────────────────────────────────────

function WaterSection({
  glasses,
  goal,
  onAdd,
}: {
  glasses: number;
  goal: number;
  onAdd: (n: number) => void;
}) {
  const pct = Math.min(glasses / goal, 1);
  const color = pct >= 1 ? "#22C55E" : pct >= 0.5 ? "#38bdf8" : "#60A5FA";
  return (
    <View style={ws.card}>
      <View style={ws.header}>
        <Text style={ws.title}>💧 Water Intake</Text>
        <Text style={[ws.count, { color }]}>
          {glasses} / {goal} glasses
        </Text>
      </View>
      <View style={ws.barBg}>
        <View
          style={[
            ws.barFill,
            { width: `${pct * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={ws.ml}>
        {glasses * ML_PER_GLASS} ml · {Math.round(pct * 100)}% of goal
      </Text>
      <View style={ws.btnRow}>
        {(
          [
            { n: 1, label: "+1", c: "#38bdf8" },
            { n: 2, label: "+2", c: "#3B82F6" },
            { n: -1, label: "−1", c: "#EF4444" },
          ] as const
        ).map((btn) => (
          <TouchableOpacity
            key={btn.label}
            style={[
              ws.btn,
              { borderColor: btn.c + "50", backgroundColor: btn.c + "12" },
            ]}
            onPress={() => onAdd(btn.n)}
          >
            <Text style={[ws.btnTxt, { color: btn.c }]}>{btn.label}</Text>
            <Text style={[ws.btnSub, { color: btn.c + "99" }]}>
              {btn.n > 0 ? `${btn.n * ML_PER_GLASS}ml` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const ws = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#0C4A6E" },
  count: { fontSize: 15, fontWeight: "800" },
  barBg: {
    height: 8,
    backgroundColor: "#E0F2FE",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: { height: "100%", borderRadius: 8 },
  ml: { fontSize: 12, color: "#64748B", marginBottom: 14 },
  btnRow: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  btnTxt: { fontSize: 16, fontWeight: "800" },
  btnSub: { fontSize: 10, marginTop: 2 },
});

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  enabled,
  onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View
      style={[rc.card, enabled && { borderColor: iconColor, borderWidth: 1.5 }]}
    >
      <View style={[rc.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={rc.info}>
        <Text style={rc.title}>{title}</Text>
        <Text style={[rc.sub, enabled && { color: iconColor }]}>
          {subtitle}
        </Text>
      </View>
      <View style={rc.right}>
        {enabled && (
          <View style={[rc.activeDot, { backgroundColor: iconColor }]} />
        )}
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: "#E5E7EB", true: iconColor + "60" }}
          thumbColor={enabled ? iconColor : "#9CA3AF"}
          ios_backgroundColor="#E5E7EB"
        />
      </View>
    </View>
  );
}
const rc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
  activeDot: { width: 7, height: 7, borderRadius: 4 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const userId = uid();
  const { goals } = useGoalsContext();
  const { steps, distanceKm, calories, status, error } = usePedometer();

  const [glasses, setGlasses] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [stepRemind, setStepRemind] = useState(false);
  const [waterRemind, setWaterRemind] = useState(false);

  // Load water + reminder prefs on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          // Thay vì dùng WATER_DATE_KEY tĩnh, hãy dùng getDateKey(userId)
          const storedDate = await AsyncStorage.getItem(getDateKey(userId));
          if (storedDate !== todayStr()) {
            await AsyncStorage.setItem(getDateKey(userId), todayStr());
            await AsyncStorage.setItem(getWaterKey(userId), "0");
          }
          const g = await loadWaterFirestore(userId);
          setGlasses(g);
          await AsyncStorage.setItem(getWaterKey(userId), String(g));
        } catch {}
        // ... (Phần notification giữ nguyên)
      })();
    }, [userId]),
  );
  async function handleAddWater(n: number) {
    const next = Math.max(0, glasses + n);
    setGlasses(next);
    await AsyncStorage.setItem(getWaterKey(userId), String(next));
    await saveWater(userId, next).catch(console.error);
    if (next >= goals.waterGlasses && glasses < goals.waterGlasses)
      Alert.alert("🎉 Well done!", "You've reached your water goal for today!");
  }

  async function handleSave() {
    if (steps === 0) {
      Alert.alert("No data", "Walk a bit first, then save your activity.");
      return;
    }
    setSaving(true);
    try {
      await saveActivity(userId, steps, distanceKm, calories);
      const user = getAuth(getApp()).currentUser;
      const name =
        user?.displayName ?? user?.email?.split("@")[0] ?? "Anonymous";
      await saveLeaderboardEntry(userId, name, steps);
      setSaved(Date.now());
      Alert.alert(
        "Saved ✅",
        `${steps.toLocaleString()} steps recorded and posted to the leaderboard.`,
      );
    } catch {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStepReminder(val: boolean) {
    if (val) {
      const ok = await requestPermission();
      if (!ok) {
        Alert.alert(
          "Permission required",
          "Allow notifications in Settings to use reminders.",
        );
        return;
      }
      await scheduleRepeat(
        STEP_ID,
        "🚶 Time to move!",
        "Take a short walk to hit your step goal!",
        2,
      );
      Alert.alert("Move Reminder set ✅", "You'll be nudged every 2 hours.");
    } else {
      await cancelNotif(STEP_ID);
    }
    setStepRemind(val);
    await AsyncStorage.setItem(STEP_PREF, val ? "1" : "0");
  }

  async function toggleWaterReminder(val: boolean) {
    if (val) {
      const ok = await requestPermission();
      if (!ok) {
        Alert.alert(
          "Permission required",
          "Allow notifications in Settings to use reminders.",
        );
        return;
      }
      await scheduleRepeat(
        WATER_ID,
        "💧 Stay hydrated!",
        "Time to drink a glass of water.",
        2,
      );
      Alert.alert("Water Reminder set ✅", "You'll be reminded every 2 hours.");
    } else {
      await cancelNotif(WATER_ID);
    }
    setWaterRemind(val);
    await AsyncStorage.setItem(WATER_PREF, val ? "1" : "0");
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Activity</Text>
        <Text style={s.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
      </View>

      {/* Pedometer status pill */}
      <View style={[s.pill, error ? s.pillErr : s.pillOk]}>
        <Ionicons
          name={error ? "warning-outline" : "radio-button-on"}
          size={12}
          color={error ? "#B45309" : "#15803D"}
        />
        <Text style={[s.pillTxt, { color: error ? "#B45309" : "#15803D" }]}>
          {error ?? status}
        </Text>
      </View>

      {/* Steps Ring */}
      <StepRing steps={steps} goal={goals.steps} />

      {/* Stats Row */}
      <View style={s.grid}>
        <StatBox
          icon="navigate-outline"
          label="Distance"
          value={distanceKm.toFixed(2)}
          unit="km"
          color="#3B82F6"
        />
        <StatBox
          icon="flame-outline"
          label="Calories"
          value={String(calories)}
          unit="kcal"
          color="#F59E0B"
        />
        <StatBox
          icon="time-outline"
          label="Active"
          value={Math.round(steps / 100).toString()}
          unit="min"
          color="#8B5CF6"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[s.saveBtn, saving && s.saveBtnOff]}
        onPress={handleSave}
        disabled={saving}
      >
        <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
        <Text style={s.saveTxt}>
          {saving ? "Saving…" : "Save Activity & Post to Leaderboard"}
        </Text>
      </TouchableOpacity>
      {saved && (
        <Text style={s.savedHint}>
          Saved at{" "}
          {new Date(saved).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}

      {/* Water */}
      <WaterSection
        glasses={glasses}
        goal={goals.waterGlasses}
        onAdd={handleAddWater}
      />

      {/* ── Reminders ───────────────────────────────────────────── */}
      <Text style={s.section}>🔔 Reminders</Text>

      <ReminderCard
        icon="walk-outline"
        iconColor="#22C55E"
        iconBg="#DCFCE7"
        title="Move Reminder"
        subtitle={
          stepRemind ? "On · nudge every 2 hrs" : "Remind me to get moving"
        }
        enabled={stepRemind}
        onToggle={toggleStepReminder}
      />

      <ReminderCard
        icon="water-outline"
        iconColor="#38bdf8"
        iconBg="#E0F2FE"
        title="Water Reminder"
        subtitle={
          waterRemind ? "On · nudge every 2 hrs" : "Remind me to drink water"
        }
        enabled={waterRemind}
        onToggle={toggleWaterReminder}
      />

      {/* Note about native build */}
      <View style={s.noteBox}>
        <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
        <Text style={s.noteTxt}>
          {Platform.OS === "ios"
            ? "Push notifications require a native build — won't fire in Expo Go"
            : "Toggle on to receive background reminders"}
        </Text>
      </View>

      {/* Tips */}
      <View style={s.tip}>
        <Text style={s.tipTitle}>💡 Activity Tips</Text>
        <Text style={s.tipTxt}>• 10,000 steps ≈ 7 km ≈ 400 kcal burned</Text>
        <Text style={s.tipTxt}>
          • 30 mins of walking daily cuts heart disease risk by 35%
        </Text>
        <Text style={s.tipTxt}>
          • Split into 3 × 10 min sessions if you are busy
        </Text>
        <Text style={s.tipTxt}>
          • Drink an extra 500 ml water during exercise
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 14 },
  title: { fontSize: 28, fontWeight: "900", color: "#111827" },
  date: { fontSize: 13, color: "#9CA3AF", marginTop: 3 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  pillOk: { backgroundColor: "#DCFCE7" },
  pillErr: { backgroundColor: "#FEF3C7" },
  pillTxt: { fontSize: 11, fontWeight: "600" },
  grid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 8,
    elevation: 3,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveBtnOff: { backgroundColor: "#9CA3AF", elevation: 0, shadowOpacity: 0 },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  savedHint: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 4,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noteTxt: { fontSize: 11, color: "#6B7280", flex: 1, lineHeight: 16 },
  tip: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 8,
  },
  tipTxt: { fontSize: 12, color: "#166534", lineHeight: 22 },
});
