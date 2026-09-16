import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, Pill } from '@/src/components/ui';
import { coupleAccents, latestRevision, partnerById } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatCountdown, formatShortDate, formatTimeRange } from '@/src/lib/dates';
import { withAlpha } from '@/src/lib/accents';
import { colors, fonts, spacing } from '@/src/theme';
import type { Couple, Meet } from '@/src/types';

export function MeetCard({
  meet,
  couple,
  currentPartnerId,
  onPress,
}: {
  meet: Meet;
  couple: Couple;
  currentPartnerId: string;
  onPress?: () => void;
}) {
  const { state } = useAppStore();
  const accents = coupleAccents(state);
  const revision = latestRevision(meet);
  const author = partnerById(couple, revision.authorId);
  const waiting = meet.status === 'pending' && revision.authorId === currentPartnerId;
  const needsYou = meet.status === 'pending' && revision.authorId !== currentPartnerId;

  const barColor =
    meet.status === 'confirmed' ? accents.us : author?.id === currentPartnerId ? accents.me : accents.them;
  const tone = meet.status === 'confirmed' ? 'sage' : meet.status === 'declined' ? 'danger' : needsYou ? 'accent' : 'gold';
  const label =
    meet.status === 'confirmed'
      ? 'Confirmed'
      : meet.status === 'declined'
        ? meet.withdrawn
          ? 'Withdrawn'
          : 'Declined'
        : needsYou
          ? 'Needs you'
          : 'Waiting';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={[styles.bar, { backgroundColor: barColor }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Pill label={label} tone={tone} />
          <Text style={styles.countdown}>{formatCountdown(revision.startsAt)}</Text>
        </View>
        <Text style={styles.when}>
          {formatShortDate(revision.startsAt)} · {formatTimeRange(revision.startsAt, revision.endsAt)}
        </Text>
        {revision.location ? (
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={16} color={colors.inkMuted} />
            <Body muted small style={styles.metaText}>
              {revision.location}
            </Body>
          </View>
        ) : null}
        <Body muted small>
          {meet.status === 'confirmed'
            ? 'Locked in for the two of you'
            : waiting
              ? `Waiting on ${couple.partners.find((p) => p.id !== currentPartnerId)?.name ?? 'them'}`
              : `${author?.name ?? 'They'} suggested this`}
        </Body>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bar: {
    width: 5,
    backgroundColor: withAlpha(colors.gold, 1),
  },
  body: {
    flex: 1,
    gap: 8,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countdown: {
    fontFamily: fonts.bodyMedium,
    color: colors.inkMuted,
    fontSize: 13,
  },
  when: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
  },
});
