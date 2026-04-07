import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../components/ui/AppCard";
import {
    calculateCalories,
    startStepCounter,
} from "../../services/activityService";
export default function ActivityScreen() {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    const sub = startStepCounter(setSteps);

    return () => sub.remove();
  }, []);

  const calories = calculateCalories(steps);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hoạt động hôm nay</Text>

      <View style={styles.grid}>
        <View style={styles.cardWrapper}>
          <AppCard>
            <Text style={styles.label}>🚶 Bước chân</Text>
            <Text style={styles.value}>{steps}</Text>
            <Text style={styles.sub}>10.000 mục tiêu</Text>
          </AppCard>
        </View>

        <View style={styles.cardWrapper}>
          <AppCard>
            <Text style={styles.label}>🔥 Calories</Text>
            <Text style={styles.value}>{calories.toFixed(0)}</Text>
            <Text style={styles.sub}>Đốt cháy</Text>
          </AppCard>
        </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
  },
  sub: {
    fontSize: 12,
    marginTop: 4,
    color: "#6B7280",
  },
});
