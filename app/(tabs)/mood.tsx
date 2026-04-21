// app/(tabs)/mood.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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

import StressedSuggestions from "@/components/mood/StressedSuggestions";
import { auth } from "@/constants/firebase";
import { getTodayMoods, saveMood } from "@/services/moodService";
import { DailyMoodRecord, MoodType, SessionType } from "@/types/mood";

// ─── Mood config ─────────────────────────────────────────────────────────────

interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
  bg: string;
}

const MOODS: MoodOption[] = [
  {
    type: "Happy",
    emoji: "😄",
    label: "Vui vẻ",
    color: "#22C55E",
    bg: "#DCFCE7",
  },
  {
    type: "Neutral",
    emoji: "😐",
    label: "Bình thường",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    type: "Stressed",
    emoji: "😰",
    label: "Căng thẳng",
    color: "#EF4444",
    bg: "#FEE2E2",
  },
];

// ─── Session label helpers ────────────────────────────────────────────────────

function sessionLabel(session: SessionType) {
  return session === "morning" ? "Buổi sáng" : "Buổi tối";
}

function sessionIcon(session: SessionType): keyof typeof Ionicons.glyphMap {
  return session === "morning" ? "sunny-outline" : "moon-outline";
}

function getMoodOption(mood: MoodType): MoodOption {
  return MOODS.find((m) => m.type === mood)!;
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Safe session helper (avoids undefined at render time) ───────────────────

function getSession(): SessionType {
  try {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 12 ? "morning" : "evening";
  } catch {
    return "morning";
  }
}

export default function MoodScreen() {
  const userId = auth.currentUser?.uid ?? "guest";

  const [currentSession] = useState<SessionType>(() => getSession());
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [dailyRecord, setDailyRecord] = useState<DailyMoodRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedThisSession, setSavedThisSession] = useState(false);

  // Scale animations for mood buttons
  const scaleAnims = MOODS.map(() => new Animated.Value(1));

  // ── Load today's record on screen focus ──
  useFocusEffect(
    useCallback(() => {
      loadTodayRecord();
    }, []),
  );

  async function loadTodayRecord() {
    setLoading(true);
    try {
      const record = await getTodayMoods(userId);
      setDailyRecord(record);

      // Pre-select if already saved this session
      const existing =
        currentSession === "morning" ? record.morning : record.evening;
      if (existing) {
        setSelectedMood(existing.mood);
        setSavedThisSession(true);
        setShowSuggestions(existing.mood === "Stressed");
      }
    } catch (e) {
      console.error("loadTodayRecord error:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectMood(mood: MoodType, index: number) {
    if (savedThisSession) return; // already saved — read-only

    setSelectedMood(mood);
    setShowSuggestions(mood === "Stressed");

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function handleSave() {
    if (!selectedMood) {
      Alert.alert("Chưa chọn cảm xúc", "Vui lòng chọn trạng thái của bạn.");
      return;
    }

    setSaving(true);
    try {
      await saveMood(userId, selectedMood, currentSession);
      setSavedThisSession(true);
      await loadTodayRecord();
      Alert.alert(
        "Đã lưu! ✅",
        `Cảm xúc ${sessionLabel(currentSession).toLowerCase()} của bạn đã được ghi lại.`,
      );
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lưu. Vui lòng thử lại.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22C55E" size="large" />
      </View>
    );
  }

  const otherSession: SessionType =
    currentSession === "morning" ? "evening" : "morning";
  const otherEntry =
    otherSession === "morning" ? dailyRecord?.morning : dailyRecord?.evening;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào 👋</Text>
        <Text style={styles.title}>Hôm nay bạn thấy thế nào?</Text>
        <View style={styles.sessionBadge}>
          <Ionicons
            name={sessionIcon(currentSession)}
            size={14}
            color="#6B7280"
          />
          <Text style={styles.sessionText}>{sessionLabel(currentSession)}</Text>
        </View>
      </View>

      {/* ── Mood selector ── */}
      <View style={styles.moodRow}>
        {MOODS.map((m, i) => {
          const isSelected = selectedMood === m.type;
          return (
            <Animated.View
              key={m.type}
              style={{ transform: [{ scale: scaleAnims[i] }], flex: 1 }}
            >
              <TouchableOpacity
                style={[
                  styles.moodCard,
                  isSelected && {
                    backgroundColor: m.bg,
                    borderColor: m.color,
                    borderWidth: 2,
                  },
                  savedThisSession && !isSelected && styles.moodCardDisabled,
                ]}
                onPress={() => handleSelectMood(m.type, i)}
                activeOpacity={0.75}
                disabled={savedThisSession && !isSelected}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    isSelected && { color: m.color, fontWeight: "700" },
                  ]}
                >
                  {m.label}
                </Text>
                {isSelected && (
                  <View style={[styles.dot, { backgroundColor: m.color }]} />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* ── Stressed suggestions ── */}
      {showSuggestions && (
        <StressedSuggestions
          onDismiss={
            savedThisSession ? undefined : () => setShowSuggestions(false)
          }
        />
      )}

      {/* ── Save button ── */}
      {!savedThisSession ? (
        <TouchableOpacity
          style={[styles.saveBtn, !selectedMood && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!selectedMood || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />
              <Text style={styles.saveBtnText}>Lưu cảm xúc</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.savedBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text style={styles.savedBannerText}>
            Đã ghi nhận {sessionLabel(currentSession).toLowerCase()}
          </Text>
        </View>
      )}

      {/* ── Other session summary ── */}
      {otherEntry && (
        <View style={styles.otherSessionCard}>
          <View style={styles.otherSessionHeader}>
            <Ionicons
              name={sessionIcon(otherSession)}
              size={16}
              color="#6B7280"
            />
            <Text style={styles.otherSessionTitle}>
              {sessionLabel(otherSession)}
            </Text>
          </View>
          <View style={styles.otherSessionBody}>
            <Text style={styles.otherEmoji}>
              {getMoodOption(otherEntry.mood).emoji}
            </Text>
            <Text
              style={[
                styles.otherMoodLabel,
                { color: getMoodOption(otherEntry.mood).color },
              ]}
            >
              {getMoodOption(otherEntry.mood).label}
            </Text>
          </View>
        </View>
      )}

      {/* ── Daily summary ── */}
      {(dailyRecord?.morning || dailyRecord?.evening) && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Tổng kết hôm nay</Text>
          <View style={styles.summaryRow}>
            {(["morning", "evening"] as SessionType[]).map((s) => {
              const entry =
                s === "morning" ? dailyRecord.morning : dailyRecord.evening;
              return (
                <View key={s} style={styles.summaryItem}>
                  <Ionicons
                    name={sessionIcon(s)}
                    size={14}
                    color={entry ? "#374151" : "#D1D5DB"}
                  />
                  <Text style={styles.summarySession}>{sessionLabel(s)}</Text>
                  <Text style={styles.summaryEmoji}>
                    {entry ? getMoodOption(entry.mood).emoji : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  // Header
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sessionText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Mood cards
  moodRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  moodCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moodCardDisabled: {
    opacity: 0.4,
  },
  moodEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },

  // Save button
  saveBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Saved banner
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  savedBannerText: {
    color: "#15803D",
    fontWeight: "600",
    fontSize: 14,
  },

  // Other session
  otherSessionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  otherSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  otherSessionTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  otherSessionBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  otherEmoji: {
    fontSize: 22,
  },
  otherMoodLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Daily summary
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 4,
  },
  summarySession: {
    fontSize: 11,
    color: "#6B7280",
  },
  summaryEmoji: {
    fontSize: 22,
  },
});
