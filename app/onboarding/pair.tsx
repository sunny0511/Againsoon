import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackRow, Body, Button, Card, Display, Screen, TextField } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { colors, spacing } from '@/src/theme';

export default function PairScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ demo?: string }>();
  const { state, session, startDemo, createCouple, joinWithCode, signOutUser } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | 'demo' | 'out' | null>(null);

  const signedIn = Boolean(session.user);
  const livePath = signedIn && session.firebaseConfigured;

  function goHome() {
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <BackRow
        onPress={() => {
          if (signedIn) router.replace('/onboarding');
          else router.back();
        }}
      />
      <Display size={32}>{livePath ? 'Pair up' : 'Pair up'}</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
        {livePath
          ? `Signed in as ${session.user?.email ?? 'you'}. Create a couple, or join with their invite code. You’ll both see the same proposals in realtime.`
          : 'This device can still run the offline demo. Live pairing needs an email sign-in and Firebase.'}
      </Body>

      {livePath ? (
        <>
          <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <Display size={22}>Create an invite</Display>
            <Body muted small>
              {state.draftName ? `You’ll be ${state.draftName}. ` : ''}We’ll mint a short code that expires in 7 days. Share it with your person.
            </Body>
            {error && busy === 'create' ? (
              <Body small style={{ color: colors.danger }}>
                {error}
              </Body>
            ) : null}
            <Button
              label="Create couple"
              loading={busy === 'create'}
              onPress={async () => {
                if (!state.draftName.trim()) {
                  router.push('/onboarding/name');
                  return;
                }
                setBusy('create');
                setError('');
                const result = await createCouple();
                setBusy(null);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                goHome();
              }}
            />
          </Card>

          <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <Display size={22}>Join with a code</Display>
            <TextField
              placeholder="MAPLE42"
              autoCapitalize="characters"
              value={code}
              onChangeText={(value) => {
                setCode(value);
                setError('');
              }}
            />
            {error && busy === 'join' ? (
              <Body small style={{ color: colors.danger }}>
                {error}
              </Body>
            ) : (
              <Body muted small>
                Ask them to read the code from Us. Codes expire after a week, or when they rotate it.
              </Body>
            )}
            <Button
              label="Join"
              variant="secondary"
              loading={busy === 'join'}
              onPress={async () => {
                if (!code.trim()) {
                  setError('Enter an invite code first.');
                  setBusy('join');
                  setBusy(null);
                  return;
                }
                setBusy('join');
                setError('');
                const result = await joinWithCode(code);
                setBusy(null);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                goHome();
              }}
            />
          </Card>
        </>
      ) : (
        <>
          <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <Display size={22}>Try Maya & Jordan</Display>
            <Body muted small>
              Offline demo with calendars, a pending picnic, and a little history. Switch profiles to negotiate both sides. Not the production path.
            </Body>
            <Button
              label="Open demo couple"
              variant="sage"
              loading={busy === 'demo'}
              onPress={() => {
                startDemo();
                goHome();
              }}
            />
          </Card>

          <Card style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <Display size={22}>Create a local invite</Display>
            <Body muted small>
              {state.draftName ? `You’ll be ${state.draftName}. ` : ''}This stays on this phone until Firebase is configured.
            </Body>
            <Button
              label="Create couple"
              variant="secondary"
              loading={busy === 'create'}
              onPress={async () => {
                if (!state.draftName.trim()) {
                  router.push('/onboarding/name');
                  return;
                }
                setBusy('create');
                const result = await createCouple();
                setBusy(null);
                if (result.error) {
                  setError(result.error);
                  return;
                }
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
              <Body small style={{ color: colors.danger }}>
                {error}
              </Body>
            ) : (
              <Body muted small>
                Use DEMO to join the sample couple as Jordan on this device.
              </Body>
            )}
            <Button
              label="Join"
              variant="secondary"
              loading={busy === 'join'}
              onPress={async () => {
                if (!code.trim()) {
                  setError('Enter an invite code first.');
                  return;
                }
                setBusy('join');
                const result = await joinWithCode(code);
                setBusy(null);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                goHome();
              }}
            />
          </Card>
        </>
      )}

      {livePath ? (
        <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Display size={22}>Offline demo</Display>
          <Body muted small>
            Walk the booking loop as Maya & Jordan on this phone. It is labeled and does not replace your live couple.
          </Body>
          <Button
            label="Open demo couple"
            variant="ghost"
            onPress={() => {
              startDemo();
              goHome();
            }}
          />
        </Card>
      ) : session.firebaseConfigured ? (
        <Button
          label="Continue with email instead"
          variant="ghost"
          style={{ marginTop: spacing.md }}
          onPress={() => router.push('/auth')}
        />
      ) : null}

      {signedIn ? (
        <Button
          label="Sign out"
          variant="ghost"
          style={{ marginTop: spacing.md }}
          loading={busy === 'out'}
          onPress={async () => {
            setBusy('out');
            await signOutUser();
            setBusy(null);
            router.replace('/onboarding');
          }}
        />
      ) : null}

      <View style={{ height: 12 }} />
      {params.demo === '1' ? (
        <Body muted small>
          Tip: the demo button is the fastest way to walk propose → counter → lock-in on one phone.
        </Body>
      ) : null}
    </Screen>
  );
}
