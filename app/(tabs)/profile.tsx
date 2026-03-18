import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/ui/AppButton";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>Nguyễn Văn A 👋</Text>
      <Text style={styles.email}>user@email.com</Text>

      <View style={styles.card}>
        <Text>🔥 Streak: 5 ngày</Text>
        <Text>🏃 Level: 3</Text>
      </View>

      <AppButton title="Đăng xuất" onPress={() => alert("Logout")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
  },
  email: {
    color: "gray",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
});
