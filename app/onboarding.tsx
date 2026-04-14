import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CircularSlider } from 'react-native-moon-slider';
import type { CircularSliderRef } from 'react-native-moon-slider';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/useStore';
import { initDb } from '@/db';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUsername, setWeightKg, setOnboarded } = useUserStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(70);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<CircularSliderRef>(null);

  // ────────────────────────────────────────────────
  // Step 1 → Step 2 transition
  // ────────────────────────────────────────────────
  const handleNameNext = () => {
    if (name.trim().length < 2) return;

    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setStep(2);
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  };

  // ────────────────────────────────────────────────
  // Finish onboarding
  // ────────────────────────────────────────────────
  const handleFinish = async () => {
    setUsername(name.trim());
    setWeightKg(weight);
    await initDb();
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* ── Progress dots ─────────────────────── */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, step === 1 && styles.dotActive]} />
          <View style={[styles.dot, step === 2 && styles.dotActive]} />
        </View>

        <Animated.View
          style={[styles.stepWrapper, { transform: [{ translateX: slideAnim }] }]}
        >
          {/* ════════════════ STEP 1 ════════════════ */}
          {step === 1 && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.step}
            >
              <View style={styles.stepContent}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Step 1 of 2</Text>
                </View>
                <Text style={styles.heading}>What's your{'\n'}name?</Text>
                <Text style={styles.subheading}>
                  We'll personalise your workout experience just for you.
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your name…"
                  placeholderTextColor="#4a5c66"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={32}
                  returnKeyType="next"
                  onSubmitEditing={handleNameNext}
                />

                <TouchableOpacity
                  style={[styles.btn, name.trim().length < 2 && styles.btnDisabled]}
                  onPress={handleNameNext}
                  activeOpacity={0.85}
                  disabled={name.trim().length < 2}
                >
                  <Text style={styles.btnText}>Continue →</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* ════════════════ STEP 2 ════════════════ */}
          {step === 2 && (
            <View style={styles.step}>
              <View style={styles.stepContent}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Step 2 of 2</Text>
                </View>
                <Text style={styles.heading}>What's your{'\n'}weight?</Text>
                <Text style={styles.subheading}>
                  Drag the knob to set your current weight.
                </Text>

                {/* ── Circular Slider ───────────────── */}
                <View style={styles.sliderWrapper}>
                  <CircularSlider
                    ref={sliderRef}
                    min={30}
                    max={200}
                    value={weight}
                    onValueChange={(val) => setWeight(Math.round(val))}
                    diameter={280}
                    sliderWidth={18}
                    thumbRadius={20}
                    startAngle={135}
                    endAngle={45}
                    trackColor="#1b2f38"
                    fillColor="#39C5B7"
                    thumbColor="#0c1316"
                    thumbStrokeColor="#39C5B7"
                    haptics
                    renderCenter={() => (
                      <View style={styles.centerContent}>
                        <Text style={styles.weightValue}>{weight}</Text>
                        <Text style={styles.weightUnit}>kg</Text>
                      </View>
                    )}
                  />
                </View>

                {/* ── Quick-pick chips ──────────────── */}
                <View style={styles.chipsRow}>
                  {[50, 60, 70, 80, 90, 100].map((w) => (
                    <TouchableOpacity
                      key={w}
                      style={[styles.chip, weight === w && styles.chipActive]}
                      onPress={() => {
                        setWeight(w);
                        sliderRef.current?.setValue(w);
                      }}
                    >
                      <Text
                        style={[styles.chipText, weight === w && styles.chipTextActive]}
                      >
                        {w}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.btn}
                  onPress={handleFinish}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnText}>Let's Go 🚀</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1316',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e3040',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#39C5B7',
  },
  stepWrapper: {
    flex: 1,
  },
  step: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContent: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#112228',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1e3a46',
  },
  badgeText: {
    color: '#39C5B7',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heading: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 12,
  },
  subheading: {
    color: '#5a7080',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#141f26',
    borderWidth: 1,
    borderColor: '#1e3040',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 24,
  },
  btn: {
    width: '100%',
    backgroundColor: '#39C5B7',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#1b3540',
  },
  btnText: {
    color: '#0c1316',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sliderWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  centerContent: {
    alignItems: 'center',
  },
  weightValue: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 58,
  },
  weightUnit: {
    color: '#39C5B7',
    fontSize: 18,
    fontWeight: '600',
    marginTop: -4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#141f26',
    borderWidth: 1,
    borderColor: '#1e3040',
  },
  chipActive: {
    backgroundColor: '#0e2e2a',
    borderColor: '#39C5B7',
  },
  chipText: {
    color: '#5a7080',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#39C5B7',
  },
});
