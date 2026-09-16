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
