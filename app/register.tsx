// app/register.tsx

import { auth } from "@/constants/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Validation ───────────────────────────────────────────────────────────────

function validateName(name: string): string | null {
  if (!name.trim()) return "Vui lòng nhập tên.";
  if (name.trim().length < 2) return "Tên tối thiểu 2 ký tự.";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Vui lòng nhập email.";
  if (!email.trim().endsWith("@gmail.com")) return "Email phải là @gmail.com.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Vui lòng nhập mật khẩu.";
  if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự.";
  if (!/[A-Z]/.test(password))
    return "Mật khẩu phải có ít nhất 1 chữ viết hoa.";
  return null;
}

function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "Vui lòng xác nhận mật khẩu.";
  if (password !== confirm) return "Mật khẩu xác nhận không khớp.";
  return null;
}

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(p: string): { label: string; color: string; pct: string } {
  if (!p) return { label: "", color: "transparent", pct: "0%" };
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 2) return { label: "Yếu", color: "#EF4444", pct: "33%" };
  if (score <= 3) return { label: "Trung bình", color: "#F59E0B", pct: "66%" };
  return { label: "Mạnh", color: "#22C55E", pct: "100%" };
}

// ─── Sub components ───────────────────────────────────────────────────────────

function ErrRow({ msg }: { msg: string }) {
  return (
    <View style={s.errRow}>
      <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
      <Text style={s.errText}>{msg}</Text>
    </View>
  );
}

function HintRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={s.hintRow}>
      <Ionicons
        name={ok ? "checkmark-circle" : "ellipse-outline"}
        size={13}
        color={ok ? "#22C55E" : "#64748B"}
      />
      <Text style={[s.hintText, ok && { color: "#22C55E" }]}>{text}</Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameErr, setNameErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

  const strength = getStrength(password);

  function validate(): boolean {
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirm(password, confirm);
    setNameErr(nErr);
    setEmailErr(eErr);
    setPassErr(pErr);
    setConfirmErr(cErr);
    return !nErr && !eErr && !pErr && !cErr;
  }

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      await updateProfile(res.user, { displayName: name.trim() });
      console.log("REGISTER OK:", res.user.uid);
      Alert.alert("Đăng ký thành công! 🎉", "Chào mừng bạn đến với FitBuddy.", [
        { text: "Bắt đầu", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "Email này đã được sử dụng."
          : err.code === "auth/invalid-email"
            ? "Email không hợp lệ."
            : "Đăng ký thất bại. Vui lòng thử lại.";
      Alert.alert("Đăng ký thất bại", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>FitBuddy</Text>
        <Text style={s.subtitle}>Tạo tài khoản mới 🚀</Text>

        {/* Name */}
        <View style={s.field}>
          <View style={[s.inputWrap, nameErr && s.inputErr]}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#64748B"
              style={s.icon}
            />
            <TextInput
              placeholder="Họ và tên"
              placeholderTextColor="#475569"
              style={[s.input, { flex: 1 }]}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setNameErr(null);
              }}
            />
          </View>
          {nameErr && <ErrRow msg={nameErr} />}
        </View>

        {/* Email */}
        <View style={s.field}>
          <View style={[s.inputWrap, emailErr && s.inputErr]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#64748B"
              style={s.icon}
            />
            <TextInput
              placeholder="Email (@gmail.com)"
              placeholderTextColor="#475569"
              style={[s.input, { flex: 1 }]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailErr(null);
              }}
            />
          </View>
          {emailErr && <ErrRow msg={emailErr} />}
        </View>

        {/* Password */}
        <View style={s.field}>
          <View style={[s.inputWrap, passErr && s.inputErr]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#64748B"
              style={s.icon}
            />
            <TextInput
              placeholder="Mật khẩu (có chữ hoa)"
              placeholderTextColor="#475569"
              style={[s.input, { flex: 1 }]}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPassErr(null);
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              style={s.eyeBtn}
            >
              <Ionicons
                name={showPass ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {/* Strength bar */}
          {password.length > 0 && (
            <View style={s.strengthWrap}>
              <View style={s.strengthBg}>
                <View
                  style={[
                    s.strengthFill,
                    { width: strength.pct, backgroundColor: strength.color },
                  ]}
                />
              </View>
              <Text style={[s.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Hints */}
          {password.length > 0 && (
            <View style={s.hints}>
              <HintRow ok={password.length >= 6} text="Tối thiểu 6 ký tự" />
              <HintRow
                ok={/[A-Z]/.test(password)}
                text="Có ít nhất 1 chữ viết hoa"
              />
            </View>
          )}
          {passErr && <ErrRow msg={passErr} />}
        </View>

        {/* Confirm */}
        <View style={s.field}>
          <View style={[s.inputWrap, confirmErr && s.inputErr]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#64748B"
              style={s.icon}
            />
            <TextInput
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="#475569"
              style={[s.input, { flex: 1 }]}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                setConfirmErr(null);
              }}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              style={s.eyeBtn}
            >
              <Ionicons
                name={showConfirm ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>
          {confirmErr && <ErrRow msg={confirmErr} />}
        </View>

        {/* Register button */}
        <TouchableOpacity
          style={[s.btn, loading && s.btnOff]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={s.btnText}>Đăng ký</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={s.link}>Đã có tài khoản? Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
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

  field: { marginBottom: 16 },
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
  inputErr: { borderColor: "#EF4444" },
  icon: { marginRight: 8 },
  input: { color: "white", fontSize: 15 },
  eyeBtn: { padding: 4 },

  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  strengthBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 4 },
  strengthLabel: { fontSize: 11, fontWeight: "600", minWidth: 65 },

  hints: { gap: 4, marginTop: 6 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  hintText: { fontSize: 12, color: "#64748B" },

  errRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  errText: { fontSize: 12, color: "#EF4444" },

  btn: {
    backgroundColor: "#38bdf8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnOff: { backgroundColor: "#475569" },
  btnText: { color: "#0f172a", fontWeight: "bold", fontSize: 15 },

  link: { color: "#38bdf8", textAlign: "center", marginTop: 20 },
});
