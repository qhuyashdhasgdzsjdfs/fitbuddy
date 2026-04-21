// app/(tabs)/activity.tsx

import { usePedometer } from "@/hooks/usePedometer";
import { useEffect, useRef as useRefReact } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import AppCard from "../../components/ui/AppCard";

const STEP_GOAL = 10_000;

export default function ActivityScreen() {
  const { steps, distanceKm, calories, available, status, error } =
    usePedometer();

  const progress = Math.min(steps / STEP_GOAL, 1);
  const barAnim = useRefReact(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [steps]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Hoạt động hôm nay</Text>

      {/* Debug status — xóa sau khi xác nhận hoạt động */}
      <View style={[s.statusBox, error ? s.statusError : s.statusOk]}>
        <Text style={s.statusText}>🔍 {error ?? status}</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressCard}>
        <View style={s.progressHeader}>
          <Text style={s.progressSteps}>{steps.toLocaleString()}</Text>
          <Text style={s.progressGoal}>
            / {STEP_GOAL.toLocaleString()} bước
          </Text>
        </View>
        <View style={s.progressBg}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: barAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={s.progressPct}>
          {Math.round(progress * 100)}% mục tiêu
        </Text>
      </View>

      {/* Stat cards */}
      <View style={s.grid}>
        <View style={s.cardWrapper}>
          <AppCard>
            <Text style={s.label}>🚶 Bước chân</Text>
            <Text style={s.value}>{steps.toLocaleString()}</Text>
            <Text style={s.sub}>{STEP_GOAL.toLocaleString()} mục tiêu</Text>
          </AppCard>
        </View>
        <View style={s.cardWrapper}>
          <AppCard>
            <Text style={s.label}>🔥 Calories</Text>
            <Text style={s.value}>{calories}</Text>
            <Text style={s.sub}>Đốt cháy (kcal)</Text>
          </AppCard>
        </View>
        <View style={s.cardWrapper}>
          <AppCard>
            <Text style={s.label}>📍 Quãng đường</Text>
            <Text style={s.value}>{distanceKm.toFixed(2)}</Text>
            <Text style={s.sub}>km</Text>
          </AppCard>
        </View>
        <View style={s.cardWrapper}>
          <AppCard>
            <Text style={s.label}>🏅 Tiến độ</Text>
            <Text style={s.value}>{Math.round(progress * 100)}%</Text>
            <Text style={s.sub}>Hoàn thành</Text>
          </AppCard>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  statusBox: { borderRadius: 10, padding: 10, marginBottom: 14 },
  statusOk: { backgroundColor: "#DCFCE7" },
  statusError: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 12, color: "#374151" },

  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 10,
  },
  progressSteps: { fontSize: 32, fontWeight: "800", color: "#111827" },
  progressGoal: { fontSize: 14, color: "#9CA3AF" },
  progressBg: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 10,
  },
  progressPct: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "right",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: { width: "48%", marginBottom: 12 },
  label: { fontSize: 13, color: "#6B7280" },
  value: { fontSize: 24, fontWeight: "800", marginTop: 6, color: "#111827" },
  sub: { fontSize: 11, marginTop: 3, color: "#9CA3AF" },
});
