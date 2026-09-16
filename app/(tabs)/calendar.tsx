import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DemoSwitcher } from '@/src/components/DemoSwitcher';
import { Body, Button, Card, Display, Label, Screen, TextField } from '@/src/components/ui';
import { confirmedOnDay, currentPartner, latestRevision, otherPartner, pendingOnDay } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import {
  addMonths,
  formatMonthTitle,
  formatTimeRange,
  formatWeekday,
  monthCells,
  sameDay,
  setTime,
  startOfDay,
  startOfMonth,
} from '@/src/lib/dates';
import { busyOnDay, isSlotFree, visibleBusyTitle } from '@/src/lib/spark';
import { colors, fonts, radii, spacing } from '@/src/theme';

export default function CalendarScreen() {
  const router = useRouter();
  const { state, switchPartner, addBusy } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [busyTitle, setBusyTitle] = useState('Busy');
  const cells = useMemo(() => monthCells(anchor), [anchor]);

  if (!state.couple || !me || !them || !state.currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  const meetsToday = [...confirmedOnDay(state.meets, selected), ...pendingOnDay(state.meets, selected)];
  const mine = busyOnDay(state.busyBlocks, selected, me.id);
  const theirs = busyOnDay(state.busyBlocks, selected, them.id);
  const dinner = setTime(selected, 19, 0);
  const dinnerEnd = setTime(selected, 21, 0);
  const dinnerFree = dinner.getTime() > Date.now() && isSlotFree(state, dinner, dinnerEnd);

  return (
    <Screen>
      <DemoSwitcher current={me} other={them} onSwitch={switchPartner} />
      <Display size={32}>Both calendars</Display>
      <Body muted style={{ marginTop: 6, marginBottom: 18 }}>
        Honey is you. Lagoon is {them.name}. Gold is the two of you. Busy blocks can hide titles from them.
      </Body>

      <View style={styles.monthNav}>
        <Pressable onPress={() => setAnchor(addMonths(anchor, -1))}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Display size={22}>{formatMonthTitle(anchor)}</Display>
        <Pressable onPress={() => setAnchor(addMonths(anchor, 1))}>
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={`${d}${i}`} style={styles.weekLab}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const active = sameDay(day, selected);
          const hasUs = confirmedOnDay(state.meets, day).length + pendingOnDay(state.meets, day).length > 0;
          const hasMe = busyOnDay(state.busyBlocks, day, me.id).length > 0;
          const hasThem = busyOnDay(state.busyBlocks, day, them.id).length > 0;
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => setSelected(day)}
              style={[styles.cell, active && styles.cellActive, !inMonth && { opacity: 0.35 }]}>
              <Text style={[styles.cellNum, active && styles.cellNumActive]}>{day.getDate()}</Text>
              <View style={styles.dots}>
                {hasMe ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
                {hasThem ? <View style={[styles.dot, { backgroundColor: colors.sage }]} /> : null}
                {hasUs ? <View style={[styles.dot, { backgroundColor: colors.gold }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Label style={{ marginTop: 18 }}>{formatWeekday(selected)} {selected.getDate()}</Label>
      {dinnerFree ? (
        <Card style={{ marginTop: 10, gap: 8 }}>
          <Body>You’re both free at 7 PM.</Body>
          <Button
            label="Propose dinner"
            variant="sage"
            onPress={() =>
              router.push({
                pathname: '/propose',
                params: { startsAt: dinner.toISOString() },
              })
            }
          />
        </Card>
      ) : null}

      <View style={{ marginTop: 12, gap: 8 }}>
        {meetsToday.map((meet) => {
          const rev = latestRevision(meet);
          return (
            <Card key={meet.id} onPress={() => router.push(`/meet/${meet.id}`)}>
              <Label>{meet.status === 'confirmed' ? 'Together' : 'Pending'}</Label>
              <Body>
                {formatTimeRange(rev.startsAt, rev.endsAt)} · {rev.location ?? 'Open place'}
              </Body>
            </Card>
          );
        })}
        {mine.map((block) => (
          <Card key={block.id}>
            <Label>You</Label>
            <Body>
              {formatTimeRange(block.startsAt, block.endsAt)} · {visibleBusyTitle(block, me.id)}
            </Body>
          </Card>
        ))}
        {theirs.map((block) => (
          <Card key={block.id}>
            <Label>{them.name}</Label>
            <Body>
              {formatTimeRange(block.startsAt, block.endsAt)} · {visibleBusyTitle(block, me.id)}
            </Body>
          </Card>
        ))}
        {meetsToday.length === 0 && mine.length === 0 && theirs.length === 0 ? (
          <Body muted>Nothing on this day yet.</Body>
        ) : null}
      </View>

      <Card style={{ marginTop: 18, gap: 12 }}>
        <Display size={20}>Mark yourself busy</Display>
        <TextField value={busyTitle} onChangeText={setBusyTitle} placeholder="Work, class, family…" />
        <Button
          label="Add 7–9 PM as busy (details hidden)"
          variant="secondary"
          onPress={() => {
            addBusy({
              partnerId: me.id,
              startsAt: setTime(selected, 19, 0).toISOString(),
              endsAt: setTime(selected, 21, 0).toISOString(),
              title: busyTitle.trim() || 'Busy',
              visibility: 'busy',
            });
          }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nav: {
    color: colors.ink,
    fontSize: 28,
    paddingHorizontal: 8,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekLab: {
    width: '14.28%',
    textAlign: 'center',
    color: colors.inkSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  cellActive: {
    backgroundColor: colors.invert,
  },
  cellNum: {
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    fontSize: 14,
  },
  cellNumActive: {
    color: colors.onInvert,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
