import { isInPast } from '@/src/lib/dates';
import type { Couple, Meet, MeetRevision, Partner, PersistedState } from '@/src/types';

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
