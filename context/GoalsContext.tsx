// context/GoalsContext.tsx
// ✅ Global goals state — thay đổi ở Profile → sync ngay toàn app

import {
  DEFAULT_GOALS,
  fetchGoals,
  persistGoals,
  UserGoals,
} from "@/hooks/useGoals";
import { getApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface GoalsCtx {
  goals: UserGoals;
  loading: boolean;
  updateGoal: (key: keyof UserGoals, value: number) => Promise<void>;
  reload: () => Promise<void>;
}

const GoalsContext = createContext<GoalsCtx>({
  goals: { ...DEFAULT_GOALS },
  loading: true,
  updateGoal: async () => {},
  reload: async () => {},
});

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<UserGoals>({ ...DEFAULT_GOALS });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const uid = getAuth(getApp()).currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      const g = await fetchGoals(uid);
      setGoals(g);
    } catch (e) {
      console.warn("GoalsContext reload:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load khi auth thay đổi (login/logout)
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(getApp()), (user) => {
      if (user) {
        reload();
      } else {
        setGoals({ ...DEFAULT_GOALS });
        setLoading(false);
      }
    });
    return unsub;
  }, [reload]);

  // Update 1 goal key → lưu Firestore → cập nhật state ngay lập tức
  const updateGoal = useCallback(
    async (key: keyof UserGoals, value: number) => {
      // Optimistic update — UI cập nhật ngay, không chờ server
      setGoals((prev) => ({ ...prev, [key]: value }));
      try {
        const uid = getAuth(getApp()).currentUser?.uid;
        if (uid) await persistGoals(uid, { [key]: value });
      } catch (e) {
        console.warn("GoalsContext updateGoal:", e);
        // Rollback nếu lỗi
        reload();
      }
    },
    [reload],
  );

  return (
    <GoalsContext.Provider value={{ goals, loading, updateGoal, reload }}>
      {children}
    </GoalsContext.Provider>
  );
}

// Hook dùng ở mọi screen thay thế useGoals()
export function useGoalsContext() {
  return useContext(GoalsContext);
}
