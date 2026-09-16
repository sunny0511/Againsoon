import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { SessionBanner } from '@/src/components/SessionBanner';
import { MeetCard } from '@/src/components/MeetCard';
import { MemoryCard } from '@/src/components/MemoryCard';
import { Body, Display, EmptyState, LoadingScreen, Screen, SectionHeader } from '@/src/components/ui';
import { currentPartner, historyMeets, latestRevision, sortedMemories } from '@/src/data/selectors';
import { isCloudCoupleReady, useAppStore } from '@/src/data/store';
import { spacing } from '@/src/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { state, session } = useAppStore();
  const me = currentPartner(state);
  const history = historyMeets(state.meets);
  const memories = sortedMemories(state.memories);

  if (session.kind === 'paired' && !isCloudCoupleReady(session, state)) return <LoadingScreen />;
  if (!state.couple || !me || !state.currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  const pastTogether = history.filter((meet) => meet.status === 'confirmed');
  const didntHappen = history.filter((meet) => meet.status === 'declined');

  return (
    <Screen>
      <SessionBanner />
      <Display size={32}>Shared history</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
        Dates that happened, memories you kept, and the ones that didn’t land.
      </Body>

      {memories.length > 0 ? (
        <View style={{ marginBottom: spacing.xl, gap: 12 }}>
          <SectionHeader title="Memories" action="Feed" onAction={() => router.push('/memories')} />
          {memories.slice(0, 2).map((memory) => {
            const meet = state.meets.find((item) => item.id === memory.meetId);
            return (
              <MemoryCard
                key={memory.id}
                memory={memory}
                couple={state.couple!}
                when={meet ? latestRevision(meet).startsAt : memory.createdAt}
                onPress={() => router.push('/memories')}
              />
            );
          })}
        </View>
      ) : null}

      {pastTogether.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No past meets yet"
          body="The first one will show up here after it happens — then you can pin a memory to it."
        />
      ) : (
        <View style={{ gap: 12 }}>
          <SectionHeader title="Together" />
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
