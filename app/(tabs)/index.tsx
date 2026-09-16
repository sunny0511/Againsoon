import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DemoSwitcher } from '@/src/components/DemoSwitcher';
import { LocationSharingCard } from '@/src/components/LocationSharingCard';
import { MeetCard } from '@/src/components/MeetCard';
import { AvatarStack, Body, Button, Card, Display, Label, Pill, Screen } from '@/src/components/ui';
import { WeekStrip } from '@/src/components/WeekStrip';
import {
  confirmedOnDay,
  currentPartner,
  latestRevision,
  otherPartner,
  pendingMeets,
  pendingOnDay,
  upcomingConfirmed,
} from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatCountdown, formatLongDate, formatTimeRange, sameDay, startOfDay } from '@/src/lib/dates';
import { colors, fonts, spacing } from '@/src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { hydrated, state, switchPartner } = useAppStore();
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const me = currentPartner(state);
  const them = otherPartner(state);
  const next = useMemo(() => upcomingConfirmed(state.meets), [state.meets]);
  const pending = useMemo(() => pendingMeets(state.meets), [state.meets]);
  const selectedConfirmed = confirmedOnDay(state.meets, selectedDay);
  const selectedPending = pendingOnDay(state.meets, selectedDay);
  const showingSelected = !sameDay(selectedDay, new Date());

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
              You & {them.name}
            </Body>
          </View>
          <AvatarStack left={me} right={them} />
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
            <Body muted>Once you both agree, it will live here.</Body>
          </Card>
        )}

        {next ? (
          <View style={{ marginBottom: spacing.lg }}>
            <LocationSharingCard meet={next} compact />
          </View>
        ) : null}

        <View style={styles.section}>
          <Label>The next two weeks</Label>
          <Body muted small style={{ marginBottom: 10, marginTop: 4 }}>
            Sage dots are confirmed. Gold dots are still being talked through.
          </Body>
          <WeekStrip meets={state.meets} selected={selectedDay} onSelect={setSelectedDay} />
        </View>

        {showingSelected ? (
          <View style={styles.section}>
            <Label>On this day</Label>
            {selectedConfirmed.length === 0 && selectedPending.length === 0 ? (
              <Body muted style={{ marginTop: 8 }}>
                Nothing planned yet.
              </Body>
            ) : (
              <View style={{ gap: 12, marginTop: 12 }}>
                {[...selectedConfirmed, ...selectedPending].map((meet) => (
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
        ) : null}

        <View style={styles.section}>
          <Label>Pending proposals</Label>
          {pending.length === 0 ? (
            <Body muted style={{ marginTop: 8 }}>
              No open suggestions. That’s a good time to send one.
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

        <Button
          label="Suggest a time"
          icon="sparkles-outline"
          style={{ marginTop: spacing.lg }}
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
  nextMeta: {
    fontFamily: fonts.bodyMedium,
  },
  section: {
    marginBottom: spacing.lg,
  },
});
