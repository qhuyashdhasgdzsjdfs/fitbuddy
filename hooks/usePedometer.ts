// hooks/usePedometer.ts
// iOS + Expo Go: gọi watchStepCount trực tiếp như code gốc hoạt động
// baseline + watch = tổng bước cả ngày

import { Pedometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

const STRIDE_M = 0.762;
const KCAL_PER_STEP = 0.04;

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

  const baselineRef = useRef(0);
  const subRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    // ── Bước 1: subscribe ngay lập tức (không chờ async) ──────────────────────
    // Giống code gốc của bạn — iOS Core Motion hoạt động cách này
    subRef.current = Pedometer.watchStepCount((result) => {
      if (cancelled) return;
      // result.steps = số bước KỂ TỪ LÚC WATCH BẮT ĐẦU (tăng dần từ 0)
      setSteps(baselineRef.current + result.steps);
    });

    setStatus("watchStepCount đã bắt đầu");

    // ── Bước 2: load baseline ngầm (không block subscription) ─────────────────
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    Pedometer.getStepCountAsync(start, new Date())
      .then((result) => {
        if (cancelled) return;
        baselineRef.current = result.steps;
        setSteps(result.steps); // hiển thị ngay baseline
        setAvailable(true);
        setStatus("Đang theo dõi ✅");
        console.log("[Pedometer] baseline:", result.steps);
      })
      .catch((e) => {
        if (cancelled) return;
        // Baseline thất bại không sao — watch vẫn đếm từ 0
        console.warn("[Pedometer] baseline error:", e?.message);
        setStatus("Đang theo dõi (không có baseline)");
      });

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, []);

  return {
    steps,
    distanceKm: parseFloat(((steps * STRIDE_M) / 1000).toFixed(2)),
    calories: Math.round(steps * KCAL_PER_STEP),
    available,
    status,
    error,
  };
}
