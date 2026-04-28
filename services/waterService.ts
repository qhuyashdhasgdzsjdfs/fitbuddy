// services/waterService.ts

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

export interface WaterLog {
  userId   : string;
  date     : string;   // "YYYY-MM-DD"
  glasses  : number;   // số ly (1 ly = 250ml)
  ml       : number;   // tổng ml
  updatedAt: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const ML_PER_GLASS  = 250;
export const DAILY_GOAL_ML = 2000; // 8 ly / ngày
export const DAILY_GOAL_GLASSES = DAILY_GOAL_ML / ML_PER_GLASS; // 8

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDb() {
  return getFirestore(getApp());
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const COLLECTION = "water_logs";

// ─── Save ────────────────────────────────────────────────────────────────────

export async function saveWaterLog(
  userId : string,
  glasses: number
): Promise<void> {
  const db    = getDb();
  const date  = today();
  const docId = `${userId}_${date}`;

  const log: WaterLog = {
    userId,
    date,
    glasses,
    ml       : glasses * ML_PER_GLASS,
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, COLLECTION, docId), log);
}

// ─── Fetch today ──────────────────────────────────────────────────────────────

export async function getTodayWater(userId: string): Promise<WaterLog | null> {
  const db   = getDb();
  const date = today();

  // ✅ 1 where duy nhất — tránh composite index
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );

  const all = snap.docs.map((d) => d.data() as WaterLog);
  return all.find((e) => e.date === date) ?? null;
}

// ─── Fetch recent 7 days ──────────────────────────────────────────────────────

export async function getRecentWater(
  userId: string,
  days = 7
): Promise<WaterLog[]> {
  const db     = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );

  return snap.docs
    .map((d) => d.data() as WaterLog)
    .filter((e) => e.date >= cutoffDate)
    .sort((a, b) => b.date.localeCompare(a.date));
}