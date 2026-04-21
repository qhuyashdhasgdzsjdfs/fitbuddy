// app/(tabs)/reminder.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    REMINDERS,
    ReminderType,
    cancelReminder,
    loadReminderStates,
    requestNotificationPermission,
    scheduleReminder,
} from "@/services/reminderServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInterval(sec: number): string {
  if (sec >= 3600) return `${sec / 3600} giờ / lần`;
  return `${sec / 60} phút / lần`;
}

function formatCountdown(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Reminder Card ────────────────────────────────────────────────────────────

interface ReminderCardProps {
  type: ReminderType;
  enabled: boolean;
  toggling: boolean;
  onToggle: (type: ReminderType, val: boolean) => void;
}

const CARD_CONFIG: Record<
  ReminderType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    desc: string;
  }
> = {
  water: {
    icon: "water-outline",
    color: "#3B82F6",
    bg: "#EFF6FF",
    desc: "Nhắc uống nước để duy trì đủ nước cho cơ thể.",
  },
  eye: {
    icon: "eye-outline",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    desc: "Nhắc nghỉ mắt, nhìn xa giảm mỏi mắt khi làm việc.",
  },
};

function ReminderCard({
  type,
  enabled,
  toggling,
  onToggle,
}: ReminderCardProps) {
  const config = REMINDERS[type];
  const cardConfig = CARD_CONFIG[type];

  return (
    <View
      style={[
        styles.card,
        enabled && { borderColor: cardConfig.color, borderWidth: 1.5 },
      ]}
    >
      {/* Icon + title row */}
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: cardConfig.bg }]}>
          <Ionicons name={cardConfig.icon} size={24} color={cardConfig.color} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{config.title}</Text>
          <View style={styles.intervalBadge}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.intervalText}>
              {formatInterval(config.intervalSec)}
            </Text>
          </View>
        </View>

        {toggling ? (
          <ActivityIndicator color={cardConfig.color} />
        ) : (
          <Switch
            value={enabled}
            onValueChange={(val) => onToggle(type, val)}
            trackColor={{ false: "#E5E7EB", true: cardConfig.color + "60" }}
            thumbColor={enabled ? cardConfig.color : "#9CA3AF"}
          />
        )}
      </View>

      {/* Description */}
      <Text style={styles.cardDesc}>{cardConfig.desc}</Text>

      {/* Notification preview */}
      {enabled && (
        <View style={[styles.preview, { backgroundColor: cardConfig.bg }]}>
          <Ionicons
            name="notifications-outline"
            size={13}
            color={cardConfig.color}
          />
          <Text style={[styles.previewText, { color: cardConfig.color }]}>
            {config.body}
          </Text>
        </View>
      )}

      {/* Status */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: enabled ? "#22C55E" : "#D1D5DB" },
          ]}
        />
        <Text style={styles.statusText}>
          {enabled ? "Đang bật — thông báo sẽ gửi định kỳ" : "Đã tắt"}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReminderScreen() {
  const [states, setStates] = useState<Record<ReminderType, boolean>>({
    water: false,
    eye: false,
  });
  const [toggling, setToggling] = useState<Record<ReminderType, boolean>>({
    water: false,
    eye: false,
  });
  const [permOk, setPermOk] = useState(true);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const saved = await loadReminderStates();
        setStates(saved);
        setLoading(false);
      })();
    }, []),
  );

  async function handleToggle(type: ReminderType, value: boolean) {
    // Xin permission lần đầu
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPermOk(false);
      Alert.alert(
        "Chưa cấp quyền thông báo",
        "Vào Settings → Notifications → bật quyền cho ứng dụng này.",
        [{ text: "OK" }],
      );
      return;
    }
    setPermOk(true);

    setToggling((prev) => ({ ...prev, [type]: true }));
    try {
      if (value) {
        await scheduleReminder(type);
        setStates((prev) => ({ ...prev, [type]: true }));
        Alert.alert(
          "Đã bật ✅",
          `Bạn sẽ nhận thông báo ${type === "water" ? "uống nước mỗi 2 giờ" : "nghỉ mắt mỗi 30 phút"}.`,
        );
      } else {
        await cancelReminder(type);
        setStates((prev) => ({ ...prev, [type]: false }));
      }
    } catch (e) {
      console.error("handleToggle error:", e);
      Alert.alert("Lỗi", "Không thể thay đổi cài đặt. Thử lại.");
    } finally {
      setToggling((prev) => ({ ...prev, [type]: false }));
    }
  }

  async function handleDisableAll() {
    Alert.alert("Tắt tất cả?", "Tất cả nhắc nhở sẽ bị huỷ.", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Tắt tất cả",
        style: "destructive",
        onPress: async () => {
          await Promise.all([cancelReminder("water"), cancelReminder("eye")]);
          setStates({ water: false, eye: false });
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22C55E" size="large" />
      </View>
    );
  }

  const anyEnabled = states.water || states.eye;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nhắc nhở sức khoẻ</Text>
        <Text style={styles.subtitle}>
          Bật thông báo để duy trì thói quen tốt
        </Text>
      </View>

      {/* Permission warning */}
      {!permOk && (
        <View style={styles.warnBox}>
          <Ionicons name="warning-outline" size={16} color="#B45309" />
          <Text style={styles.warnText}>
            Chưa cấp quyền thông báo — vào Settings để bật.
          </Text>
        </View>
      )}

      {/* Summary banner khi có reminder bật */}
      {anyEnabled && (
        <View style={styles.activeBanner}>
          <Ionicons name="notifications" size={16} color="#15803D" />
          <Text style={styles.activeBannerText}>
            {[states.water && "Uống nước", states.eye && "Nghỉ mắt"]
              .filter(Boolean)
              .join(" · ")}{" "}
            đang hoạt động
          </Text>
        </View>
      )}

      {/* Reminder cards */}
      {(["water", "eye"] as ReminderType[]).map((type) => (
        <ReminderCard
          key={type}
          type={type}
          enabled={states[type]}
          toggling={toggling[type]}
          onToggle={handleToggle}
        />
      ))}

      {/* Disable all */}
      {anyEnabled && (
        <TouchableOpacity
          style={styles.disableAllBtn}
          onPress={handleDisableAll}
        >
          <Ionicons
            name="notifications-off-outline"
            size={16}
            color="#EF4444"
          />
          <Text style={styles.disableAllText}>Tắt tất cả nhắc nhở</Text>
        </TouchableOpacity>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Lưu ý</Text>
        <Text style={styles.infoText}>
          • Thông báo chạy nền — app không cần mở{"\n"}• Tắt app không ảnh hưởng
          đến nhắc nhở{"\n"}• Thông báo đầu tiên gửi sau 1 chu kỳ kể từ lúc bật
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 3 },

  warnBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warnText: { flex: 1, fontSize: 12, color: "#92400E" },

  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DCFCE7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  activeBannerText: { fontSize: 13, color: "#15803D", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  intervalBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  intervalText: { fontSize: 12, color: "#6B7280" },
  cardDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 10,
  },

  preview: { borderRadius: 10, padding: 10, marginBottom: 10 },
  previewText: { fontSize: 12, lineHeight: 17, marginLeft: 4, flex: 1 },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, color: "#9CA3AF" },

  disableAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF1F2",
    marginBottom: 16,
  },
  disableAllText: { color: "#EF4444", fontWeight: "600", fontSize: 14 },

  infoBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0369A1",
    marginBottom: 6,
  },
  infoText: { fontSize: 12, color: "#0C4A6E", lineHeight: 20 },
});
