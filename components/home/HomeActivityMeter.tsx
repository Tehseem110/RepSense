import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useStore';
import {
  WHO_CAL_TARGET,
  WHO_TIME_TARGET,
  getRepSenseScore,
  getZoneForScore,
} from '@/constants/health';

const ZONE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Sedentary: 'bed-outline',
  Light: 'walk-outline',
  Moderate: 'bicycle-outline',
  Active: 'fitness-outline',
  Peak: 'flash-outline',
};

// Segmented gradient bar segments
const SEGMENTS = [
  { color: '#e74c3c' },
  { color: '#e67e22' },
  { color: '#f1c40f' },
  { color: '#2ecc71' },
  { color: '#73e5a5' },
];

export default function HomeActivityMeter() {
  const calories = useUserStore((s) => s.calories);
  const activeTimeSeconds = useUserStore((s) => s.activeTimeSeconds);

  const score = getRepSenseScore(calories, activeTimeSeconds);
  const zone = getZoneForScore(score);
  const zoneIcon = ZONE_ICONS[zone.label] ?? 'flash-outline';

  // Animate the thumb position
  const thumbAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: score / 100,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();
  }, [score]);

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>RepSense Activity Meter</Text>
        <View style={[styles.zoneBadge, { backgroundColor: zone.color + '22', borderColor: zone.color + '55' }]}>
          <Ionicons name={zoneIcon} size={13} color={zone.color} />
          <Text style={[styles.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
        </View>
      </View>

      {/* ── Score ── */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreValue, { color: zone.color }]}>{score}</Text>
        <Text style={styles.scoreMax}> / 100</Text>
        <Text style={styles.scoreCaption}>  health score</Text>
      </View>

      {/* ── Segmented bar + thumb ── */}
      <View style={styles.barWrapper}>
        <View style={styles.segmentTrack}>
          {SEGMENTS.map((seg, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: seg.color },
                i === 0 && styles.segFirst,
                i === SEGMENTS.length - 1 && styles.segLast,
              ]}
            />
          ))}
        </View>

        {/* animated thumb */}
        <Animated.View
          style={[
            styles.thumb,
            { borderColor: zone.color },
            {
              left: thumbAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '95%'],
              }),
            },
          ]}
        />
      </View>

      {/* ── Zone ticks ── */}
      <View style={styles.tickRow}>
        {['0', '20', '40', '60', '80', '100'].map((t) => (
          <Text key={t} style={styles.tick}>{t}</Text>
        ))}
      </View>

      {/* ── Sub-scores ── */}
      <View style={styles.subRow}>
        {/* Calories sub-score */}
        <View style={styles.subItem}>
          <View style={styles.subHeader}>
            <Ionicons name="flame" size={14} color="#ff9f43" />
            <Text style={styles.subLabel}>Calories</Text>
          </View>
          <View style={styles.subTrack}>
            <View
              style={[
                styles.subFill,
                {
                  width: `${Math.min((calories / WHO_CAL_TARGET) * 100, 100)}%`,
                  backgroundColor: '#ff9f43',
                },
              ]}
            />
          </View>
          <Text style={styles.subCaption}>
            {calories} / {WHO_CAL_TARGET} kcal
          </Text>
        </View>

        <View style={styles.subDivider} />

        {/* Active time sub-score */}
        <View style={styles.subItem}>
          <View style={styles.subHeader}>
            <Ionicons name="timer-outline" size={14} color="#6ae094" />
            <Text style={styles.subLabel}>Active Time</Text>
          </View>
          <View style={styles.subTrack}>
            <View
              style={[
                styles.subFill,
                {
                  width: `${Math.min((activeTimeSeconds / WHO_TIME_TARGET) * 100, 100)}%`,
                  backgroundColor: '#6ae094',
                },
              ]}
            />
          </View>
          <Text style={styles.subCaption}>
            {Math.round(activeTimeSeconds / 60)} / 45 min
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18242a',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  zoneLabel: { fontSize: 12, fontWeight: '700' },

  // Score
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  scoreValue: { fontSize: 36, fontWeight: '800' },
  scoreMax: { color: '#4a6070', fontSize: 18, fontWeight: '600' },
  scoreCaption: { color: '#768490', fontSize: 13 },

  // Bar
  barWrapper: {
    marginBottom: 4,
    position: 'relative',
  },
  segmentTrack: {
    height: 14,
    flexDirection: 'row',
    borderRadius: 7,
    overflow: 'hidden',
  },
  segment: { flex: 1 },
  segFirst: { borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  segLast: { borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  thumb: {
    position: 'absolute',
    top: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1b3237',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },

  // Ticks
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  tick: { color: '#4a6070', fontSize: 10 },

  // Sub-scores
  subRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 0,
  },
  subItem: { flex: 1 },
  subDivider: {
    width: 1,
    backgroundColor: '#2a3d47',
    marginHorizontal: 14,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  subLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  subTrack: {
    height: 6,
    backgroundColor: '#1b3237',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  subFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 4,
  },
  subCaption: { color: '#768490', fontSize: 11 },
});
