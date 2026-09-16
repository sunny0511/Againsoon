import { useRouter } from 'expo-router';

import { Body, Button, Display, Screen, WarmMark } from '@/src/components/ui';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <WarmMark />
      <Display>Againsoon</Display>
      <Body muted style={{ marginTop: 10, marginBottom: 28 }}>
        A quiet place for two people to propose a time, talk it through, and lock in the next time you’ll be together.
      </Body>
      <Button label="Get started" onPress={() => router.push('/onboarding/name')} />
      <Button
        label="Try the demo couple"
        variant="ghost"
        style={{ marginTop: 10 }}
        onPress={() => router.push({ pathname: '/onboarding/pair', params: { demo: '1' } })}
      />
    </Screen>
  );
}
