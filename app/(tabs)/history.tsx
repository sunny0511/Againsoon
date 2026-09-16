import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { MeetCard } from '@/src/components/MeetCard';
import { Body, Display, Screen } from '@/src/components/ui';
import { currentPartner, historyMeets } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';

export default function HistoryScreen() {
  const router = useRouter();
  const { state } = useAppStore();
  const me = currentPartner(state);
  const history = historyMeets(state.meets);

  if (!state.couple || !me || !state.currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  const pastTogether = history.filter((meet) => meet.status === 'confirmed');
  const didntHappen = history.filter((meet) => meet.status === 'declined');

  return (
    <Screen>
        <Display size={32}>Shared history</Display>
        <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
          Past meets you’ve locked in, plus the ones that didn’t land.
        </Body>

        {pastTogether.length === 0 ? (
          <Body muted>No past meets yet — the first one will show up here after it happens.</Body>
        ) : (
          <View style={{ gap: 12 }}>
            {pastTogether.map((meet) => (
              <MeetCard
                key={meet.id}
                meet={meet}
                couple={state.couple!}
                currentPartnerId={state.currentPartnerId!}
                onPress={() => router.push(`/meet/${meet.id}`)}
              />
            ))}
          </View>
        )}

        {didntHappen.length > 0 ? (
          <View style={{ marginTop: 28, gap: 12 }}>
            <Display size={22}>Didn’t happen</Display>
            {didntHappen.map((meet) => (
              <MeetCard
                key={meet.id}
                meet={meet}
                couple={state.couple!}
                currentPartnerId={state.currentPartnerId!}
                onPress={() => router.push(`/meet/${meet.id}`)}
              />
            ))}
          </View>
        ) : null}
    </Screen>
  );
}
