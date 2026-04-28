// hooks/useGoals.ts
// ✅ Self-contained: toàn bộ Firestore logic nằm trong file này
// KHÔNG import từ goalService để tránh lỗi resolve

import { useEffect, useState } from "react";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

// ─── Types & Defaults ─────────────────────────────────────────────────────────

export interface UserGoals {
  steps       : number;
  waterGlasses: number;
  calories    : number;
  sleepHours  : number;
}

export const DEFAULT_GOALS: UserGoals = {
  steps       : 10000,
  waterGlasses: 8,
  calories    : 500,
  sleepHours  : 8,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDb() { return getFirestore(getApp()); }

export async function fetchGoals(userId: string): Promise<UserGoals> {
  try {
    const snap = await getDoc(doc(getDb(), "user_goals", userId));
    if (!snap.exists()) return { ...DEFAULT_GOALS };
    return { ...DEFAULT_GOALS, ...snap.data() } as UserGoals;
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

export async function persistGoals(userId: string, goals: Partial<UserGoals>): Promise<void> {
  await setDoc(doc(getDb(), "user_goals", userId), { ...goals, updatedAt: Date.now() }, { merge: true });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGoals(): {
  goals  : UserGoals;
  loading: boolean;
  reload : () => Promise<void>;
} {
  const [goals,   setGoals]   = useState<UserGoals>({ ...DEFAULT_GOALS });
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const uid = getAuth(getApp()).currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      const g = await fetchGoals(uid);
      setGoals(g);
    } catch (e) {
      console.warn("useGoals:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  return { goals, loading, reload };
}