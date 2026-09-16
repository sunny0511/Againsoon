import type { BusyBlock, Meet, PersistedState } from '@/src/types';

import { addHours, rangesOverlap, setTime, startOfDay, upcomingDays } from '@/src/lib/dates';

export type SparkIdea = {
  title: string;
  location: string;
  notes: string;
};

export const SPARK_IDEAS: SparkIdea[] = [
  {
    title: 'Night market wander',
    location: 'Harbour night market',
    notes: 'No plan except snacks and people-watching.',
  },
  {
    title: 'Sunrise hike',
    location: 'East ridge trailhead',
    notes: 'Thermos coffee at the top. Easy pace.',
  },
  {
    title: 'Ceramics for two',
    location: 'Clay & Co studio',
    notes: 'Make something ugly and keep it forever.',
  },
  {
    title: 'Record-shop date',
    location: 'Second Press vinyl',
    notes: 'Each pick one album the other has never heard.',
  },
  {
    title: 'Golden-hour picnic',
    location: 'Hill park lawn',
    notes: 'Blanket, fruit, and a ridiculous dessert.',
  },
  {
    title: 'Cook at ours',
    location: 'Home kitchen',
    notes: 'One of us shops, the other DJs.',
  },
];

export type SparkSuggestion = SparkIdea & {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  fromWishlist?: boolean;
};

function blockOverlaps(blocks: BusyBlock[], start: Date, end: Date, partnerId?: string): boolean {
  return blocks.some((block) => {
    if (partnerId && block.partnerId !== partnerId) return false;
    return rangesOverlap(start, end, new Date(block.startsAt), new Date(block.endsAt));
  });
}

function meetOverlaps(meets: Meet[], start: Date, end: Date): boolean {
  return meets.some((meet) => {
    if (meet.status === 'declined') return false;
    const revision = meet.revisions[meet.revisions.length - 1];
    const meetStart = new Date(revision.startsAt);
    const meetEnd = revision.endsAt ? new Date(revision.endsAt) : addHours(meetStart, 2);
    return rangesOverlap(start, end, meetStart, meetEnd);
  });
}

export function isSlotFree(state: PersistedState, start: Date, end: Date): boolean {
  return !blockOverlaps(state.busyBlocks, start, end) && !meetOverlaps(state.meets, start, end);
}

export function findMutualFreeSlots(state: PersistedState, count = 4): { start: Date; end: Date }[] {
  const days = upcomingDays(16);
  const found: { start: Date; end: Date }[] = [];
  for (const day of days) {
    if (day.getDay() === 1) continue;
    const dinner = setTime(startOfDay(day), 19, 0);
    const dinnerEnd = addHours(dinner, 2);
    if (dinner.getTime() <= Date.now()) continue;
    if (isSlotFree(state, dinner, dinnerEnd)) {
      found.push({ start: dinner, end: dinnerEnd });
    }
    if (found.length >= count) break;
  }
  return found;
}

export function sparkSuggestions(state: PersistedState): SparkSuggestion[] {
  const slots = findMutualFreeSlots(state, 4);
  const wishes = state.wishlistItems.filter((item) => !item.isPrivate);
  const ideas: SparkIdea[] = wishes.length
    ? wishes.map((item) => ({ title: item.title, location: item.note ?? 'TBD', notes: item.note ?? 'From our wishlist.' }))
    : SPARK_IDEAS;

  return slots.map((slot, index) => {
    const idea = ideas[index % ideas.length];
    const fromWish = wishes[index % Math.max(wishes.length, 1)];
    return {
      id: `spark_${index}`,
      ...idea,
      startsAt: slot.start.toISOString(),
      endsAt: slot.end.toISOString(),
      fromWishlist: wishes.length > 0,
      reason: wishes.length
        ? `You’re both free, and “${fromWish?.title ?? idea.title}” is waiting on the wishlist.`
        : 'You’re both free this evening — Spark picked a date that fits.',
    };
  });
}

export function visibleBusyTitle(block: BusyBlock, viewerId: string | null): string {
  if (block.partnerId === viewerId || block.visibility === 'details') return block.title;
  return 'Busy';
}

export function busyOnDay(blocks: BusyBlock[], day: Date, partnerId?: string): BusyBlock[] {
  return blocks.filter((block) => {
    if (partnerId && block.partnerId !== partnerId) return false;
    const start = new Date(block.startsAt);
    return (
      start.getFullYear() === day.getFullYear() &&
      start.getMonth() === day.getMonth() &&
      start.getDate() === day.getDate()
    );
  });
}
