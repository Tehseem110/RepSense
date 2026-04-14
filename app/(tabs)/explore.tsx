import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useStore';

// ─── Helper ────────────────────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

// ─── Test Row ───────────────────────────────────────────────────────────────
interface TestRowProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  currentValue: string;
  inputValue: string;
  placeholder: string;
  unit: string;
  onChangeText: (v: string) => void;
  onSet: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  incrementLabel?: string;
}

function TestRow({
  label,
  icon,
  iconColor,
  currentValue,
  inputValue,
  placeholder,
  unit,
  onChangeText,
  onSet,
  onIncrement,
  onDecrement,
  onReset,
  incrementLabel = '+10',
}: TestRowProps) {
  return (
    <View style={rowStyles.card}>
      {/* Header */}
      <View style={rowStyles.header}>
        <View style={[rowStyles.iconBadge, { backgroundColor: iconColor + '22' }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.currentValue}>{currentValue}</Text>
      </View>

      {/* Input row */}
      <View style={rowStyles.inputRow}>
        <TextInput
          style={rowStyles.input}
          value={inputValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#4a6070"
          keyboardType="numeric"
        />
        <Text style={rowStyles.unitLabel}>{unit}</Text>
        <TouchableOpacity style={rowStyles.setBtn} onPress={onSet} activeOpacity={0.8}>
          <Text style={rowStyles.setBtnText}>Set</Text>
        </TouchableOpacity>
      </View>

      {/* Quick buttons */}
      <View style={rowStyles.quickRow}>
        <TouchableOpacity style={[rowStyles.quickBtn, rowStyles.decrementBtn]} onPress={onDecrement} activeOpacity={0.8}>
          <Ionicons name="remove" size={18} color="#ff6b6b" />
        </TouchableOpacity>
        <TouchableOpacity style={[rowStyles.quickBtn, rowStyles.incrementBtn]} onPress={onIncrement} activeOpacity={0.8}>
          <Text style={rowStyles.quickBtnText}>{incrementLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rowStyles.quickBtn, rowStyles.resetBtn]} onPress={onReset} activeOpacity={0.8}>
          <Ionicons name="refresh" size={16} color="#768490" />
          <Text style={rowStyles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Test Panel ─────────────────────────────────────────────────────────
export default function TestPanel() {
  const calories = useUserStore((s) => s.calories);
  const activeTimeSeconds = useUserStore((s) => s.activeTimeSeconds);
  const setCalories = useUserStore((s) => s.setCalories);
  const setActiveTimeSeconds = useUserStore((s) => s.setActiveTimeSeconds);

  const [calInput, setCalInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  // ── calories helpers ──
  const handleSetCalories = () => {
    const val = parseInt(calInput, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Enter a valid non-negative number.');
      return;
    }
    setCalories(val);
    setCalInput('');
  };

  // ── active time helpers (input is in minutes) ──
  const handleSetTime = () => {
    const val = parseInt(timeInput, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Enter a valid number of minutes.');
      return;
    }
    setActiveTimeSeconds(val * 60);
    setTimeInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View style={styles.titleBadge}>
            <Ionicons name="flask" size={20} color="#73e5a5" />
          </View>
          <View>
            <Text style={styles.title}>Dev Test Panel</Text>
            <Text style={styles.subtitle}>Changes reflect live on Home screen</Text>
          </View>
        </View>

        {/* ── Live snapshot ── */}
        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>Current Values (Home Screen)</Text>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Ionicons name="flame" size={24} color="#ff9f43" />
              <Text style={styles.snapshotVal}>{calories}</Text>
              <Text style={styles.snapshotUnit}>kcal</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Ionicons name="timer-outline" size={24} color="#6ae094" />
              <Text style={styles.snapshotVal}>{formatTime(activeTimeSeconds)}</Text>
              <Text style={styles.snapshotUnit}>hh:mm:ss</Text>
            </View>
          </View>
        </View>

        {/* ── Calories Test ── */}
        <TestRow
          label="Calories Burned"
          icon="flame"
          iconColor="#ff9f43"
          currentValue={`${calories} kcal`}
          inputValue={calInput}
          placeholder="e.g. 500"
          unit="kcal"
          onChangeText={setCalInput}
          onSet={handleSetCalories}
          onIncrement={() => setCalories(calories + 50)}
          onDecrement={() => setCalories(Math.max(0, calories - 50))}
          onReset={() => setCalories(0)}
          incrementLabel="+50 kcal"
        />

        {/* ── Active Time Test ── */}
        <TestRow
          label="Active Time"
          icon="timer-outline"
          iconColor="#6ae094"
          currentValue={formatTime(activeTimeSeconds)}
          inputValue={timeInput}
          placeholder="e.g. 45 (minutes)"
          unit="min"
          onChangeText={setTimeInput}
          onSet={handleSetTime}
          onIncrement={() => setActiveTimeSeconds(activeTimeSeconds + 300)}
          onDecrement={() => setActiveTimeSeconds(Math.max(0, activeTimeSeconds - 300))}
          onReset={() => setActiveTimeSeconds(0)}
          incrementLabel="+5 min"
        />

        {/* ── Reset All ── */}
        <TouchableOpacity
          style={styles.resetAllBtn}
          onPress={() => {
            setCalories(0);
            setActiveTimeSeconds(0);
            setCalInput('');
            setTimeInput('');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
          <Text style={styles.resetAllText}>Reset All Values</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          ℹ️  Values are persisted via MMKV — they survive hot reload.
          Use "Reset All" to clear them.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Row Styles ──────────────────────────────────────────────────────────────
const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: '#18242a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  currentValue: {
    color: '#73e5a5',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#0e1c22',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a3d47',
  },
  unitLabel: {
    color: '#768490',
    marginHorizontal: 10,
    fontSize: 14,
    width: 30,
  },
  setBtn: {
    backgroundColor: '#73e5a5',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  setBtnText: {
    color: '#0c1316',
    fontWeight: '800',
    fontSize: 15,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 4,
  },
  decrementBtn: {
    backgroundColor: '#ff6b6b22',
    borderWidth: 1,
    borderColor: '#ff6b6b44',
  },
  incrementBtn: {
    flex: 1,
    backgroundColor: '#73e5a522',
    borderWidth: 1,
    borderColor: '#73e5a544',
    justifyContent: 'center',
  },
  quickBtnText: {
    color: '#73e5a5',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: '#2a3d47',
  },
  resetText: {
    color: '#768490',
    fontSize: 13,
  },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0c1316',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  titleBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#73e5a522',
    borderWidth: 1,
    borderColor: '#73e5a544',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#768490',
    fontSize: 13,
    marginTop: 2,
  },
  snapshotCard: {
    backgroundColor: '#18242a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#73e5a522',
  },
  snapshotTitle: {
    color: '#768490',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snapshotItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  snapshotVal: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  snapshotUnit: {
    color: '#768490',
    fontSize: 12,
  },
  snapshotDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#2a3d47',
  },
  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff6b6b11',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff6b6b33',
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  resetAllText: {
    color: '#ff6b6b',
    fontWeight: '700',
    fontSize: 15,
  },
  hint: {
    color: '#4a6070',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
