import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useStore';

/** Converts total seconds → "HH:MM:SS" string */
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function HomeTopTiles() {
  const calories = useUserStore((s) => s.calories);
  const activeTimeSeconds = useUserStore((s) => s.activeTimeSeconds);

  return (
    <View style={styles.topTilesContainer}>
      <View style={[styles.tile, styles.caloriesTile]}>
        <Text style={styles.tileTitle}>Calories Burned</Text>
        <View style={styles.circleContainer}>
          <View style={styles.progressRing}>
            <View style={styles.progressInner}>
              <Text style={styles.calorieValue}>{calories}</Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.rightTiles}>
        <View style={[styles.tile, styles.smallTile, { marginBottom: 16 }]}>
          <Ionicons name="timer-outline" size={36} color="#6ae094" />
          <Text style={styles.smallTileText}>Active Time</Text>
        </View>
        <View style={[styles.tile, styles.smallTile, styles.durationTile]}>
          <Text style={styles.durationText}>{formatTime(activeTimeSeconds)}</Text>
          <View style={styles.durationIconWrapper}>
            <Ionicons name="barbell" size={16} color="#1b242a" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topTilesContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tile: {
    backgroundColor: "#18242a",
    borderRadius: 18,
    padding: 16,
  },
  caloriesTile: {
    flex: 1.1,
    marginRight: 16,
    alignItems: "center",
  },
  tileTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 20,
  },
  circleContainer: {
    marginVertical: 4,
    marginBottom: 10,
  },
  progressRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: "#73e5a5",
    borderLeftColor: "#16b4cc",
    borderBottomColor: "#16b4cc",
    borderRightColor: "#16b4cc",
    transform: [{ rotate: "-45deg" }],
    justifyContent: "center",
    alignItems: "center",
  },
  progressInner: {
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
  },
  calorieValue: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
  },
  calorieUnit: {
    color: "#768490",
    fontSize: 14,
    marginTop: -4,
  },
  rightTiles: {
    flex: 0.9,
  },
  smallTile: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  smallTileText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  durationTile: {
    paddingVertical: 20,
  },
  durationText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  durationIconWrapper: {
    backgroundColor: "#73e5a5",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
