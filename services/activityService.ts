import { Accelerometer } from "expo-sensors";

let steps = 0;

export const startStepCounter = (onUpdate: (steps: number) => void) => {
  Accelerometer.setUpdateInterval(500);

  const subscription = Accelerometer.addListener((data) => {
    const magnitude = Math.sqrt(
      data.x * data.x + data.y * data.y + data.z * data.z,
    );

    if (magnitude > 1.2) {
      steps++;
      onUpdate(steps);
    }
  });

  return subscription;
};

export const calculateCalories = (steps: number) => {
  return steps * 0.04;
};
