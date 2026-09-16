import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { colors } from '@/src/theme';

export default function OnboardingLayout() {
  const { hydrated, state, session } = useAppStore();

  if (!hydrated || session.kind === 'boot') return <LoadingScreen />;
  if (session.kind === 'paired' || ((session.kind === 'demo' || session.kind === 'local') && state.couple && state.onboardingComplete)) {
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
