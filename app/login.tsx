// app/login.tsx

import { auth } from "@/constants/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Vui lòng nhập email.";
  if (!email.trim().endsWith("@gmail.com")) return "Email phải là @gmail.com.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Vui lòng nhập mật khẩu.";
  if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự.";
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  function validate(): boolean {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    return !eErr && !pErr;
  }

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      console.log("LOGIN OK:", res.user.uid);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
          ? "Email hoặc mật khẩu không đúng."
          : err.code === "auth/too-many-requests"
            ? "Tài khoản tạm khóa do đăng nhập sai nhiều lần."
            : "Đăng nhập thất bại. Vui lòng thử lại.";
      Alert.alert("Đăng nhập thất bại", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>FitBuddy</Text>
        <Text style={styles.subtitle}>Stay healthy, stay focused 💪</Text>

        {/* Email */}
        <View style={styles.fieldWrap}>
          <View style={[styles.inputWrap, emailErr && styles.inputError]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#64748B"
              style={styles.icon}
            />
            <TextInput
              placeholder="Email (@gmail.com)"
              placeholderTextColor="#475569"
              style={styles.input}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(t) => {
                setEmail(t);
                setEmailErr(null);
              }}
            />
          </View>
          {emailErr && (
            <View style={styles.errRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
              <Text style={styles.errText}>{emailErr}</Text>
            </View>
          )}
        </View>

        {/* Password */}
        <View style={styles.fieldWrap}>
          <View style={[styles.inputWrap, passwordErr && styles.inputError]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#64748B"
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#475569"
              style={[styles.input, { flex: 1 }]}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordErr(null);
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPass ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>
          {passwordErr && (
            <View style={styles.errRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
              <Text style={styles.errText}>{passwordErr}</Text>
            </View>
          )}
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#38bdf8",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: { textAlign: "center", color: "#94a3b8", marginBottom: 32 },

  fieldWrap: { marginBottom: 16 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: { borderColor: "#EF4444" },
  icon: { marginRight: 8 },
  input: { color: "white", fontSize: 15, flex: 1 },
  eyeBtn: { padding: 4 },

  errRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  errText: { fontSize: 12, color: "#EF4444" },

  button: {
    backgroundColor: "#38bdf8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: "#475569" },
  buttonText: { color: "#0f172a", fontWeight: "bold", fontSize: 15 },

  link: { color: "#38bdf8", textAlign: "center", marginTop: 20 },
});
