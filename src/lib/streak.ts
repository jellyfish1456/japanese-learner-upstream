const STREAK_KEY = "jp-learner:streak";

export interface DayRecord {
  date: string; // YYYY-MM-DD
  actions: number;
}

export interface StreakData {
  currentStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  todayActions: number;
  weekHistory: DayRecord[]; // last 7 days
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadRaw(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { currentStreak: 0, lastStudyDate: "", todayActions: 0, weekHistory: [] };
}

function save(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function loadStreak(): StreakData {
  const data = loadRaw();
  const today = todayStr();

  if (data.lastStudyDate !== today) {
    data.todayActions = 0;
  }

  if (data.lastStudyDate && data.lastStudyDate !== today && data.lastStudyDate !== yesterdayStr()) {
    data.currentStreak = 0;
  }

  return data;
}

export function recordAction(): StreakData {
  const data = loadRaw();
  const today = todayStr();

  if (data.lastStudyDate !== today) {
    if (data.lastStudyDate === yesterdayStr()) {
      data.currentStreak += 1;
    } else if (data.lastStudyDate !== today) {
      data.currentStreak = 1;
    }
    data.todayActions = 0;
  }

  data.todayActions += 1;
  data.lastStudyDate = today;

  const existing = data.weekHistory.find((d) => d.date === today);
  if (existing) {
    existing.actions = data.todayActions;
  } else {
    data.weekHistory.push({ date: today, actions: data.todayActions });
  }
  // keep only last 7 days
  data.weekHistory = data.weekHistory.slice(-7);

  save(data);
  return data;
}

export function getWeekDays(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  const labels = ["日", "一", "二", "三", "四", "五", "六"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ date: dateStr, label: labels[d.getDay()] });
  }
  return days;
}
