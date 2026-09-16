import { addDays, hourRange, overlaps, setTime, startOfDay } from '@/src/lib/dates';
import type {
  BusyPattern,
  CalendarAccount,
  Meet,
  Partner,
} from '@/src/types';

function latestRevision(meet: Meet) {
  return meet.revisions[meet.revisions.length - 1];
}

export type ExpandedBusy = {
  id: string;
  calendarId: string;
  partnerId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  showDetailsToPartner: boolean;
};

export type MutualWindow = {
  id: string;
  label: string;
  startsAt: Date;
  endsAt: Date;
};

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 22;

export function expandBusyPatterns(
  patterns: BusyPattern[],
  calendars: CalendarAccount[],
  from: Date,
  days = 14,
): ExpandedBusy[] {
  const calendarById = new Map(calendars.map((item) => [item.id, item]));
  const result: ExpandedBusy[] = [];
  for (let index = 0; index < days; index += 1) {
    const day = addDays(startOfDay(from), index);
    const weekday = day.getDay();
    for (const pattern of patterns) {
      if (!pattern.weekdays.includes(weekday)) continue;
      const calendar = calendarById.get(pattern.calendarId);
      if (!calendar) continue;
      const start = setTime(day, pattern.startHour, pattern.startMinute ?? 0);
      const end = setTime(day, pattern.endHour, pattern.endMinute ?? 0);
      if (end.getTime() <= start.getTime()) continue;
      result.push({
        id: `${pattern.id}-${day.toISOString().slice(0, 10)}`,
        calendarId: calendar.id,
        partnerId: calendar.partnerId,
        title: pattern.title,
        startsAt: start,
        endsAt: end,
        showDetailsToPartner: calendar.showDetailsToPartner,
      });
    }
  }
  return result;
}

export function displayBusyTitle(
  block: ExpandedBusy,
  viewerId: string,
): string {
  if (block.partnerId === viewerId || block.showDetailsToPartner) return block.title;
  return 'Busy';
}

export function partnerBusyOnDay(
  blocks: ExpandedBusy[],
  partnerId: string,
  day: Date,
): ExpandedBusy[] {
  const start = startOfDay(day).getTime();
  const end = addDays(startOfDay(day), 1).getTime();
  return blocks
    .filter(
      (block) =>
        block.partnerId === partnerId &&
        block.startsAt.getTime() < end &&
        block.endsAt.getTime() > start,
    )
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function meetWindow(meet: Meet): { start: Date; end: Date } {
  const revision = latestRevision(meet);
  const start = new Date(revision.startsAt);
  const end = revision.endsAt ? new Date(revision.endsAt) : new Date(start.getTime() + 90 * 60000);
  return { start, end };
}

export function isHourBusyForPartner(
  hourStart: Date,
  hourEnd: Date,
  partnerId: string,
  blocks: ExpandedBusy[],
  meets: Meet[],
): boolean {
  const calendarHit = blocks.some(
    (block) =>
      block.partnerId === partnerId && overlaps(hourStart, hourEnd, block.startsAt, block.endsAt),
  );
  if (calendarHit) return true;
  return meets.some((meet) => {
    if (meet.status !== 'confirmed') return false;
    const window = meetWindow(meet);
    return overlaps(hourStart, hourEnd, window.start, window.end);
  });
}

const PREFERRED_WINDOWS = [
  { label: 'Brunch', hour: 11, duration: 2 },
  { label: 'Afternoon', hour: 15, duration: 2 },
  { label: 'Golden hour', hour: 17, duration: 2 },
  { label: 'Dinner', hour: 19, duration: 2 },
] as const;

export function mutualWindowsForRange(
  me: Partner,
  them: Partner,
  blocks: ExpandedBusy[],
  meets: Meet[],
  from: Date,
  days = 10,
  now = new Date(),
): MutualWindow[] {
  const windows: MutualWindow[] = [];
  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const day = addDays(startOfDay(from), dayIndex);
    for (const preferred of PREFERRED_WINDOWS) {
      const start = setTime(day, preferred.hour, 0);
      const end = setTime(day, preferred.hour + preferred.duration, 0);
      if (end.getTime() <= now.getTime()) continue;
      const hours = hourRange(day, preferred.hour, preferred.hour + preferred.duration);
      const free = hours.every(
        (slot) =>
          !isHourBusyForPartner(slot.start, slot.end, me.id, blocks, meets) &&
          !isHourBusyForPartner(slot.start, slot.end, them.id, blocks, meets),
      );
      if (!free) continue;
      windows.push({
        id: `${day.toISOString().slice(0, 10)}-${preferred.label}`,
        label: preferred.label,
        startsAt: start,
        endsAt: end,
      });
    }

    const eveningStart = 18;
    const eveningHours = hourRange(day, eveningStart, DAY_END_HOUR);
    let runStart: Date | null = null;
    let runEnd: Date | null = null;
    const flush = () => {
      if (!runStart || !runEnd) return;
      const durationHours = (runEnd.getTime() - runStart.getTime()) / 3600000;
      if (durationHours < 2) return;
      const alreadyCovered = windows.some(
        (window) =>
          window.startsAt.getTime() >= runStart!.getTime() &&
          window.endsAt.getTime() <= runEnd!.getTime() &&
          window.label !== 'Open evening',
      );
      if (alreadyCovered) return;
      windows.push({
        id: `${day.toISOString().slice(0, 10)}-evening-${runStart.getHours()}`,
        label: 'Open evening',
        startsAt: runStart,
        endsAt: runEnd,
      });
    };
    for (const slot of eveningHours) {
      if (slot.end.getTime() <= now.getTime()) continue;
      const free =
        !isHourBusyForPartner(slot.start, slot.end, me.id, blocks, meets) &&
        !isHourBusyForPartner(slot.start, slot.end, them.id, blocks, meets);
      if (free) {
        if (!runStart) runStart = slot.start;
        runEnd = slot.end;
      } else {
        flush();
        runStart = null;
        runEnd = null;
      }
    }
    flush();
  }
  return windows.slice(0, 10);
}

export function hourStatus(
  hourStart: Date,
  hourEnd: Date,
  meId: string,
  themId: string,
  blocks: ExpandedBusy[],
  meets: Meet[],
): {
  meBusy: ExpandedBusy | null;
  themBusy: ExpandedBusy | null;
  confirmed: Meet | null;
  pending: Meet | null;
  mutualFree: boolean;
} {
  const meBusy =
    blocks.find(
      (block) => block.partnerId === meId && overlaps(hourStart, hourEnd, block.startsAt, block.endsAt),
    ) ?? null;
  const themBusy =
    blocks.find(
      (block) =>
        block.partnerId === themId && overlaps(hourStart, hourEnd, block.startsAt, block.endsAt),
    ) ?? null;
  const confirmed =
    meets.find((meet) => {
      if (meet.status !== 'confirmed') return false;
      const window = meetWindow(meet);
      return overlaps(hourStart, hourEnd, window.start, window.end);
    }) ?? null;
  const pending =
    meets.find((meet) => {
      if (meet.status !== 'pending') return false;
      const window = meetWindow(meet);
      return overlaps(hourStart, hourEnd, window.start, window.end);
    }) ?? null;
  return {
    meBusy,
    themBusy,
    confirmed,
    pending,
    mutualFree: !meBusy && !themBusy && !confirmed,
  };
}

export function providerLabel(provider: CalendarAccount['provider']): string {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    case 'outlook':
      return 'Outlook';
    default:
      return 'Sample';
  }
}
