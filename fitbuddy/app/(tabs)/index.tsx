import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>FitBuddy</Text>
      <Text style={styles.subtitle}>Chào Nguyễn Văn A 👋</Text>

      {/* Health Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Điểm sức khỏe</Text>
        <Text style={styles.score}>250</Text>
        <Text style={styles.level}>Level 3</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <StatCard
          title="Bước chân"
          value="4,520"
          progress={0.45}
          icon="walk-outline"
          color="#22C55E"
        />

        <StatCard
          title="Nước uống"
          value="4/8"
          progress={0.5}
          icon="water-outline"
          color="#3B82F6"
        />

        <StatCard
          title="Giấc ngủ"
          value="8h"
          progress={1}
          icon="moon-outline"
          color="#8B5CF6"
        />

        <StatCard
          title="Năng lượng"
          value="176 kcal"
          progress={0.3}
          icon="flash-outline"
          color="#F59E0B"
        />
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value, progress, icon, color }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <Text style={styles.cardValue}>{value}</Text>

      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F7",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: 20,
  },

  scoreCard: {
    backgroundColor: "#16A34A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  scoreLabel: { color: "white", opacity: 0.9 },

  score: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
    marginVertical: 6,
  },

  level: { color: "white", opacity: 0.9 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    backgroundColor: "white",
    width: "48%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardTitle: {
    color: "#6B7280",
    marginLeft: 6,
  },

  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  progressBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
});
