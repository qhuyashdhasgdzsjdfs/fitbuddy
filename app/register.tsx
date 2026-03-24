import { auth } from "@/constants/firebase";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Vui lòng nhập đầy đủ email và password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password phải >= 6 ký tự");
      return;
    }

    try {
      setLoading(true);

      const res = await createUserWithEmailAndPassword(auth, email, password);

      console.log("REGISTER OK:", res.user.uid);

      Alert.alert("Success", "Tạo tài khoản thành công");

      router.replace("/login");
    } catch (err: any) {
      console.log("REGISTER ERROR:", err);

      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Loading..." : "Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#38bdf8",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    color: "white",
  },
  button: {
    backgroundColor: "#38bdf8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "bold",
  },
});
