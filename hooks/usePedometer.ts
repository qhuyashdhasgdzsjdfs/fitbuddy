// hooks/usePedometer.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pedometer } from "expo-sensors";
import { getApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

const STRIDE_M = 0.762;
const KCAL_PER_STEP = 0.04;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export interface PedometerData {
  steps: number;
  distanceKm: number;
  calories: number;
  available: boolean;
  status: string;
  error: string | null;
}

export function usePedometer(): PedometerData {
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState(true);
  const [status, setStatus] = useState("Đang khởi động...");
  const [error, setError] = useState<string | null>(null);

  // 1. TẠO STATE LẮNG NGHE SỰ THAY ĐỔI CỦA USER ID
  const [userId, setUserId] = useState(() => {
    return getAuth(getApp()).currentUser?.uid || "guest";
  });

  useEffect(() => {
    const auth = getAuth(getApp());
    const unsub = onAuthStateChanged(auth, (user) => {
      // Mỗi khi đăng nhập/đăng xuất, biến userId sẽ tự động cập nhật
      setUserId(user?.uid || "guest");
    });
    return unsub;
  }, []);

  const userBaselineRef = useRef(0);
  const watchedStepsRef = useRef(0);
  const subRef = useRef<{ remove: () => void } | null>(null);

  // 2. THUẬT TOÁN ĐẾM BƯỚC SẼ TỰ ĐỘNG CHẠY LẠI TỪ ĐẦU KHI `userId` THAY ĐỔI
  useEffect(() => {
    let cancelled = false;

    // Reset lại toàn bộ bộ đếm trên UI khi bắt đầu với user mới
    userBaselineRef.current = 0;
    watchedStepsRef.current = 0;
    setSteps(0);

    // ── Bước 1: Subscribe ngay lập tức ──────────────────────
    subRef.current = Pedometer.watchStepCount((result) => {
      if (cancelled) return;
      watchedStepsRef.current = result.steps;
      setSteps(userBaselineRef.current + watchedStepsRef.current);
    });

    setStatus("watchStepCount đã bắt đầu");

    // ── Bước 2: Load ngầm Baseline (Offset) cho từng User ─────────────────
    async function loadUserBaseline() {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      let deviceStepsToday = 0;
      try {
        const result = await Pedometer.getStepCountAsync(start, new Date());
        deviceStepsToday = result.steps;
      } catch (e: any) {
        if (!cancelled) {
          console.warn("[Pedometer] baseline error:", e?.message);
          setStatus("Đang theo dõi (không có baseline máy)");
        }
      }

      if (cancelled) return;

      // Xử lý "Điểm neo" theo ID người dùng
      const offsetKey = `pedometer_offset_${userId}_${todayStr()}`;
      const storedOffset = await AsyncStorage.getItem(offsetKey);
      let offset = 0;

      if (storedOffset === null) {
        // User mới tinh: Ghi nhận số bước máy đang có làm điểm 0
        offset = deviceStepsToday;
        await AsyncStorage.setItem(offsetKey, offset.toString());
      } else {
        // Lấy lại điểm neo cũ đã lưu
        offset = parseInt(storedOffset, 10);
      }

      // Công thức: Bước hiển thị = Tổng máy - Điểm neo
      userBaselineRef.current = Math.max(0, deviceStepsToday - offset);

      // Cập nhật lên UI
      setSteps(userBaselineRef.current + watchedStepsRef.current);
      setAvailable(true);
      setStatus("Đang theo dõi ✅");
    }

    loadUserBaseline();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [userId]); // 👈 Điểm mấu chốt: Lắng nghe sự thay đổi của userId ở đây

  return {
    steps,
    distanceKm: parseFloat(((steps * STRIDE_M) / 1000).toFixed(2)),
    calories: Math.round(steps * KCAL_PER_STEP),
    available,
    status,
    error,
  };
}
