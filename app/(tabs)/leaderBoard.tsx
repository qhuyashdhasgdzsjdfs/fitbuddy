// app/(tabs)/leaderboard.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { usePedometer } from "@/hooks/usePedometer";
import {
    fetchLeaderboard,
    LeaderboardEntry,
} from "@/services/leaderboardService";

// ─── Medal ────────────────────────────────────────────────────────────────────

function getMedal(rank: number) {
  if (rank === 1) return { icon: "🥇", color: "#F59E0B" };
  if (rank === 2) return { icon: "🥈", color: "#9CA3AF" };
  if (rank === 3) return { icon: "🥉", color: "#B45309" };
  return null;
}

// ─── Podium ───────────────────────────────────────────────────────────────────

function Podium({ top3 }: { top3: (LeaderboardEntry & { isMe: boolean })[] }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = [80, 110, 60];
  const ranks = [2, 1, 3];

  return (
    <View style={pod.container}>
      {order.map((entry, i) => {
        const rank = ranks[i];
        const medal = getMedal(rank);
        const color =
          rank === 1 ? "#22C55E" : rank === 2 ? "#60A5FA" : "#FCD34D";

        return (
          <View key={entry.userId} style={pod.col}>
            <Text style={pod.avatar}>{entry.avatar}</Text>
            {entry.isMe && <Text style={pod.meTag}>Bạn</Text>}
            <Text style={pod.name} numberOfLines={1}>
              {entry.displayName}
            </Text>
            <Text style={pod.steps}>{entry.steps.toLocaleString()}</Text>
            <View
              style={[pod.bar, { height: heights[i], backgroundColor: color }]}
            >
              <Text style={pod.medal}>{medal?.icon}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const pod = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  col: { flex: 1, alignItems: "center" },
  avatar: { fontSize: 28, marginBottom: 4 },
  meTag: {
    fontSize: 9,
    backgroundColor: "#22C55E",
    color: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginBottom: 2,
    fontWeight: "700",
  },
  name: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
    textAlign: "center",
  },
  steps: { fontSize: 10, color: "#6B7280", marginBottom: 4 },
  bar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 8,
  },
  medal: { fontSize: 20 },
});

// ─── Row ──────────────────────────────────────────────────────────────────────

function LeaderRow({
  entry,
  rank,
  maxSteps,
  isMe,
}: {
  entry: LeaderboardEntry;
  rank: number;
  maxSteps: number;
  isMe: boolean;
}) {
  const medal = getMedal(rank);
  const barWidth = (entry.steps / maxSteps) * 100;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350 + rank * 50,
      useNativeDriver: false,
    }).start();
  }, [entry.steps]);

  return (
    <View
      style={[
        row.wrap,
        isMe && row.meWrap,
        { backgroundColor: isMe ? "#F0FDF4" : "#fff" },
      ]}
    >
      <View style={row.rankWrap}>
        {medal ? (
          <Text style={{ fontSize: 20 }}>{medal.icon}</Text>
        ) : (
          <Text style={row.rank}>{rank}</Text>
        )}
      </View>

      <Text style={row.avatar}>{entry.avatar}</Text>

      <View style={row.info}>
        <View style={row.nameRow}>
          <Text
            style={[row.name, isMe && { color: "#15803D", fontWeight: "800" }]}
          >
            {entry.displayName}
          </Text>
          {isMe && (
            <View style={row.meTag}>
              <Text style={row.meTagText}>Bạn</Text>
            </View>
          )}
        </View>
        <View style={row.barBg}>
          <Animated.View
            style={[
              row.barFill,
              {
                width: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", `${barWidth}%`],
                }),
                backgroundColor: isMe
                  ? "#22C55E"
                  : rank <= 3
                    ? "#60A5FA"
                    : "#D1D5DB",
              },
            ]}
          />
        </View>
      </View>

      <Text style={[row.steps, isMe && { color: "#15803D" }]}>
        {entry.steps.toLocaleString()}
        {"\n"}
        <Text style={row.stepsSub}>bước</Text>
      </Text>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  meWrap: { borderColor: "#86EFAC", borderWidth: 1.5 },
  rankWrap: { width: 32, alignItems: "center" },
  rank: { fontSize: 14, fontWeight: "700", color: "#9CA3AF" },
  avatar: { fontSize: 24, marginHorizontal: 10 },
  info: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  name: { fontSize: 14, fontWeight: "600", color: "#111827" },
  meTag: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  meTagText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  barBg: {
    height: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  steps: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
    textAlign: "right",
    minWidth: 52,
  },
  stepsSub: { fontSize: 10, fontWeight: "400", color: "#9CA3AF" },
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const { steps } = usePedometer();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const myId = (() => {
    try {
      return getAuth(getApp()).currentUser?.uid ?? "";
    } catch {
      return "";
    }
  })();

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch (e) {
      console.error("fetchLeaderboard error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  // Merge: thay thế entry của user hiện tại bằng steps realtime
  const merged = useMemo(() => {
    const updated = entries.map((e) =>
      e.userId === myId ? { ...e, steps } : e,
    );
    // Nếu user chưa có entry hôm nay, thêm vào nếu đã có steps
    const hasMe = updated.some((e) => e.userId === myId);
    if (!hasMe && myId && steps > 0) {
      try {
        const user = getAuth(getApp()).currentUser;
        const name = user?.displayName ?? user?.email?.split("@")[0] ?? "Bạn";
        updated.push({
          userId: myId,
          displayName: name,
          avatar: "😊",
          steps,
          date: new Date().toISOString().split("T")[0],
          updatedAt: Date.now(),
        });
      } catch {}
    }
    return updated.sort((a, b) => b.steps - a.steps);
  }, [entries, steps, myId]);

  const myRank = merged.findIndex((e) => e.userId === myId) + 1;
  const maxSteps = merged[0]?.steps ?? 1;
  const top3 = merged.slice(0, 3);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={s.loadingText}>Đang tải bảng xếp hạng...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor="#22C55E"
        />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🏆 Bảng xếp hạng</Text>
        <Text style={s.subtitle}>Kéo xuống để làm mới • Hôm nay</Text>
      </View>

      {/* My rank */}
      {myRank > 0 && (
        <View style={s.myCard}>
          <View>
            <Text style={s.myLabel}>Thứ hạng của bạn</Text>
            <Text style={s.myRank}>
              #{myRank} / {merged.length}
            </Text>
          </View>
          <View style={s.myRight}>
            <Text style={s.mySteps}>{steps.toLocaleString()}</Text>
            <Text style={s.myStepsSub}>bước hôm nay</Text>
          </View>
        </View>
      )}

      {/* Empty state */}
      {merged.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>🏃</Text>
          <Text style={s.emptyTitle}>Chưa có dữ liệu hôm nay</Text>
          <Text style={s.emptyText}>
            Đi bộ và Lưu hoạt động để cập nhật trên bảng xếp hạng.
          </Text>
        </View>
      )}

      {/* Podium */}
      {top3.length >= 2 && (
        <View style={s.podiumCard}>
          <Text style={s.sectionTitle}>Top 3 🎖</Text>
          <Podium top3={top3.map((e) => ({ ...e, isMe: e.userId === myId }))} />
        </View>
      )}

      {/* List */}
      <View style={s.list}>
        {merged.map((entry, i) => (
          <LeaderRow
            key={entry.userId}
            entry={entry}
            rank={i + 1}
            maxSteps={maxSteps}
            isMe={entry.userId === myId}
          />
        ))}
      </View>

      {/* Note */}
      <View style={s.note}>
        <Ionicons name="information-circle-outline" size={13} color="#6B7280" />
        <Text style={s.noteText}>Nhấn Lưu hoạt động để cập nhật xếp hạng.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 13, color: "#6B7280" },

  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },

  myCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#22C55E",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  myLabel: { fontSize: 12, color: "#D1FAE5" },
  myRank: { fontSize: 26, fontWeight: "800", color: "#fff" },
  myRight: { alignItems: "flex-end" },
  mySteps: { fontSize: 22, fontWeight: "800", color: "#fff" },
  myStepsSub: { fontSize: 11, color: "#D1FAE5" },

  emptyBox: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  podiumCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  list: { marginBottom: 16 },

  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  noteText: { flex: 1, fontSize: 11, color: "#6B7280", lineHeight: 16 },
});
