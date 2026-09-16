import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackRow, Body, Button, Card, Display, Screen, TextField } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { spacing } from '@/src/theme';

export default function PairScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ demo?: string }>();
  const { account, state, startDemo, createCouple, joinWithCode, setDraftName } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function goHome() {
    router.replace('/(tabs)');
  }

  async function openDemo() {
    setBusy(true);
    try {
      await startDemo();
      goHome();
    } finally {
      setBusy(false);
    }
  }

  const firstName = state.draftName || account?.name || '';

  return (
    <Screen>
        <BackRow onPress={() => router.back()} />
        <Display size={32}>Pair up</Display>
        <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
          {account && !account.isSandbox
            ? `Signed in as ${account.email}. Create a couple or join with an invite code. Data stays on this device.`
            : 'Create a couple, join with a code, or open the sample couple to walk the booking loop.'}
        </Body>

        <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
          <Display size={22}>Try Maya & Jordan</Display>
          <Body muted small>
            Sample calendars, a pending picnic, lists, and a lock-in. Switch profiles to negotiate both sides. App Review can use this path.
          </Body>
          <Button
            label={busy ? 'Opening…' : 'Open sample couple'}
            variant="sage"
            disabled={busy}
            onPress={openDemo}
          />
        </Card>

        <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
          <Display size={22}>Create an invite</Display>
          <Body muted small>
            {firstName ? `You’ll be ${firstName}. ` : ''}We’ll generate a short code your person can type on this phone.
          </Body>
          <Button
            label="Create couple"
            onPress={() => {
              if (!account) {
                router.push('/onboarding/account');
                return;
              }
              if (!state.draftName.trim() && !account.name) {
                router.push('/onboarding/name');
                return;
              }
              if (!state.draftName.trim() && account.name) {
                setDraftName(account.name);
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
              if (!account) {
                router.push('/onboarding/account');
                return;
              }
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
            Tip: Open sample couple is the fastest way to walk propose → counter → lock-in.
          </Body>
        ) : null}
    </Screen>
  );
}
