import * as SQLite from 'expo-sqlite';

export interface ActivityLog {
  id?: number;
  activity_name: string;
  duration: number;
  calories: number;
  date: string;
}

export interface WeightLog {
  id?: number;
  weight_kg: number;
  date: string; // ISO date string YYYY-MM-DD
}

export interface DailyStats {
  date: string;            // ISO date YYYY-MM-DD (PRIMARY KEY)
  calories: number;        // kcal burned
  active_time_seconds: number; // active time in seconds
}

let db: SQLite.SQLiteDatabase | null = null;

// Initialize and get the database connection
export const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('repsense.db');
  }
  return db;
};

// Setup Tables (Should be called when App loads)
export const initDb = async () => {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight_kg REAL NOT NULL,
      date TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      calories INTEGER NOT NULL DEFAULT 0,
      active_time_seconds INTEGER NOT NULL DEFAULT 0
    );
  `);
};

// Insert a log into the activities DB
export const addActivityLog = async (log: ActivityLog) => {
  const database = await getDb();
  const statement = await database.prepareAsync(
    'INSERT INTO activity_logs (activity_name, duration, calories, date) VALUES ($name, $duration, $calories, $date)'
  );
  
  try {
    const result = await statement.executeAsync({
      $name: log.activity_name,
      $duration: log.duration,
      $calories: log.calories,
      $date: log.date,
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

// Get all historical data from SQLite
export const getActivityHistory = async (): Promise<ActivityLog[]> => {
  const database = await getDb();
  // We can fetch massive data using sqlite easily
  const allRows = await database.getAllAsync<ActivityLog>(
    'SELECT * FROM activity_logs ORDER BY date DESC'
  );
  return allRows;
};

// --- Daily Stats helpers (calories + active time per date) ---

// Upsert (insert or replace) stats for a given date
export const upsertDailyStats = async (stats: DailyStats) => {
  const database = await getDb();
  const statement = await database.prepareAsync(
    'INSERT OR REPLACE INTO daily_stats (date, calories, active_time_seconds) VALUES ($date, $calories, $active_time_seconds)'
  );
  try {
    await statement.executeAsync({
      $date: stats.date,
      $calories: stats.calories,
      $active_time_seconds: stats.active_time_seconds,
    });
  } finally {
    await statement.finalizeAsync();
  }
};

// Get stats for a specific date (returns null if no record exists)
export const getDailyStatsByDate = async (date: string): Promise<DailyStats | null> => {
  const database = await getDb();
  const row = await database.getFirstAsync<DailyStats>(
    'SELECT * FROM daily_stats WHERE date = $date',
    { $date: date }
  );
  return row ?? null;
};

// Get all daily stats ordered newest first
export const getAllDailyStats = async (): Promise<DailyStats[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<DailyStats>(
    'SELECT * FROM daily_stats ORDER BY date DESC'
  );
  return rows;
};

// --- Weight Log helpers ---

// Insert or replace today's weight log (UNIQUE date constraint)
export const addWeightLog = async (log: WeightLog) => {
  const database = await getDb();
  const statement = await database.prepareAsync(
    'INSERT OR REPLACE INTO weight_logs (weight_kg, date) VALUES ($weight, $date)'
  );
  try {
    const result = await statement.executeAsync({
      $weight: log.weight_kg,
      $date: log.date,
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

// Get all weight logs ordered oldest → newest (for chart)
export const getWeightHistory = async (): Promise<WeightLog[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<WeightLog>(
    'SELECT * FROM weight_logs ORDER BY date ASC'
  );
  return rows;
};

// Get today's weight log if it exists
export const getTodayWeightLog = async (): Promise<WeightLog | null> => {
  const database = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const row = await database.getFirstAsync<WeightLog>(
    'SELECT * FROM weight_logs WHERE date = $date',
    { $date: today }
  );
  return row ?? null;
};
