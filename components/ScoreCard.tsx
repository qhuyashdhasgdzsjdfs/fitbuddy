import { StyleSheet, Text, View } from "react-native";

export default function ScoreCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Điểm sức khỏe</Text>
      <Text style={styles.score}>250</Text>
      <Text style={styles.level}>Level 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#16A34A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  label: { color: "white", opacity: 0.9 },
  score: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
    marginVertical: 6,
  },
  level: { color: "white", opacity: 0.9 },
});
