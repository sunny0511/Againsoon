import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Chip, Label, Legend, Segmented } from '@/src/components/ui';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  displayBusyTitle,
  expandBusyPatterns,
  hourStatus,
  mutualWindowsForRange,
  type ExpandedBusy,
} from '@/src/lib/calendar';
import {
  addDays,
  formatMonthDay,
  formatWeekday,
  hourRange,
  sameDay,
  startOfDay,
  startOfWeek,
} from '@/src/lib/dates';
import { withAlpha } from '@/src/lib/accents';
import { colors, fonts, radii, spacing } from '@/src/theme';
import type { CalendarAccount, Meet, Partner } from '@/src/types';

export function AvailabilityBoard({
  me,
  them,
  usColor,
  calendars,
  patterns,
  meets,
  viewerId,
  onProposeWindow,
  onOpenMeet,
}: {
  me: Partner;
  them: Partner;
  usColor: string;
  calendars: CalendarAccount[];
  patterns: Parameters<typeof expandBusyPatterns>[0];
  meets: Meet[];
  viewerId: string;
  onProposeWindow: (startsAt: Date, endsAt: Date) => void;
  onOpenMeet: (meetId: string) => void;
}) {
  const [mode, setMode] = useState<'week' | 'day'>('week');
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const from = startOfWeek(new Date());
  const blocks = useMemo(
    () => expandBusyPatterns(patterns, calendars, from, 14),
    [patterns, calendars, from],
  );
  const windows = useMemo(
    () => mutualWindowsForRange(me, them, blocks, meets, new Date(), 10),
    [me, them, blocks, meets],
  );

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(from, index));

  return (
    <View style={{ gap: spacing.md }}>
      <Legend me={me.hue} them={them.hue} us={usColor} meLabel="Me" themLabel="Them" />
      <Segmented
        options={[
          { id: 'week', label: 'Week' },
          { id: 'day', label: 'Day' },
        ]}
        value={mode}
        onChange={(id) => setMode(id as 'week' | 'day')}
      />

      {mode === 'week' ? (
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              selected={sameDay(day, selected)}
              me={me}
              them={them}
              usColor={usColor}
              blocks={blocks}
              meets={meets}
              onPress={() => {
                setSelected(day);
                setMode('day');
              }}
            />
          ))}
        </View>
      ) : (
        <DayTimeline
          day={selected}
          me={me}
          them={them}
          usColor={usColor}
          blocks={blocks}
          meets={meets}
          viewerId={viewerId}
          onSelectDay={setSelected}
          onProposeWindow={onProposeWindow}
          onOpenMeet={onOpenMeet}
        />
      )}

      <View>
        <Label>Mutual free windows</Label>
        <Body muted small style={{ marginTop: 4, marginBottom: 10 }}>
          Tap a slot you’re both free — it opens a propose with the time filled in.
        </Body>
        {windows.length === 0 ? (
          <Body muted small>
            No wide-open windows in the next few days. Try a later week, or peek at a specific day.
          </Body>
        ) : (
          <View style={styles.wrap}>
            {windows.map((window) => (
              <Chip
                key={window.id}
                label={`${formatWeekday(window.startsAt)} ${formatMonthDay(window.startsAt)} · ${window.label}`}
                onPress={() => onProposeWindow(window.startsAt, window.endsAt)}
                color={usColor}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function DayColumn({
  day,
  selected,
  me,
  them,
  usColor,
  blocks,
  meets,
  onPress,
}: {
  day: Date;
  selected: boolean;
  me: Partner;
  them: Partner;
  usColor: string;
  blocks: ExpandedBusy[];
  meets: Meet[];
  onPress: () => void;
}) {
  const hours = hourRange(day, DAY_START_HOUR, DAY_END_HOUR);
  return (
    <Pressable onPress={onPress} style={[styles.col, selected && styles.colSelected]}>
      <Text style={[styles.colWeek, selected && styles.colSelectedText]}>{formatWeekday(day)}</Text>
      <Text style={[styles.colDate, selected && styles.colSelectedText]}>{day.getDate()}</Text>
      <View style={styles.stack}>
        {hours.map((slot) => {
          const status = hourStatus(slot.start, slot.end, me.id, them.id, blocks, meets);
          let color = withAlpha(colors.inkSoft, 0.12);
          if (status.confirmed) color = usColor;
          else if (status.pending) color = colors.gold;
          else if (status.meBusy && status.themBusy) color = withAlpha(usColor, 0.55);
          else if (status.meBusy) color = me.hue;
          else if (status.themBusy) color = them.hue;
          else color = withAlpha(usColor, 0.22);
          return <View key={slot.start.toISOString()} style={[styles.stackCell, { backgroundColor: color }]} />;
        })}
      </View>
    </Pressable>
  );
}

function DayTimeline({
  day,
  me,
  them,
  usColor,
  blocks,
  meets,
  viewerId,
  onSelectDay,
  onProposeWindow,
  onOpenMeet,
}: {
  day: Date;
  me: Partner;
  them: Partner;
  usColor: string;
  blocks: ExpandedBusy[];
  meets: Meet[];
  viewerId: string;
  onSelectDay: (day: Date) => void;
  onProposeWindow: (startsAt: Date, endsAt: Date) => void;
  onOpenMeet: (meetId: string) => void;
}) {
  const hours = hourRange(day, DAY_START_HOUR, DAY_END_HOUR);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(day), index));

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
        {weekDays.map((item) => {
          const active = sameDay(item, day);
          return (
            <Pressable
              key={item.toISOString()}
              onPress={() => onSelectDay(item)}
              style={[styles.miniDay, active && { backgroundColor: colors.invert }]}>
              <Text style={[styles.miniWeek, active && { color: colors.onInvert }]}>{formatWeekday(item)}</Text>
              <Text style={[styles.miniDate, active && { color: colors.onInvert }]}>{item.getDate()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.laneHeader}>
        <Text style={[styles.laneTitle, { flex: 1 }]}> </Text>
        <Text style={[styles.laneTitle, { color: me.hue }]}>{me.name}</Text>
        <Text style={[styles.laneTitle, { color: them.hue }]}>{them.name}</Text>
      </View>
      {hours.map((slot) => {
        const status = hourStatus(slot.start, slot.end, me.id, them.id, blocks, meets);
        const hourLabel = slot.start.getHours() % 12 || 12;
        const suffix = slot.start.getHours() >= 12 ? 'p' : 'a';
        return (
          <Pressable
            key={slot.start.toISOString()}
            disabled={!status.mutualFree}
            onPress={() => {
              if (status.confirmed) {
                onOpenMeet(status.confirmed.id);
                return;
              }
              if (status.pending) {
                onOpenMeet(status.pending.id);
                return;
              }
              if (status.mutualFree) onProposeWindow(slot.start, slot.end);
            }}
            style={styles.hourRow}>
            <Text style={styles.hourLabel}>
              {hourLabel}
              {suffix}
            </Text>
            <LaneBlock
              color={me.hue}
              busy={status.meBusy}
              viewerId={viewerId}
              confirmed={Boolean(status.confirmed)}
              pending={Boolean(status.pending)}
              usColor={usColor}
            />
            <LaneBlock
              color={them.hue}
              busy={status.themBusy}
              viewerId={viewerId}
              confirmed={Boolean(status.confirmed)}
              pending={Boolean(status.pending)}
              usColor={usColor}
            />
          </Pressable>
        );
      })}
      <Card style={{ gap: 6, padding: spacing.md }}>
        <Body small>
          Free hours are tappable. Busy blocks from mocked calendars stay private when the partner’s calendar is set
          to “Busy”.
        </Body>
      </Card>
    </View>
  );
}

function LaneBlock({
  color,
  busy,
  viewerId,
  confirmed,
  pending,
  usColor,
}: {
  color: string;
  busy: ExpandedBusy | null;
  viewerId: string;
  confirmed: boolean;
  pending: boolean;
  usColor: string;
}) {
  if (confirmed) {
    return (
      <View style={[styles.lane, { backgroundColor: withAlpha(usColor, 0.9) }]}>
        <Text style={styles.laneText} numberOfLines={1}>
          Locked in
        </Text>
      </View>
    );
  }
  if (pending) {
    return (
      <View style={[styles.lane, { backgroundColor: withAlpha(colors.gold, 0.85) }]}>
        <Text style={styles.laneText} numberOfLines={1}>
          Pending
        </Text>
      </View>
    );
  }
  if (busy) {
    return (
      <View style={[styles.lane, { backgroundColor: withAlpha(color, 0.92) }]}>
        <Text style={styles.laneText} numberOfLines={1}>
          {displayBusyTitle(busy, viewerId)}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.lane, styles.laneFree]}>
      <Text style={[styles.laneText, { color: colors.inkSoft }]} numberOfLines={1}>
        Free
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  colSelected: {
    borderColor: colors.invert,
    backgroundColor: colors.cardElevated,
  },
  colWeek: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  colDate: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
  },
  colSelectedText: {
    color: colors.ink,
  },
  stack: {
    width: '70%',
    gap: 1,
    marginTop: 4,
  },
  stackCell: {
    height: 7,
    borderRadius: 2,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChips: {
    gap: 8,
    paddingRight: 8,
  },
  miniDay: {
    width: 52,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  miniWeek: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  miniDate: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
  },
  laneHeader: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 36,
  },
  laneTitle: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    textAlign: 'center',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourLabel: {
    width: 28,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.inkSoft,
  },
  lane: {
    flex: 1,
    minHeight: 28,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  laneFree: {
    backgroundColor: withAlpha(colors.ink, 0.04),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
  },
  laneText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.onAccent,
  },
});
