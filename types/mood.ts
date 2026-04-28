// types/mood.ts

export type MoodType = "Happy" | "Neutral" | "Stressed";

export type SessionType = "morning" | "evening";

export interface MoodEntry {
  id?: string;
  userId: string;
  mood: MoodType;
  session: SessionType;
  note?: string;
  timestamp: number; // Unix ms
  date: string; // "YYYY-MM-DD"
}

export interface DailyMoodRecord {
  date: string;
  morning?: MoodEntry;
  evening?: MoodEntry;
}
