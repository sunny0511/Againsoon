import { Redirect, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { Body, Button, Display, Screen, WarmMark } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { colors } from '@/src/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { account, state } = useAppStore();

  if (account && state.couple && state.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }
  if (account && !state.couple) {
    return <Redirect href="/onboarding/pair" />;
  }

  return (
    <Screen>
      <WarmMark />
      <Display>Againsoon</Display>
      <Body muted style={{ marginTop: 10, marginBottom: 28 }}>
        Propose a time, talk it through, and lock in the next date. Create an account to keep your couple on this device.
      </Body>
      <Button label="Create account" onPress={() => router.push('/onboarding/account')} />
      <Button
        label="Sign in"
        variant="secondary"
        style={{ marginTop: 10 }}
        onPress={() => router.push('/onboarding/sign-in')}
      />
      <Button
        label="Explore sample couple"
        variant="ghost"
        style={{ marginTop: 10 }}
        onPress={() => router.push({ pathname: '/onboarding/pair', params: { demo: '1' } })}
      />
      <Pressable onPress={() => router.push('/legal/privacy')} style={{ marginTop: 22 }}>
        <Body small style={{ color: colors.inkSoft, textAlign: 'center' }}>
          Privacy Policy · Terms
        </Body>
      </Pressable>
    </Screen>
  );
}
