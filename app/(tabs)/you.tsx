import * as Clipboard from 'expo-clipboard';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Share, View } from 'react-native';

import { AvatarStack, Body, Button, Card, Display, Label, Screen, TextField } from '@/src/components/ui';
import { currentPartner, otherPartner } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatInviteCode } from '@/src/lib/id';
import { spacing } from '@/src/theme';

export default function YouScreen() {
  const router = useRouter();
  const { state, switchPartner, namePartner, reset } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const [partnerName, setPartnerName] = useState(them?.isPlaceholder ? '' : (them?.name ?? ''));
  const [copied, setCopied] = useState(false);

  if (!state.couple || !me || !them) {
    return <Redirect href="/onboarding" />;
  }

  const code = formatInviteCode(state.couple.inviteCode);
  const shareMessage = `Join me on Againsoon with code ${state.couple.inviteCode}`;

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
    const message = 'This clears the couple and meets saved on this device.';
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && window.confirm(`Start over?\n\n${message}`);
      if (confirmed) {
        reset();
        router.replace('/onboarding');
      }
      return;
    }
    Alert.alert('Start over?', message, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: () => {
          reset();
          router.replace('/onboarding');
        },
      },
    ]);
  }

  return (
    <Screen>
        <Display size={32}>You two</Display>
        <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
          Lightweight pairing for this MVP. A real backend can replace the local store later without changing these screens much.
        </Body>

        <Card style={{ gap: spacing.md, alignItems: 'flex-start' }}>
          <AvatarStack left={me} right={them} />
          <Display size={24}>
            {me.name} & {them.name}
          </Display>
          <Body muted small>
            You’re viewing the app as {me.name}. Switch to see pending proposals from the other side.
          </Body>
          <Button label={`Switch to ${them.name}`} variant="secondary" onPress={switchPartner} />
        </Card>

        <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Label>Invite code</Label>
          <Display size={30}>{code}</Display>
          <Body muted small>
            Share this with your person, or type DEMO on a fresh install to open the sample couple.
          </Body>
          <Button label={copied ? 'Copied' : 'Copy code'} variant="ghost" onPress={copyCode} />
          <Button label="Share invite" variant="ghost" onPress={shareCode} />
        </Card>

        {them.isPlaceholder ? (
          <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
            <Display size={22}>Name your person</Display>
            <TextField
              placeholder="Jordan"
              value={partnerName}
              onChangeText={setPartnerName}
            />
            <Button
              label="Save name"
              disabled={!partnerName.trim()}
              onPress={() => namePartner(partnerName)}
            />
          </Card>
        ) : null}

        <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Display size={22}>On this device</Display>
          <Body muted small>
            Meets are saved in local storage. Notifications, real calendars, and accounts are out of MVP scope.
          </Body>
          <Button label="Start over" variant="danger" onPress={confirmReset} />
        </Card>
        <View style={{ height: 12 }} />
    </Screen>
  );
}
