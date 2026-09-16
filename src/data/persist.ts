import AsyncStorage from '@react-native-async-storage/async-storage';

import { createEmptyState, workspaceForCouple } from '@/src/data/seed';
import { colors } from '@/src/theme';
import type { AccentPresetId, DateGoalCadence, PersistedState } from '@/src/types';

export const STORAGE_KEY = 'againsoon.state.v3';
export const LEGACY_STORAGE_KEY = 'againsoon.state.v2';
export const MODE_KEY = 'againsoon.mode.v1';
export const EMAIL_FOR_SIGN_IN_KEY = 'againsoon.emailForSignIn';

export type LocalSessionMode = 'demo' | 'local';

const CADENCES: DateGoalCadence[] = ['weekly', 'biweekly', 'twiceWeekly', 'monthly'];
const PRESETS: AccentPresetId[] = ['terracotta-sage', 'blush-sea', 'honey-plum', 'coral-dusk'];

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
    accentPresetId: accent && PRESETS.includes(accent) ? accent : 'terracotta-sage',
  };
}

export async function loadState(): Promise<PersistedState | null> {
  try {
    const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<Partial<PersistedState>, 'version'> & { version?: number };
    if (parsed.version !== 2 && parsed.version !== 3) return null;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearState(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_STORAGE_KEY, MODE_KEY]);
}

export async function loadMode(): Promise<LocalSessionMode | null> {
  try {
    const raw = await AsyncStorage.getItem(MODE_KEY);
    if (raw === 'demo' || raw === 'local') return raw;
    return null;
  } catch {
    return null;
  }
}

export async function saveMode(mode: LocalSessionMode | null): Promise<void> {
  if (!mode) {
    await AsyncStorage.removeItem(MODE_KEY);
    return;
  }
  await AsyncStorage.setItem(MODE_KEY, mode);
}

export async function rememberEmailForSignIn(email: string): Promise<void> {
  await AsyncStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email.trim());
}

export async function readEmailForSignIn(): Promise<string | null> {
  return AsyncStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
}

export async function clearEmailForSignIn(): Promise<void> {
  await AsyncStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
}
