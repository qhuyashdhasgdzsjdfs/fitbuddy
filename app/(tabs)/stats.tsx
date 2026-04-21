// app/(tabs)/stats.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { usePedometer } from "@/hooks/usePedometer";
import {
  ActivityEntry,
  getRecentActivities,
  saveActivity,
} from "@/services/activityService";
import { saveLeaderboardEntry } from "@/services/leaderboardService";

const DAILY_GOAL = 10_000;

function getUserId(): string {
  try {
    return getAuth(getApp()).currentUser?.uid ?? "guest";
  } catch {
    return "guest";
  }
}

function formatSteps(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function dayLabel(dateStr: string): string {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}

function RingProgress({
  progress,
  steps,
}: {
  progress: number;
  steps: number;
}) {
  const size = 180,
    stroke = 14;
  const pct = Math.min(progress, 1);
  return (
    <View style={ring.container}>
      <View
        style={[
          ring.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: "#E5E7EB",
          },
        ]}
      />
      <View
        style={[
          ring.arc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: "#22C55E",
            transform: [{ rotate: `${-90 + pct * 360}deg` }],
            borderTopColor: pct < 0.25 ? "#22C55E" : "transparent",
            borderRightColor: pct >= 0.25 ? "#22C55E" : "transparent",
            borderBottomColor: pct >= 0.5 ? "#22C55E" : "transparent",
            borderLeftColor: pct >= 0.75 ? "#22C55E" : "transparent",
          },
        ]}
      />
      <View style={ring.center}>
        <Text style={ring.stepNum}>{steps.toLocaleString()}</Text>
        <Text style={ring.stepLabel}>bước</Text>
        <Text style={ring.goalLabel}>
          Mục tiêu {DAILY_GOAL.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  track: { position: "absolute" },
  arc: { position: "absolute" },
  center: { alignItems: "center" },
  stepNum: { fontSize: 36, fontWeight: "800", color: "#111827" },
  stepLabel: { fontSize: 14, color: "#6B7280", marginTop: -2 },
  goalLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
});

function StatPill({
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
    <View style={[pill.wrap, { borderColor: color + "30" }]}>
      <View style={[pill.iconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={pill.label}>{label}</Text>
      <Text style={[pill.value, { color }]}>{value}</Text>
      <Text style={pill.unit}>{unit}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  label: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  value: { fontSize: 20, fontWeight: "800" },
  unit: { fontSize: 11, color: "#6B7280", marginTop: 1 },
});

function WeeklyChart({ history }: { history: ActivityEntry[] }) {
  const maxSteps = Math.max(...history.map((h) => h.steps), 1);
  const today = new Date().toISOString().split("T")[0];
  return (
    <View style={chart.container}>
      <Text style={chart.title}>📅 7 ngày gần nhất</Text>
      <View style={chart.bars}>
        {history.map((item) => {
          const pct = item.steps / maxSteps,
            isToday = item.date === today;
          return (
            <View key={item.date} style={chart.barCol}>
              <Text style={chart.barVal}>
                {item.steps > 0 ? formatSteps(item.steps) : ""}
              </Text>
              <View style={chart.barBg}>
                <View
                  style={[
                    chart.barFill,
                    {
                      height: `${Math.max(pct * 100, 4)}%`,
                      backgroundColor: isToday ? "#22C55E" : "#A7F3D0",
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  chart.barDay,
                  isToday && { color: "#22C55E", fontWeight: "700" },
                ]}
              >
                {dayLabel(item.date)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chart = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 100 },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barVal: { fontSize: 9, color: "#6B7280", marginBottom: 2 },
  barBg: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 6 },
  barDay: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },
});

export default function StatsScreen() {
  const userId = getUserId();
  const { steps, distanceKm, calories, available, error } = usePedometer();
  const [history, setHistory] = useState<ActivityEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const progress = steps / DAILY_GOAL;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [userId]),
  );

  async function loadHistory() {
    try {
      const data = await getRecentActivities(userId, 7);
      setHistory(buildWeek(data));
    } catch (e) {
      console.error("loadHistory error:", e);
    }
  }

  function buildWeek(data: ActivityEntry[]): ActivityEntry[] {
    const map: Record<string, ActivityEntry> = {};
    data.forEach((d) => {
      map[d.date] = d;
    });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      return (
        map[dateStr] ?? {
          userId,
          date: dateStr,
          steps: 0,
          distanceKm: 0,
          calories: 0,
          savedAt: 0,
        }
      );
    });
  }

  async function handleSave() {
    if (steps === 0) {
      Alert.alert("Chưa có dữ liệu", "Hãy đi bộ một chút rồi thử lại.");
      return;
    }
    setSaving(true);
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    try {
      await saveActivity(userId, steps, distanceKm, calories);

      // ✅ Lưu leaderboard — tài khoản khác sẽ thấy
      const user = getAuth(getApp()).currentUser;
      const name = user?.displayName ?? user?.email?.split("@")[0] ?? "Bạn";
      await saveLeaderboardEntry(userId, name, steps);

      setLastSaved(Date.now());
      await loadHistory();
      Alert.alert(
        "Đã lưu! ✅",
        `${steps.toLocaleString()} bước hôm nay đã được ghi lại.`,
      );
    } catch (e) {
      console.error("handleSave error:", e);
      Alert.alert("Lỗi", "Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Text style={s.title}>Hoạt động hôm nay</Text>
        <Text style={s.subtitle}>
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
      </View>

      {!available && (
        <View style={s.warnBox}>
          <Ionicons name="warning-outline" size={16} color="#B45309" />
          <Text style={s.warnText}>
            {error ?? "Thiết bị không hỗ trợ đếm bước."}
          </Text>
        </View>
      )}

      <View style={s.ringCard}>
        <RingProgress progress={progress} steps={steps} />
        <View style={s.progressBg}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: `${Math.min(progress * 100, 100)}%`,
                transform: [{ scaleX: pulseAnim }],
              },
            ]}
          />
        </View>
        <Text style={s.progressPct}>
          {Math.min(Math.round(progress * 100), 100)}% mục tiêu
        </Text>
      </View>

      <View style={s.pillRow}>
        <StatPill
          icon="walk-outline"
          label="Bước chân"
          value={steps.toLocaleString()}
          unit="bước"
          color="#22C55E"
        />
        <StatPill
          icon="navigate-outline"
          label="Quãng đường"
          value={distanceKm.toFixed(2)}
          unit="km"
          color="#3B82F6"
        />
        <StatPill
          icon="flame-outline"
          label="Calories"
          value={String(calories)}
          unit="kcal"
          color="#F59E0B"
        />
      </View>

      <TouchableOpacity
        style={[s.saveBtn, saving && s.saveBtnOff]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={s.saveBtnText}>Lưu hoạt động hôm nay</Text>
          </>
        )}
      </TouchableOpacity>

      {lastSaved && (
        <Text style={s.savedHint}>
          Đã lưu lúc{" "}
          {new Date(lastSaved).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}

      <View style={s.noteCard}>
        <Text style={s.noteTitle}>📐 Cách tính</Text>
        <Text style={s.noteText}>
          • Quãng đường = bước × 0.762 m (sải chân trung bình)
        </Text>
        <Text style={s.noteText}>
          • Calories = bước × 0.04 kcal (người ~70 kg)
        </Text>
      </View>

      {history.length > 0 && <WeeklyChart history={history} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  warnBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warnText: { flex: 1, fontSize: 12, color: "#92400E" },
  ringCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  progressBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#22C55E", borderRadius: 8 },
  progressPct: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  pillRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  saveBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveBtnOff: { backgroundColor: "#9CA3AF", elevation: 0, shadowOpacity: 0 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  savedHint: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 6,
  },
  noteText: { fontSize: 12, color: "#166534", lineHeight: 20 },
});
