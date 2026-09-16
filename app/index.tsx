import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';

export default function Index() {
  const { hydrated, state } = useAppStore();

  if (!hydrated) return <LoadingScreen />;
  if (!state.onboardingComplete || !state.couple) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
