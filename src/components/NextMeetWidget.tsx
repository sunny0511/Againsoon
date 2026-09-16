import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Label } from '@/src/components/ui';
import { latestRevision, pendingMeets, upcomingConfirmed } from '@/src/data/selectors';
import { formatCountdown, formatTimeRange } from '@/src/lib/dates';
import { colors, fonts, radii, spacing } from '@/src/theme';
import type { PersistedState } from '@/src/types';

export function NextMeetWidget({
  state,
  onPress,
}: {
  state: PersistedState;
  onPress?: () => void;
}) {
  const next = upcomingConfirmed(state.meets);
  const revision = next ? latestRevision(next) : null;
  const pending = pendingMeets(state.meets).length;
  const groceries = state.lists.find((list) => list.kind === 'groceries');
  const groceryLeft = groceries
    ? state.listItems.filter((item) => item.listId === groceries.id && !item.done).length
    : 0;
  const couple = state.couple;
  const names = couple ? `${couple.partners[0].name} & ${couple.partners[1].name}` : 'Againsoon';

  const inner = (
    <View style={styles.card}>
      <Label>Next meet</Label>
      {next && revision ? (
        <>
          <Text style={styles.when}>{formatCountdown(revision.startsAt)}</Text>
          <Body small>{formatTimeRange(revision.startsAt, revision.endsAt)}</Body>
          <Body muted small>
            {revision.location ?? 'Place still open'}
          </Body>
        </>
      ) : (
        <>
          <Text style={styles.when}>Nothing locked</Text>
          <Body muted small>
            Propose a time when you’re both free.
          </Body>
        </>
      )}
      <View style={styles.meta}>
        <Text style={styles.chip}>{names}</Text>
        {pending ? <Text style={styles.chip}>{pending} pending</Text> : null}
        {groceryLeft ? <Text style={styles.chip}>{groceryLeft} to pick up</Text> : null}
      </View>
    </View>
  );

  if (!onPress) return inner;
  return <Pressable onPress={onPress}>{inner}</Pressable>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 6,
    minWidth: 220,
  },
  when: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    lineHeight: 30,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.gold,
    backgroundColor: colors.goldSoft,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
});
