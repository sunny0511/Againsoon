import { addDays, addHours, addMinutes, nowIso, setTime } from '@/src/lib/dates';
import { createId, createInviteCode } from '@/src/lib/id';
import type { Couple, Meet, PersistedState } from '@/src/types';

export const DEMO_INVITE_CODE = 'HONEY42';

export function createEmptyState(): PersistedState {
  return {
    version: 2,
    onboardingComplete: false,
    draftName: '',
    currentPartnerId: null,
    couple: null,
    meets: [],
    locationSharingByPartnerId: {},
  };
}

export function createDemoCouple(): Couple {
  return {
    id: 'couple_demo',
    inviteCode: DEMO_INVITE_CODE,
    partners: [
      { id: 'p_maya', name: 'Maya', hue: '#E08A6A' },
      { id: 'p_jordan', name: 'Jordan', hue: '#7CBA9F' },
    ],
  };
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

  return {
    version: 2,
    onboardingComplete: true,
    draftName: maya.name,
    currentPartnerId: maya.id,
    couple,
    meets,
    locationSharingByPartnerId: {},
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
    hue: '#7CBA9F',
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
