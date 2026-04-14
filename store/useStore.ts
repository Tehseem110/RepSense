import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Create an MMKV instance
export const storage = new MMKV();

// Wrap MMKV with Zustand's StateStorage interface
const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    try {
      return storage.set(name, value);
    } catch (error) {
      console.error('MMKV setItem error:', error);
    }
  },
  getItem: (name) => {
    try {
      const value = storage.getString(name);
      return value ?? null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  },
  removeItem: (name) => {
    try {
      return storage.delete(name);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
    }
  },
};

interface UserState {
  hasOnboarded: boolean;
  username: string | null;
  weightKg: number | null;
  theme: 'light' | 'dark' | 'system';
  // Activity tracking
  calories: number;
  activeTimeSeconds: number;
  // Daily goals
  calorieGoal: number;
  activeTimeGoalSeconds: number;
  setOnboarded: (value: boolean) => void;
  setUsername: (name: string) => void;
  setWeightKg: (weight: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCalories: (calories: number) => void;
  setActiveTimeSeconds: (seconds: number) => void;
  setCalorieGoal: (goal: number) => void;
  setActiveTimeGoalSeconds: (seconds: number) => void;
}

// User setup & settings uses MMKV for extremely fast access & persistence
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      username: null,
      weightKg: null,
      theme: 'dark',
      calories: 0,
      activeTimeSeconds: 0,
      calorieGoal: 500,
      activeTimeGoalSeconds: 3600,
      setOnboarded: (value) => set({ hasOnboarded: value }),
      setUsername: (name) => set({ username: name }),
      setWeightKg: (weight) => set({ weightKg: weight }),
      setTheme: (theme) => set({ theme }),
      setCalories: (calories) => set({ calories }),
      setActiveTimeSeconds: (activeTimeSeconds) => set({ activeTimeSeconds }),
      setCalorieGoal: (calorieGoal) => set({ calorieGoal }),
      setActiveTimeGoalSeconds: (activeTimeGoalSeconds) => set({ activeTimeGoalSeconds }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
