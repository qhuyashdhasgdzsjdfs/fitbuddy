// app/(tabs)/mood.tsx
// ✅ Self-contained: toàn bộ Firestore logic nằm trong file này

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDocs, getFirestore, query, setDoc, where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type MoodType    = "Happy" | "Neutral" | "Stressed";
type SessionType = "morning" | "evening";

interface MoodEntry {
  userId: string; mood: MoodType; session: SessionType;
  note: string; timestamp: number; date: string;
}

interface DailyRecord { date: string; morning?: MoodEntry; evening?: MoodEntry; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid()    { try { return getAuth(getApp()).currentUser?.uid ?? "guest"; } catch { return "guest"; } }
function getDb()  { return getFirestore(getApp()); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

function getSession(): SessionType {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? "morning" : "evening";
}

async function saveMood(userId: string, mood: MoodType, session: SessionType) {
  const date  = todayStr();
  const entry: MoodEntry = { userId, mood, session, note: "", timestamp: Date.now(), date };
  await setDoc(doc(getDb(), "moods", `${userId}_${date}_${session}`), entry);
}

async function loadTodayMoods(userId: string): Promise<DailyRecord> {
  const date = todayStr();
  const snap = await getDocs(query(collection(getDb(), "moods"), where("userId", "==", userId)));
  const record: DailyRecord = { date };
  snap.forEach(d => {
    const e = d.data() as MoodEntry;
    if (e.date === date) {
      if (e.session === "morning") record.morning = e;
      if (e.session === "evening") record.evening = e;
    }
  });
  return record;
}

async function loadRecent(userId: string, days = 7): Promise<MoodEntry[]> {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().split("T")[0];
  const snap = await getDocs(query(collection(getDb(), "moods"), where("userId", "==", userId)));
  return snap.docs.map(d => d.data() as MoodEntry)
    .filter(e => e.date >= cutoffDate)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ─── Mood config ──────────────────────────────────────────────────────────────

const MOODS: { type: MoodType; emoji: string; label: string; color: string; bg: string }[] = [
  { type: "Happy",    emoji: "😄", label: "Vui vẻ",      color: "#22C55E", bg: "#DCFCE7" },
  { type: "Neutral",  emoji: "😐", label: "Bình thường",  color: "#F59E0B", bg: "#FEF3C7" },
  { type: "Stressed", emoji: "😰", label: "Căng thẳng",   color: "#EF4444", bg: "#FEE2E2" },
];

function getMoodConfig(type?: MoodType) {
  return MOODS.find(m => m.type === type) ?? MOODS[1];
}

// ─── Stressed tips ────────────────────────────────────────────────────────────

const TIPS = [
  { icon: "fitness-outline",    title: "Hít thở sâu",    desc: "4 giây hít vào, giữ 4 giây, thở ra 4 giây" },
  { icon: "walk-outline",       title: "Đi bộ nhẹ",      desc: "10 phút đi bộ giảm cortisol hiệu quả" },
  { icon: "musical-notes-outline", title: "Nghe nhạc",   desc: "Chọn nhạc nhẹ nhàng để thư giãn tâm trí" },
  { icon: "water-outline",      title: "Uống nước",      desc: "Mất nước làm tăng cảm giác căng thẳng" },
  { icon: "moon-outline",       title: "Nghỉ ngơi",      desc: "Nhắm mắt 10 phút giúp não hồi phục" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MoodScreen() {
  const userId   = uid();
  const session  = getSession();

  const [record,  setRecord]  = useState<DailyRecord>({ date: todayStr() });
  const [recent,  setRecent]  = useState<MoodEntry[]>([]);
  const [saving,  setSaving]  = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [rec, hist] = await Promise.all([loadTodayMoods(userId), loadRecent(userId)]);
        setRecord(rec); setRecent(hist);
      } catch (e) { console.error("Mood:", e); }
    })();
  }, [userId]));

  async function handleSelect(mood: MoodType) {
    setSaving(true);
    try {
      await saveMood(userId, mood, session);
      const rec = await loadTodayMoods(userId);
      setRecord(rec);
      Alert.alert("Đã lưu ✅", `Tâm trạng ${getMoodConfig(mood).label} buổi ${session === "morning" ? "sáng" : "tối"} đã được ghi lại.`);
    } catch (e) { Alert.alert("Lỗi", "Không thể lưu tâm trạng."); }
    finally { setSaving(false); }
  }

  const sessionEntry = session === "morning" ? record.morning : record.evening;
  const otherEntry   = session === "morning" ? record.evening : record.morning;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Tâm trạng</Text>
        <Text style={s.subtitle}>Buổi {session === "morning" ? "sáng ☀️" : "tối 🌙"}</Text>
      </View>

      {/* Already saved */}
      {sessionEntry && (
        <View style={[s.savedCard, { backgroundColor: getMoodConfig(sessionEntry.mood).bg, borderColor: getMoodConfig(sessionEntry.mood).color + "40" }]}>
          <Text style={s.savedEmoji}>{getMoodConfig(sessionEntry.mood).emoji}</Text>
          <View>
            <Text style={[s.savedLabel, { color: getMoodConfig(sessionEntry.mood).color }]}>
              {getMoodConfig(sessionEntry.mood).label}
            </Text>
            <Text style={s.savedSub}>Đã ghi hôm nay • Nhấn để cập nhật</Text>
          </View>
        </View>
      )}

      {/* Picker */}
      <Text style={s.sectionTitle}>Bạn đang cảm thấy thế nào?</Text>
      <View style={s.moodRow}>
        {MOODS.map(m => {
          const active = sessionEntry?.mood === m.type;
          return (
            <TouchableOpacity
              key={m.type}
              style={[s.moodBtn, { backgroundColor: active ? m.color : m.bg, borderColor: m.color + (active ? "FF" : "40") }]}
              onPress={() => handleSelect(m.type)}
              disabled={saving}
            >
              <Text style={s.moodEmoji}>{m.emoji}</Text>
              <Text style={[s.moodLabel, { color: active ? "#fff" : m.color }]}>{m.label}</Text>
              {active && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stressed tips */}
      {sessionEntry?.mood === "Stressed" && (
        <View style={s.tipsCard}>
          <Text style={s.tipsTitle}>💆 Gợi ý giảm căng thẳng</Text>
          {TIPS.map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <View style={s.tipIcon}><Ionicons name={tip.icon as any} size={20} color="#EF4444" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.tipTitle2}>{tip.title}</Text>
                <Text style={s.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Other session */}
      {otherEntry && (
        <View style={s.otherCard}>
          <Text style={s.otherLabel}>Buổi {session === "morning" ? "tối" : "sáng"}</Text>
          <Text style={s.otherEmoji}>{getMoodConfig(otherEntry.mood).emoji}</Text>
          <Text style={[s.otherMood, { color: getMoodConfig(otherEntry.mood).color }]}>
            {getMoodConfig(otherEntry.mood).label}
          </Text>
        </View>
      )}

      {/* History */}
      {recent.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>Lịch sử gần đây</Text>
          {recent.slice(0, 7).map((e, i) => {
            const cfg = getMoodConfig(e.mood);
            return (
              <View key={i} style={[s.histRow, { borderLeftColor: cfg.color }]}>
                <Text style={s.histEmoji}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.histMood, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={s.histDate}>{e.date} · {e.session === "morning" ? "Sáng" : "Tối"}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: "#FFFBF5" },
  content:     { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header:      { marginBottom: 24 },
  title:       { fontSize: 28, fontWeight: "900", color: "#111827" },
  subtitle:    { fontSize: 14, color: "#9CA3AF", marginTop: 3 },
  savedCard:   { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1.5 },
  savedEmoji:  { fontSize: 32 },
  savedLabel:  { fontSize: 16, fontWeight: "700" },
  savedSub:    { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  sectionTitle:{ fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12 },
  moodRow:     { flexDirection: "row", gap: 10, marginBottom: 20 },
  moodBtn:     { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16, borderWidth: 2, gap: 6 },
  moodEmoji:   { fontSize: 28 },
  moodLabel:   { fontSize: 12, fontWeight: "700" },
  tipsCard:    { backgroundColor: "#FFF1F2", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#FECACA" },
  tipsTitle:   { fontSize: 14, fontWeight: "700", color: "#DC2626", marginBottom: 12 },
  tipRow:      { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  tipIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  tipTitle2:   { fontSize: 13, fontWeight: "700", color: "#111827" },
  tipDesc:     { fontSize: 11, color: "#6B7280", marginTop: 2 },
  otherCard:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  otherLabel:  { fontSize: 12, color: "#9CA3AF", fontWeight: "600", flex: 1 },
  otherEmoji:  { fontSize: 24 },
  otherMood:   { fontSize: 14, fontWeight: "700" },
  histRow:     { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
  histEmoji:   { fontSize: 22 },
  histMood:    { fontSize: 14, fontWeight: "700" },
  histDate:    { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
});