import * as Clipboard from 'expo-clipboard';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { SessionBanner } from '@/src/components/SessionBanner';
import {
  AvatarStack,
  Body,
  Button,
  Card,
  Chip,
  Display,
  Label,
  LoadingScreen,
  Screen,
  TextField,
  ToggleRow,
} from '@/src/components/ui';
import { currentPartner, isSharingLocation, otherPartner, upcomingKeyDates, upcomingReminders } from '@/src/data/selectors';
import { canSwitchPartner, isCloudCoupleReady, useAppStore } from '@/src/data/store';
import { confirmAction } from '@/src/lib/confirm';
import { formatInviteCode } from '@/src/lib/id';
import { requestOwnLocation } from '@/src/lib/location';
import { cadenceLabel } from '@/src/lib/goals';
import { formatDaysUntil, formatShortDate } from '@/src/lib/dates';
import { ACCENT_PRESETS, colors, fonts, radii, spacing } from '@/src/theme';
import type { DateGoalCadence, KeyDateKind } from '@/src/types';

const CADENCES: DateGoalCadence[] = ['weekly', 'twiceWeekly', 'biweekly', 'monthly'];
const KINDS: { id: KeyDateKind; label: string }[] = [
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'trip', label: 'Trip' },
  { id: 'other', label: 'Other' },
];

export default function UsScreen() {
  const router = useRouter();
  const {
    state,
    session,
    switchPartner,
    namePartner,
    reset,
    leaveCouple,
    rotateInviteCode,
    signOutUser,
    setLocationSharing,
    setDateGoal,
    setAccentPreset,
    toggleCalendarPrivacy,
    addKeyDate,
    removeKeyDate,
  } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const [partnerName, setPartnerName] = useState(them?.isPlaceholder ? '' : (them?.name ?? ''));
  const [copied, setCopied] = useState(false);
  const [keyTitle, setKeyTitle] = useState('');
  const [keyKind, setKeyKind] = useState<KeyDateKind>('anniversary');
  const [keyOffset, setKeyOffset] = useState('30');
  const [busy, setBusy] = useState<'leave' | 'rotate' | 'out' | null>(null);
  const [accountError, setAccountError] = useState('');

  if (session.kind === 'paired' && !isCloudCoupleReady(session, state)) return <LoadingScreen />;
  if (!state.couple || !me || !them) {
    return <Redirect href="/onboarding" />;
  }

  const code = formatInviteCode(state.couple.inviteCode);
  const shareMessage = `Join me on Againsoon with code ${state.couple.inviteCode}`;
  const upcoming = upcomingKeyDates(state.keyDates);
  const reminders = upcomingReminders(state.keyDates).slice(0, 6);
  const myCalendars = state.calendars.filter((item) => item.partnerId === me.id);

  async function copyCode() {
    await Clipboard.setStringAsync(state.couple!.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function shareCode() {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      await copyCode();
    }
  }

  function confirmReset() {
    void (async () => {
      const confirmed = await confirmAction(
        'Start over?',
        'This clears the couple and meets saved on this device.',
        'Start over',
      );
      if (confirmed) {
        reset();
        router.replace('/onboarding');
      }
    })();
  }

  async function confirmLeave() {
    const confirmed = await confirmAction(
      'Leave this couple?',
      'You’ll unpair from this space. Their data stays. You can join again with a fresh invite.',
      'Leave couple',
    );
    if (!confirmed) return;
    setBusy('leave');
    setAccountError('');
    const result = await leaveCouple();
    setBusy(null);
    if (result.error) {
      setAccountError(result.error);
      return;
    }
    router.replace('/onboarding/pair');
  }

  async function confirmSignOut() {
    const confirmed = await confirmAction(
      'Sign out?',
      'You’ll need your email to get back into this couple.',
      'Sign out',
    );
    if (!confirmed) return;
    setBusy('out');
    const result = await signOutUser();
    setBusy(null);
    if (result.error) {
      setAccountError(result.error);
      return;
    }
    router.replace('/onboarding');
  }

  async function rotateCode() {
    setBusy('rotate');
    setAccountError('');
    const result = await rotateInviteCode();
    setBusy(null);
    if (result.error) setAccountError(result.error);
  }

  return (
    <Screen>
      <SessionBanner />
      <Display size={32}>Us</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
        {session.kind === 'paired'
          ? 'Pairing, cadence, key dates, and the colours you two use — live on both phones.'
          : session.kind === 'demo'
            ? 'Offline demo. Pairing, cadence, and colours stay on this device.'
            : 'Pairing, cadence, key dates, and the colours you two use.'}
      </Body>

      <Card style={{ gap: spacing.md, alignItems: 'flex-start' }}>
        <AvatarStack left={me} right={them} />
        <Display size={24}>
          {me.name} & {them.name}
        </Display>
        {canSwitchPartner(session) ? (
          <>
            <Body muted small>
              You’re viewing as {me.name}. Switch to see proposals, privacy, and calendars from the other side.
            </Body>
            <Button label={`Switch to ${them.name}`} variant="secondary" onPress={switchPartner} />
          </>
        ) : (
          <Body muted small>
            You’re {me.name}. {them.isPlaceholder ? 'Waiting for your person to join with the invite code.' : `${them.name} is on the other phone.`}
          </Body>
        )}
      </Card>

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Display size={22}>Date cadence</Display>
        <Body muted small>
          Home counts confirmed history toward this month’s goal and nudges you when you’re behind.
        </Body>
        <View style={styles.wrap}>
          {CADENCES.map((item) => (
            <Chip
              key={item}
              label={cadenceLabel(item)}
              active={state.dateGoal.cadence === item}
              onPress={() => setDateGoal(item)}
            />
          ))}
        </View>
      </Card>

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Display size={22}>Key dates</Display>
        {upcoming.length === 0 ? (
          <Body muted small>
            Anniversaries, birthdays, trips — they’ll countdown on Home.
          </Body>
        ) : (
          upcoming.map((row) => (
            <View key={row.item.id} style={styles.keyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.keyTitle}>{row.item.title}</Text>
                <Body muted small>
                  {formatShortDate(row.occurs.toISOString())} · {row.label}
                  {row.item.annual ? ' · every year' : ''}
                </Body>
              </View>
              <Pressable onPress={() => removeKeyDate(row.item.id)}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
        <Label>Add one</Label>
        <TextField placeholder="Our anniversary" value={keyTitle} onChangeText={setKeyTitle} />
        <View style={styles.wrap}>
          {KINDS.map((item) => (
            <Chip key={item.id} label={item.label} active={keyKind === item.id} onPress={() => setKeyKind(item.id)} />
          ))}
        </View>
        <TextField
          label="Days from now"
          placeholder="30"
          keyboardType="number-pad"
          value={keyOffset}
          onChangeText={setKeyOffset}
        />
        <Button
          label="Save key date"
          variant="secondary"
          disabled={!keyTitle.trim()}
          onPress={() => {
            const days = Math.max(1, Number(keyOffset) || 30);
            const date = new Date();
            date.setDate(date.getDate() + days);
            addKeyDate({
              title: keyTitle.trim(),
              kind: keyKind,
              date: date.toISOString(),
              annual: keyKind !== 'trip',
            });
            setKeyTitle('');
          }}
        />
      </Card>

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Display size={22}>Upcoming reminders</Display>
        <Body muted small>
          Local stubs — no push notifications yet. You’ll see them here as the date approaches.
        </Body>
        {reminders.length === 0 ? (
          <Body muted small>
            Nothing queued. Add a key date above.
          </Body>
        ) : (
          reminders.map((row) => (
            <View key={row.id} style={styles.keyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.keyTitle}>{row.title}</Text>
                <Body muted small>
                  Remind {row.daysBefore === 1 ? 'the day before' : `${row.daysBefore} days before`} ·{' '}
                  {formatDaysUntil(row.fireAt)}
                </Body>
              </View>
            </View>
          ))
        )}
      </Card>

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Display size={22}>Your colours</Display>
        <Body muted small>
          Me / them / us. The first swatch is partner one, the second is partner two, gold is the two of you.
        </Body>
        <View style={{ gap: 10 }}>
          {ACCENT_PRESETS.map((preset) => {
            const active = state.accentPresetId === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() => setAccentPreset(preset.id)}
                style={[styles.preset, active && styles.presetActive]}>
                <View style={styles.swatches}>
                  <View style={[styles.swatch, { backgroundColor: preset.me }]} />
                  <View style={[styles.swatch, { backgroundColor: preset.them }]} />
                  <View style={[styles.swatch, { backgroundColor: preset.us }]} />
                </View>
                <Text style={styles.presetLabel}>{preset.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Display size={22}>Calendar privacy</Display>
        <Body muted small>
          Mock calendars only. When this is off, {them.name} sees “Busy” instead of the title.
        </Body>
        {myCalendars.map((calendar) => (
          <ToggleRow
            key={calendar.id}
            label={`${calendar.name} · show titles`}
            description={
              calendar.showDetailsToPartner
                ? `${them.name} can see event names on this calendar.`
                : `${them.name} only sees Busy.`
            }
            value={calendar.showDetailsToPartner}
            onValueChange={() => toggleCalendarPrivacy(calendar.id)}
          />
        ))}
      </Card>

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Display size={22}>Hour-before location</Display>
        <ToggleRow
          label="Share how far I am"
          description="Optional. Starting one hour before a confirmed meet, you and your person can see how far each of you is. Nothing is shared until both of you turn this on."
          value={isSharingLocation(state, me.id)}
          onValueChange={(value) => {
            setLocationSharing(value);
            if (value) requestOwnLocation();
          }}
        />
      </Card>

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Label>Invite code</Label>
        <Display size={30}>{code}</Display>
        <Body muted small>
          {session.kind === 'paired'
            ? `Share this with your person. It expires ${state.couple.inviteCodeExpiresAt ? formatShortDate(state.couple.inviteCodeExpiresAt) : 'in 7 days'} unless you rotate it.`
            : 'Share this on this device, or type DEMO on a fresh install to open the sample couple.'}
        </Body>
        <Button label={copied ? 'Copied' : 'Copy code'} variant="ghost" onPress={copyCode} />
        <Button label="Share invite" variant="ghost" onPress={shareCode} />
        {session.kind === 'paired' ? (
          <Button label="Rotate code" variant="ghost" loading={busy === 'rotate'} onPress={rotateCode} />
        ) : null}
      </Card>

      {them.isPlaceholder ? (
        <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Display size={22}>Name your person</Display>
          <TextField placeholder="Jordan" value={partnerName} onChangeText={setPartnerName} />
          <Button label="Save name" disabled={!partnerName.trim()} onPress={() => namePartner(partnerName)} />
        </Card>
      ) : null}

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Display size={22}>{session.kind === 'paired' ? 'Account' : 'On this device'}</Display>
        {accountError ? (
          <Body small style={{ color: colors.danger }}>
            {accountError}
          </Body>
        ) : (
          <Body muted small>
            {session.kind === 'paired'
              ? `Signed in as ${session.user?.email ?? 'you'}. Leave unpairs you; their space stays. Sign out keeps the couple for next time.`
              : session.kind === 'demo'
                ? 'This is the Maya & Jordan offline demo. Start over to leave it.'
                : 'Meets, ideas, and calendars are saved on this phone until you sign in.'}
          </Body>
        )}
        {session.kind === 'paired' ? (
          <>
            <Button label="Leave couple" variant="danger" loading={busy === 'leave'} onPress={confirmLeave} />
            <Button label="Sign out" variant="ghost" loading={busy === 'out'} onPress={confirmSignOut} />
          </>
        ) : (
          <Button label="Start over" variant="danger" onPress={confirmReset} />
        )}
        {session.kind === 'demo' && session.user ? (
          <Button label="Sign out of email too" variant="ghost" loading={busy === 'out'} onPress={confirmSignOut} />
        ) : null}
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  keyTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  remove: {
    fontFamily: fonts.bodyMedium,
    color: colors.inkSoft,
    fontSize: 13,
    paddingTop: 2,
  },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.canvasDeep,
  },
  presetActive: {
    borderColor: colors.invert,
  },
  swatches: {
    flexDirection: 'row',
    gap: 6,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  presetLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
});
