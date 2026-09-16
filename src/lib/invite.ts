import { nowIso } from '@/src/lib/dates';
import { createInviteCode } from '@/src/lib/id';

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function inviteExpiresAt(from = Date.now()): { iso: string; ms: number } {
  const ms = from + INVITE_TTL_MS;
  return { iso: nowIso(new Date(ms)), ms };
}

export function isInviteExpired(expiresAtMs?: number, expiresAtIso?: string, now = Date.now()): boolean {
  if (typeof expiresAtMs === 'number') return expiresAtMs <= now;
  if (expiresAtIso) {
    const parsed = Date.parse(expiresAtIso);
    if (!Number.isNaN(parsed)) return parsed <= now;
  }
  return false;
}

export function freshInviteCode(): string {
  return createInviteCode();
}
