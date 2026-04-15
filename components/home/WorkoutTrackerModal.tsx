import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "@/store/useStore";
import { useWorkoutTracker } from "@/hooks/useWorkoutTracker";
import { upsertDailyStats } from "@/db";
import { useKeepAwake } from "expo-keep-awake";

// ─── Helper ──────────────────────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// MET zone visual bar levels
const ZONE_LEVELS = [
  { label: "Resting", bars: 1 },
  { label: "Light", bars: 2 },
  { label: "Walking", bars: 3 },
  { label: "Jogging", bars: 4 },
  { label: "Running", bars: 5 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function WorkoutTrackerModal({ visible, onClose }: Props) {
  const weightKg = useUserStore((s) => s.weightKg) ?? 70; // fallback 70kg
  const setStoreCalories = useUserStore((s) => s.setCalories);
  const setStoreActiveTime = useUserStore((s) => s.setActiveTimeSeconds);
  const storeCalories = useUserStore((s) => s.calories);
  const storeActiveTime = useUserStore((s) => s.activeTimeSeconds);

  const tracker = useWorkoutTracker(weightKg);

  // Keep screen on while modal is open / workout is active
  useKeepAwake();

  // ── Pulse animation for active indicator ────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (tracker.status === "running") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [tracker.status]);

  // ── Reset when modal closes ──────────────────────────────────────────────
  const handleClose = () => {
    if (tracker.status !== "idle") {
      Alert.alert(
        "Workout in progress",
        "Stop and save your workout before closing?",
        [
          { text: "Keep going", style: "cancel" },
          {
            text: "Stop & Save",
            onPress: async () => {
              await saveWorkout();
              tracker.reset();
              onClose();
            },
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              tracker.reset();
              onClose();
            },
          },
        ],
      );
    } else {
      tracker.reset();
      onClose();
    }
  };

  // ── Save workout to SQLite + MMKV store ──────────────────────────────────
  const saveWorkout = async () => {
    const finalSnapshot = tracker.stop();
    const newCalories = Math.floor(finalSnapshot.caloriesBurned);
    // activeSeconds = only non-resting time (what gets added to daily total)
    const newActiveTime = finalSnapshot.activeSeconds;

    // Always ADD on top of the current MMKV values — they are the live
    // source of truth shown on the Home screen (avoids SQLite/MMKV drift).
    const totalCalories = storeCalories + newCalories;
    const totalActiveTime = storeActiveTime + newActiveTime;

    // Persist the new cumulative total to SQLite (for historical access)
    const todayStr = toDateString(new Date());
    await upsertDailyStats({
      date: todayStr,
      calories: totalCalories,
      active_time_seconds: totalActiveTime,
    });

    // Update MMKV store → Home screen tiles & activity meter update live
    setStoreCalories(totalCalories);
    setStoreActiveTime(totalActiveTime);

    return {
      newCalories,
      newActiveTime: finalSnapshot.activeSeconds,
      totalCalories,
      totalActiveTime,
    };
  };

  // ── Stop & save handler ──────────────────────────────────────────
  const handleStopAndSave = async () => {
    if (tracker.totalSeconds < 3) {
      Alert.alert("Too short", "Workout must be at least 3 seconds to save.");
      return;
    }
    const { newCalories, newActiveTime, totalCalories, totalActiveTime } =
      await saveWorkout();

    Alert.alert(
      "🎉 Workout Saved!",
      `+${newCalories} kcal  •  +${formatTime(newActiveTime)} active time\n\nToday's total: ${totalCalories} kcal  •  ${formatTime(totalActiveTime)}`,
      [
        {
          text: "Done",
          onPress: () => {
            tracker.reset();
            onClose();
          },
        },
      ],
    );
  };

  // ── Zone bars meter ──────────────────────────────────────────────────────
  const activeBars =
    ZONE_LEVELS.find((z) => z.label === tracker.currentZone.label)?.bars ?? 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        bounces={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Workout Tracker</Text>
            <Text style={styles.headerSub}>
              Calories from movement via sensors
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color="#768490" />
          </TouchableOpacity>
        </View>

        {/* ── Weight note ── */}
        <View style={styles.weightBanner}>
          <Ionicons name="person-outline" size={14} color="#73e5a5" />
          <Text style={styles.weightBannerText}>
            Using {weightKg} kg body weight for calorie calculation
          </Text>
        </View>

        {/* ── Live Calorie Ring ── */}
        <View style={styles.ringSection}>
          {/* Total time — outside the ring, above it */}
          <View style={styles.totalTimeRow}>
            <Ionicons name="stopwatch-outline" size={16} color="#768490" />
            <Text style={styles.totalTimeText}>
              {formatTime(tracker.totalSeconds)}
            </Text>
            <Text style={styles.totalTimeLabel}>total time</Text>
          </View>

          {/* Ring — kcal + active time only */}
          <Animated.View
            style={[
              styles.outerRing,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: tracker.currentZone.color,
              },
            ]}
          >
            <View style={styles.innerRing}>
              <Ionicons
                name="flame"
                size={28}
                color={tracker.currentZone.color}
              />
              <Text style={styles.calorieCount}>
                {Math.floor(tracker.caloriesBurned)}
              </Text>
              <Text style={styles.calorieUnit}>kcal burned</Text>
              {/* Active time — only non-resting seconds */}
              <View style={styles.activeTimeRow}>
                <Ionicons name="timer-outline" size={13} color="#73e5a5" />
                <Text style={styles.activeTimeText}>
                  {formatTime(tracker.activeSeconds)}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Controls ── */}
        <View style={styles.controls}>
          {tracker.status === "idle" && (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={tracker.start}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={22} color="#0c1316" />
              <Text style={styles.startBtnText}>Start Tracking</Text>
            </TouchableOpacity>
          )}

          {tracker.status === "running" && (
            <View style={styles.activeControls}>
              <TouchableOpacity
                style={styles.pauseBtn}
                onPress={tracker.pause}
                activeOpacity={0.8}
              >
                <Ionicons name="pause" size={22} color="#ffffff" />
                <Text style={styles.pauseBtnText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleStopAndSave}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={22} color="#0c1316" />
                <Text style={styles.saveBtnText}>Stop & Save</Text>
              </TouchableOpacity>
            </View>
          )}

          {tracker.status === "paused" && (
            <View style={styles.activeControls}>
              <TouchableOpacity
                style={styles.resumeBtn}
                onPress={tracker.resume}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={22} color="#0c1316" />
                <Text style={styles.resumeBtnText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleStopAndSave}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={22} color="#0c1316" />
                <Text style={styles.saveBtnText}>Stop & Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Zone Indicator ── */}
        <View style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <View
              style={[
                styles.zoneDot,
                { backgroundColor: tracker.currentZone.color },
              ]}
            />
            <Text
              style={[styles.zoneLabel, { color: tracker.currentZone.color }]}
            >
              {tracker.currentZone.label}
            </Text>
            <Text style={styles.zoneMet}>
              MET {tracker.currentZone.met.toFixed(1)}
            </Text>
          </View>

          {/* Activity bar meter */}
          <View style={styles.barMeter}>
            {[1, 2, 3, 4, 5].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.barSegment,
                  {
                    backgroundColor:
                      bar <= activeBars ? tracker.currentZone.color : "#2a3d47",
                    height: 8 + bar * 6,
                  },
                ]}
              />
            ))}
          </View>

          <Text style={styles.zoneHint}>
            Move more to increase intensity zone
          </Text>
        </View>

        {/* ── MET Reference Table ── */}
        <View style={styles.metTable}>
          <Text style={styles.metTableTitle}>Activity Zones</Text>
          {[
            { label: "Resting", met: 1.0, color: "#768490" },
            { label: "Light", met: 2.5, color: "#73e5a5" },
            { label: "Walking", met: 4.0, color: "#6ae094" },
            { label: "Jogging", met: 7.0, color: "#f1c40f" },
            { label: "Running", met: 10.0, color: "#ff9f43" },
          ].map((zone) => (
            <View
              key={zone.label}
              style={[
                styles.metRow,
                tracker.currentZone.label === zone.label && styles.metRowActive,
              ]}
            >
              <View style={[styles.metDot, { backgroundColor: zone.color }]} />
              <Text style={styles.metName}>{zone.label}</Text>
              <Text style={styles.metValue}>MET {zone.met}</Text>
              <Text style={styles.metCalc}>
                ≈ {((zone.met * weightKg) / 60).toFixed(1)} kcal/min
              </Text>
            </View>
          ))}
        </View>

        {/* ── Formula note ── */}
        <View style={styles.formulaBox}>
          <Text style={styles.formulaTitle}>📐 Formula Used</Text>
          <Text style={styles.formulaText}>
            Calories = MET × Weight(kg) × Time(hours){"\n"}
            Movement intensity → MET via accelerometer delta
          </Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c1316",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  headerSub: {
    color: "#768490",
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#18242a",
    justifyContent: "center",
    alignItems: "center",
  },

  // Weight banner
  weightBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#73e5a511",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#73e5a522",
    marginBottom: 28,
  },
  weightBannerText: {
    color: "#73e5a5",
    fontSize: 13,
    fontWeight: "500",
  },

  // Calorie ring
  ringSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#18242a",
    shadowColor: "#73e5a5",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  innerRing: {
    alignItems: "center",
    gap: 4,
  },
  calorieCount: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 52,
  },
  calorieUnit: {
    color: "#768490",
    fontSize: 13,
  },
  // Total time (outside ring)
  totalTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  totalTimeText: {
    color: "#c0cdd5",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalTimeLabel: {
    color: "#4a6070",
    fontSize: 12,
    fontWeight: "500",
    alignSelf: "flex-end",
    marginBottom: 2,
  },
  // Active time pill (inside ring)
  activeTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: "#73e5a511",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#73e5a522",
  },
  activeTimeText: {
    color: "#73e5a5",
    fontSize: 13,
    fontWeight: "700",
  },

  // Zone card
  zoneCard: {
    backgroundColor: "#18242a",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    alignItems: "center",
  },
  zoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneLabel: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  zoneMet: {
    color: "#768490",
    fontSize: 14,
    fontWeight: "600",
  },
  barMeter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 12,
  },
  barSegment: {
    width: 28,
    borderRadius: 6,
  },
  zoneHint: {
    color: "#4a6070",
    fontSize: 12,
  },

  // MET Table
  metTable: {
    backgroundColor: "#18242a",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  metTableTitle: {
    color: "#768490",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  metRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  metRowActive: {
    backgroundColor: "#ffffff11",
  },
  metDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metName: {
    color: "#c0cdd5",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  metValue: {
    color: "#768490",
    fontSize: 13,
    width: 60,
    textAlign: "right",
  },
  metCalc: {
    color: "#768490",
    fontSize: 12,
    width: 90,
    textAlign: "right",
  },

  // Controls
  controls: {
    marginBottom: 20,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#73e5a5",
    borderRadius: 18,
    paddingVertical: 18,
  },
  startBtnText: {
    color: "#0c1316",
    fontSize: 18,
    fontWeight: "800",
  },
  activeControls: {
    flexDirection: "row",
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2a3d47",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#3a5060",
  },
  pauseBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  resumeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#73e5a5",
    borderRadius: 16,
    paddingVertical: 16,
  },
  resumeBtnText: {
    color: "#0c1316",
    fontSize: 16,
    fontWeight: "800",
  },
  saveBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff9f43",
    borderRadius: 16,
    paddingVertical: 16,
  },
  saveBtnText: {
    color: "#0c1316",
    fontSize: 16,
    fontWeight: "800",
  },

  // Formula
  formulaBox: {
    backgroundColor: "#18242a",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a3d47",
  },
  formulaTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  formulaText: {
    color: "#768490",
    fontSize: 13,
    lineHeight: 20,
  },
});
