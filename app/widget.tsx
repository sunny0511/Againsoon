import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { NextMeetWidget } from '@/src/components/NextMeetWidget';
import { BackRow, Body, Display, Screen } from '@/src/components/ui';
import { currentPartner, upcomingConfirmed } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { spacing } from '@/src/theme';

export default function WidgetScreen() {
  const router = useRouter();
  const { state } = useAppStore();
  const me = currentPartner(state);

  if (!state.couple || !me) {
    return <Redirect href="/onboarding" />;
  }

  const next = upcomingConfirmed(state.meets);

  return (
    <Screen>
      <BackRow onPress={() => router.back()} />
      <Display size={28}>Home widget</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 20 }}>
        Pin this screen to your home screen (Share → Add to Home Screen on iOS, or the browser menu on Android). It stays in sync with the next locked-in meet.
      </Body>
      <NextMeetWidget
        state={state}
        onPress={() => {
          if (next) router.push(`/meet/${next.id}`);
          else router.replace('/(tabs)');
        }}
      />
      <View style={{ height: spacing.lg }} />
      <Body muted small>
        Native iOS and Android widgets can render this same next-meet, grocery, and pending payload once a store build ships.
      </Body>
    </Screen>
  );
}
