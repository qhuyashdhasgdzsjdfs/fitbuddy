import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MoodScreen() {
  const moods = ["😄", "🙂", "😐", "😢", "😡"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hôm nay bạn thấy thế nào?</Text>

      <View style={styles.row}>
        {moods.map((mood, index) => (
          <TouchableOpacity key={index} style={styles.box}>
            <Text style={styles.emoji}>{mood}</Text>
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
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
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
  },
  emoji: {
    fontSize: 24,
  },
});
