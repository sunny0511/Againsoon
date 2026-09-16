import { useRouter } from 'expo-router';

import { BackRow, Body, Display, Screen } from '@/src/components/ui';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <Screen>
      <BackRow onPress={() => router.back()} />
      <Display size={32}>Terms of Use</Display>
      <Body muted small style={{ marginTop: 8, marginBottom: 18 }}>
        Last updated 16 September 2026
      </Body>
      <Body style={{ marginBottom: 14 }}>
        Againsoon helps two people propose, counter, and lock in a time to meet. By creating an account you agree to these terms.
      </Body>
      <Body style={{ marginBottom: 14 }}>
        This version keeps couple data on your device. It is not synced to another phone yet. Do not rely on it as the only copy of important plans.
      </Body>
      <Body style={{ marginBottom: 14 }}>
        You are responsible for the email and password you choose. You can delete the account in the app. Don’t use Againsoon to harass anyone or break the law.
      </Body>
      <Body style={{ marginBottom: 14 }}>
        Assist may call a cloud language model (with an on-device fallback). Maps use third-party place search. Suggestions are not professional advice. “Explore sample couple” is a fictional sandbox.
      </Body>
      <Body muted small>
        Contact: hello@againsoon.app
      </Body>
    </Screen>
  );
}
