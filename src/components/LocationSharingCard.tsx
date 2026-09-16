import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Body, Button, Card, Display, ToggleRow } from '@/src/components/ui';
import { bothSharingLocation, currentPartner, isSharingLocation, latestRevision, otherPartner } from '@/src/data/selectors';
import { useAppStore } from '@/src/data/store';
import { formatMeters, isLocationWindowOpen, msUntilLocationWindow, offsetCoords, proximityForMeet, proximityFromCoords, requestOwnLocation, type Coords } from '@/src/lib/location';
import { colors, radii, spacing } from '@/src/theme';
import type { Meet, Partner } from '@/src/types';

export function LocationSharingCard({
  meet,
  compact = false,
}: {
  meet: Meet;
  compact?: boolean;
}) {
  const { state, setLocationSharing, switchPartner } = useAppStore();
  const me = currentPartner(state);
  const them = otherPartner(state);
  const [live, setLive] = useState(false);
  const [youCoords, setYouCoords] = useState<Coords | null>(null);
  const mineOn = isSharingLocation(state, state.currentPartnerId);
  const bothOn = bothSharingLocation(state);
  const windowOpen = isLocationWindowOpen(meet);
  const untilWindow = msUntilLocationWindow(meet);
  const venue = latestRevision(meet).place;
  const snapshot = useMemo(() => {
    if (youCoords && venue) {
      const venueCoords = { latitude: venue.lat, longitude: venue.lon };
      const them = offsetCoords(venueCoords, 420, -180);
      return proximityFromCoords(youCoords, them, venueCoords);
    }
    return proximityForMeet(meet);
  }, [meet, youCoords, venue, live, mineOn, bothOn]);

  useEffect(() => {
    if (!mineOn || !windowOpen) return;
    let active = true;
    requestOwnLocation().then((coords) => {
      if (active && coords) {
        setYouCoords(coords);
        setLive(true);
      }
    });
    return () => {
      active = false;
    };
  }, [mineOn, windowOpen, meet.id]);

  if (!me || !them) return null;

  async function enableSharing() {
    const coords = await requestOwnLocation();
    if (coords) setYouCoords(coords);
    setLive(Boolean(coords));
    setLocationSharing(true);
  }

  if (compact && !windowOpen) {
    return null;
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <View>
        <Display size={compact ? 20 : 24}>{windowOpen && bothOn ? 'On the way' : 'Hour-before location'}</Display>
        <Body muted small style={{ marginTop: 4 }}>
          Optional. From one hour before a confirmed meet, you can see how far each of you is — until you arrive.
        </Body>
      </View>

      <ToggleRow
        label={`Share my location as ${me.name}`}
        description={
          live
            ? 'This phone’s GPS is on. Distances use the live map pin for the meet; their pin is estimated on a one-device demo.'
            : 'We’ll ask for GPS when the window opens. Until then, distances are estimated.'
        }
        value={mineOn}
        onValueChange={(value) => {
          if (value) enableSharing();
          else setLocationSharing(false);
        }}
      />

      {!mineOn ? (
        <Body muted small>
          Off by default. Nothing is shared until you turn this on.
        </Body>
      ) : !isSharingLocation(state, them.id) ? (
        <View style={{ gap: 10 }}>
          <Body muted small>
            Waiting on {them.name} to turn this on too. On one phone, switch profiles to opt in as them.
          </Body>
          <Button label={`Switch to ${them.name}`} variant="secondary" onPress={switchPartner} />
        </View>
      ) : !windowOpen ? (
        <Body muted small>
          {untilWindow && untilWindow > 0
            ? `You’ll see each other starting in ${Math.max(1, Math.round(untilWindow / 60000))} minutes.`
            : 'Location sharing has closed for this meet.'}
        </Body>
      ) : (
        <ProximityTrack me={me} them={them} snapshot={snapshot} />
      )}
    </Card>
  );
}

function ProximityTrack({
  me,
  them,
  snapshot,
}: {
  me: Partner;
  them: Partner;
  snapshot: ReturnType<typeof proximityForMeet>;
}) {
  const youLeft = pct(Math.max(4, Math.min(86, snapshot.youProgress * 100)));
  const themLeft = pct(Math.max(8, Math.min(90, snapshot.themProgress * 100)));

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.track}>
        <View style={styles.rail} />
        <View style={[styles.pin, { left: youLeft }]}>
          <Avatar name={me.name} hue={me.hue} size={28} />
        </View>
        <View style={[styles.pin, { left: themLeft }]}>
          <Avatar name={them.name} hue={them.hue} size={28} />
        </View>
        <View style={styles.placeDot} />
      </View>
      <Body>
        You’re about {formatMeters(snapshot.youMeters)} from the meet (~{snapshot.youMinutes} min).
      </Body>
      <Body>
        {them.name} is about {formatMeters(snapshot.themMeters)} away (~{snapshot.themMinutes} min).
      </Body>
      <Body muted small>
        You’re roughly {formatMeters(snapshot.apartMeters)} apart — about {snapshot.apartMinutes} minutes from each other.
      </Body>
    </View>
  );
}

function pct(value: number): `${number}%` {
  return `${Math.round(value)}%` as `${number}%`;
}

const styles = StyleSheet.create({
  track: {
    height: 44,
    justifyContent: 'center',
    marginTop: 4,
  },
  rail: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 8,
  },
  pin: {
    position: 'absolute',
    top: 8,
    marginLeft: -14,
  },
  placeDot: {
    position: 'absolute',
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
  },
});
