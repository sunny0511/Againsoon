import { useRouter } from 'expo-router';

import { Body, Button, Display, Screen, WarmMark } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';

export default function WelcomeScreen() {
  const router = useRouter();
  const { session } = useAppStore();

  return (
    <Screen>
      <WarmMark />
      <Display>Againsoon</Display>
      <Body muted style={{ marginTop: 10, marginBottom: 28 }}>
        The couples app for proposing a time, talking it through, and locking in the next date — together, on two phones.
      </Body>
      {session.firebaseConfigured ? (
        <Button label="Continue with email" onPress={() => router.push('/auth')} />
      ) : (
        <Button label="Get started" onPress={() => router.push('/onboarding/name')} />
      )}
      <Button
        label="Try the offline demo"
        variant="ghost"
        style={{ marginTop: 10 }}
        onPress={() => router.push({ pathname: '/onboarding/pair', params: { demo: '1' } })}
      />
      {!session.firebaseConfigured ? (
        <Body muted small style={{ marginTop: 18 }}>
          Live pairing is off until Firebase config is added. The Maya & Jordan demo still works on this device.
        </Body>
      ) : (
        <Body muted small style={{ marginTop: 18 }}>
          The demo couple is an offline walkthrough. Real pairing uses an invite code after you sign in.
        </Body>
      )}
    </Screen>
  );
}
