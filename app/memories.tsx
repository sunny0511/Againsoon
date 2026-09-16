import { Redirect, useRouter } from 'expo-router';

import { MemoryCard } from '@/src/components/MemoryCard';
import { BackRow, Body, Display, EmptyState, Screen } from '@/src/components/ui';
import { currentPartner, latestRevision, sortedMemories } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { spacing } from '@/src/theme';
import { View } from 'react-native';

export default function MemoriesScreen() {
  const router = useRouter();
  const { state } = useAppStore();
  const me = currentPartner(state);
  const memories = sortedMemories(state.memories);

  if (!state.couple || !me) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen>
      <BackRow onPress={() => router.back()} />
      <Display size={32}>Memories</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
        Short notes from dates that already happened. Add more from a past meet in History.
      </Body>
      {memories.length === 0 ? (
        <EmptyState
          icon="images-outline"
          title="Nothing saved yet"
          body="After a confirmed meet passes, open it and leave a note — a photo is optional."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {memories.map((memory) => {
            const meet = state.meets.find((item) => item.id === memory.meetId);
            return (
              <MemoryCard
                key={memory.id}
                memory={memory}
                couple={state.couple!}
                when={meet ? latestRevision(meet).startsAt : memory.createdAt}
                onPress={() => meet && router.push(`/meet/${meet.id}`)}
              />
            );
          })}
        </View>
      )}
    </Screen>
  );
}
