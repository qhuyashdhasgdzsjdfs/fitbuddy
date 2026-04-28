// services/goalService.ts

import { getApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserGoals {
  steps: number; // bước chân / ngày
  waterGlasses: number; // ly nước / ngày
  calories: number; // kcal tiêu thụ / ngày
  sleepHours: number; // giờ ngủ / ngày
  updatedAt: number;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_GOALS: UserGoals = {
  steps: 10000,
  waterGlasses: 8,
  calories: 500,
  sleepHours: 8,
  updatedAt: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDb() {
  return getFirestore(getApp());
}

const COLLECTION = "user_goals";

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveGoals(
  userId: string,
  goals: Partial<UserGoals>,
): Promise<void> {
  await setDoc(
    doc(getDb(), COLLECTION, userId),
    { ...goals, updatedAt: Date.now() },
    { merge: true },
  );
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadGoals(userId: string): Promise<UserGoals> {
  const snap = await getDoc(doc(getDb(), COLLECTION, userId));
  if (!snap.exists()) return { ...DEFAULT_GOALS };
  return { ...DEFAULT_GOALS, ...snap.data() } as UserGoals;
}
