import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BackRow, Body, Button, Display, Screen, TextField } from '@/src/components/ui';
import { AuthError } from '@/src/data/auth';
import { useAppStore } from '@/src/data/store';
import { colors, spacing } from '@/src/theme';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { signUp } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await signUp({
        email,
        name,
        password,
        confirm,
        acceptedTerms: accepted,
      });
      router.replace('/');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not create that account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackRow onPress={() => router.back()} />
      <Display size={32}>Create your account</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
        Email and a password, then you’ll pair with your person. This version keeps the couple on this device.
      </Body>
      <View style={{ gap: spacing.md }}>
        <TextField
          label="First name"
          placeholder="Maya"
          autoComplete="given-name"
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Email"
          placeholder="you@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
        />
        <TextField
          label="Confirm password"
          placeholder="Type it again"
          secureTextEntry
          autoComplete="new-password"
          value={confirm}
          onChangeText={setConfirm}
        />
        <Pressable onPress={() => setAccepted((value) => !value)} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: accepted ? colors.gold : colors.canvasDeep,
              marginTop: 2,
            }}
          />
          <Text style={{ flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 }}>
            I agree to the{' '}
            <Text style={{ color: colors.accentDeep }} onPress={() => router.push('/legal/privacy')}>
              Privacy Policy
            </Text>{' '}
            and{' '}
            <Text style={{ color: colors.accentDeep }} onPress={() => router.push('/legal/terms')}>
              Terms
            </Text>
            .
          </Text>
        </Pressable>
        {error ? (
          <Body small style={{ color: colors.danger }}>
            {error}
          </Body>
        ) : null}
        <Button label={busy ? 'Creating…' : 'Create account'} disabled={busy} onPress={submit} />
        <Button label="I already have an account" variant="ghost" onPress={() => router.push('/onboarding/sign-in')} />
      </View>
    </Screen>
  );
}
