import { Redirect, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DatePrepList } from '@/src/components/DatePrepList';
import { DemoSwitcher } from '@/src/components/DemoSwitcher';
import { LocationSharingCard } from '@/src/components/LocationSharingCard';
import { MeetCard } from '@/src/components/MeetCard';
import { MemoryCard } from '@/src/components/MemoryCard';
import { NextMeetWidget } from '@/src/components/NextMeetWidget';
import { SharedListCard } from '@/src/components/SharedListCard';
import {
  AvatarStack,
  Body,
  Button,
  Card,
  Display,
  Label,
  Pill,
  ProgressBar,
  Screen,
  SectionHeader,
} from '@/src/components/ui';
import {
  coupleAccents,
  currentPartner,
  latestRevision,
  listByKind,
  otherPartner,
  pendingMeets,
  prepForMeet,
  sortedMemories,
  upcomingConfirmed,
  upcomingKeyDates,
} from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { cadenceLabel, goalProgress, nudgeCopy } from '@/src/lib/goals';
import { formatCountdown, formatLongDate, formatTimeRange } from '@/src/lib/dates';
import { colors, fonts, radii, spacing } from '@/src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { hydrated, state, switchPartner } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const accents = coupleAccents(state);
  const next = useMemo(() => upcomingConfirmed(state.meets), [state.meets]);
  const pending = useMemo(() => pendingMeets(state.meets), [state.meets]);
  const progress = useMemo(() => goalProgress(state.meets, state.dateGoal), [state.meets, state.dateGoal]);
  const nudge = them ? nudgeCopy(progress, them.name) : null;
  const keyDates = useMemo(() => upcomingKeyDates(state.keyDates).slice(0, 2), [state.keyDates]);
  const memories = useMemo(() => sortedMemories(state.memories).slice(0, 6), [state.memories]);
  const prep = next ? prepForMeet(state, next.id) : [];
  const groceries = listByKind(state, 'groceries');
  const chores = listByKind(state, 'chores');

  const couple = state.couple;
  const currentPartnerId = state.currentPartnerId;
  if (!hydrated) return null;
  if (!couple || !me || !them || !currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  const nextRevision = next ? latestRevision(next) : null;

  return (
    <Screen>
      <DemoSwitcher current={me} other={them} onSwitch={switchPartner} />

      <View style={styles.heroHeader}>
        <View style={{ flex: 1 }}>
          <Label>Againsoon</Label>
          <Display size={32} style={{ marginTop: 4 }}>
            Hey {me.name}
          </Display>
          <Body muted small style={{ marginTop: 4 }}>
            You & {them.name} · {cadenceLabel(state.dateGoal.cadence).toLowerCase()}
          </Body>
        </View>
        <AvatarStack left={me} right={them} />
      </View>

      {next && nextRevision ? (
        <Card style={styles.nextCard} onPress={() => router.push(`/meet/${next.id}`)}>
          <View style={styles.nextTop}>
            <Pill label="Next meet" tone="sage" />
            <View style={[styles.usDot, { backgroundColor: accents.us }]} />
          </View>
          <Display size={28} style={{ marginTop: 8 }}>
            {formatLongDate(nextRevision.startsAt)}
          </Display>
          <Body style={styles.nextMeta}>
            {formatTimeRange(nextRevision.startsAt, nextRevision.endsAt)} · {formatCountdown(nextRevision.startsAt)}
          </Body>
          {nextRevision.location ? (
            <Body muted>{nextRevision.location}</Body>
          ) : (
            <Body muted>Place still open</Body>
          )}
        </Card>
      ) : (
        <Card style={styles.nextCard}>
          <Pill label="Nothing locked in" tone="gold" />
          <Display size={26} style={{ marginTop: 8 }}>
            Suggest the next time
          </Display>
          <Body muted>Once you both agree, it lives here — not just on a shared calendar.</Body>
        </Card>
      )}

      {next ? (
        <View style={{ marginBottom: spacing.lg }}>
          <LocationSharingCard meet={next} compact />
        </View>
      ) : null}

      <Card style={{ gap: 10, marginBottom: spacing.lg }}>
        <View style={styles.goalHead}>
          <Label>Date nights this month</Label>
          <Text style={styles.goalCount}>
            {progress.completed} of {progress.target}
          </Text>
        </View>
        <ProgressBar ratio={progress.ratio} color={progress.behind ? colors.accent : accents.us} />
        <Body muted small>
          History counts. {progress.upcoming > 0 ? `${progress.upcoming} more already locked in ahead. ` : ''}
          Goal: {cadenceLabel(state.dateGoal.cadence).toLowerCase()}.
        </Body>
        {nudge ? (
          <Pressable onPress={() => router.push('/(tabs)/calendar')} style={styles.nudge}>
            <Text style={styles.nudgeText}>{nudge}</Text>
            <Text style={styles.nudgeLink}>Find a free window</Text>
          </Pressable>
        ) : null}
      </Card>

      {keyDates.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Coming up" action="Us" onAction={() => router.push('/(tabs)/us')} />
          <View style={{ gap: 8 }}>
            {keyDates.map((row) => (
              <Card key={row.item.id} style={styles.keyRow} onPress={() => router.push('/(tabs)/us')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.keyTitle}>{row.item.title}</Text>
                  <Body muted small>
                    {row.item.kind === 'anniversary'
                      ? 'Anniversary'
                      : row.item.kind === 'birthday'
                        ? 'Birthday'
                        : row.item.kind === 'trip'
                          ? 'Trip'
                          : 'Key date'}
                  </Body>
                </View>
                <View style={styles.countdownChip}>
                  <Text style={styles.countdownText}>{row.label}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {next && prep.length > 0 ? (
        <Card style={{ gap: 10, marginBottom: spacing.lg }}>
          <Label>Date prep</Label>
          <Body muted small>
            Just for this next meet — who books, what to bring.
          </Body>
          <DatePrepList meetId={next.id} />
        </Card>
      ) : null}

      {groceries ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Groceries" action="Us" onAction={() => router.push('/(tabs)/us')} />
          <Card>
            <SharedListCard list={groceries} compact />
          </Card>
        </View>
      ) : null}

      {chores ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Chores" action="Us" onAction={() => router.push('/(tabs)/us')} />
          <Card>
            <SharedListCard list={chores} compact />
          </Card>
        </View>
      ) : null}

      {state.widgetEnabled ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Home widget" action="Open" onAction={() => router.push('/widget')} />
          <NextMeetWidget state={state} onPress={() => router.push('/widget')} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Pending proposals"
          action={pending.length ? undefined : 'Propose'}
          onAction={pending.length ? undefined : () => router.push('/propose')}
        />
        {pending.length === 0 ? (
          <Body muted>No open suggestions. That’s a good time to send one.</Body>
        ) : (
          <View style={{ gap: 12 }}>
            {pending.map((meet) => (
              <MeetCard
                key={meet.id}
                meet={meet}
                couple={couple}
                currentPartnerId={currentPartnerId}
                onPress={() => router.push(`/meet/${meet.id}`)}
              />
            ))}
          </View>
        )}
      </View>

      {memories.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Memories" action="See all" onAction={() => router.push('/memories')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {memories.map((memory) => {
              const meet = state.meets.find((item) => item.id === memory.meetId);
              return (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  couple={couple}
                  compact
                  when={meet ? latestRevision(meet).startsAt : memory.createdAt}
                  onPress={() => router.push('/memories')}
                />
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <Button
        label="Suggest a time"
        icon="sparkles-outline"
        style={{ marginTop: spacing.sm }}
        onPress={() => router.push('/propose')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  nextCard: {
    gap: 6,
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  nextTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nextMeta: {
    fontFamily: fonts.bodyMedium,
  },
  section: {
    marginBottom: spacing.lg,
  },
  goalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCount: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
  },
  nudge: {
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: 12,
    gap: 6,
  },
  nudgeText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  nudgeLink: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.gold,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  keyTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  countdownChip: {
    backgroundColor: colors.usSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  countdownText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.gold,
  },
});
