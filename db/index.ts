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
