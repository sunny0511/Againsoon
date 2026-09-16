import { extrasDefaults } from '@/src/data/persist';
import { addDays, addHours, addMinutes, nowIso, setTime, startOfDay } from '@/src/lib/dates';
import { createId, createInviteCode } from '@/src/lib/id';
import type { BusyBlock, Couple, Meet, PersistedState } from '@/src/types';

export const DEMO_INVITE_CODE = 'HONEY42';

export function createEmptyState(): PersistedState {
  return {
    version: 3,
    onboardingComplete: false,
    draftName: '',
    currentPartnerId: null,
    couple: null,
    meets: [],
    locationSharingByPartnerId: {},
    ...extrasDefaults(),
  };
}

export function createDemoCouple(): Couple {
  return {
    id: 'couple_demo',
    inviteCode: DEMO_INVITE_CODE,
    partners: [
      { id: 'p_maya', name: 'Maya', hue: '#E08A6A' },
      { id: 'p_jordan', name: 'Jordan', hue: '#5FBFB0' },
    ],
  };
}

function weekdayBusy(partnerId: string, now: Date, title: string, startH: number, endH: number, days = 12): BusyBlock[] {
  const blocks: BusyBlock[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = addDays(startOfDay(now), i);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    const start = setTime(day, startH, 0);
    if (start.getTime() < now.getTime() - 3600000) continue;
    blocks.push({
      id: `busy_${partnerId}_${i}_${startH}`,
      partnerId,
      startsAt: start.toISOString(),
      endsAt: setTime(day, endH, 0).toISOString(),
      title,
      visibility: 'busy',
    });
  }
  return blocks;
}

export function createDemoState(now = new Date()): PersistedState {
  const couple = createDemoCouple();
  const [maya, jordan] = couple.partners;
  const brunch = setTime(addDays(now, -12), 11, 0);
  const walk = setTime(addDays(now, -5), 18, 30);
  const dinner = setTime(addDays(now, 4), 19, 0);
  const picnic = setTime(addDays(now, 2), 18, 30);
  const lantern = addMinutes(now, 48);

  const meets: Meet[] = [
    {
      id: 'meet_lantern',
      status: 'confirmed',
      createdAt: nowIso(addHours(now, -5)),
      confirmedAt: nowIso(addHours(now, -4)),
      revisions: [
        {
          id: createId('rev'),
          authorId: maya.id,
          startsAt: lantern.toISOString(),
          endsAt: addMinutes(lantern, 90).toISOString(),
          location: 'The lantern steps',
          notes: 'A short one before the week gets loud.',
          createdAt: nowIso(addHours(now, -5)),
        },
        {
          id: createId('rev'),
          authorId: jordan.id,
          startsAt: lantern.toISOString(),
          endsAt: addMinutes(lantern, 90).toISOString(),
          location: 'The lantern steps',
          notes: 'Yes — I’ll leave in a bit.',
          createdAt: nowIso(addHours(now, -4)),
        },
      ],
    },
    {
      id: 'meet_picnic',
      status: 'pending',
      createdAt: nowIso(addHours(now, -6)),
      revisions: [
        {
          id: createId('rev'),
          authorId: jordan.id,
          startsAt: picnic.toISOString(),
          endsAt: addHours(picnic, 2).toISOString(),
          location: 'Riverside lawn',
          notes: 'Picnic blanket, peaches, and the cheap sparkling we like.',
          createdAt: nowIso(addHours(now, -6)),
        },
      ],
    },
    {
      id: 'meet_dinner',
      status: 'confirmed',
      createdAt: nowIso(addDays(now, -1)),
      confirmedAt: nowIso(addDays(now, -1)),
      revisions: [
        {
          id: createId('rev'),
          authorId: maya.id,
          startsAt: dinner.toISOString(),
          location: 'Goldfinch wine bar',
          notes: 'Try the orange wine. Corner table if we can.',
          createdAt: nowIso(addDays(now, -2)),
        },
        {
          id: createId('rev'),
          authorId: jordan.id,
          startsAt: dinner.toISOString(),
          location: 'Goldfinch wine bar',
          notes: 'Yes — 7pm is perfect. I’ll book.',
          createdAt: nowIso(addDays(now, -1)),
        },
      ],
    },
    {
      id: 'meet_walk',
      status: 'confirmed',
      createdAt: nowIso(addDays(now, -8)),
      confirmedAt: nowIso(addDays(now, -6)),
      revisions: [
        {
          id: createId('rev'),
          authorId: jordan.id,
          startsAt: walk.toISOString(),
          endsAt: addHours(walk, 1).toISOString(),
          location: 'The loop by the river',
          notes: 'Just a walk and a hot chocolate after.',
          createdAt: nowIso(addDays(now, -8)),
        },
      ],
    },
    {
      id: 'meet_brunch',
      status: 'confirmed',
      createdAt: nowIso(addDays(now, -16)),
      confirmedAt: nowIso(addDays(now, -14)),
      revisions: [
        {
          id: createId('rev'),
          authorId: maya.id,
          startsAt: brunch.toISOString(),
          location: 'The Little Oven',
          notes: 'The table by the window, as always.',
          createdAt: nowIso(addDays(now, -16)),
        },
      ],
    },
  ];

  const gymDay = addDays(startOfDay(now), now.getDay() <= 2 ? 2 - now.getDay() : 9 - now.getDay());

  return {
    version: 3,
    onboardingComplete: true,
    draftName: maya.name,
    currentPartnerId: maya.id,
    couple,
    meets,
    locationSharingByPartnerId: {},
    dateGoal: { cadenceDays: 7 },
    busyBlocks: [
      ...weekdayBusy(maya.id, now, 'Work', 9, 17),
      ...weekdayBusy(jordan.id, now, 'Studio days', 10, 16),
      {
        id: 'busy_jordan_gym',
        partnerId: jordan.id,
        startsAt: setTime(gymDay, 18, 0).toISOString(),
        endsAt: setTime(gymDay, 19, 0).toISOString(),
        title: 'Climbing',
        visibility: 'details',
      },
    ],
    wishlists: [
      { id: 'wish_dates', title: 'Date nights', emoji: '🌙' },
      { id: 'wish_trips', title: 'Weekends away', emoji: '🚂' },
      { id: 'wish_gifts', title: 'Gifts', emoji: '🎁' },
    ],
    wishlistItems: [
      {
        id: 'wi_market',
        listId: 'wish_dates',
        title: 'Night market wander',
        note: 'Harbour stalls, share everything.',
        savedById: maya.id,
        isPrivate: false,
        createdAt: nowIso(addDays(now, -9)),
      },
      {
        id: 'wi_ceramics',
        listId: 'wish_dates',
        title: 'Ceramics for two',
        note: 'Clay & Co, Thursday evenings.',
        savedById: jordan.id,
        isPrivate: false,
        createdAt: nowIso(addDays(now, -4)),
      },
      {
        id: 'wi_cabin',
        listId: 'wish_trips',
        title: 'Foggy cabin weekend',
        note: 'No signal. Board games. Soup.',
        savedById: maya.id,
        isPrivate: false,
        createdAt: nowIso(addDays(now, -20)),
      },
      {
        id: 'wi_vinyl',
        listId: 'wish_gifts',
        title: 'That record player',
        note: 'Surprise — keep this private.',
        savedById: maya.id,
        isPrivate: true,
        createdAt: nowIso(addDays(now, -2)),
      },
    ],
    keyDates: [
      { id: 'kd_met', title: 'The day we met', month: 6, day: 14, recurringYearly: true, note: 'Rain and the wrong café.' },
      { id: 'kd_maya', title: 'Maya’s birthday', month: 10, day: 3, recurringYearly: true },
      { id: 'kd_jordan', title: 'Jordan’s birthday', month: 2, day: 21, recurringYearly: true },
      {
        id: 'kd_trip',
        title: 'Train to the coast',
        month: addDays(now, 38).getMonth() + 1,
        day: addDays(now, 38).getDate(),
        year: addDays(now, 38).getFullYear(),
        recurringYearly: false,
        note: 'Leave Friday, come back Sunday.',
      },
    ],
    lists: [
      { id: 'list_picnic', title: 'Picnic bag', kind: 'groceries' },
      { id: 'list_life', title: 'Us todos', kind: 'todos' },
    ],
    listItems: [
      { id: 'li_peaches', listId: 'list_picnic', title: 'Peaches', done: true, aisle: 'Produce', createdAt: nowIso() },
      { id: 'li_fizz', listId: 'list_picnic', title: 'Cheap sparkling', done: false, aisle: 'Drinks', assigneeId: jordan.id, createdAt: nowIso() },
      { id: 'li_blanket', listId: 'list_picnic', title: 'The big blanket', done: false, aisle: 'Home', assigneeId: maya.id, createdAt: nowIso() },
      { id: 'li_book', listId: 'list_life', title: 'Book the ceramics class', done: false, assigneeId: jordan.id, createdAt: nowIso() },
    ],
    memories: [
      {
        id: 'mem_brunch',
        meetId: 'meet_brunch',
        title: 'Window table at The Little Oven',
        note: 'You stole the last pastry. I’d let you again.',
        mood: 'cozy',
        authorId: jordan.id,
        createdAt: nowIso(addDays(now, -12)),
      },
      {
        id: 'mem_walk',
        meetId: 'meet_walk',
        title: 'River loop after dark',
        note: 'Hot chocolate on a bench. Quiet on purpose.',
        mood: 'easy',
        authorId: maya.id,
        createdAt: nowIso(addDays(now, -5)),
      },
    ],
  };
}

export function createCoupleFromName(name: string): { couple: Couple; currentPartnerId: string } {
  const you: Couple['partners'][0] = {
    id: createId('p'),
    name: name.trim() || 'You',
    hue: '#E08A6A',
  };
  const them: Couple['partners'][1] = {
    id: createId('p'),
    name: 'Your person',
    hue: '#5FBFB0',
    isPlaceholder: true,
  };

  return {
    currentPartnerId: you.id,
    couple: {
      id: createId('couple'),
      inviteCode: createInviteCode(),
      partners: [you, them],
    },
  };
}
