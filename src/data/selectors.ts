import { formatDaysUntil, isInPast, nextOccurrence } from '@/src/lib/dates';
import { colors } from '@/src/theme';
import type {
  Couple,
  KeyDate,
  Meet,
  MeetRevision,
  Memory,
  Partner,
  PersistedState,
} from '@/src/types';

export function currentPartner(state: PersistedState): Partner | null {
  if (!state.couple || !state.currentPartnerId) return null;
  return state.couple.partners.find((partner) => partner.id === state.currentPartnerId) ?? null;
}

export function otherPartner(state: PersistedState): Partner | null {
  if (!state.couple || !state.currentPartnerId) return null;
  return state.couple.partners.find((partner) => partner.id !== state.currentPartnerId) ?? null;
}

export function partnerById(couple: Couple | null, id: string): Partner | undefined {
  return couple?.partners.find((partner) => partner.id === id);
}

export function latestRevision(meet: Meet): MeetRevision {
  return meet.revisions[meet.revisions.length - 1];
}

export function canRespond(meet: Meet, partnerId: string | null): boolean {
  if (!partnerId || meet.status !== 'pending') return false;
  return latestRevision(meet).authorId !== partnerId;
}

export function isWaitingOnOther(meet: Meet, partnerId: string | null): boolean {
  if (!partnerId || meet.status !== 'pending') return false;
  return latestRevision(meet).authorId === partnerId;
}

export function upcomingConfirmed(meets: Meet[], now = new Date()): Meet | null {
  const upcoming = meets
    .filter((meet) => meet.status === 'confirmed' && !isInPast(latestRevision(meet).startsAt, now))
    .sort(
      (a, b) =>
        new Date(latestRevision(a).startsAt).getTime() -
        new Date(latestRevision(b).startsAt).getTime(),
    );
  return upcoming[0] ?? null;
}

export function pendingMeets(meets: Meet[]): Meet[] {
  return meets
    .filter((meet) => meet.status === 'pending')
    .sort(
      (a, b) =>
        new Date(latestRevision(a).startsAt).getTime() -
        new Date(latestRevision(b).startsAt).getTime(),
    );
}

export function historyMeets(meets: Meet[], now = new Date()): Meet[] {
  return meets
    .filter((meet) => {
      if (meet.status === 'declined') return true;
      if (meet.status === 'confirmed' && isInPast(latestRevision(meet).startsAt, now)) return true;
      return false;
    })
    .sort(
      (a, b) =>
        new Date(latestRevision(b).startsAt).getTime() -
        new Date(latestRevision(a).startsAt).getTime(),
    );
}

export function confirmedOnDay(meets: Meet[], day: Date): Meet[] {
  return meets.filter((meet) => {
    if (meet.status !== 'confirmed') return false;
    const start = new Date(latestRevision(meet).startsAt);
    return (
      start.getFullYear() === day.getFullYear() &&
      start.getMonth() === day.getMonth() &&
      start.getDate() === day.getDate()
    );
  });
}

export function isSharingLocation(state: PersistedState, partnerId: string | null): boolean {
  if (!partnerId) return false;
  return Boolean(state.locationSharingByPartnerId[partnerId]);
}

export function bothSharingLocation(state: PersistedState): boolean {
  if (!state.couple) return false;
  return state.couple.partners.every((partner) => isSharingLocation(state, partner.id));
}

export function pendingOnDay(meets: Meet[], day: Date): Meet[] {
  return meets.filter((meet) => {
    if (meet.status !== 'pending') return false;
    const start = new Date(latestRevision(meet).startsAt);
    return (
      start.getFullYear() === day.getFullYear() &&
      start.getMonth() === day.getMonth() &&
      start.getDate() === day.getDate()
    );
  });
}

export function coupleAccents(state: PersistedState): { me: string; them: string; us: string } {
  const me = currentPartner(state);
  const them = otherPartner(state);
  return {
    me: me?.hue ?? colors.accent,
    them: them?.hue ?? colors.sage,
    us: state.couple?.usHue ?? colors.gold,
  };
}

export function memoriesForMeet(memories: Memory[], meetId: string): Memory[] {
  return memories
    .filter((memory) => memory.meetId === meetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function sortedMemories(memories: Memory[]): Memory[] {
  return [...memories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export type UpcomingKeyDate = {
  item: KeyDate;
  occurs: Date;
  label: string;
};

export function upcomingKeyDates(keyDates: KeyDate[], now = new Date()): UpcomingKeyDate[] {
  return keyDates
    .map((item) => {
      const occurs = nextOccurrence(item.date, item.annual, now);
      return { item, occurs, label: formatDaysUntil(occurs, now) };
    })
    .sort((a, b) => a.occurs.getTime() - b.occurs.getTime());
}

export type ReminderRow = {
  id: string;
  title: string;
  fireAt: Date;
  kind: KeyDate['kind'];
  daysBefore: number;
};

export function upcomingReminders(keyDates: KeyDate[], now = new Date()): ReminderRow[] {
  const rows: ReminderRow[] = [];
  for (const item of keyDates) {
    const occurs = nextOccurrence(item.date, item.annual, now);
    for (const daysBefore of item.reminderDaysBefore) {
      const fireAt = new Date(occurs);
      fireAt.setDate(fireAt.getDate() - daysBefore);
      if (fireAt.getTime() >= now.getTime() - 86400000) {
        rows.push({
          id: `${item.id}-${daysBefore}`,
          title: item.title,
          fireAt,
          kind: item.kind,
          daysBefore,
        });
      }
    }
  }
  return rows.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

export function prepForMeet(state: PersistedState, meetId: string) {
  return state.datePrep.filter((item) => item.meetId === meetId);
}

export function listByKind(state: PersistedState, kind: PersistedState['lists'][number]['kind']) {
  return state.lists.find((list) => list.kind === kind) ?? null;
}

export function remainingListCount(state: PersistedState, listId: string): number {
  return state.listItems.filter((item) => item.listId === listId && !item.done).length;
}
