// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";

const TABS = [
  { name: "index",       title: "Trang chủ", icon: "home"                  },
  { name: "activity",    title: "Vận động",  icon: "walk-outline"           },
  { name: "water",       title: "Nước",      icon: "water-outline"          },
  { name: "mood",        title: "Tâm trạng", icon: "happy-outline"          },
  { name: "leaderboard", title: "Bảng xếp",  icon: "trophy-outline"         },
  { name: "profile",     title: "Hồ sơ",     icon: "person-circle-outline"  },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown       : false,
        tabBarActiveTintColor  : "#22C55E",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor  : "#FFFFFF",
          borderTopWidth   : 0,
          elevation        : 20,
          shadowColor      : "#000",
          shadowOffset     : { width: 0, height: -4 },
          shadowOpacity    : 0.08,
          shadowRadius     : 16,
          height           : Platform.OS === "ios" ? 84 : 64,
          paddingBottom    : Platform.OS === "ios" ? 28 : 8,
          paddingTop       : 8,
        },
        tabBarLabelStyle: {
          fontSize    : 10,
          fontWeight  : "600",
          marginTop   : -2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title      : tab.title,
            tabBarIcon : ({ color, size }) => (
              <Ionicons name={tab.icon as any} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}