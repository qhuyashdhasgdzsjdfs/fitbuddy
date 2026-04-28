import { StyleSheet, View } from "react-native";

export default function AppCard({ children }: any) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#E5E7EB",
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    minHeight: 100,
    justifyContent: "center",
    elevation: 2,
  },
});
