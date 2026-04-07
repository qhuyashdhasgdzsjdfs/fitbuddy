import { saveMood } from "@/services/moodService";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AppCard from "../../components/ui/AppCard";

export default function MoodScreen() {
  const [selected, setSelected] = useState<number | null>(null);
  const [period, setPeriod] = useState<"morning" | "evening">("morning");

  const moods = [
    { icon: "😄", value: "very_happy" },
    { icon: "🙂", value: "happy" },
    { icon: "😐", value: "normal" },
    { icon: "😢", value: "sad" },
    { icon: "😡", value: "angry" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hôm nay bạn thấy thế nào?</Text>

      {/* 🧠 CARD */}
      <View style={styles.grid}>
        <View style={styles.cardWrapper}>
          <AppCard>
            <Text style={styles.label}>🧠 Mood hôm nay</Text>
            <Text style={styles.value}>
              {selected !== null ? moods[selected].icon : "--"}
            </Text>
            <Text style={styles.sub}>Cảm xúc</Text>
          </AppCard>
        </View>
      </View>

      {/* 🌅 🌙 CHỌN THỜI ĐIỂM */}
      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[styles.periodBtn, period === "morning" && styles.activeBtn]}
          onPress={() => setPeriod("morning")}
        >
          <Text style={styles.periodText}>🌅 Sáng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodBtn, period === "evening" && styles.activeBtn]}
          onPress={() => setPeriod("evening")}
        >
          <Text style={styles.periodText}>🌙 Tối</Text>
        </TouchableOpacity>
      </View>

      {/* 😀 MOOD LIST */}
      <View style={styles.row}>
        {moods.map((mood, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.box, selected === index && styles.selectedBox]}
            onPress={() => {
              setSelected(index);
              saveMood(mood.value, period);
            }}
          >
            <Text style={styles.emoji}>{mood.icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  // 🔲 GRID
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  cardWrapper: {
    width: "48%",
    marginBottom: 15,
  },

  // 🧠 CARD TEXT
  label: {
    fontSize: 13,
    color: "#6B7280",
  },

  value: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 6,
  },

  sub: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },

  // 🌅 🌙 PERIOD
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  periodBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
  },

  activeBtn: {
    backgroundColor: "#4CAF50",
  },

  periodText: {
    fontWeight: "600",
  },

  // 😀 MOOD LIST
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  box: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    width: 60,
    alignItems: "center",
  },

  selectedBox: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },

  emoji: {
    fontSize: 24,
  },
});
