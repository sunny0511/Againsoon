import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DatePrepList } from '@/src/components/DatePrepList';
import { LocationSharingCard } from '@/src/components/LocationSharingCard';
import { LockInMoment } from '@/src/components/LockInMoment';
import { MemoryCard } from '@/src/components/MemoryCard';
import {
  BackRow,
  Body,
  Button,
  Card,
  Display,
  Label,
  LoadingScreen,
  Pill,
  Screen,
  TextField,
} from '@/src/components/ui';
import { canRespond, isWaitingOnOther, latestRevision, memoriesForMeet, partnerById } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatCountdown, formatLongDate, formatTimeRange, isInPast } from '@/src/lib/dates';
import { colors, fonts, spacing } from '@/src/theme';

export default function MeetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, accept, decline, withdraw, cancelConfirmed, addMemory } = useAppStore();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineNote, setDeclineNote] = useState('');
  const [calendarHint, setCalendarHint] = useState(false);
  const [giveUp, setGiveUp] = useState(false);
  const [lockedIn, setLockedIn] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setGiveUp(true), 400);
    return () => clearTimeout(timer);
  }, [id]);

  const meet = state.meets.find((item) => item.id === id);
  if (!meet || !state.couple || !state.currentPartnerId) {
    if (!giveUp) return <LoadingScreen />;
    return <Redirect href="/(tabs)" />;
  }

  const revision = latestRevision(meet);
  const them = state.couple.partners.find((partner) => partner.id !== state.currentPartnerId);
  const actionable = canRespond(meet, state.currentPartnerId);
  const waiting = isWaitingOnOther(meet, state.currentPartnerId);
  const past = meet.status === 'confirmed' && isInPast(revision.startsAt);
  const memories = memoriesForMeet(state.memories, meet.id);

  const statusTone = meet.status === 'confirmed' ? 'sage' : meet.status === 'declined' ? 'danger' : actionable ? 'accent' : 'gold';
  const statusLabel =
    meet.status === 'confirmed'
      ? past
        ? 'You were together'
        : 'Locked in'
      : meet.status === 'declined'
        ? meet.withdrawn
          ? 'Withdrawn'
          : 'Declined'
        : actionable
          ? `Waiting on you`
          : `Waiting on ${them?.name ?? 'them'}`;

  async function pickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      setPhotoUri(undefined);
    }
  }

  async function lockIn() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // web / unsupported
    }
    accept(meet!.id);
    setLockedIn(true);
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <BackRow onPress={() => router.back()} />
        <Pill label={statusLabel} tone={statusTone} />
        <Display size={34} style={{ marginTop: 12 }}>
          {formatLongDate(revision.startsAt)}
        </Display>
        <Text style={styles.time}>{formatTimeRange(revision.startsAt, revision.endsAt)}</Text>
        <Body muted style={{ marginTop: 6 }}>
          {formatCountdown(revision.startsAt)}
        </Body>

        <Card style={{ marginTop: spacing.lg, gap: 10 }}>
          {revision.location ? (
            <Row icon="location-outline" label={revision.location} />
          ) : (
            <Row icon="map-outline" label="Place still open" muted />
          )}
          {revision.notes ? <Row icon="chatbubble-ellipses-outline" label={revision.notes} /> : null}
        </Card>

        {meet.status === 'confirmed' && !past ? (
          <View style={{ marginTop: spacing.lg }}>
            <LocationSharingCard meet={meet} />
          </View>
        ) : null}

        {meet.status === 'confirmed' && !past ? (
          <Card style={{ marginTop: spacing.lg, gap: 10 }}>
            <Label>Date prep</Label>
            <DatePrepList meetId={meet.id} />
          </Card>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Label>How you got here</Label>
          <View style={{ marginTop: 12, gap: 10 }}>
            {meet.revisions.map((item, index) => {
              const author = partnerById(state.couple, item.authorId);
              const latest = index === meet.revisions.length - 1;
              return (
                <Card key={item.id} style={[styles.thread, latest && styles.threadLatest]}>
                  <Body small style={styles.threadWho}>
                    {author?.name ?? 'Someone'} · {index === 0 ? 'suggested' : 'countered'}
                  </Body>
                  <Body>
                    {formatLongDate(item.startsAt)} · {formatTimeRange(item.startsAt, item.endsAt)}
                  </Body>
                  {item.location ? (
                    <Body muted small>
                      {item.location}
                    </Body>
                  ) : null}
                  {item.notes ? (
                    <Body muted small>
                      “{item.notes}”
                    </Body>
                  ) : null}
                </Card>
              );
            })}
            {meet.status === 'declined' && meet.declineNote ? (
              <Card style={styles.thread}>
                <Body small style={styles.threadWho}>
                  {partnerById(state.couple, meet.declinedById ?? '')?.name ?? 'Someone'} · closed this
                </Body>
                <Body muted>“{meet.declineNote}”</Body>
              </Card>
            ) : null}
          </View>
        </View>

        {past ? (
          <Card style={{ marginTop: spacing.xl, gap: 12 }}>
            <Display size={22}>Memory</Display>
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} couple={state.couple!} when={revision.startsAt} />
            ))}
            <TextField
              label="A short note"
              placeholder="The river was silver."
              value={memoryNote}
              onChangeText={setMemoryNote}
              multiline
            />
            <Button
              label={photoUri ? 'Photo attached' : 'Add a photo (optional)'}
              variant="ghost"
              icon="image-outline"
              onPress={pickPhoto}
            />
            <Button
              label="Save memory"
              variant="secondary"
              disabled={!memoryNote.trim()}
              onPress={() => {
                addMemory({
                  meetId: meet.id,
                  note: memoryNote.trim(),
                  photoUri,
                  photoKind: photoUri ? 'custom' : 'lantern',
                });
                setMemoryNote('');
                setPhotoUri(undefined);
              }}
            />
          </Card>
        ) : null}

        {actionable ? (
          <View style={{ marginTop: spacing.xl, gap: 10 }}>
            <Button label="This time works" variant="sage" icon="checkmark" onPress={lockIn} />
            <Button
              label="Suggest a different time"
              variant="secondary"
              onPress={() => router.push({ pathname: '/propose', params: { counterOf: meet.id } })}
            />
            {declineOpen ? (
              <Card style={{ gap: 12 }}>
                <TextField
                  label="A kind note (optional)"
                  placeholder={`That night is tricky for me.`}
                  value={declineNote}
                  onChangeText={setDeclineNote}
                  multiline
                />
                <Button
                  label="Send decline"
                  variant="danger"
                  onPress={() => {
                    decline(meet.id, declineNote);
                    setDeclineOpen(false);
                  }}
                />
              </Card>
            ) : (
              <Button label="Can't make it" variant="ghost" onPress={() => setDeclineOpen(true)} />
            )}
          </View>
        ) : null}

        {waiting ? (
          <View style={{ marginTop: spacing.xl, gap: 10 }}>
            <Body muted>
              {them?.name ?? 'They'} hasn’t answered yet. You can wait, or withdraw this suggestion.
            </Body>
            <Button label="Withdraw suggestion" variant="ghost" onPress={() => withdraw(meet.id)} />
          </View>
        ) : null}

        {meet.status === 'confirmed' && !past ? (
          <View style={{ marginTop: spacing.xl, gap: 10 }}>
            <Button
              label="Add to calendar"
              variant="secondary"
              onPress={() => setCalendarHint(true)}
            />
            {calendarHint ? (
              <Body muted small>
                Calendar export is stubbed. The time is already confirmed here in Againsoon.
              </Body>
            ) : null}
            <Button
              label="Cancel this meet"
              variant="danger"
              onPress={() => cancelConfirmed(meet.id, 'Had to cancel.')}
            />
          </View>
        ) : null}
      </Screen>
      <LockInMoment
        visible={lockedIn}
        partnerName={them?.name ?? 'them'}
        onDone={() => setLockedIn(false)}
      />
    </View>
  );
}

function Row({
  icon,
  label,
  muted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={muted ? colors.inkSoft : colors.inkMuted} />
      <Body muted={muted} style={{ flex: 1 }}>
        {label}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  time: {
    fontFamily: fonts.displayMedium,
    fontSize: 22,
    color: colors.ink,
    marginTop: 6,
  },
  thread: {
    gap: 4,
    padding: 14,
  },
  threadLatest: {
    borderColor: colors.accentSoft,
    backgroundColor: colors.highlight,
  },
  threadWho: {
    fontFamily: fonts.bodySemi,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
});
