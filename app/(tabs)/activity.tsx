// app/(tabs)/activity.tsx

import { useGoals } from "@/hooks/useGoals";
import { usePedometer } from "@/hooks/usePedometer";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

function StatBox({ icon, label, value, unit, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string; unit: string; color: string;
}) {
  return (
    <View style={[sb.card, { borderTopColor: color }]}>
      <View style={[sb.iconWrap, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[sb.value, { color }]}>{value}</Text>
      <Text style={sb.unit}>{unit}</Text>
      <Text style={sb.label}>{label}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  card:    { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center", borderTopWidth: 3, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  iconWrap:{ width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  value:   { fontSize: 24, fontWeight: "900" },
  unit:    { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  label:   { fontSize: 12, color: "#6B7280", fontWeight: "600", marginTop: 4 },
});

export default function ActivityScreen() {
  const { goals }          = useGoals();
  const { steps, distanceKm, calories, status, error } = usePedometer();

  const GOAL     = goals.steps;
  const progress = Math.min(steps / GOAL, 1);
  const barAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, { toValue: progress, useNativeDriver: false, tension: 40, friction: 8 }).start();
  }, [steps]);

  const color =
    progress >= 1    ? "#22C55E" :
    progress >= 0.6  ? "#3B82F6" :
    progress >= 0.3  ? "#F59E0B" : "#EF4444";

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Vận động</Text>
        <Text style={s.subtitle}>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</Text>
      </View>

      {/* Status */}
      <View style={[s.statusPill, error ? s.statusErr : s.statusOk]}>
        <Ionicons name={error ? "warning-outline" : "radio-button-on"} size={12} color={error ? "#B45309" : "#15803D"} />
        <Text style={[s.statusText, { color: error ? "#B45309" : "#15803D" }]}>{error ?? status}</Text>
      </View>

      {/* Big ring card */}
      <View style={s.ringCard}>
        {/* Circular progress */}
        <View style={s.circleWrap}>
          <View style={[s.circleBg, { borderColor: color + "20" }]} />
          <View style={s.circleCenter}>
            <Text style={[s.stepBig, { color }]}>{steps.toLocaleString()}</Text>
            <Text style={s.stepSub}>bước chân</Text>
            <Text style={s.stepGoal}>/ {GOAL.toLocaleString()}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.barBg}>
          <Animated.View style={[s.barFill, {
            width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            backgroundColor: color,
          }]} />
        </View>

        <View style={s.progressRow}>
          <Text style={[s.progressPct, { color }]}>{Math.round(progress * 100)}%</Text>
          <Text style={s.progressLabel}>
            {progress >= 1 ? "✅ Đã đạt mục tiêu!" : `Còn ${(GOAL - steps).toLocaleString()} bước`}
          </Text>
        </View>
      </View>

      {/* Stat boxes */}
      <View style={s.grid}>
        <StatBox icon="walk-outline"     label="Bước chân"   value={steps.toLocaleString()} unit="bước" color="#22C55E" />
        <StatBox icon="flame-outline"    label="Calories"    value={String(calories)}        unit="kcal" color="#F59E0B" />
      </View>
      <View style={[s.grid, { marginTop: 12 }]}>
        <StatBox icon="navigate-outline" label="Quãng đường" value={distanceKm.toFixed(2)}  unit="km"   color="#3B82F6" />
        <StatBox icon="time-outline"     label="Hoạt động"   value={Math.round(steps / 100).toString()} unit="phút" color="#8B5CF6" />
      </View>

      {/* Tips */}
      <View style={s.tipCard}>
        <Text style={s.tipTitle}>💡 Mẹo vận động</Text>
        <Text style={s.tipText}>• 10.000 bước = ~7 km = ~400 kcal</Text>
        <Text style={s.tipText}>• Đi bộ 30 phút mỗi ngày giảm nguy cơ bệnh tim 35%</Text>
        <Text style={s.tipText}>• Chia nhỏ thành 3 lần x 10 phút nếu bận</Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: "#F8FAFC" },
  content:      { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header:       { marginBottom: 16 },
  title:        { fontSize: 28, fontWeight: "900", color: "#111827" },
  subtitle:     { fontSize: 13, color: "#9CA3AF", marginTop: 3 },
  statusPill:   { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  statusOk:     { backgroundColor: "#DCFCE7" },
  statusErr:    { backgroundColor: "#FEF3C7" },
  statusText:   { fontSize: 11, fontWeight: "600" },
  ringCard:     { backgroundColor: "#fff", borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
  circleWrap:   { width: 180, height: 180, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  circleBg:     { position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 14 },
  circleCenter: { alignItems: "center" },
  stepBig:      { fontSize: 38, fontWeight: "900" },
  stepSub:      { fontSize: 13, color: "#6B7280", marginTop: -2 },
  stepGoal:     { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  barBg:        { width: "100%", height: 10, backgroundColor: "#F3F4F6", borderRadius: 10, overflow: "hidden" },
  barFill:      { height: "100%", borderRadius: 10 },
  progressRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  progressPct:  { fontSize: 18, fontWeight: "800" },
  progressLabel:{ fontSize: 13, color: "#6B7280" },
  grid:         { flexDirection: "row", gap: 12 },
  tipCard:      { backgroundColor: "#F0FDF4", borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#BBF7D0" },
  tipTitle:     { fontSize: 13, fontWeight: "700", color: "#15803D", marginBottom: 8 },
  tipText:      { fontSize: 12, color: "#166534", lineHeight: 22 },
});