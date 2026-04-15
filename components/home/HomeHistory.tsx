import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useUserStore } from '@/store/useStore';
import { getRepSenseScore } from '@/constants/health';
import { getDailyStatsByDate } from '@/db';

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface HistoryTile {
  id: string;
  day: string;  // e.g. "Wed"
  date: string; // e.g. "15"
  score: number;
}

export default function HomeHistory() {
  const [history, setHistory] = useState<HistoryTile[]>([]);
  const todayCalories = useUserStore((s) => s.calories);
  const todayActiveTime = useUserStore((s) => s.activeTimeSeconds);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadHistory = async () => {
        const tiles: HistoryTile[] = [];
        const today = new Date();

        // Load 4 past days + today
        for (let i = 4; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = toDateString(d);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dateNum = d.getDate().toString();

          let cal = 0;
          let time = 0;

          if (i === 0) {
            // Today: use live MMKV store
            cal = todayCalories;
            time = todayActiveTime;
          } else {
            // Past days: query SQLite
            const stats = await getDailyStatsByDate(dStr);
            if (stats) {
              cal = stats.calories;
              time = stats.active_time_seconds;
            }
          }

          tiles.push({
            id: dStr,
            day: dayName,
            date: dateNum,
            score: getRepSenseScore(cal, time)
          });
        }

        if (isActive) setHistory(tiles);
      };

      loadHistory();
      return () => { isActive = false; };
    }, [todayCalories, todayActiveTime])
  );

  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Daily workout history</Text>
        <Text style={styles.historyMini}>Score</Text>
      </View>
      <View style={styles.historyDaysRow}>
        {history.map((item) => (
          <View key={item.id} style={styles.historyDayTile}>
            <Text style={styles.historyDayText}>{item.day}</Text>
            <Text style={styles.historyDateText}>{item.date}</Text>
            <Text style={styles.historySubText}>{item.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  historyTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  historyMini: {
    color: "#28bbce",
    fontSize: 13,
    fontWeight: "600",
  },
  historyDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyDayTile: {
    backgroundColor: "#18242a",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  historyDayText: {
    color: "#768490",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  historyDateText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  historySubText: {
    color: "#73e5a5",
    fontSize: 14,
    fontWeight: "700",
  },
});
