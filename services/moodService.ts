// services/moodService.ts

import {
  DailyMoodRecord,
  MoodEntry,
  MoodType,
  SessionType,
} from "@/types/mood";
import { getApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";

// ✅ Lazy: không import db từ firebase.ts nữa
// Gọi getFirestore(getApp()) bên trong function để tránh circular dependency
function getDb() {
  return getFirestore(getApp());
}

const COLLECTION = "moods";

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getCurrentSession(): SessionType {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 12 ? "morning" : "evening";
}

export async function saveMood(
  userId: string,
  mood: MoodType,
  session: SessionType,
  note?: string,
): Promise<void> {
  const db = getDb();
  const date = formatDate(new Date());
  const docId = `${userId}_${date}_${session}`;

  const entry: MoodEntry = {
    userId,
    mood,
    session,
    note: note ?? "",
    timestamp: Date.now(),
    date,
  };

  await setDoc(doc(db, COLLECTION, docId), entry);
}

export async function getTodayMoods(userId: string): Promise<DailyMoodRecord> {
  const db = getDb();
  const date = formatDate(new Date());

  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    where("date", "==", date),
  );

  const snapshot = await getDocs(q);
  const record: DailyMoodRecord = { date };

  snapshot.forEach((d) => {
    const entry = d.data() as MoodEntry;
    if (entry.session === "morning") record.morning = entry;
    if (entry.session === "evening") record.evening = entry;
  });

  return record;
}

/**
 * Fetch the single most recent mood entry for a user.
 */
export async function getLatestMood(userId: string): Promise<MoodEntry | null> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as MoodEntry;
}

export async function getRecentMoods(
  userId: string,
  days = 7,
): Promise<MoodEntry[]> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = formatDate(cutoff);

  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    where("date", ">=", cutoffDate),
    orderBy("date", "desc"),
    orderBy("timestamp", "desc"),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as MoodEntry);
}
