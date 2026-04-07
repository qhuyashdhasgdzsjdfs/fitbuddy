import AsyncStorage from "@react-native-async-storage/async-storage";

const MOOD_KEY = "MOOD_DATA";

export type MoodType = "Happy" | "Neutral" | "Stressed";

export interface MoodItem {
  mood: MoodType;
  date: string;
}

// Lưu mood
export const saveMood = async (mood: MoodType): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(MOOD_KEY);
    const moods: MoodItem[] = existing ? JSON.parse(existing) : [];

    const newMood: MoodItem = {
      mood,
      date: new Date().toISOString(),
    };

    moods.push(newMood);

    await AsyncStorage.setItem(MOOD_KEY, JSON.stringify(moods));
  } catch (error) {
    console.log("Error saving mood:", error);
  }
};

// Lấy mood
export const getMoods = async (): Promise<MoodItem[]> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log(error);
    return [];
  }
};
