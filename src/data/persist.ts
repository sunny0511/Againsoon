import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PersistedState } from '@/src/types';

export const STORAGE_KEY = 'againsoon.state.v2';

export async function loadState(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState> & { version?: number };
    if (parsed.version !== 2) return null;
    return {
      version: 2,
      onboardingComplete: Boolean(parsed.onboardingComplete),
      draftName: parsed.draftName ?? '',
      currentPartnerId: parsed.currentPartnerId ?? null,
      couple: parsed.couple ?? null,
      meets: parsed.meets ?? [],
      locationSharingByPartnerId: parsed.locationSharingByPartnerId ?? {},
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
