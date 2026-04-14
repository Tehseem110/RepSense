/**
 * WHO / ACSM health benchmarks used across the app.
 *
 * Calories : 400 kcal/day from exercise
 *   – ACSM recommends 300–500 kcal per session for healthy adults
 *
 * Active time : 45 min/day (2700 sec)
 *   – WHO minimum is 30 min/day; 45 min = excellent tier
 */

export const WHO_CAL_TARGET = 400;        // kcal
export const WHO_TIME_TARGET = 45 * 60;   // seconds  (45 min)

/**
 * Computes the 0-100 RepSense health score.
 * Score = average of calorie sub-score and active-time sub-score.
 */
export function getRepSenseScore(calories: number, activeTimeSeconds: number): number {
  const calScore = Math.min(calories / WHO_CAL_TARGET, 1) * 100;
  const timeScore = Math.min(activeTimeSeconds / WHO_TIME_TARGET, 1) * 100;
  return Math.round((calScore + timeScore) / 2);
}

export interface Zone {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

export const HEALTH_ZONES: Zone[] = [
  { min: 0,  max: 20,  label: 'Sedentary', color: '#e74c3c', description: 'Little to no activity today' },
  { min: 20, max: 40,  label: 'Light',     color: '#e67e22', description: 'Light movement, keep going!' },
  { min: 40, max: 60,  label: 'Moderate',  color: '#f1c40f', description: 'Good effort, push further' },
  { min: 60, max: 80,  label: 'Active',    color: '#2ecc71', description: 'Great! You\'re in the healthy zone' },
  { min: 80, max: 101, label: 'Peak',      color: '#73e5a5', description: 'Outstanding! WHO goal exceeded' },
];

export function getZoneForScore(score: number): Zone {
  return HEALTH_ZONES.find((z) => score >= z.min && score < z.max) ?? HEALTH_ZONES[HEALTH_ZONES.length - 1];
}
