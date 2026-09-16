import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Label } from '@/src/components/ui';
import { formatTimeRange, formatWeekday, sameDay, setTime, startOfDay, upcomingDays } from '@/src/lib/dates';
import { colors, fonts, radii, spacing } from '@/src/theme';
import type { ProposeInput } from '@/src/types';

const SLOTS = [
  { label: 'Brunch', hours: 11, minutes: 0 },
  { label: 'Lunch', hours: 13, minutes: 0 },
  { label: 'Afternoon', hours: 15, minutes: 30 },
  { label: 'Golden hour', hours: 17, minutes: 30 },
  { label: 'Dinner', hours: 19, minutes: 0 },
  { label: 'Late', hours: 21, minutes: 0 },
] as const;

const WINDOWS = [
  { label: 'Exact time', hours: 0 },
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: 'Evening', hours: 3 },
] as const;

function matchingSlotIndex(startsAt?: string): number {
  if (!startsAt) return 4;
  const date = new Date(startsAt);
  return SLOTS.findIndex((slot) => slot.hours === date.getHours() && slot.minutes === date.getMinutes());
}

export function WhenPicker({
  value,
  onChange,
}: {
  value: ProposeInput | null;
  onChange: (value: ProposeInput) => void;
}) {
  const initialCustom = matchingSlotIndex(value?.startsAt) < 0 && Boolean(value?.startsAt);
  const [day, setDay] = useState(() => startOfDay(value?.startsAt ? new Date(value.startsAt) : new Date()));
  const [slotIndex, setSlotIndex] = useState(() => {
    const found = matchingSlotIndex(value?.startsAt);
    return found >= 0 ? found : 4;
  });
  const [useCustom, setUseCustom] = useState(initialCustom);
  const [windowHours, setWindowHours] = useState(() => {
    if (!value?.startsAt || !value.endsAt) return initialCustom ? 0 : 0;
    const diff = (new Date(value.endsAt).getTime() - new Date(value.startsAt).getTime()) / 3600000;
    if (initialCustom) return 0;
    if (diff >= 2.5) return 3;
    if (diff >= 1.5) return 2;
    if (diff >= 0.5) return 1;
    return 0;
  });

  const customStart = value?.startsAt ? new Date(value.startsAt) : null;
  const days = useMemo(() => upcomingDays(16), []);

  function emit(nextDay = day, nextSlot = slotIndex, nextWindow = windowHours, custom = useCustom) {
    if (custom && value?.startsAt) {
      const original = new Date(value.startsAt);
      const start = setTime(nextDay, original.getHours(), original.getMinutes());
      const duration = value.endsAt
        ? new Date(value.endsAt).getTime() - new Date(value.startsAt).getTime()
        : 0;
      onChange({
        startsAt: start.toISOString(),
        endsAt: duration > 0 ? new Date(start.getTime() + duration).toISOString() : undefined,
        location: value?.location,
        notes: value?.notes,
        wishlistItemId: value?.wishlistItemId,
      });
      return;
    }
    const slot = SLOTS[nextSlot];
    const start = setTime(nextDay, slot.hours, slot.minutes);
    const endsAt = nextWindow > 0 ? new Date(start.getTime() + nextWindow * 3600000).toISOString() : undefined;
    onChange({
      startsAt: start.toISOString(),
      endsAt,
      location: value?.location,
      notes: value?.notes,
      wishlistItemId: value?.wishlistItemId,
    });
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <Label>Day</Label>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          style={{ marginTop: 10 }}>
          {days.map((item) => {
            const active = sameDay(item, day);
            const today = sameDay(item, new Date());
            return (
              <Pressable
                key={item.toISOString()}
                onPress={() => {
                  setDay(item);
                  emit(item, slotIndex, windowHours, useCustom);
                }}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipKicker, active && styles.chipActiveText]}>
                  {today ? 'Today' : formatWeekday(item)}
                </Text>
                <Text style={[styles.chipTitle, active && styles.chipActiveText]}>{item.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View>
        <Label>Time of day</Label>
        <View style={styles.wrap}>
          {initialCustom && customStart ? (
            <Pressable
              onPress={() => {
                setUseCustom(true);
                emit(day, slotIndex, windowHours, true);
              }}
              style={[styles.slot, useCustom && styles.chipActive, { width: '100%' }]}>
              <Text style={[styles.slotLabel, useCustom && styles.chipActiveText]}>This window</Text>
              <Text style={[styles.slotTime, useCustom && styles.chipActiveText]}>
                {formatTimeRange(value?.startsAt ?? '', value?.endsAt)}
              </Text>
            </Pressable>
          ) : null}
          {SLOTS.map((slot, index) => {
            const active = !useCustom && index === slotIndex;
            return (
              <Pressable
                key={slot.label}
                onPress={() => {
                  setUseCustom(false);
                  setSlotIndex(index);
                  emit(day, index, windowHours, false);
                }}
                style={[styles.slot, active && styles.chipActive]}>
                <Text style={[styles.slotLabel, active && styles.chipActiveText]}>{slot.label}</Text>
                <Text style={[styles.slotTime, active && styles.chipActiveText]}>
                  {formatClock(slot.hours, slot.minutes)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!useCustom ? (
        <View>
          <Label>Exact or a window</Label>
          <View style={styles.wrap}>
            {WINDOWS.map((item) => {
              const active = item.hours === windowHours;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    setWindowHours(item.hours);
                    emit(day, slotIndex, item.hours, false);
                  }}
                  style={[styles.window, active && styles.chipActive]}>
                  <Text style={[styles.windowLabel, active && styles.chipActiveText]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Body muted small style={{ marginTop: 8 }}>
            A window is useful when the exact minute doesn’t matter — “sometime after dinner.”
          </Body>
        </View>
      ) : (
        <Body muted small>
          Keeping the time you picked from the calendar. Choose a named slot above if you’d rather shift it.
        </Body>
      )}
    </View>
  );
}

function formatClock(hours: number, minutes: number): string {
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return minutes === 0 ? `${h} ${suffix}` : `${h}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    width: 62,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.invert,
    borderColor: colors.invert,
  },
  chipKicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  chipTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  chipActiveText: {
    color: colors.onInvert,
  },
  slot: {
    width: '48%',
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  slotLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
  },
  slotTime: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  window: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  windowLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
});
