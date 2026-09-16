import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { colors } from '@/src/theme';

export default function AuthLayout() {
  const { hydrated, state, session } = useAppStore();

  if (!hydrated || session.kind === 'boot') return <LoadingScreen />;
  if (session.kind === 'paired' || ((session.kind === 'demo' || session.kind === 'local') && state.couple)) {
    return <Redirect href="/(tabs)" />;
  }
  if (session.kind === 'unpaired') {
    return <Redirect href="/onboarding/pair" />;
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
