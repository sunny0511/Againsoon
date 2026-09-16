import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Display, LoadingScreen, Screen, WarmMark } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { colors, spacing } from '@/src/theme';

export default function AuthCompleteScreen() {
  const router = useRouter();
  const { session, completeMagicLink } = useAppStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    completeMagicLink().then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [completeMagicLink]);

  if (session.kind === 'paired') return <Redirect href="/(tabs)" />;
  if (session.kind === 'unpaired') return <Redirect href="/onboarding/pair" />;
  if (busy) return <LoadingScreen />;

  return (
    <Screen>
      <WarmMark />
      <Display size={32}>{error ? 'Link didn’t work' : 'You’re in'}</Display>
      <Body muted style={{ marginTop: 10, marginBottom: 24 }}>
        {error || 'Signed in. Next you’ll create a couple or join with a code.'}
      </Body>
      {error ? (
        <Body small style={{ color: colors.danger, marginBottom: spacing.md }}>
          Ask for a fresh link, or sign in with your password.
        </Body>
      ) : null}
      <Button
        label={error ? 'Back to sign in' : 'Continue'}
        onPress={() => router.replace(error ? '/auth' : '/onboarding/pair')}
      />
      <View style={{ height: 12 }} />
    </Screen>
  );
}
