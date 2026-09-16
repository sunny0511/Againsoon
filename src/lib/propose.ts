import { addDays, setTime, startOfDay } from '@/src/lib/dates';
import type { ProposeInput } from '@/src/types';

export function defaultProposeInput(from?: ProposeInput | null): ProposeInput {
  if (from?.startsAt) return from;
  const now = new Date();
  let dinner = setTime(startOfDay(now), 19, 0);
  if (dinner.getTime() <= now.getTime()) {
    dinner = setTime(addDays(startOfDay(now), 1), 19, 0);
  }
  return { startsAt: dinner.toISOString() };
}

export function firstParam(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
