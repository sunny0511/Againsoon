import AsyncStorage from '@react-native-async-storage/async-storage';

import { createEmptyState, workspaceForCouple } from '@/src/data/seed';
import { colors } from '@/src/theme';
import type { AccentPresetId, DateGoalCadence, PersistedState } from '@/src/types';

export const STORAGE_KEY = 'againsoon.state.v3';
export const LEGACY_STORAGE_KEY = 'againsoon.state.v2';

const CADENCES: DateGoalCadence[] = ['weekly', 'biweekly', 'twiceWeekly', 'monthly'];
const PRESETS: AccentPresetId[] = ['terracotta-sage', 'blush-sea', 'honey-plum', 'coral-dusk'];

export function stateKey(accountId?: string | null): string {
  return accountId ? `${STORAGE_KEY}.${accountId}` : STORAGE_KEY;
}

export function normalizeState(parsed: Omit<Partial<PersistedState>, 'version'> & { version?: number }): PersistedState {
  const empty = createEmptyState();
  const couple = parsed.couple
    ? {
        ...parsed.couple,
        usHue: parsed.couple.usHue ?? colors.gold,
        partners: parsed.couple.partners,
      }
    : null;
  const workspace = couple ? workspaceForCouple(couple) : empty;
  const cadence = parsed.dateGoal?.cadence;
  const accent = parsed.accentPresetId;

  return {
    version: 3,
    onboardingComplete: Boolean(parsed.onboardingComplete),
    draftName: parsed.draftName ?? '',
    currentPartnerId: parsed.currentPartnerId ?? null,
    couple,
    meets: parsed.meets ?? [],
    locationSharingByPartnerId: parsed.locationSharingByPartnerId ?? {},
    calendars: parsed.calendars?.length ? parsed.calendars : workspace.calendars,
    busyPatterns: parsed.busyPatterns?.length ? parsed.busyPatterns : workspace.busyPatterns,
    dateGoal: { cadence: cadence && CADENCES.includes(cadence) ? cadence : 'weekly' },
    wishlist: parsed.wishlist ?? workspace.wishlist,
    keyDates: parsed.keyDates ?? workspace.keyDates,
    memories: parsed.memories ?? workspace.memories,
    datePrep: parsed.datePrep ?? workspace.datePrep,
    lists: parsed.lists ?? workspace.lists,
    listItems: parsed.listItems ?? workspace.listItems,
    widgetEnabled: parsed.widgetEnabled ?? true,
    accentPresetId: accent && PRESETS.includes(accent) ? accent : 'terracotta-sage',
  };
}

function parseRaw(raw: string): PersistedState | null {
  try {
    const parsed = JSON.parse(raw) as Omit<Partial<PersistedState>, 'version'> & { version?: number };
    if (parsed.version !== 2 && parsed.version !== 3) return null;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

export async function loadState(accountId?: string | null): Promise<PersistedState | null> {
  try {
    if (accountId) {
      const namespaced = await AsyncStorage.getItem(stateKey(accountId));
      if (namespaced) return parseRaw(namespaced);
    }
    const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
    if (!raw) return null;
    return parseRaw(raw);
  } catch {
    return null;
  }
}

export async function saveState(state: PersistedState, accountId?: string | null): Promise<void> {
  await AsyncStorage.setItem(stateKey(accountId), JSON.stringify(state));
}

export async function clearState(accountId?: string | null): Promise<void> {
  const keys = [stateKey(accountId)];
  if (!accountId) keys.push(STORAGE_KEY, LEGACY_STORAGE_KEY);
  await AsyncStorage.multiRemove(keys);
}

export async function migrateLegacyState(accountId: string): Promise<void> {
  const existing = await AsyncStorage.getItem(stateKey(accountId));
  if (existing) return;
  const legacy = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
  if (!legacy) return;
  await AsyncStorage.setItem(stateKey(accountId), legacy);
}
