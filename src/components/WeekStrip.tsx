import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmedOnDay, pendingOnDay } from '@/src/data/selectors';
import { formatWeekday, sameDay, upcomingDays } from '@/src/lib/dates';
import { colors, fonts, radii, spacing } from '@/src/theme';
import type { Meet } from '@/src/types';

export function WeekStrip({
  meets,
  selected,
  onSelect,
}: {
  meets: Meet[];
  selected: Date;
  onSelect: (day: Date) => void;
}) {
  const days = upcomingDays(14);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((day) => {
        const active = sameDay(day, selected);
        const confirmed = confirmedOnDay(meets, day).length > 0;
        const pending = pendingOnDay(meets, day).length > 0;
        return (
          <Pressable
            key={day.toISOString()}
            onPress={() => onSelect(day)}
            style={[styles.day, active && styles.dayActive]}>
            <Text style={[styles.weekday, active && styles.activeText]}>{formatWeekday(day)}</Text>
            <Text style={[styles.date, active && styles.activeText]}>{day.getDate()}</Text>
            <View style={styles.dots}>
              {confirmed ? <View style={[styles.dot, { backgroundColor: active ? colors.white : colors.sage }]} /> : null}
              {pending ? <View style={[styles.dot, { backgroundColor: active ? colors.goldSoft : colors.gold }]} /> : null}
              {!confirmed && !pending ? <View style={styles.dotSpacer} /> : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: spacing.lg,
  },
  day: {
    width: 58,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    gap: 2,
  },
  dayActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  weekday: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  date: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  activeText: {
    color: colors.white,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    minHeight: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSpacer: {
    height: 6,
  },
});
