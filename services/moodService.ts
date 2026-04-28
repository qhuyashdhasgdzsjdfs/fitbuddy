// services/moodService.ts

import { getApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { MoodEntry, MoodType, SessionType, DailyMoodRecord } from "@/types/mood";

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
  note?: string
): Promise<void> {
  const db    = getDb();
  const date  = formatDate(new Date());
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
  const db   = getDb();
  const date = formatDate(new Date());

  // ✅ 1 where duy nhất, lọc date trong JS
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );

  const record: DailyMoodRecord = { date };
  snap.forEach((d) => {
    const entry = d.data() as MoodEntry;
    if (entry.date === date) {
      if (entry.session === "morning") record.morning = entry;
      if (entry.session === "evening") record.evening = entry;
    }
  });

  return record;
}

// ✅ Không dùng orderBy — sort trong JS để tránh composite index
export async function getLatestMood(userId: string): Promise<MoodEntry | null> {
  const db = getDb();

  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );

  if (snap.empty) return null;

  // Sort theo timestamp giảm dần trong JS
  const entries = snap.docs
    .map((d) => d.data() as MoodEntry)
    .sort((a, b) => b.timestamp - a.timestamp);

  return entries[0];
}

export async function getRecentMoods(
  userId: string,
  days = 7
): Promise<MoodEntry[]> {
  const db     = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = formatDate(cutoff);

  // ✅ 1 where duy nhất, lọc và sort trong JS
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );

  return snap.docs
    .map((d) => d.data() as MoodEntry)
    .filter((e) => e.date >= cutoffDate)
    .sort((a, b) => b.timestamp - a.timestamp);
}