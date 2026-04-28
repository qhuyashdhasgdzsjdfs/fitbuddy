// components/mood/StressedSuggestions.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Suggestion {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: "leaf-outline",
    title: "Hít thở sâu",
    description: "Thực hành 4-7-8: hít vào 4 giây, giữ 7 giây, thở ra 8 giây.",
    color: "#22C55E",
  },
  {
    icon: "walk-outline",
    title: "Đi bộ nhẹ",
    description: "Chỉ cần 10 phút đi bộ ngoài trời giúp giảm cortisol đáng kể.",
    color: "#3B82F6",
  },
  {
    icon: "musical-notes-outline",
    title: "Nghe nhạc thư giãn",
    description:
      "Âm nhạc nhịp chậm (~60 BPM) giúp não bộ bình tĩnh lại nhanh chóng.",
    color: "#A855F7",
  },
  {
    icon: "journal-outline",
    title: "Viết ra cảm xúc",
    description:
      "Ghi lại 3 điều bạn đang lo lắng — xem lại và đánh giá mức độ thực tế.",
    color: "#F59E0B",
  },
  {
    icon: "water-outline",
    title: "Uống nước",
    description:
      "Mất nước làm tăng cảm giác lo âu. Uống 1 ly nước ngay bây giờ.",
    color: "#06B6D4",
  },
];

interface Props {
  onDismiss?: () => void;
}

export default function StressedSuggestions({ onDismiss }: Props) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>💛</Text>
          <View>
            <Text style={styles.headerTitle}>Bạn đang căng thẳng?</Text>
            <Text style={styles.headerSubtitle}>
              Thử một trong các gợi ý dưới đây
            </Text>
          </View>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestion cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SUGGESTIONS.map((s, idx) => (
          <View key={idx} style={styles.card}>
            <View
              style={[styles.iconWrap, { backgroundColor: s.color + "20" }]}
            >
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardDesc}>{s.description}</Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#B45309",
    marginTop: 2,
  },
  dismissBtn: {
    padding: 4,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    width: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 16,
  },
});
