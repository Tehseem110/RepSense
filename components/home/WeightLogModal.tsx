import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Circle,
  Text as SkiaText,
  useFont,
  Paint,
  DashPathEffect,
} from '@shopify/react-native-skia';
import { addWeightLog, getWeightHistory, WeightLog } from '@/db';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 160;
const CHART_PADDING = { top: 20, bottom: 30, left: 8, right: 8 };

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

// ── Mini line chart using Skia paths ────────────────────────────────────────

function WeightChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) {
    return (
      <View style={chartStyles.emptyChart}>
        <Ionicons name="analytics-outline" size={32} color="#2a3d47" />
        <Text style={chartStyles.emptyText}>
          Log at least 2 entries to see your trend
        </Text>
      </View>
    );
  }

  const weights = logs.map((l) => l.weight_kg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const plotW = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Compute x/y for each point
  const points = logs.map((log, i) => ({
    x: CHART_PADDING.left + (i / (logs.length - 1)) * plotW,
    y: CHART_PADDING.top + (1 - (log.weight_kg - minW) / range) * plotH,
    label: formatDate(log.date),
    weight: log.weight_kg,
  }));

  // Build smooth line path
  const linePath = Skia.Path.Make();
  points.forEach((p, i) => {
    if (i === 0) linePath.moveTo(p.x, p.y);
    else {
      const prev = points[i - 1];
      const cpX = (prev.x + p.x) / 2;
      linePath.cubicTo(cpX, prev.y, cpX, p.y, p.x, p.y);
    }
  });

  // Build filled gradient area path
  const fillPath = linePath.copy();
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  fillPath.lineTo(lastPt.x, CHART_PADDING.top + plotH);
  fillPath.lineTo(firstPt.x, CHART_PADDING.top + plotH);
  fillPath.close();

  // Trend direction
  const isUp = weights[weights.length - 1] > weights[0];
  const lineColor = isUp ? '#ef6c6c' : '#73e5a5';
  const fillTop = isUp ? '#ef6c6c' : '#73e5a5';

  return (
    <View style={chartStyles.chartWrapper}>
      <Canvas style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        {/* Gradient fill */}
        <Path path={fillPath} opacity={0.12}>
          <LinearGradient
            start={vec(0, CHART_PADDING.top)}
            end={vec(0, CHART_PADDING.top + plotH)}
            colors={[fillTop, 'transparent']}
          />
        </Path>

        {/* Line */}
        <Path
          path={linePath}
          color={lineColor}
          style="stroke"
          strokeWidth={2.5}
          strokeCap="round"
          strokeJoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 5 : 3.5}
            color={i === points.length - 1 ? lineColor : '#18242a'}
          />
        ))}
        {points.map((p, i) => (
          <Circle
            key={`border-${i}`}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 5 : 3.5}
            color={lineColor}
            style="stroke"
            strokeWidth={1.5}
          />
        ))}
      </Canvas>

      {/* X-axis labels */}
      <View style={[chartStyles.xLabels, { width: CHART_WIDTH }]}>
        {points
          .filter((_, i) => i === 0 || i === points.length - 1 || (logs.length <= 7 && i % 1 === 0) || i % Math.ceil(logs.length / 5) === 0)
          .map((p, idx) => (
            <Text
              key={idx}
              style={[chartStyles.xLabel, { position: 'absolute', left: p.x - 20 }]}
            >
              {p.label}
            </Text>
          ))}
      </View>

      {/* Y extremes */}
      <View style={chartStyles.yLabels}>
        <Text style={chartStyles.yLabel}>{maxW.toFixed(1)}</Text>
        <Text style={chartStyles.yLabel}>{minW.toFixed(1)}</Text>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  chartWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  emptyChart: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: '#556673',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  xLabels: {
    height: 20,
    position: 'relative',
    marginTop: -4,
  },
  xLabel: {
    color: '#556673',
    fontSize: 10,
    width: 40,
    textAlign: 'center',
  },
  yLabels: {
    position: 'absolute',
    right: -32,
    top: CHART_PADDING.top,
    bottom: CHART_PADDING.bottom,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yLabel: {
    color: '#556673',
    fontSize: 10,
  },
});

// ── Main Modal ───────────────────────────────────────────────────────────────

interface WeightLogModalProps {
  visible: boolean;
  onClose: () => void;
  onLogged: () => void;
  todayLog: WeightLog | null;
}

export default function WeightLogModal({
  visible,
  onClose,
  onLogged,
  todayLog,
}: WeightLogModalProps) {
  const [inputWeight, setInputWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [history, setHistory] = useState<WeightLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedToday, setSavedToday] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const loadHistory = useCallback(async () => {
    const logs = await getWeightHistory();
    setHistory(logs);
  }, []);

  useEffect(() => {
    if (visible) {
      loadHistory();
      if (todayLog) {
        const displayVal =
          unit === 'lbs'
            ? (todayLog.weight_kg * 2.20462).toFixed(1)
            : todayLog.weight_kg.toFixed(1);
        setInputWeight(displayVal);
        setSavedToday(true);
      } else {
        setInputWeight('');
        setSavedToday(false);
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible, todayLog]);

  const handleSave = async () => {
    const val = parseFloat(inputWeight);
    if (isNaN(val) || val <= 0) return;

    setSaving(true);
    try {
      const weightKg = unit === 'lbs' ? val / 2.20462 : val;
      await addWeightLog({ weight_kg: parseFloat(weightKg.toFixed(2)), date: getTodayIso() });
      await loadHistory();
      setSavedToday(true);
      onLogged();
    } finally {
      setSaving(false);
    }
  };

  const toggleUnit = () => {
    setUnit((prev) => {
      const next = prev === 'kg' ? 'lbs' : 'kg';
      const parsed = parseFloat(inputWeight);
      if (!isNaN(parsed)) {
        setInputWeight(
          next === 'lbs'
            ? (parsed * 2.20462).toFixed(1)
            : (parsed / 2.20462).toFixed(1)
        );
      }
      return next;
    });
  };

  const latestWeight = history.length > 0 ? history[history.length - 1] : null;
  const prevWeight =
    history.length > 1 ? history[history.length - 2] : null;
  const diff =
    latestWeight && prevWeight
      ? latestWeight.weight_kg - prevWeight.weight_kg
      : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="scale-outline" size={20} color="#73e5a5" />
              </View>
              <Text style={styles.sheetTitle}>Weight Logger</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color="#768490" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Input section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Today's Weight</Text>
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.weightInput}
                  value={inputWeight}
                  onChangeText={setInputWeight}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor="#2a3d47"
                  maxLength={6}
                  selectionColor="#73e5a5"
                />
                {/* Unit toggle */}
                <TouchableOpacity style={styles.unitToggle} onPress={toggleUnit} activeOpacity={0.8}>
                  <Text style={[styles.unitOption, unit === 'kg' && styles.unitActive]}>kg</Text>
                  <Text style={styles.unitDivider}>|</Text>
                  <Text style={[styles.unitOption, unit === 'lbs' && styles.unitActive]}>lbs</Text>
                </TouchableOpacity>
              </View>

              {/* Change indicator */}
              {diff !== null && (
                <Animated.View entering={FadeIn} style={styles.diffRow}>
                  <Ionicons
                    name={diff > 0 ? 'trending-up' : diff < 0 ? 'trending-down' : 'remove'}
                    size={16}
                    color={diff > 0 ? '#ef6c6c' : diff < 0 ? '#73e5a5' : '#556673'}
                  />
                  <Text style={[styles.diffText, { color: diff > 0 ? '#ef6c6c' : diff < 0 ? '#73e5a5' : '#556673' }]}>
                    {diff === 0
                      ? 'No change from last entry'
                      : `${diff > 0 ? '+' : ''}${diff.toFixed(2)} kg from last entry`}
                  </Text>
                </Animated.View>
              )}

              {/* Save button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving && styles.saveButtonDisabled,
                  savedToday && styles.saveButtonSaved,
                ]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#0c1316" />
                ) : (
                  <>
                    <Ionicons
                      name={savedToday ? 'checkmark-circle' : 'save-outline'}
                      size={18}
                      color="#0c1316"
                    />
                    <Text style={styles.saveButtonText}>
                      {savedToday ? 'Update Today\'s Log' : 'Log Weight'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Chart section */}
            <View style={styles.chartSection}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.sectionTitle}>Weight Journey</Text>
                <Text style={styles.entriesCount}>{history.length} entries</Text>
              </View>
              <WeightChart logs={history} />
            </View>

            {/* Last 5 entries */}
            {history.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Recent Logs</Text>
                {[...history].reverse().slice(0, 5).map((log, i) => {
                  const isToday = log.date === getTodayIso();
                  return (
                    <View key={log.id ?? i} style={styles.logRow}>
                      <View style={styles.logLeft}>
                        <View style={[styles.logDot, isToday && styles.logDotToday]} />
                        <Text style={styles.logDate}>
                          {isToday ? 'Today' : formatDate(log.date)}
                        </Text>
                      </View>
                      <Text style={[styles.logWeight, isToday && styles.logWeightToday]}>
                        {log.weight_kg.toFixed(1)} kg
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#111d23',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1e3040',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0d2218',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18242a',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Input
  inputSection: {
    marginBottom: 8,
  },
  inputLabel: {
    color: '#768490',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#18242a',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
    borderWidth: 1.5,
    borderColor: '#1e3040',
    textAlign: 'center',
  },
  unitToggle: {
    backgroundColor: '#18242a',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1e3040',
  },
  unitOption: {
    color: '#556673',
    fontSize: 14,
    fontWeight: '600',
  },
  unitActive: {
    color: '#73e5a5',
  },
  unitDivider: {
    color: '#2a3d47',
    fontSize: 14,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#73e5a5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonSaved: {
    backgroundColor: '#39C5B7',
  },
  saveButtonText: {
    color: '#0c1316',
    fontSize: 16,
    fontWeight: '700',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#1e3040',
    marginVertical: 20,
  },

  // Chart
  chartSection: {
    marginBottom: 20,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  entriesCount: {
    color: '#556673',
    fontSize: 12,
    fontWeight: '500',
  },

  // Recent logs
  recentSection: {
    gap: 10,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#18242a',
    borderRadius: 12,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2a3d47',
  },
  logDotToday: {
    backgroundColor: '#73e5a5',
  },
  logDate: {
    color: '#768490',
    fontSize: 14,
    fontWeight: '500',
  },
  logWeight: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  logWeightToday: {
    color: '#73e5a5',
  },
});
