import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DemoSwitcher } from '@/src/components/DemoSwitcher';
import { LocationSharingCard } from '@/src/components/LocationSharingCard';
import { MeetCard } from '@/src/components/MeetCard';
import { AvatarStack, Body, Button, Card, Display, Label, Pill, Screen } from '@/src/components/ui';
import {
  currentPartner,
  dateGoalLabel,
  datesThisCycle,
  latestRevision,
  nextKeyDate,
  otherPartner,
  pendingMeets,
  upcomingConfirmed,
} from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatCountdown, formatLongDate, formatTimeRange } from '@/src/lib/dates';
import { colors, fonts, radii, spacing } from '@/src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { hydrated, state, switchPartner } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const next = upcomingConfirmed(state.meets);
  const pending = pendingMeets(state.meets);
  const cycle = datesThisCycle(state.meets, state.dateGoal.cadenceDays);
  const key = nextKeyDate(state.keyDates);
  const couple = state.couple;
  const currentPartnerId = state.currentPartnerId;

  if (!hydrated) return null;
  if (!couple || !me || !them || !currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  const nextRevision = next ? latestRevision(next) : null;
  const goalTarget = 1;
  const goalPct = Math.min(1, cycle.length / goalTarget);

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
            You & {them.name}
          </Body>
        </View>
        <AvatarStack left={me} right={them} />
      </View>

      <View style={styles.row}>
        <Card style={styles.mini} onPress={() => router.push('/you')}>
          <Label>Date goal</Label>
          <Display size={22} style={{ marginTop: 6 }}>
            {cycle.length}/{goalTarget}
          </Display>
          <Body muted small>
            {dateGoalLabel(state.dateGoal.cadenceDays)}
          </Body>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(goalPct * 100)}%` as `${number}%` }]} />
          </View>
        </Card>
        {key ? (
          <Card style={styles.mini} onPress={() => router.push('/together')}>
            <Label>Countdown</Label>
            <Display size={22} style={{ marginTop: 6 }}>
              {formatCountdown(key.when.toISOString())}
            </Display>
            <Body muted small>
              {key.item.title}
            </Body>
          </Card>
        ) : null}
      </View>

      {next && nextRevision ? (
        <Card style={styles.nextCard} onPress={() => router.push(`/meet/${next.id}`)}>
          <Pill label="Next meet" tone="sage" />
          <Display size={28} style={{ marginTop: 8 }}>
            {formatLongDate(nextRevision.startsAt)}
          </Display>
          <Body style={styles.nextMeta}>
            {formatTimeRange(nextRevision.startsAt, nextRevision.endsAt)} · {formatCountdown(nextRevision.startsAt)}
          </Body>
          {nextRevision.location ? <Body muted>{nextRevision.location}</Body> : <Body muted>Place still open</Body>}
        </Card>
      ) : (
        <Card style={styles.nextCard}>
          <Pill label="Nothing locked in" tone="gold" />
          <Display size={26} style={{ marginTop: 8 }}>
            Suggest the next time
          </Display>
          <Body muted>Spark can find a pocket you’re both free.</Body>
        </Card>
      )}

      {next ? (
        <View style={{ marginBottom: spacing.lg }}>
          <LocationSharingCard meet={next} compact />
        </View>
      ) : null}

      <View style={styles.section}>
        <Label>Pending proposals</Label>
        {pending.length === 0 ? (
          <Body muted style={{ marginTop: 8 }}>
            No open suggestions.
          </Body>
        ) : (
          <View style={{ gap: 12, marginTop: 12 }}>
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

      <Button label="Suggest a time" icon="sparkles-outline" onPress={() => router.push('/propose')} />
      <Pressable onPress={() => router.push('/ideas')} style={{ marginTop: 14, alignSelf: 'center' }}>
        <Text style={styles.link}>Or let Spark find a time you’re both free</Text>
      </Pressable>
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
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  mini: {
    flex: 1,
    padding: 14,
    gap: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.cardBorder,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: colors.sage,
  },
  nextCard: {
    gap: 6,
    marginBottom: spacing.lg,
  },
  nextMeta: {
    fontFamily: fonts.bodyMedium,
  },
  section: {
    marginBottom: spacing.lg,
  },
  link: {
    fontFamily: fonts.bodyMedium,
    color: colors.accentDeep,
    fontSize: 14,
  },
});
