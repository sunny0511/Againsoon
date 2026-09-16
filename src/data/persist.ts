import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DateGoal, PersistedState } from '@/src/types';

export const STORAGE_KEY = 'againsoon.state.v3';

const defaultGoal: DateGoal = { cadenceDays: 7 };

export function extrasDefaults(): Pick<
  PersistedState,
  | 'dateGoal'
  | 'busyBlocks'
  | 'wishlists'
  | 'wishlistItems'
  | 'keyDates'
  | 'lists'
  | 'listItems'
  | 'memories'
> {
  return {
    dateGoal: defaultGoal,
    busyBlocks: [],
    wishlists: [
      { id: 'wish_dates', title: 'Date nights', emoji: '🌙' },
      { id: 'wish_trips', title: 'Weekends away', emoji: '🚂' },
      { id: 'wish_gifts', title: 'Gifts', emoji: '🎁' },
    ],
    wishlistItems: [],
    keyDates: [],
    lists: [
      { id: 'list_picnic', title: 'For the next meet', kind: 'groceries' },
      { id: 'list_life', title: 'Us todos', kind: 'todos' },
    ],
    listItems: [],
    memories: [],
  };
}

export async function loadState(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState> & { version?: number };
    if (parsed.version !== 3 && parsed.version !== 2) return null;
    const extras = extrasDefaults();
    return {
      ...extras,
      version: 3,
      onboardingComplete: Boolean(parsed.onboardingComplete),
      draftName: parsed.draftName ?? '',
      currentPartnerId: parsed.currentPartnerId ?? null,
      couple: parsed.couple ?? null,
      meets: parsed.meets ?? [],
      locationSharingByPartnerId: parsed.locationSharingByPartnerId ?? {},
      dateGoal: parsed.dateGoal ?? extras.dateGoal,
      busyBlocks: parsed.busyBlocks ?? extras.busyBlocks,
      wishlists: parsed.wishlists?.length ? parsed.wishlists : extras.wishlists,
      wishlistItems: parsed.wishlistItems ?? extras.wishlistItems,
      keyDates: parsed.keyDates?.length ? parsed.keyDates : extras.keyDates,
      lists: parsed.lists?.length ? parsed.lists : extras.lists,
      listItems: parsed.listItems ?? extras.listItems,
      memories: parsed.memories ?? extras.memories,
    };
  } catch {
    return null;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
