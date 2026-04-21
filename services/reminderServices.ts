// services/reminderService.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// ─── Config ───────────────────────────────────────────────────────────────────

export type ReminderType = "water" | "eye";

interface ReminderConfig {
  id: string; // identifier cho notification channel
  title: string;
  body: string;
  intervalSec: number;
  icon: string;
}

export const REMINDERS: Record<ReminderType, ReminderConfig> = {
  water: {
    id: "water_reminder",
    title: "💧 Uống nước nào!",
    body: "Đã 2 tiếng rồi — uống 1 ly nước để giữ sức khoẻ nhé.",
    intervalSec: 2 * 60 * 60, // 2 giờ
    icon: "💧",
  },
  eye: {
    id: "eye_reminder",
    title: "👁 Nghỉ mắt đi bạn!",
    body: "30 phút nhìn màn hình rồi — nhìn xa 20 giây để mắt thư giãn.",
    intervalSec: 30 * 60, // 30 phút
    icon: "👁",
  },
};

const STORAGE_KEY = "reminder_settings";

// ─── Notification handler (gọi 1 lần ở app root nếu muốn) ────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleReminder(type: ReminderType): Promise<void> {
  const config = REMINDERS[type];

  // Hủy reminder cũ trước khi tạo mới (tránh duplicate)
  await cancelReminder(type);

  await Notifications.scheduleNotificationAsync({
    identifier: config.id,
    content: {
      title: config.title,
      body: config.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: config.intervalSec,
      repeats: true,
    },
  });

  await saveState(type, true);
}

export async function cancelReminder(type: ReminderType): Promise<void> {
  const config = REMINDERS[type];
  await Notifications.cancelScheduledNotificationAsync(config.id);
  await saveState(type, false);
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export async function toggleReminder(
  type: ReminderType,
  enabled: boolean,
): Promise<void> {
  if (enabled) {
    await scheduleReminder(type);
  } else {
    await cancelReminder(type);
  }
}

// ─── Persist state ────────────────────────────────────────────────────────────

async function saveState(type: ReminderType, enabled: boolean): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, [type]: enabled }),
    );
  } catch (e) {
    console.warn("reminderService saveState error:", e);
  }
}

export async function loadReminderStates(): Promise<
  Record<ReminderType, boolean>
> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      water: data.water ?? false,
      eye: data.eye ?? false,
    };
  } catch {
    return { water: false, eye: false };
  }
}

// ─── Get next trigger time (để hiển thị "lần tới lúc...") ───────────────────

export async function getNextTrigger(type: ReminderType): Promise<Date | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const found = scheduled.find((n) => n.identifier === REMINDERS[type].id);
  if (!found) return null;

  const trigger = found.trigger as any;
  if (trigger?.seconds) {
    return new Date(Date.now() + trigger.seconds * 1000);
  }
  return null;
}
