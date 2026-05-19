import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ROUTINE: 'glowup_routine',
  COMPLETED: 'glowup_completed_',
  STREAK: 'glowup_streak',
  LAST_DATE: 'glowup_last_date',
  STEPS: 'glowup_steps_',
  WATER: 'glowup_water_',
  WORKOUTS: 'glowup_workouts',
  CHAT: 'glowup_chat',
  PROFILE: 'glowup_profile',
  ACHIEVEMENTS: 'glowup_achievements',
  TOTAL_PUSHUPS: 'glowup_total_pushups',
};

export const getDateKey = (date = new Date()) => date.toISOString().split('T')[0];

// ─── Routine ────────────────────────────────────────────────────────────────
export const saveRoutine = async (routine) => {
  try { await AsyncStorage.setItem(KEYS.ROUTINE, JSON.stringify(routine)); } catch (e) { console.error(e); }
};
export const loadRoutine = async (defaultRoutine) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ROUTINE);
    return data ? JSON.parse(data) : defaultRoutine;
  } catch { return defaultRoutine; }
};

// ─── Completed Tasks ─────────────────────────────────────────────────────────
export const saveCompleted = async (completed, dateKey = getDateKey()) => {
  try { await AsyncStorage.setItem(KEYS.COMPLETED + dateKey, JSON.stringify(completed)); } catch (e) { console.error(e); }
};
export const loadCompleted = async (dateKey = getDateKey()) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.COMPLETED + dateKey);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
};

// ─── History ─────────────────────────────────────────────────────────────────
export const loadHistory = async (days = 30) => {
  const history = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = getDateKey(date);
    const completed = await loadCompleted(dateKey);
    history.push({ dateKey, completed });
  }
  return history;
};

// ─── Streak ──────────────────────────────────────────────────────────────────
export const saveStreak = async (streak) => {
  try { await AsyncStorage.setItem(KEYS.STREAK, String(streak)); } catch {}
};
export const loadStreak = async () => {
  try { const d = await AsyncStorage.getItem(KEYS.STREAK); return d ? parseInt(d) : 0; } catch { return 0; }
};
export const saveLastCompletedDate = async (dateKey) => {
  await AsyncStorage.setItem(KEYS.LAST_DATE, dateKey);
};
export const loadLastCompletedDate = async () => {
  try { return await AsyncStorage.getItem(KEYS.LAST_DATE); } catch { return null; }
};

// ─── Steps ────────────────────────────────────────────────────────────────────
export const saveSteps = async (steps, dateKey = getDateKey()) => {
  try { await AsyncStorage.setItem(KEYS.STEPS + dateKey, String(steps)); } catch (e) { console.error(e); }
};
export const loadSteps = async (dateKey = getDateKey()) => {
  try {
    const d = await AsyncStorage.getItem(KEYS.STEPS + dateKey);
    return d ? parseInt(d) : 0;
  } catch { return 0; }
};
export const loadStepsHistory = async (days = 7) => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dk = getDateKey(date);
    const steps = await loadSteps(dk);
    result.push({ dateKey: dk, steps, date });
  }
  return result;
};

// ─── Water ────────────────────────────────────────────────────────────────────
export const saveWater = async (glasses, dateKey = getDateKey()) => {
  try { await AsyncStorage.setItem(KEYS.WATER + dateKey, String(glasses)); } catch (e) { console.error(e); }
};
export const loadWater = async (dateKey = getDateKey()) => {
  try {
    const d = await AsyncStorage.getItem(KEYS.WATER + dateKey);
    return d ? parseInt(d) : 0;
  } catch { return 0; }
};
export const loadWaterHistory = async (days = 7) => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dk = getDateKey(date);
    const glasses = await loadWater(dk);
    result.push({ dateKey: dk, glasses, date });
  }
  return result;
};

// ─── Workout Sessions ─────────────────────────────────────────────────────────
export const saveWorkoutSession = async (session) => {
  try {
    const existing = await loadWorkoutHistory();
    existing.unshift(session);
    const trimmed = existing.slice(0, 50);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(trimmed));
  } catch (e) { console.error(e); }
};
export const loadWorkoutHistory = async () => {
  try {
    const d = await AsyncStorage.getItem(KEYS.WORKOUTS);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
};

// ─── Total Pushups ────────────────────────────────────────────────────────────
export const saveTotalPushups = async (count) => {
  try { await AsyncStorage.setItem(KEYS.TOTAL_PUSHUPS, String(count)); } catch {}
};
export const loadTotalPushups = async () => {
  try { const d = await AsyncStorage.getItem(KEYS.TOTAL_PUSHUPS); return d ? parseInt(d) : 0; } catch { return 0; }
};

// ─── Chat History ─────────────────────────────────────────────────────────────
export const saveChatHistory = async (messages) => {
  try {
    const trimmed = messages.slice(-100);
    await AsyncStorage.setItem(KEYS.CHAT, JSON.stringify(trimmed));
  } catch (e) { console.error(e); }
};
export const loadChatHistory = async () => {
  try {
    const d = await AsyncStorage.getItem(KEYS.CHAT);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
};

// ─── User Profile ─────────────────────────────────────────────────────────────
export const DEFAULT_PROFILE = {
  name: 'Champion',
  age: 21,
  weight: 70,
  height: 175,
  stepGoal: 8000,
  waterGoal: 8,
  gender: 'male',
};
export const saveProfile = async (profile) => {
  try { await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile)); } catch (e) { console.error(e); }
};
export const loadProfile = async () => {
  try {
    const d = await AsyncStorage.getItem(KEYS.PROFILE);
    return d ? { ...DEFAULT_PROFILE, ...JSON.parse(d) } : DEFAULT_PROFILE;
  } catch { return DEFAULT_PROFILE; }
};

// ─── Achievements ─────────────────────────────────────────────────────────────
export const saveAchievements = async (unlocked) => {
  try { await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(unlocked)); } catch {}
};
export const loadAchievements = async () => {
  try {
    const d = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
};
