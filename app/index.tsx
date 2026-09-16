import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';

export default function Index() {
  const { hydrated, account, state } = useAppStore();

  if (!hydrated) return <LoadingScreen />;
  if (account && state.couple && state.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }
  if (account && !state.couple) {
    return <Redirect href="/onboarding/pair" />;
  }
  return <Redirect href="/onboarding" />;
}
