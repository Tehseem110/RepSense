import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useStore';
import {
  upsertDailyStats,
  getDailyStatsByDate,
  getAllDailyStats,
  DailyStats,
} from '@/db';

// ─── Helper ────────────────────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function toDateString(d: Date): string {
  // Returns YYYY-MM-DD in local time (not UTC)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return `Today  (${dateStr})`;
  if (dateStr === yesterday) return `Yesterday  (${dateStr})`;
  return dateStr;
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

// ─── History Row ─────────────────────────────────────────────────────────────
function HistoryRow({ stat, isToday }: { stat: DailyStats; isToday: boolean }) {
  return (
    <View style={[histStyles.row, isToday && histStyles.rowToday]}>
      <View style={histStyles.dateCol}>
        <Text style={histStyles.dateText}>{stat.date}</Text>
        {isToday && <View style={histStyles.todayBadge}><Text style={histStyles.todayBadgeText}>TODAY</Text></View>}
      </View>
      <View style={histStyles.valCol}>
        <Ionicons name="flame" size={14} color="#ff9f43" />
        <Text style={histStyles.valText}>{stat.calories} kcal</Text>
      </View>
      <View style={histStyles.valCol}>
        <Ionicons name="timer-outline" size={14} color="#6ae094" />
        <Text style={histStyles.valText}>{formatTime(stat.active_time_seconds)}</Text>
      </View>
    </View>
  );
}

// ─── Main Test Panel ─────────────────────────────────────────────────────────
export default function TestPanel() {
  const storeCalories = useUserStore((s) => s.calories);
  const storeActiveTime = useUserStore((s) => s.activeTimeSeconds);
  const setStoreCalories = useUserStore((s) => s.setCalories);
  const setStoreActiveTime = useUserStore((s) => s.setActiveTimeSeconds);

  const todayStr = toDateString(new Date());

  // ── Selected date state ──
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateStr = toDateString(selectedDate);
  const isToday = selectedDateStr === todayStr;

  // ── Values for the selected date ──
  const [calories, setCalories] = useState(0);
  const [activeTimeSeconds, setActiveTimeSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Input fields ──
  const [calInput, setCalInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  // ── History list ──
  const [history, setHistory] = useState<DailyStats[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Load stats for selected date ──────────────────────────────────────────
  const loadDate = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const row = await getDailyStatsByDate(dateStr);
      if (row) {
        setCalories(row.calories);
        setActiveTimeSeconds(row.active_time_seconds);
      } else {
        // No record yet — show zeros
        setCalories(0);
        setActiveTimeSeconds(0);
      }
      setCalInput('');
      setTimeInput('');
    } catch (e) {
      console.error('loadDate error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & load on date change
  useEffect(() => {
    loadDate(selectedDateStr);
  }, [selectedDateStr, loadDate]);

  // ── Persist to SQLite (& MMKV if today) ───────────────────────────────────
  const persist = async (nextCalories: number, nextActiveTime: number) => {
    const stats: DailyStats = {
      date: selectedDateStr,
      calories: nextCalories,
      active_time_seconds: nextActiveTime,
    };
    await upsertDailyStats(stats);
    if (isToday) {
      setStoreCalories(nextCalories);
      setStoreActiveTime(nextActiveTime);
    }
  };

  // ── Calories helpers ──────────────────────────────────────────────────────
  const handleSetCalories = async () => {
    const val = parseInt(calInput, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Enter a valid non-negative number.');
      return;
    }
    const next = val;
    setCalories(next);
    setCalInput('');
    await persist(next, activeTimeSeconds);
  };

  // ── Active time helpers (input in minutes) ────────────────────────────────
  const handleSetTime = async () => {
    const val = parseInt(timeInput, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Enter a valid number of minutes.');
      return;
    }
    const next = val * 60;
    setActiveTimeSeconds(next);
    setTimeInput('');
    await persist(calories, next);
  };

  // ── Quick helpers ─────────────────────────────────────────────────────────
  const updateCalories = async (next: number) => {
    setCalories(next);
    await persist(next, activeTimeSeconds);
  };
  const updateActiveTime = async (next: number) => {
    setActiveTimeSeconds(next);
    await persist(calories, next);
  };

  // ── Date navigation ───────────────────────────────────────────────────────
  const shiftDate = (days: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      // Don't allow future dates
      if (d > new Date()) return prev;
      return d;
    });
  };

  // ── History ───────────────────────────────────────────────────────────────
  const loadHistory = async () => {
    const rows = await getAllDailyStats();
    setHistory(rows);
    setShowHistory(true);
  };

  // ── Reset all for selected date ───────────────────────────────────────────
  const handleResetAll = async () => {
    setCalories(0);
    setActiveTimeSeconds(0);
    setCalInput('');
    setTimeInput('');
    await persist(0, 0);
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

        {/* ── Date Navigator ── */}
        <View style={styles.dateNavCard}>
          <TouchableOpacity style={styles.navBtn} onPress={() => shiftDate(-1)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#73e5a5" />
          </TouchableOpacity>
          <View style={styles.dateCenterBlock}>
            <Text style={styles.dateLabel}>{formatDisplayDate(selectedDateStr)}</Text>
            {!isToday && (
              <TouchableOpacity onPress={() => setSelectedDate(new Date())} activeOpacity={0.7}>
                <Text style={styles.jumpToday}>Jump to Today</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.navBtn, isToday && styles.navBtnDisabled]}
            onPress={() => shiftDate(1)}
            disabled={isToday}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={22} color={isToday ? '#2a3d47' : '#73e5a5'} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#73e5a5" style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* ── Live snapshot ── */}
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotTitleRow}>
                <Text style={styles.snapshotTitle}>
                  {isToday ? 'Current Values (Home Screen)' : `Values for ${selectedDateStr}`}
                </Text>
                {!isToday && (
                  <View style={styles.historyBadge}>
                    <Ionicons name="time-outline" size={12} color="#ff9f43" />
                    <Text style={styles.historyBadgeText}>Historical</Text>
                  </View>
                )}
              </View>
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
              {isToday && (
                <View style={styles.mmkvNote}>
                  <Ionicons name="save-outline" size={12} color="#73e5a5" />
                  <Text style={styles.mmkvNoteText}>Also synced to MMKV → Home screen updates live</Text>
                </View>
              )}
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
              onIncrement={() => updateCalories(calories + 50)}
              onDecrement={() => updateCalories(Math.max(0, calories - 50))}
              onReset={() => updateCalories(0)}
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
              onIncrement={() => updateActiveTime(activeTimeSeconds + 300)}
              onDecrement={() => updateActiveTime(Math.max(0, activeTimeSeconds - 300))}
              onReset={() => updateActiveTime(0)}
              incrementLabel="+5 min"
            />

            {/* ── Reset All ── */}
            <TouchableOpacity
              style={styles.resetAllBtn}
              onPress={handleResetAll}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
              <Text style={styles.resetAllText}>Reset {isToday ? "Today's" : `${selectedDateStr}'s`} Values</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              ℹ️  Values saved to SQLite per date. Today's values also sync to MMKV.{'\n'}
              Navigate dates with ‹ › to view or edit past records.
            </Text>
          </>
        )}

        {/* ── History Section ── */}
        <TouchableOpacity
          style={styles.historyToggleBtn}
          onPress={showHistory ? () => setShowHistory(false) : loadHistory}
          activeOpacity={0.8}
        >
          <Ionicons name={showHistory ? 'chevron-up' : 'list-outline'} size={18} color="#73e5a5" />
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide History' : 'View All History'}
          </Text>
        </TouchableOpacity>

        {showHistory && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>All Daily Records</Text>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>No records yet. Set some values above!</Text>
            ) : (
              <>
                {/* Header row */}
                <View style={histStyles.headerRow}>
                  <Text style={[histStyles.headerText, { flex: 1.2 }]}>Date</Text>
                  <Text style={[histStyles.headerText, { flex: 1 }]}>Calories</Text>
                  <Text style={[histStyles.headerText, { flex: 1 }]}>Active Time</Text>
                </View>
                {history.map((stat) => (
                  <TouchableOpacity
                    key={stat.date}
                    onPress={() => {
                      setSelectedDate(new Date(stat.date + 'T12:00:00'));
                      setShowHistory(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <HistoryRow stat={stat} isToday={stat.date === todayStr} />
                  </TouchableOpacity>
                ))}
                <Text style={styles.historyHint}>Tap a row to jump to that date</Text>
              </>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── History Styles ───────────────────────────────────────────────────────────
const histStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3d47',
    marginBottom: 4,
  },
  headerText: {
    color: '#768490',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#18242a',
  },
  rowToday: {
    backgroundColor: '#73e5a511',
    borderRadius: 8,
    paddingHorizontal: 6,
    marginHorizontal: -6,
  },
  dateCol: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dateText: {
    color: '#c0cdd5',
    fontSize: 13,
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: '#73e5a522',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  todayBadgeText: {
    color: '#73e5a5',
    fontSize: 9,
    fontWeight: '800',
  },
  valCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  valText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});

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
  // Date Navigator
  dateNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18242a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a3d47',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#73e5a511',
    borderWidth: 1,
    borderColor: '#73e5a533',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    backgroundColor: '#18242a',
    borderColor: '#2a3d47',
  },
  dateCenterBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  jumpToday: {
    color: '#73e5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  // Snapshot
  snapshotCard: {
    backgroundColor: '#18242a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#73e5a522',
  },
  snapshotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  snapshotTitle: {
    color: '#768490',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff9f4322',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#ff9f4344',
  },
  historyBadgeText: {
    color: '#ff9f43',
    fontSize: 10,
    fontWeight: '700',
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
  mmkvNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a3d47',
  },
  mmkvNoteText: {
    color: '#73e5a5',
    fontSize: 11,
    fontWeight: '500',
  },
  // Action buttons
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
    marginBottom: 20,
  },
  // History
  historyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#73e5a511',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#73e5a533',
    paddingVertical: 13,
    marginBottom: 16,
  },
  historyToggleText: {
    color: '#73e5a5',
    fontWeight: '700',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#18242a',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyText: {
    color: '#4a6070',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  historyHint: {
    color: '#4a6070',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
});
