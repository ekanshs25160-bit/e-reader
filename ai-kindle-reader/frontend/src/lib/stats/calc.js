import { localDateKey } from '../storage/sessions';

export function computeStreaks(activeDates, todayLocal = new Date()) {
  const activeDatesSet = new Set(activeDates);
  const todayKey = localDateKey(todayLocal);

  let checkDate = new Date(todayLocal);
  if (!activeDatesSet.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let currentStreak = 0;
  while (true) {
    const dStr = localDateKey(checkDate);
    if (activeDatesSet.has(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const activeDatesSorted = Array.from(activeDatesSet).sort();
  let longestStreak = 0;
  let run = 0;
  let prevActiveD = null;

  for (const dateStr of activeDatesSorted) {
    const parts = dateStr.split('-').map(Number);
    const currD = new Date(parts[0], parts[1] - 1, parts[2]);

    if (!prevActiveD) {
      run = 1;
    } else {
      const diffDays = Math.round((currD.getTime() - prevActiveD.getTime()) / 86400000);
      if (diffDays === 1) {
        run++;
      } else if (diffDays > 1) {
        run = 1;
      }
    }
    if (run > longestStreak) {
      longestStreak = run;
    }
    prevActiveD = currD;
  }

  return { currentStreak, longestStreak };
}

export function computeMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function buildWeeklyDays(dailyRecords = [], todayLocal = new Date()) {
  const currentDayOfWeek = (todayLocal.getDay() + 6) % 7;
  const monday = new Date(todayLocal);
  monday.setDate(todayLocal.getDate() - currentDayOfWeek);

  const records = Array.isArray(dailyRecords) ? dailyRecords : [];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return dayLabels.map((lbl, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = localDateKey(d);

    const record = records.find((r) => r.date === dateStr);
    const seconds = record ? record.seconds : 0;
    const pages = record ? record.pages : 0;
    const minutes = Math.floor(seconds / 60);
    const isToday = idx === currentDayOfWeek;

    let topBookId = null;
    let maxSec = -1;
    if (record?.perBook && typeof record.perBook === 'object') {
      for (const [bId, data] of Object.entries(record.perBook)) {
        const s = Number(data?.seconds || 0);
        if (s > maxSec) {
          maxSec = s;
          topBookId = bId;
        }
      }
    }

    return {
      label: lbl,
      dayNum: idx,
      dateStr,
      seconds,
      minutes,
      pages,
      active: seconds > 0 || pages > 0,
      isToday,
      topBookId,
    };
  });
}

export function buildHeatmap(dailyRecords, todayLocal = new Date()) {
  const currentDayOfWeek = (todayLocal.getDay() + 6) % 7;
  const monday = new Date(todayLocal);
  monday.setDate(todayLocal.getDate() - currentDayOfWeek);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const heatmap = [];
  for (let i = 181; i >= 0; i--) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() - i);
    const dateStr = localDateKey(d);

    const record = dailyRecords.find((r) => r.date === dateStr);
    const seconds = record ? record.seconds : 0;
    const pages = record ? record.pages : 0;

    let level = 0;
    if (seconds >= 3600) level = 4;
    else if (seconds >= 1800) level = 3;
    else if (seconds >= 600) level = 2;
    else if (seconds > 0 || pages > 0) level = 1;

    heatmap.push({
      date: dateStr,
      seconds,
      pages,
      active: seconds > 0 || pages > 0,
      level,
    });
  }
  return heatmap;
}

export function buildLast30Days(dailyRecords, todayLocal = new Date()) {
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayLocal);
    d.setDate(todayLocal.getDate() - i);
    const dateStr = localDateKey(d);

    const record = dailyRecords.find((r) => r.date === dateStr);
    const seconds = record ? record.seconds : 0;
    const pages = record ? record.pages : 0;

    last30Days.push({
      date: dateStr,
      seconds,
      pages,
      active: seconds > 0 || pages > 0,
    });
  }
  return last30Days;
}
