import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackRow, Body, Button, Card, Display, Screen, TextField } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { spacing } from '@/src/theme';

export default function PairScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ demo?: string }>();
  const { state, startDemo, createCouple, joinWithCode } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function goHome() {
    router.replace('/(tabs)');
  }

  return (
    <Screen>
        <BackRow onPress={() => router.back()} />
        <Display size={32}>Pair up</Display>
        <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
          In real life this would send an invite. For this MVP, everything lives on this device — including a two-person demo.
        </Body>

        <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
          <Display size={22}>Try Maya & Jordan</Display>
          <Body muted small>
            Preloaded with a pending picnic, a confirmed dinner, and a little history. Switch profiles to negotiate both sides.
          </Body>
          <Button
            label="Open demo couple"
            variant="sage"
            onPress={() => {
              startDemo();
              goHome();
            }}
          />
        </Card>

        <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
          <Display size={22}>Create an invite</Display>
          <Body muted small>
            {state.draftName ? `You’ll be ${state.draftName}. ` : ''}We’ll generate a short code your person can type on this phone.
          </Body>
          <Button
            label="Create couple"
            onPress={() => {
              if (!state.draftName.trim()) {
                router.push('/onboarding/name');
                return;
              }
              createCouple();
              goHome();
            }}
          />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Display size={22}>Join with a code</Display>
          <TextField
            placeholder="HONEY42 or DEMO"
            autoCapitalize="characters"
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setError('');
            }}
          />
          {error ? (
            <Body small style={{ color: '#9B3A3A' }}>
              {error}
            </Body>
          ) : (
            <Body muted small>
              Use DEMO to join the sample couple as Jordan.
            </Body>
          )}
          <Button
            label="Join"
            variant="secondary"
            onPress={() => {
              if (!code.trim()) {
                setError('Enter an invite code first.');
                return;
              }
              joinWithCode(code);
              goHome();
            }}
          />
        </Card>
        <View style={{ height: 12 }} />
        {params.demo === '1' ? (
          <Body muted small>
            Tip: the demo button above is the fastest way to walk the booking loop.
          </Body>
        ) : null}
    </Screen>
  );
}
