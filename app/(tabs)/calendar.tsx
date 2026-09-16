import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AvailabilityBoard } from '@/src/components/AvailabilityBoard';
import { DemoSwitcher } from '@/src/components/DemoSwitcher';
import { Body, Button, Card, Display, Label, Screen } from '@/src/components/ui';
import { coupleAccents, currentPartner, otherPartner } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { providerLabel } from '@/src/lib/calendar';
import { colors, spacing } from '@/src/theme';

export default function CalendarScreen() {
  const router = useRouter();
  const { account, state, switchPartner } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const accents = coupleAccents(state);

  if (!state.couple || !me || !them || !state.currentPartnerId) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen>
      {account?.isSandbox ? (
        <DemoSwitcher current={me} other={them} onSwitch={switchPartner} />
      ) : null}
      <Display size={32}>Both of you</Display>
      <Body muted style={{ marginTop: 8, marginBottom: 18 }}>
        Sample calendars, plus locked-in meets and open proposals. Tap a mutual free slot to propose.
      </Body>

      <AvailabilityBoard
        me={me}
        them={them}
        usColor={accents.us}
        calendars={state.calendars}
        patterns={state.busyPatterns}
        meets={state.meets}
        viewerId={state.currentPartnerId}
        onProposeWindow={(startsAt, endsAt) =>
          router.push({
            pathname: '/propose',
            params: {
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
              source: 'calendar',
            },
          })
        }
        onOpenMeet={(id) => router.push(`/meet/${id}`)}
      />

      <View style={{ height: spacing.lg }} />
      <Card style={{ gap: 10, marginBottom: spacing.lg }}>
        <Label>Connect calendars</Label>
        <Body muted small>
          Google, Apple, and Outlook sync is coming soon. These blocks are rich mock data so you can still plan around
          a real-looking week.
        </Body>
        <Button label="Connect calendars — coming soon" variant="ghost" onPress={() => {}} />
      </Card>

      <View style={{ height: spacing.lg }} />
      <Label>Privacy on mock calendars</Label>
      <Body muted small style={{ marginTop: 6, marginBottom: 10 }}>
        Your person sees “Busy” unless a calendar is set to share titles. Switch profiles to check the other side.
      </Body>
      <View style={{ gap: 10 }}>
        {state.calendars.map((calendar) => {
          const owner = state.couple!.partners.find((partner) => partner.id === calendar.partnerId);
          const mine = calendar.partnerId === state.currentPartnerId;
          return (
            <Card key={calendar.id} style={styles.calRow}>
              <View style={{ flex: 1 }}>
                <Body>
                  {owner?.name} · {calendar.name}
                </Body>
                <Body muted small>
                  {providerLabel(calendar.provider)} · {calendar.showDetailsToPartner ? 'titles visible' : 'Busy only'}
                  {mine ? '' : ' to you'}
                </Body>
              </View>
              <View style={[styles.swatch, { backgroundColor: owner?.hue ?? colors.inkSoft }]} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
