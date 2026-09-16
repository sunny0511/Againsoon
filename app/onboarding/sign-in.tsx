import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackRow, Body, Button, Display, Screen, TextField } from '@/src/components/ui';
import { AuthError } from '@/src/data/auth';
import { useAppStore } from '@/src/data/store';
import { colors, spacing } from '@/src/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackRow onPress={() => router.back()} />
      <Display size={32}>Welcome back</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
        Sign in to the account on this device.
      </Body>
      <View style={{ gap: spacing.md }}>
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
          placeholder="Your password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        {error ? (
          <Body small style={{ color: colors.danger }}>
            {error}
          </Body>
        ) : null}
        <Button label={busy ? 'Signing in…' : 'Sign in'} disabled={busy} onPress={submit} />
        <Button label="Create an account" variant="ghost" onPress={() => router.push('/onboarding/account')} />
      </View>
    </Screen>
  );
}
