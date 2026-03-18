import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  value: string;
  progress: number;
  icon: any;
  color: string;
};

export default function StatCard({
  title,
  value,
  progress,
  icon,
  color,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <Text style={styles.value}>{value}</Text>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progress,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    marginLeft: 6,
    color: "gray",
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  progress: {
    height: 6,
    borderRadius: 6,
  },
});
