import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackRow, Body, Button, Card, Display, Screen, TextField, WarmMark } from '@/src/components/ui';
import { useAppStore } from '@/src/data/store';
import { colors, spacing } from '@/src/theme';

type Mode = 'signin' | 'signup' | 'link';

export default function AuthScreen() {
  const router = useRouter();
  const { session, signInWithEmail, signUpWithEmail, sendMagicLink, sendPasswordReset } = useAppStore();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (!session.firebaseConfigured) {
    return (
      <Screen>
        <BackRow onPress={() => router.back()} />
        <WarmMark />
        <Display size={32}>Firebase isn’t configured</Display>
        <Body muted style={{ marginTop: 10, marginBottom: 24 }}>
          Live pairing needs a Firebase project. The app still runs the offline demo so you can walk the booking loop on this device.
        </Body>
        <Card style={{ gap: spacing.md }}>
          <Body small muted>
            Add EXPO_PUBLIC_FIREBASE_* keys (see README), enable Email/Password and email link sign-in, then deploy firestore.rules.
          </Body>
          <Button label="Try the offline demo" variant="sage" onPress={() => router.replace('/onboarding/pair')} />
        </Card>
      </Screen>
    );
  }

  async function submit() {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'link') {
        const result = await sendMagicLink(email);
        if (result.error) setError(result.error);
        else setNotice('Check your email for a sign-in link. Open it on this device.');
        return;
      }
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('What should we call you?');
          return;
        }
        if (password.length < 6) {
          setError('Use at least 6 characters for the password.');
          return;
        }
        const result = await signUpWithEmail({ email, password, name });
        if (result.error) setError(result.error);
        else router.replace('/onboarding/pair');
        return;
      }
      const result = await signInWithEmail({ email, password });
      if (result.error) setError(result.error);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    try {
      const result = await sendPasswordReset(email);
      if (result.error) setError(result.error);
      else setNotice('Password reset sent. Check your inbox.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackRow onPress={() => router.back()} />
      <WarmMark />
      <Display size={32}>{mode === 'signup' ? 'Create your account' : mode === 'link' ? 'Email a sign-in link' : 'Welcome back'}</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
        Two phones, one couple space. Sign in so you and your person can propose, counter, and lock in in realtime.
      </Body>

      {mode === 'signup' ? (
        <TextField
          label="First name"
          placeholder="Maya"
          value={name}
          autoCapitalize="words"
          onChangeText={setName}
        />
      ) : null}

      <View style={{ height: mode === 'signup' ? spacing.md : 0 }} />
      <TextField
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setError('');
        }}
      />
      {mode !== 'link' ? (
        <View style={{ marginTop: spacing.md }}>
          <TextField
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
            autoComplete={mode === 'signup' ? 'password-new' : 'password'}
            textContentType={mode === 'signup' ? 'newPassword' : 'password'}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
          />
        </View>
      ) : (
        <Body muted small style={{ marginTop: spacing.md }}>
          We’ll email a link. Firebase needs this app’s continue URL on an authorized domain.
        </Body>
      )}

      {error ? (
        <Body small style={{ color: colors.danger, marginTop: 12 }}>
          {error}
        </Body>
      ) : notice ? (
        <Body small style={{ color: colors.sage, marginTop: 12 }}>
          {notice}
        </Body>
      ) : (
        <View style={{ height: 12 }} />
      )}

      <Button
        label={mode === 'signup' ? 'Create account' : mode === 'link' ? 'Send link' : 'Sign in'}
        loading={busy}
        style={{ marginTop: 8 }}
        onPress={submit}
      />
      {mode === 'signin' ? (
        <Button label="Email me a reset link" variant="ghost" style={{ marginTop: 10 }} onPress={resetPassword} />
      ) : null}

      <View style={{ height: spacing.lg }} />
      {mode !== 'signin' ? (
        <Button label="Sign in with password" variant="ghost" onPress={() => setMode('signin')} />
      ) : null}
      {mode !== 'signup' ? (
        <Button
          label="Create an account"
          variant={mode === 'signin' ? 'secondary' : 'ghost'}
          style={{ marginTop: 8 }}
          onPress={() => setMode('signup')}
        />
      ) : null}
      {mode !== 'link' ? (
        <Button label="Email me a sign-in link" variant="ghost" style={{ marginTop: 8 }} onPress={() => setMode('link')} />
      ) : null}
    </Screen>
  );
}
