const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function nowIso(date = new Date()): string {
  return date.toISOString();
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addHours(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setHours(next.getHours() + amount);
  return next;
}

export function addMinutes(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + amount);
  return next;
}

export function setTime(date: Date, hours: number, minutes: number): Date {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatWeekday(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function formatMonthDay(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minuteText = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
  return `${hours}${minuteText} ${suffix}`;
}

export function formatTimeRange(startsAt: string, endsAt?: string): string {
  if (!endsAt) return formatTime(startsAt);
  return `${formatTime(startsAt)} – ${formatTime(endsAt)}`;
}

export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return `${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatCountdown(iso: string, now = new Date()): string {
  const start = new Date(iso);
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) {
    if (sameDay(start, now)) return 'earlier today';
    const daysAgo = Math.round((now.getTime() - startOfDay(start).getTime()) / 86400000);
    if (daysAgo === 1) return 'yesterday';
    return `${daysAgo} days ago`;
  }

  if (sameDay(start, now)) {
    const hours = Math.round(diffMs / 3600000);
    if (hours <= 1) return 'in about an hour';
    return `tonight · in ${hours} hours`;
  }

  const tomorrow = addDays(startOfDay(now), 1);
  if (sameDay(start, tomorrow)) return 'tomorrow';

  const days = Math.round((startOfDay(start).getTime() - startOfDay(now).getTime()) / 86400000);
  if (days < 7) return `in ${days} days`;
  return formatShortDate(iso);
}

export function formatDaysUntil(date: Date, now = new Date()): string {
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000);
  if (days < 0) return formatCountdown(date.toISOString(), now);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? 'in a month' : `in ${months} months`;
}

export function isInPast(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}

export function upcomingDays(count = 14, from = new Date()): Date[] {
  const start = startOfDay(from);
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function daysAround(count = 14, from = new Date()): Date[] {
  return upcomingDays(count, from);
}

export function nextOccurrence(isoDate: string, annual: boolean, now = new Date()): Date {
  const source = new Date(isoDate);
  if (!annual) return source;
  const next = new Date(now.getFullYear(), source.getMonth(), source.getDate());
  if (startOfDay(next).getTime() < startOfDay(now).getTime()) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function hourRange(day: Date, fromHour = 8, toHour = 22): { start: Date; end: Date }[] {
  const hours: { start: Date; end: Date }[] = [];
  for (let hour = fromHour; hour < toHour; hour += 1) {
    hours.push({ start: setTime(day, hour, 0), end: setTime(day, hour + 1, 0) });
  }
  return hours;
}
