import { addDays, addHours, addMinutes, nowIso, setTime } from '@/src/lib/dates';
import { applyPresetToCouple } from '@/src/lib/accents';
import { createId, createInviteCode } from '@/src/lib/id';
import { colors } from '@/src/theme';
import type {
  BusyPattern,
  CalendarAccount,
  Couple,
  DatePrepItem,
  KeyDate,
  Meet,
  Memory,
  PersistedState,
  PlaceRef,
  SharedList,
  SharedListItem,
  WishlistItem,
} from '@/src/types';

export const DEMO_INVITE_CODE = 'HONEY42';

const PLACE_LANTERN: PlaceRef = {
  name: 'The lantern steps',
  lat: -33.8583,
  lon: 151.2153,
  label: 'Circular Quay, Sydney',
};
const PLACE_LAWN: PlaceRef = {
  name: 'Riverside lawn',
  lat: -33.8715,
  lon: 151.2156,
  label: 'Royal Botanic Garden, Sydney',
};
const PLACE_GOLDFINCH: PlaceRef = {
  name: 'Goldfinch wine bar',
  lat: -33.8841,
  lon: 151.211,
  label: 'Surry Hills, Sydney',
};
const PLACE_LOOP: PlaceRef = {
  name: 'The loop by the river',
  lat: -33.869,
  lon: 151.217,
  label: 'Farm Cove walk, Sydney',
};
const PLACE_OVEN: PlaceRef = {
  name: 'The Little Oven',
  lat: -33.8792,
  lon: 151.2055,
  label: 'Darlinghurst, Sydney',
};

export function defaultCalendars(couple: Couple): CalendarAccount[] {
  const [me, them] = couple.partners;
  return [
    {
      id: `${me.id}_work`,
      partnerId: me.id,
      name: 'Work',
      provider: 'google',
      showDetailsToPartner: false,
    },
    {
      id: `${me.id}_life`,
      partnerId: me.id,
      name: 'Personal',
      provider: 'apple',
      showDetailsToPartner: true,
    },
    {
      id: `${them.id}_work`,
      partnerId: them.id,
      name: 'Work',
      provider: 'outlook',
      showDetailsToPartner: false,
    },
    {
      id: `${them.id}_life`,
      partnerId: them.id,
      name: 'Personal',
      provider: 'google',
      showDetailsToPartner: true,
    },
  ];
}

export function defaultBusyPatterns(couple: Couple, calendars = defaultCalendars(couple)): BusyPattern[] {
  const [me, them] = couple.partners;
  const mineWork = calendars.find((item) => item.partnerId === me.id && item.name === 'Work')?.id;
  const mineLife = calendars.find((item) => item.partnerId === me.id && item.name === 'Personal')?.id;
  const theirsWork = calendars.find((item) => item.partnerId === them.id && item.name === 'Work')?.id;
  const theirsLife = calendars.find((item) => item.partnerId === them.id && item.name === 'Personal')?.id;
  if (!mineWork || !mineLife || !theirsWork || !theirsLife) return [];
  const weekdays = [1, 2, 3, 4, 5];
  return [
    {
      id: `${me.id}_am`,
      calendarId: mineWork,
      title: 'Focus block',
      weekdays,
      startHour: 9,
      endHour: 12,
    },
    {
      id: `${me.id}_pm`,
      calendarId: mineWork,
      title: 'Meetings',
      weekdays,
      startHour: 13,
      endHour: 17,
    },
    {
      id: `${me.id}_yoga`,
      calendarId: mineLife,
      title: 'Yoga',
      weekdays: [2],
      startHour: 19,
      endHour: 21,
    },
    {
      id: `${them.id}_work`,
      calendarId: theirsWork,
      title: 'Office hours',
      weekdays,
      startHour: 10,
      endHour: 18,
    },
    {
      id: `${them.id}_band`,
      calendarId: theirsLife,
      title: 'Band practice',
      weekdays: [3],
      startHour: 19,
      endHour: 21,
    },
  ];
}

export function defaultLists(): { lists: SharedList[]; listItems: SharedListItem[] } {
  return {
    lists: [
      { id: 'list_groceries', kind: 'groceries', title: 'For the next meet' },
      { id: 'list_chores', kind: 'chores', title: 'Us chores' },
    ],
    listItems: [],
  };
}

export function workspaceForCouple(couple: Couple): Pick<
  PersistedState,
  | 'calendars'
  | 'busyPatterns'
  | 'dateGoal'
  | 'wishlist'
  | 'keyDates'
  | 'memories'
  | 'datePrep'
  | 'lists'
  | 'listItems'
  | 'widgetEnabled'
  | 'accentPresetId'
> {
  const calendars = defaultCalendars(couple);
  const lists = defaultLists();
  return {
    calendars,
    busyPatterns: defaultBusyPatterns(couple, calendars),
    dateGoal: { cadence: 'weekly' },
    wishlist: [],
    keyDates: [],
    memories: [],
    datePrep: [],
    lists: lists.lists,
    listItems: lists.listItems,
    widgetEnabled: true,
    accentPresetId: 'terracotta-sage',
  };
}

export function createEmptyState(): PersistedState {
  return {
    version: 3,
    onboardingComplete: false,
    draftName: '',
    currentPartnerId: null,
    couple: null,
    meets: [],
    locationSharingByPartnerId: {},
    calendars: [],
    busyPatterns: [],
    dateGoal: { cadence: 'weekly' },
    wishlist: [],
    keyDates: [],
    memories: [],
    datePrep: [],
    lists: [],
    listItems: [],
    widgetEnabled: true,
    accentPresetId: 'terracotta-sage',
  };
}

export function createDemoCouple(): Couple {
  return applyPresetToCouple(
    {
      id: 'couple_demo',
      inviteCode: DEMO_INVITE_CODE,
      usHue: colors.gold,
      partners: [
        { id: 'p_maya', name: 'Maya', hue: colors.accent },
        { id: 'p_jordan', name: 'Jordan', hue: colors.sage },
      ],
    },
    'terracotta-sage',
  );
}

export function createDemoState(now = new Date()): PersistedState {
  const couple = createDemoCouple();
  const [maya, jordan] = couple.partners;
  const brunch = setTime(addDays(now, -35), 11, 0);
  const walk = setTime(addDays(now, -5), 18, 30);
  const dinner = setTime(addDays(now, 4), 19, 0);
  const picnic = setTime(addDays(now, 2), 18, 30);
  const lantern = addMinutes(now, 48);
  const anniversary = setTime(addDays(now, 22), 19, 0);
  const cabin = setTime(addDays(now, 9), 16, 0);
  const birthday = setTime(addDays(now, 41), 0, 0);

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
          place: PLACE_LANTERN,
          notes: 'A short one before the week gets loud.',
          createdAt: nowIso(addHours(now, -5)),
        },
        {
          id: createId('rev'),
          authorId: jordan.id,
          startsAt: lantern.toISOString(),
          endsAt: addMinutes(lantern, 90).toISOString(),
          location: 'The lantern steps',
          place: PLACE_LANTERN,
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
          place: PLACE_LAWN,
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
          place: PLACE_GOLDFINCH,
          notes: 'Try the orange wine. Corner table if we can.',
          createdAt: nowIso(addDays(now, -2)),
        },
        {
          id: createId('rev'),
          authorId: jordan.id,
          startsAt: dinner.toISOString(),
          location: 'Goldfinch wine bar',
          place: PLACE_GOLDFINCH,
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
          place: PLACE_LOOP,
          notes: 'Just a walk and a hot chocolate after.',
          createdAt: nowIso(addDays(now, -8)),
        },
      ],
    },
    {
      id: 'meet_brunch',
      status: 'confirmed',
      createdAt: nowIso(addDays(now, -38)),
      confirmedAt: nowIso(addDays(now, -36)),
      revisions: [
        {
          id: createId('rev'),
          authorId: maya.id,
          startsAt: brunch.toISOString(),
          location: 'The Little Oven',
          place: PLACE_OVEN,
          notes: 'The table by the window, as always.',
          createdAt: nowIso(addDays(now, -38)),
        },
      ],
    },
  ];

  const workspace = workspaceForCouple(couple);
  const wishlist: WishlistItem[] = [
    {
      id: 'wish_peaches',
      title: 'Picnic with peaches',
      notes: 'Riverside lawn, the cheap sparkling, no itinerary.',
      budget: '$',
      vibe: 'outdoors',
      createdAt: nowIso(addDays(now, -20)),
      createdById: jordan.id,
    },
    {
      id: 'wish_market',
      title: 'Night market wander',
      notes: 'Share skewers. Sit wherever the string lights are.',
      budget: '$',
      vibe: 'foodie',
      createdAt: nowIso(addDays(now, -18)),
      createdById: maya.id,
    },
    {
      id: 'wish_phones',
      title: 'Cook at home, phones away',
      notes: 'One pot, a record, the good olive oil.',
      budget: '$',
      vibe: 'cozy',
      createdAt: nowIso(addDays(now, -14)),
      createdById: maya.id,
    },
    {
      id: 'wish_sunrise',
      title: 'Sunrise hike',
      notes: 'Thermos of coffee. Back before the city is loud.',
      budget: 'free',
      vibe: 'outdoors',
      createdAt: nowIso(addDays(now, -10)),
      createdById: jordan.id,
    },
    {
      id: 'wish_wine',
      title: 'Orange wine at Goldfinch',
      notes: 'Corner table if we can. Stay for the late playlist.',
      budget: '$$',
      vibe: 'foodie',
      createdAt: nowIso(addDays(now, -9)),
      createdById: maya.id,
    },
    {
      id: 'wish_books',
      title: 'Bookstore + rainy coffee',
      notes: 'Each pick a book the other has to read a page of.',
      budget: '$',
      vibe: 'cozy',
      createdAt: nowIso(addDays(now, -4)),
      createdById: jordan.id,
    },
  ];

  const keyDates: KeyDate[] = [
    {
      id: 'key_cabin',
      title: 'Cabin weekend',
      kind: 'trip',
      date: cabin.toISOString(),
      annual: false,
      reminderDaysBefore: [7, 1],
    },
    {
      id: 'key_anniversary',
      title: 'First-date anniversary',
      kind: 'anniversary',
      date: anniversary.toISOString(),
      annual: true,
      reminderDaysBefore: [7, 1],
    },
    {
      id: 'key_jordan_bday',
      title: 'Jordan’s birthday',
      kind: 'birthday',
      date: birthday.toISOString(),
      annual: true,
      reminderDaysBefore: [14, 1],
    },
  ];

  const memories: Memory[] = [
    {
      id: 'mem_walk',
      meetId: 'meet_walk',
      note: 'The river was silver. We didn’t talk much and it was perfect.',
      photoKind: 'walk',
      createdAt: nowIso(addDays(now, -5)),
      authorId: maya.id,
    },
    {
      id: 'mem_brunch',
      meetId: 'meet_brunch',
      note: 'Window table, too much butter, Jordan stole the last pastry.',
      photoKind: 'oven',
      createdAt: nowIso(addDays(now, -34)),
      authorId: jordan.id,
    },
  ];

  const datePrep: DatePrepItem[] = [
    {
      id: 'prep_lantern_1',
      meetId: 'meet_lantern',
      text: 'Bring the little lantern',
      done: false,
      assigneeId: maya.id,
    },
    {
      id: 'prep_lantern_2',
      meetId: 'meet_lantern',
      text: 'Leave a few minutes early',
      done: false,
      assigneeId: jordan.id,
    },
    {
      id: 'prep_dinner_1',
      meetId: 'meet_dinner',
      text: 'Book the corner table',
      done: true,
      assigneeId: jordan.id,
    },
    {
      id: 'prep_dinner_2',
      meetId: 'meet_dinner',
      text: 'Ask for the orange wine',
      done: false,
      assigneeId: maya.id,
    },
  ];

  const lists: SharedList[] = [
    { id: 'list_groceries', kind: 'groceries', title: 'For the lantern steps', meetId: 'meet_lantern' },
    { id: 'list_chores', kind: 'chores', title: 'Us chores' },
  ];
  const listItems: SharedListItem[] = [
    {
      id: 'g_peaches',
      listId: 'list_groceries',
      title: 'Peaches',
      done: false,
      aisle: 'Produce',
      assigneeId: maya.id,
      createdAt: nowIso(addHours(now, -8)),
    },
    {
      id: 'g_sparkling',
      listId: 'list_groceries',
      title: 'Cheap sparkling',
      done: false,
      aisle: 'Drinks',
      assigneeId: jordan.id,
      createdAt: nowIso(addHours(now, -8)),
    },
    {
      id: 'g_blanket',
      listId: 'list_groceries',
      title: 'Picnic blanket (already packed)',
      done: true,
      aisle: 'Other',
      createdAt: nowIso(addHours(now, -20)),
    },
    {
      id: 'c_recycling',
      listId: 'list_chores',
      title: 'Recycling out before we leave',
      done: false,
      assigneeId: jordan.id,
      createdAt: nowIso(addHours(now, -10)),
    },
    {
      id: 'c_camera',
      listId: 'list_chores',
      title: 'Charge the camera',
      done: false,
      assigneeId: maya.id,
      createdAt: nowIso(addHours(now, -10)),
    },
    {
      id: 'c_cabin',
      listId: 'list_chores',
      title: 'Text the cabin host about Friday',
      done: true,
      createdAt: nowIso(addDays(now, -1)),
    },
  ];

  return {
    version: 3,
    onboardingComplete: true,
    draftName: maya.name,
    currentPartnerId: maya.id,
    couple,
    meets,
    locationSharingByPartnerId: {},
    calendars: workspace.calendars,
    busyPatterns: workspace.busyPatterns,
    dateGoal: { cadence: 'weekly' },
    wishlist,
    keyDates,
    memories,
    datePrep,
    lists,
    listItems,
    widgetEnabled: true,
    accentPresetId: 'terracotta-sage',
  };
}

export function createCoupleFromName(name: string): { couple: Couple; currentPartnerId: string } {
  const you: Couple['partners'][0] = {
    id: createId('p'),
    name: name.trim() || 'You',
    hue: colors.accent,
  };
  const them: Couple['partners'][1] = {
    id: createId('p'),
    name: 'Your person',
    hue: colors.sage,
    isPlaceholder: true,
  };

  return {
    currentPartnerId: you.id,
    couple: applyPresetToCouple(
      {
        id: createId('couple'),
        inviteCode: createInviteCode(),
        usHue: colors.gold,
        partners: [you, them],
      },
      'terracotta-sage',
    ),
  };
}

export function defaultPrepForMeet(meetId: string): DatePrepItem[] {
  return [
    {
      id: createId('prep'),
      meetId,
      text: 'Who’s booking?',
      done: false,
    },
    {
      id: createId('prep'),
      meetId,
      text: 'What should we bring?',
      done: false,
    },
  ];
}
