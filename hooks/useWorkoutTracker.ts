import { useRef, useState, useCallback, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';

// ─── MET table ───────────────────────────────────────────────────────────────
const MET_TABLE = [
  { label: 'Resting',  minMag: 0.0,  maxMag: 0.05, met: 1.0,  color: '#768490', isActive: false },
  { label: 'Light',    minMag: 0.05, maxMag: 0.15, met: 2.5,  color: '#73e5a5', isActive: true  },
  { label: 'Walking',  minMag: 0.15, maxMag: 0.35, met: 4.0,  color: '#6ae094', isActive: true  },
  { label: 'Jogging',  minMag: 0.35, maxMag: 0.65, met: 7.0,  color: '#f1c40f', isActive: true  },
  { label: 'Running',  minMag: 0.65, maxMag: 9999, met: 10.0, color: '#ff9f43', isActive: true  },
];

export type ActivityZone = typeof MET_TABLE[number];

function getMETZone(magnitude: number): ActivityZone {
  return MET_TABLE.find((z) => magnitude >= z.minMag && magnitude < z.maxMag) ?? MET_TABLE[0];
}

// ─── Types ───────────────────────────────────────────────────────────────────
export type WorkoutStatus = 'idle' | 'running' | 'paused';

export interface WorkoutState {
  status: WorkoutStatus;
  /** Seconds in non-Resting zones only — what gets saved as active time */
  activeSeconds: number;
  /** Total wall-clock seconds since start (pauses excluded) */
  totalSeconds: number;
  caloriesBurned: number;
  currentZone: ActivityZone;
  currentMagnitude: number;
}

export interface WorkoutControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => { caloriesBurned: number; activeSeconds: number; totalSeconds: number };
  reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useWorkoutTracker(
  weightKg: number,
  tickMs: number = 200,
): WorkoutState & WorkoutControls {
  const [status,           setStatus]           = useState<WorkoutStatus>('idle');
  const [activeSeconds,    setActiveSeconds]    = useState(0);
  const [totalSeconds,     setTotalSeconds]     = useState(0);
  const [caloriesBurned,   setCaloriesBurned]   = useState(0);
  const [currentZone,      setCurrentZone]      = useState<ActivityZone>(MET_TABLE[0]);
  const [currentMagnitude, setCurrentMagnitude] = useState(0);

  const statusRef      = useRef<WorkoutStatus>('idle');
  const caloriesRef    = useRef(0);
  const activeRef      = useRef(0);
  const totalRef       = useRef(0);
  const currentZoneRef = useRef<ActivityZone>(MET_TABLE[0]);
  const prevAccel      = useRef({ x: 0, y: 0, z: 0 });
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Accelerometer ──────────────────────────────────────────────────────────
  useEffect(() => {
    Accelerometer.setUpdateInterval(tickMs);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (statusRef.current !== 'running') return;

      const dx = x - prevAccel.current.x;
      const dy = y - prevAccel.current.y;
      const dz = z - prevAccel.current.z;
      const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
      prevAccel.current = { x, y, z };

      const zone = getMETZone(mag);
      currentZoneRef.current = zone;
      setCurrentZone(zone);
      setCurrentMagnitude(mag);

      // Calories = MET × weight(kg) × time(hours)
      const tickHours = tickMs / 1000 / 3600;
      caloriesRef.current += zone.met * weightKg * tickHours;
      setCaloriesBurned(caloriesRef.current);
    });
    return () => sub.remove();
  }, [weightKg, tickMs]);

  // ── 1-second timer ────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;
      totalRef.current += 1;
      setTotalSeconds(totalRef.current);
      if (currentZoneRef.current.isActive) {
        activeRef.current += 1;
        setActiveSeconds(activeRef.current);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const start = useCallback(() => {
    statusRef.current = 'running';
    setStatus('running');
    startTimer();
  }, [startTimer]);

  const pause = useCallback(() => {
    statusRef.current = 'paused';
    setStatus('paused');
    stopTimer();
  }, [stopTimer]);

  const resume = useCallback(() => {
    statusRef.current = 'running';
    setStatus('running');
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    statusRef.current = 'idle';
    setStatus('idle');
    stopTimer();
    return {
      caloriesBurned: caloriesRef.current,
      activeSeconds:  activeRef.current,
      totalSeconds:   totalRef.current,
    };
  }, [stopTimer]);

  const reset = useCallback(() => {
    statusRef.current = 'idle';
    setStatus('idle');
    stopTimer();
    caloriesRef.current    = 0;
    activeRef.current      = 0;
    totalRef.current       = 0;
    currentZoneRef.current = MET_TABLE[0];
    setCaloriesBurned(0);
    setActiveSeconds(0);
    setTotalSeconds(0);
    setCurrentZone(MET_TABLE[0]);
    setCurrentMagnitude(0);
  }, [stopTimer]);

  return {
    status, activeSeconds, totalSeconds, caloriesBurned,
    currentZone, currentMagnitude,
    start, pause, resume, stop, reset,
  };
}
