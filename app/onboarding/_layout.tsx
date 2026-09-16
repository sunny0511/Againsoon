import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { colors } from '@/src/theme';

export default function OnboardingLayout() {
  const { hydrated, state } = useAppStore();

  if (!hydrated) return <LoadingScreen />;
  if (state.onboardingComplete && state.couple) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}
