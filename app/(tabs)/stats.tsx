import { StyleSheet, Text, View } from "react-native";
import StatCard from "../../components/ui/StatCard";

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thống kê 📊</Text>

      <StatCard
        title="Bước chân"
        value="6,200"
        progress={0.6}
        icon="walk"
        color="#22C55E"
      />

      <StatCard
        title="Nước uống"
        value="5/8"
        progress={0.7}
        icon="water"
        color="#3B82F6"
      />

      <StatCard
        title="Giấc ngủ"
        value="7h"
        progress={0.8}
        icon="moon"
        color="#8B5CF6"
      />
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
    marginBottom: 16,
  },
});
