// services/leaderboardService.ts

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

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar: string; // emoji
  steps: number;
  date: string; // "YYYY-MM-DD"
  updatedAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDb() {
  return getFirestore(getApp());
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const COLLECTION = "leaderboard";

// ─── Save / upsert ────────────────────────────────────────────────────────────

export async function saveLeaderboardEntry(
  userId: string,
  displayName: string,
  steps: number,
  avatar = "😊",
): Promise<void> {
  const db = getDb();
  const date = today();
  const docId = `${userId}_${date}`;

  const entry: LeaderboardEntry = {
    userId,
    displayName,
    avatar,
    steps,
    date,
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, COLLECTION, docId), entry);
}

// ─── Fetch today's leaderboard ────────────────────────────────────────────────
// Chỉ dùng 1 where để tránh composite index

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const db = getDb();
  const date = today();

  // Lấy tất cả entries, lọc date trong JS
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("date", "==", date)),
  );

  return snap.docs
    .map((d) => d.data() as LeaderboardEntry)
    .sort((a, b) => b.steps - a.steps);
}
