// app/(tabs)/profile.tsx

import { auth } from "@/constants/firebase";
import { useGoalsContext } from "@/context/GoalsContext";
import { UserGoals } from "@/hooks/useGoals";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface GoalCfg {
  key: keyof UserGoals;
  label: string;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  min: number;
  max: number;
  step: number;
}

const GOAL_CFG: GoalCfg[] = [
  {
    key: "steps",
    label: "Daily Steps",
    unit: "steps",
    icon: "walk-outline",
    color: "#22C55E",
    min: 1000,
    max: 30000,
    step: 500,
  },
  {
    key: "waterGlasses",
    label: "Water Glasses",
    unit: "glasses",
    icon: "water-outline",
    color: "#38bdf8",
    min: 1,
    max: 20,
    step: 1,
  },
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    icon: "flame-outline",
    color: "#F59E0B",
    min: 100,
    max: 3000,
    step: 50,
  },
];

const PRESETS: Record<string, number[]> = {
  steps: [5000, 8000, 10000, 15000],
  waterGlasses: [6, 8, 10, 12],
  calories: [200, 300, 500, 800],
};

function GoalModal({
  cfg,
  current,
  onSave,
  onClose,
}: {
  cfg: GoalCfg;
  current: number;
  onSave: (v: number) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(String(current));
  function adjust(d: number) {
    const next = Math.min(
      cfg.max,
      Math.max(cfg.min, (parseFloat(val) || current) + d),
    );
    setVal(String(next));
  }
  function save() {
    const n = parseFloat(val);
    if (isNaN(n) || n < cfg.min || n > cfg.max) {
      Alert.alert(
        "Invalid",
        `Enter a number between ${cfg.min} and ${cfg.max}.`,
      );
      return;
    }
    onSave(n);
    onClose();
  }
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={m.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={m.backdrop} onPress={onClose} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.hdr}>
            <View style={[m.iconWrap, { backgroundColor: cfg.color + "18" }]}>
              <Ionicons name={cfg.icon} size={22} color={cfg.color} />
            </View>
            <View>
              <Text style={m.title}>{cfg.label} Goal</Text>
              <Text style={m.range}>
                {cfg.min} – {cfg.max} {cfg.unit}
              </Text>
            </View>
          </View>
          <View style={m.stepper}>
            <TouchableOpacity
              style={[m.stepBtn, { borderColor: cfg.color }]}
              onPress={() => adjust(-cfg.step)}
            >
              <Ionicons name="remove" size={22} color={cfg.color} />
            </TouchableOpacity>
            <View style={m.inputWrap}>
              <TextInput
                style={[m.input, { color: cfg.color }]}
                value={val}
                onChangeText={setVal}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={m.unit}>{cfg.unit}</Text>
            </View>
            <TouchableOpacity
              style={[m.stepBtn, { borderColor: cfg.color }]}
              onPress={() => adjust(cfg.step)}
            >
              <Ionicons name="add" size={22} color={cfg.color} />
            </TouchableOpacity>
          </View>
          <View style={m.presets}>
            {(PRESETS[cfg.key] ?? []).map((p) => {
              const active = val === String(p);
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    m.preset,
                    active && {
                      backgroundColor: cfg.color,
                      borderColor: cfg.color,
                    },
                  ]}
                  onPress={() => setVal(String(p))}
                >
                  <Text style={[m.presetTxt, active && { color: "#fff" }]}>
                    {p} {cfg.unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
              <Text style={m.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.saveBtn, { backgroundColor: cfg.color }]}
              onPress={save}
            >
              <Text style={m.saveTxt}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  hdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  range: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrap: { alignItems: "center" },
  input: {
    fontSize: 44,
    fontWeight: "900",
    textAlign: "center",
    minWidth: 110,
  },
  unit: { fontSize: 14, color: "#9CA3AF", marginTop: -4 },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  presetTxt: { fontSize: 13, color: "#374151", fontWeight: "600" },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelTxt: { color: "#6B7280", fontWeight: "600", fontSize: 15 },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

function GoalRow({
  cfg,
  value,
  onPress,
}: {
  cfg: GoalCfg;
  value: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={gr.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[gr.iconWrap, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={gr.info}>
        <Text style={gr.label}>{cfg.label}</Text>
        <Text style={gr.sub}>Daily target</Text>
      </View>
      <Text style={[gr.value, { color: cfg.color }]}>{value}</Text>
      <Text style={gr.unit}>{cfg.unit}</Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color="#D1D5DB"
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  );
}

const gr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", color: "#111827" },
  sub: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  value: { fontSize: 18, fontWeight: "900" },
  unit: { fontSize: 11, color: "#9CA3AF" },
});

export default function ProfileScreen() {
  const user = auth.currentUser;
  const { goals, loading, updateGoal } = useGoalsContext();
  const [saving, setSaving] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [editCfg, setEditCfg] = useState<GoalCfg | null>(null);

  const name = user?.displayName ?? user?.email?.split("@")[0] ?? "User";
  const email = user?.email ?? "";
  const avatar = name.charAt(0).toUpperCase();

  async function handleSave(key: keyof UserGoals, val: number) {
    setSaving(true);
    try {
      await updateGoal(key, val);
    } catch {
      Alert.alert("Error", "Could not save goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLogoutBusy(true);
          try {
            await signOut(auth);
            router.replace("/login");
          } catch {
            Alert.alert("Error", "Could not sign out.");
          } finally {
            setLogoutBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{avatar}</Text>
            </View>
          </View>
          <Text style={s.name}>{name}</Text>
          <Text style={s.email}>{email}</Text>
        </View>

        {/* Goals */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>🎯 My Goals</Text>
          {saving && <ActivityIndicator size="small" color="#22C55E" />}
        </View>
        <View style={s.card}>
          {loading ? (
            <View style={s.loadWrap}>
              <ActivityIndicator color="#22C55E" />
            </View>
          ) : (
            GOAL_CFG.map((cfg, i) => (
              <View key={cfg.key}>
                <GoalRow
                  cfg={cfg}
                  value={goals[cfg.key] as number}
                  onPress={() => setEditCfg(cfg)}
                />
                {i < GOAL_CFG.length - 1 && <View style={s.divider} />}
              </View>
            ))
          )}
        </View>
        <Text style={s.hint}>
          Tap any goal to edit • Changes sync across the whole app
        </Text>

        {/* Account */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>👤 Account</Text>
        <View style={s.card}>
          <View style={gr.row}>
            <View style={[gr.iconWrap, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
            </View>
            <View style={gr.info}>
              <Text style={gr.label}>Email</Text>
              <Text style={gr.sub} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={gr.row}>
            <View style={[gr.iconWrap, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="flame-outline" size={20} color="#F59E0B" />
            </View>
            <View style={gr.info}>
              <Text style={gr.label}>Streak</Text>
              <Text style={gr.sub}>5 days in a row 🔥</Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={[s.logoutBtn, logoutBusy && s.logoutOff]}
          onPress={handleLogout}
          disabled={logoutBusy}
        >
          {logoutBusy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={s.logoutTxt}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {editCfg && (
        <GoalModal
          cfg={editCfg}
          current={goals[editCfg.key] as number}
          onSave={(val) => handleSave(editCfg.key, val)}
          onClose={() => setEditCfg(null)}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 48 },
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#22C55E40",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { fontSize: 34, fontWeight: "900", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#111827" },
  email: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },
  loadWrap: { padding: 24, alignItems: "center" },
  hint: {
    fontSize: 11,
    color: "#C4C9D4",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    elevation: 2,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  logoutOff: { backgroundColor: "#9CA3AF", elevation: 0, shadowOpacity: 0 },
  logoutTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
