function GetTimeRange(schedule) {
  const timeRange = schedule.time_schedule
    ?.replace(/['"]/g, "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!timeRange) return null;

  const [, startHour, startMinute, endHour, endMinute] = timeRange.map(Number);
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59)
    return null;
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return end > start ? { start, end } : null;
}

export function ParseProgressTime(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

// current.game_id is the next match's order within the schedule, not its match ID.
export function GetScheduleProgress(schedules, current, nowMinutes) {
  if (!current || !Number.isFinite(nowMinutes)) return null;

  const ranges = schedules.map(GetTimeRange).filter(Boolean);
  if (ranges.length === 0) return null;
  const firstStart = Math.min(...ranges.map((range) => range.start));
  const lastEnd = Math.max(...ranges.map((range) => range.end));
  // Hide outside competition hours even when the stored position is unfinished.
  if (nowMinutes < firstStart - 10 || nowMinutes >= lastEnd) return null;

  const schedule = schedules.find((item) => item.id === current.id);
  if (!schedule) return null;
  const range = GetTimeRange(schedule);
  // The completed position has no time range, so it has no progress estimate.
  if (!range) return null;
  const { start, end } = range;
  const count = Number(schedule.game_count);
  const order = Number(current.game_id);
  if (
    !Number.isInteger(count) ||
    count <= 0 ||
    !Number.isInteger(order) ||
    order < 1 ||
    order > count
  )
    return null;

  // At the first match we cannot distinguish early progress from a scheduled break.
  if (order === 1 && nowMinutes < start) return "開始待ち";
  const plannedMinutes = start + ((order - 1) / count) * (end - start);
  const difference = Math.round(Math.abs(nowMinutes - plannedMinutes));
  if (difference === 0) return "ほぼ予定どおり";
  return `約${difference}分${nowMinutes > plannedMinutes ? "遅れ" : "先行"}`;
}
