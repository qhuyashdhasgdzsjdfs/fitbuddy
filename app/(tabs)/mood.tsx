import { saveMood } from "@/services/moodService";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

      {/* 🔥 CHỌN SÁNG / TỐI */}
      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[styles.periodBtn, period === "morning" && styles.activeBtn]}
          onPress={() => setPeriod("morning")}
        >
          <Text>🌅 Sáng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodBtn, period === "evening" && styles.activeBtn]}
          onPress={() => setPeriod("evening")}
        >
          <Text>🌙 Tối</Text>
        </TouchableOpacity>
      </View>

      {/* 🔥 MOOD */}
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
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  // 🌅🌙
  periodRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  periodBtn: {
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  activeBtn: {
    backgroundColor: "#4CAF50",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  box: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    width: 60,
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
  },
  selectedBox: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
});
