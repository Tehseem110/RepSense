import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import WeightLogModal from './WeightLogModal';
import { getTodayWeightLog, getWeightHistory, WeightLog } from '@/db';

export default function HomeWeightCard() {
  const [modalVisible, setModalVisible] = useState(false);
  const [todayLog, setTodayLog] = useState<WeightLog | null>(null);
  const [lastLog, setLastLog] = useState<WeightLog | null>(null);
  const [weekChange, setWeekChange] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const [today, history] = await Promise.all([
      getTodayWeightLog(),
      getWeightHistory(),
    ]);
    setTodayLog(today);
    if (history.length > 0) {
      setLastLog(history[history.length - 1]);
    }
    // Week-over-week change
    if (history.length >= 2) {
      const recent = history[history.length - 1].weight_kg;
      const older = history[0].weight_kg;
      setWeekChange(parseFloat((recent - older).toFixed(2)));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClose = () => setModalVisible(false);
  const handleLogged = () => {
    loadData();
  };

  const isUp = weekChange !== null && weekChange > 0;
  const isDown = weekChange !== null && weekChange < 0;

  return (
    <>
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.card}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.iconBox}>
              <Ionicons name="scale-outline" size={18} color="#73e5a5" />
            </View>
            <Text style={styles.cardTitle}>Weight Tracker</Text>
          </View>
          {lastLog && (
            <View style={[styles.trendBadge, isDown ? styles.trendDown : isUp ? styles.trendUp : styles.trendFlat]}>
              <Ionicons
                name={isDown ? 'trending-down' : isUp ? 'trending-up' : 'remove'}
                size={12}
                color={isDown ? '#73e5a5' : isUp ? '#ef6c6c' : '#556673'}
              />
              {weekChange !== null && (
                <Text style={[styles.trendText, isDown ? styles.trendTextDown : isUp ? styles.trendTextUp : styles.trendTextFlat]}>
                  {weekChange > 0 ? '+' : ''}{weekChange} kg
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Weight display */}
        <View style={styles.weightDisplay}>
          {todayLog ? (
            <>
              <Text style={styles.weightValue}>
                {todayLog.weight_kg.toFixed(1)}
              </Text>
              <Text style={styles.weightUnit}>kg today</Text>
            </>
          ) : (
            <Text style={styles.noLogText}>Not logged today</Text>
          )}
        </View>

        {/* Action row */}
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={todayLog ? 'create-outline' : 'add-circle-outline'}
            size={18}
            color="#0c1316"
          />
          <Text style={styles.logButtonText}>
            {todayLog ? "Update Today's Weight" : 'Log Todays Weight'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <WeightLogModal
        visible={modalVisible}
        onClose={handleClose}
        onLogged={handleLogged}
        todayLog={todayLog}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18242a',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e3040',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#0d2218',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  trendUp: {
    backgroundColor: 'rgba(239,108,108,0.12)',
  },
  trendDown: {
    backgroundColor: 'rgba(115,229,165,0.12)',
  },
  trendFlat: {
    backgroundColor: '#1e3040',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trendTextUp: { color: '#ef6c6c' },
  trendTextDown: { color: '#73e5a5' },
  trendTextFlat: { color: '#556673' },

  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 16,
  },
  weightValue: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  weightUnit: {
    color: '#556673',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  noLogText: {
    color: '#2a3d47',
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  logButton: {
    backgroundColor: '#73e5a5',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logButtonText: {
    color: '#0c1316',
    fontSize: 15,
    fontWeight: '700',
  },
});
