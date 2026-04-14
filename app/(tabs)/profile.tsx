import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useStore';
import {
  WHO_CAL_TARGET,
  WHO_TIME_TARGET,
  getRepSenseScore,
  getZoneForScore,
  HEALTH_ZONES,
} from '@/constants/health';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const ZONE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Sedentary: 'bed-outline',
  Light: 'walk-outline',
  Moderate: 'bicycle-outline',
  Active: 'fitness-outline',
  Peak: 'flash-outline',
};

// ─── Edit Goal Bottom Sheet ───────────────────────────────────────────────────
interface EditGoalModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  unit: string;
  currentGoal: number;
  onClose: () => void;
  onSave: (val: number) => void;
}
function EditGoalModal({
  visible, title, subtitle, unit, currentGoal, onClose, onSave,
}: EditGoalModalProps) {
  const [input, setInput] = useState(String(currentGoal));

  const handleSave = () => {
    const n = parseInt(input, 10);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Invalid', 'Please enter a positive number.');
      return;
    }
    onSave(n);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={modal.overlay}
      >
        <View style={modal.sheet}>
          <View style={modal.handle} />

          <Text style={modal.title}>Edit {title}</Text>
          <Text style={modal.subtitle}>{subtitle}</Text>

          {/* Input */}
          <View style={modal.inputRow}>
            <TextInput
              style={modal.input}
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder={String(currentGoal)}
              placeholderTextColor="#4a6070"
              autoFocus
            />
            <Text style={modal.unit}>{unit}</Text>
          </View>

          {/* Buttons */}
          <View style={modal.btnRow}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modal.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={modal.saveText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: '#18242a',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 44,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#2a3d47',
    borderRadius: 2, alignSelf: 'center', marginBottom: 22,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#768490', fontSize: 13, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  input: {
    flex: 1, backgroundColor: '#0c1316', borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 14,
    color: '#fff', fontSize: 24, fontWeight: '700',
    borderWidth: 1, borderColor: '#2a3d47',
  },
  unit: { color: '#768490', fontSize: 16, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, backgroundColor: '#0c1316', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    borderWidth: 1, borderColor: '#2a3d47',
  },
  cancelText: { color: '#768490', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    flex: 1, backgroundColor: '#73e5a5', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  saveText: { color: '#0c1316', fontSize: 16, fontWeight: '800' },
});

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const pct = score / 100;
  return (
    <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[ringS.base, { borderColor: '#1b3237' }]} />
      <View
        style={[
          ringS.base,
          {
            borderColor: color,
            borderRightColor: pct < 0.75 ? 'transparent' : color,
            borderBottomColor: pct < 0.5 ? 'transparent' : color,
            borderLeftColor: pct < 0.25 ? 'transparent' : color,
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
      <View style={{ alignItems: 'center', position: 'absolute' }}>
        <Text style={[ringS.num, { color }]}>{score}</Text>
        <Text style={ringS.sub}>/ 100</Text>
      </View>
    </View>
  );
}
const ringS = StyleSheet.create({
  base: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, borderWidth: 12,
  },
  num: { fontSize: 38, fontWeight: '800' },
  sub: { color: '#768490', fontSize: 14, fontWeight: '600', marginTop: -4 },
});

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, color, label, value, sub }: {
  icon: keyof typeof Ionicons.glyphMap; color: string;
  label: string; value: string; sub: string;
}) {
  return (
    <View style={pillS.pill}>
      <View style={[pillS.iconBadge, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={pillS.value}>{value}</Text>
      <Text style={pillS.label}>{label}</Text>
      <Text style={pillS.sub}>{sub}</Text>
    </View>
  );
}
const pillS = StyleSheet.create({
  pill: {
    flex: 1, backgroundColor: '#18242a', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 4,
  },
  iconBadge: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  value: { color: '#fff', fontSize: 15, fontWeight: '800' },
  label: { color: '#768490', fontSize: 12, fontWeight: '500', textAlign: 'center' },
  sub: { color: '#4a6070', fontSize: 11, textAlign: 'center' },
});

// ─── Editable Goal Row ────────────────────────────────────────────────────────
function GoalRow({ icon, color, label, value, goal, unit, note, onEdit }: {
  icon: keyof typeof Ionicons.glyphMap; color: string; label: string;
  value: number; goal: number; unit: string; note: string;
  onEdit: () => void;
}) {
  const pct = Math.min(value / goal, 1);

  return (
    <View style={goalS.card}>
      <View style={goalS.headerRow}>
        <View style={[goalS.iconBadge, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={goalS.label}>{label}</Text>
          <Text style={goalS.note}>{note}</Text>
        </View>
        <TouchableOpacity style={goalS.editBtn} onPress={onEdit} activeOpacity={0.8}>
          <Ionicons name="pencil" size={13} color="#73e5a5" />
          <Text style={goalS.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={goalS.track}>
        <View style={[goalS.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>

      {/* Footer: value vs goal + WHO chip */}
      <View style={goalS.footer}>
        <Text style={goalS.progress}>
          <Text style={{ color }}>{value}</Text>
          <Text style={goalS.progressGoal}> / {goal} {unit}</Text>
        </Text>
        <View style={goalS.pctBadge}>
          <Text style={[goalS.pctText, { color }]}>{Math.round(pct * 100)}%</Text>
        </View>
      </View>
    </View>
  );
}
const goalS = StyleSheet.create({
  card: { backgroundColor: '#18242a', borderRadius: 18, padding: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  iconBadge: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  label: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  note: { color: '#4a6070', fontSize: 11 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#73e5a515', borderWidth: 1, borderColor: '#73e5a530',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  editText: { color: '#73e5a5', fontSize: 12, fontWeight: '600' },
  track: { height: 8, backgroundColor: '#1b3237', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  fill: { height: '100%', borderRadius: 4, minWidth: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progress: { flex: 1, fontSize: 13, fontWeight: '700' },
  progressGoal: { color: '#768490', fontWeight: '500' },
  pctBadge: { backgroundColor: '#1b3237', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pctText: { fontSize: 12, fontWeight: '700' },
});

// ─── Zone Ladder ─────────────────────────────────────────────────────────────
function ZoneLadder({ currentScore }: { currentScore: number }) {
  return (
    <View style={ladderS.wrap}>
      {[...HEALTH_ZONES].reverse().map((z) => {
        const active = currentScore >= z.min && currentScore < z.max;
        const icon = ZONE_ICONS[z.label] ?? 'flash-outline';
        return (
          <View
            key={z.label}
            style={[
              ladderS.row,
              active && { backgroundColor: z.color + '15', borderColor: z.color + '55', borderWidth: 1 },
            ]}
          >
            <View style={[ladderS.dot, { backgroundColor: active ? z.color : z.color + '44' }]} />
            <Ionicons name={icon} size={16} color={active ? z.color : '#4a6070'} />
            <View style={{ flex: 1 }}>
              <Text style={[ladderS.zoneLabel, { color: active ? z.color : '#768490' }]}>
                {z.label}{active ? '  ← you are here' : ''}
              </Text>
              <Text style={ladderS.zoneDesc}>{z.description}</Text>
            </View>
            <Text style={[ladderS.range, { color: active ? z.color : '#4a6070' }]}>
              {z.min}–{z.max === 101 ? 100 : z.max}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
const ladderS = StyleSheet.create({
  wrap: { backgroundColor: '#18242a', borderRadius: 18, overflow: 'hidden', marginBottom: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 14, margin: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  zoneLabel: { fontSize: 13, fontWeight: '700' },
  zoneDesc: { color: '#4a6070', fontSize: 11, marginTop: 1 },
  range: { fontSize: 12, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const username = useUserStore((s) => s.username);
  const weightKg = useUserStore((s) => s.weightKg);
  const calories = useUserStore((s) => s.calories);
  const activeTimeSeconds = useUserStore((s) => s.activeTimeSeconds);
  const calorieGoal = useUserStore((s) => s.calorieGoal);
  const activeTimeGoalSeconds = useUserStore((s) => s.activeTimeGoalSeconds);
  const setCalorieGoal = useUserStore((s) => s.setCalorieGoal);
  const setActiveTimeGoalSeconds = useUserStore((s) => s.setActiveTimeGoalSeconds);

  const [editCal, setEditCal] = useState(false);
  const [editTime, setEditTime] = useState(false);

  const score = getRepSenseScore(calories, activeTimeSeconds);
  const zone = getZoneForScore(score);
  const zoneIcon = ZONE_ICONS[zone.label] ?? 'flash-outline';

  const calGoalMins = Math.round(calorieGoal); // kcal — not converting
  const timeGoalMins = Math.round(activeTimeGoalSeconds / 60);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.pageTitle}>Profile</Text>

        {/* ── Hero card ── */}
        <View style={s.heroCard}>
          <View style={s.avatarGlow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>{getInitials(username)}</Text>
            </View>
          </View>
          <View style={s.heroInfo}>
            <Text style={s.nameText}>{username ?? 'Your Name'}</Text>
            <View style={s.weightBadge}>
              <Ionicons name="scale-outline" size={13} color="#73e5a5" />
              <Text style={s.weightText}>
                {weightKg != null ? `${weightKg} kg` : 'No weight set'}
              </Text>
            </View>
            <View style={[s.zoneBadge, { backgroundColor: zone.color + '22', borderColor: zone.color + '55' }]}>
              <Ionicons name={zoneIcon} size={13} color={zone.color} />
              <Text style={[s.zoneText, { color: zone.color }]}>{zone.label}</Text>
            </View>
          </View>
        </View>

        {/* ── RepSense Score ── */}
        <Text style={s.sectionLabel}>REPSENSE HEALTH SCORE</Text>
        <View style={s.scoreCard}>
          <View style={s.scoreRow}>
            <ScoreRing score={score} color={zone.color} />
            <View style={s.scoreRight}>
              <Text style={[s.scoreZoneLabel, { color: zone.color }]}>{zone.label}</Text>
              <Text style={s.scoreDesc}>{zone.description}</Text>
              <View style={s.benchBox}>
                <Text style={s.benchTitle}>TARGETS (score basis)</Text>
                <View style={s.benchRow}>
                  <Ionicons name="flame" size={13} color="#ff9f43" />
                  <Text style={s.benchText}>{WHO_CAL_TARGET} kcal/day</Text>
                </View>
                <View style={s.benchRow}>
                  <Ionicons name="timer-outline" size={13} color="#6ae094" />
                  <Text style={s.benchText}>45 min/day</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Editable Goals ── */}
        <Text style={s.sectionLabel}>MY DAILY GOALS</Text>

        <GoalRow
          icon="flame" color="#ff9f43" label="Calorie Goal"
          value={calories} goal={calorieGoal} unit="kcal"
          note="ACSM recommendation: 300–500 kcal/day"
          onEdit={() => setEditCal(true)}
        />

        <GoalRow
          icon="timer-outline" color="#6ae094" label="Active Time Goal"
          value={Math.round(activeTimeSeconds / 60)} goal={timeGoalMins} unit="min"
          note="Recommendation: 30 min minimum, 45 min excellent"
          onEdit={() => setEditTime(true)}
        />

        {/* ── Zone Ladder ── */}
        <Text style={s.sectionLabel}>HEALTH ZONES</Text>
        <ZoneLadder currentScore={score} />

      </ScrollView>

      {/* ── Edit Modals ── */}
      <EditGoalModal
        visible={editCal}
        title="Calorie Goal"
        subtitle="Set your daily calorie burn target"
        unit="kcal"
        currentGoal={calorieGoal}
        onClose={() => setEditCal(false)}
        onSave={setCalorieGoal}
      />
      <EditGoalModal
        visible={editTime}
        title="Active Time Goal"
        subtitle="Set your daily active time target"
        unit="min"
        currentGoal={timeGoalMins}
        onClose={() => setEditTime(false)}
        onSave={(mins) => setActiveTimeGoalSeconds(mins * 60)}
      />
    </SafeAreaView>
  );
}

// ─── Screen Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0c1316' },
  scroll: { padding: 20, paddingBottom: 50 },
  pageTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 20 },
  sectionLabel: {
    color: '#4a6070', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.2, marginBottom: 10, marginTop: 20,
  },

  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#18242a', borderRadius: 20,
    padding: 20, gap: 16, marginBottom: 4,
  },
  avatarGlow: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#73e5a520', borderWidth: 2, borderColor: '#73e5a560',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarCircle: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#1b3237', justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { color: '#73e5a5', fontSize: 24, fontWeight: '800' },
  heroInfo: { flex: 1, gap: 6 },
  nameText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  weightBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#73e5a515', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#73e5a530', alignSelf: 'flex-start',
  },
  weightText: { color: '#73e5a5', fontSize: 13, fontWeight: '600' },
  zoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  zoneText: { fontSize: 12, fontWeight: '700' },

  scoreCard: {
    backgroundColor: '#18242a', borderRadius: 20, padding: 20, marginBottom: 4,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  scoreRight: { flex: 1, gap: 6 },
  scoreZoneLabel: { fontSize: 18, fontWeight: '800' },
  scoreDesc: { color: '#768490', fontSize: 13, lineHeight: 18 },
  benchBox: {
    marginTop: 6, backgroundColor: '#0c1316',
    borderRadius: 12, padding: 10, gap: 4,
  },
  benchTitle: { color: '#4a6070', fontSize: 10, fontWeight: '700', marginBottom: 4, letterSpacing: 0.8 },
  benchRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benchText: { color: '#768490', fontSize: 12 },

  pillRow: { flexDirection: 'row', marginBottom: 4 },
});
