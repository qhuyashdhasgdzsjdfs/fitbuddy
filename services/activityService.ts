// services/activityService.ts

import { Pedometer } from "expo-sensors";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityEntry {
  userId: string;
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  savedAt: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STRIDE_M = 0.762;
const KCAL_PER_STEP = 0.04;
const COLLECTION = "activities";

// ─── Calculation helpers ──────────────────────────────────────────────────────

export function calculateDistance(steps: number): number {
  return parseFloat(((steps * STRIDE_M) / 1000).toFixed(2));
}

export function calculateCalories(steps: number): number {
  return Math.round(steps * KCAL_PER_STEP);
}

// ─── Pedometer ────────────────────────────────────────────────────────────────

/**
 * Bắt đầu đếm bước realtime.
 * ✅ Trả về { remove } để dùng: const sub = startStepCounter(...); sub.remove()
 */
export function startStepCounter(
  onUpdate: (steps: number) => void,
  onError?: (err: string) => void,
): { remove: () => void } {
  let sub: { remove: () => void } | null = null;

  Pedometer.isAvailableAsync().then((available) => {
    if (!available) {
      onError?.("Thiết bị không hỗ trợ đếm bước chân.");
      return;
    }

    // Load bước từ đầu ngày hôm nay
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    Pedometer.getStepCountAsync(start, new Date())
      .then((r) => onUpdate(r.steps))
      .catch(() => {});

    // Watch realtime
    sub = Pedometer.watchStepCount((r) => onUpdate(r.steps));
  });

  return { remove: () => sub?.remove() };
}

// ─── Lazy DB ──────────────────────────────────────────────────────────────────

function getDb() {
  return getFirestore(getApp());
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Firestore — chỉ dùng 1 where, lọc trong JS ──────────────────────────────

export async function saveActivity(
  userId: string,
  steps: number,
  distanceKm: number,
  calories: number,
): Promise<void> {
  const db = getDb();
  const date = formatDate(new Date());

  await setDoc(doc(db, COLLECTION, `${userId}_${date}`), {
    userId,
    date,
    steps,
    distanceKm,
    calories,
    savedAt: Date.now(),
  } as ActivityEntry);
}

export async function getTodayActivity(
  userId: string,
): Promise<ActivityEntry | null> {
  const db = getDb();
  const date = formatDate(new Date());

  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId)),
  );

  const all = snap.docs.map((d) => d.data() as ActivityEntry);
  return all.find((e) => e.date === date) ?? null;
}

export async function getRecentActivities(
  userId: string,
  days = 7,
): Promise<ActivityEntry[]> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = formatDate(cutoff);

  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId)),
  );

  return snap.docs
    .map((d) => d.data() as ActivityEntry)
    .filter((e) => e.date >= cutoffDate)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLatestActivity(
  userId: string,
): Promise<ActivityEntry | null> {
  const db = getDb();

  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId)),
  );

  if (snap.empty) return null;
  return snap.docs
    .map((d) => d.data() as ActivityEntry)
    .sort((a, b) => b.savedAt - a.savedAt)[0];
}
