import { useRouter } from 'expo-router';

import { BackRow, Body, Display, Screen } from '@/src/components/ui';

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <Screen>
      <BackRow onPress={() => router.back()} />
      <Display size={32}>Privacy Policy</Display>
      <Body muted small style={{ marginTop: 8, marginBottom: 18 }}>
        Last updated 16 September 2026
      </Body>
      <Body style={{ marginBottom: 14 }}>
        Againsoon stores your account and couple data on this device. We do not run a cloud account server in this version, we do not sell your data, we do not use the advertising ID, and we do not include app data in Android backups.
      </Body>
      <Body style={{ marginBottom: 14 }}>
        Account: email, first name, and a hashed password in secure storage. Couple data: meets, mocked calendars, lists, memories, and optional photos you attach.
      </Body>
      <Body style={{ marginBottom: 14 }}>
        Location is optional. If you turn on hour-before sharing, GPS on this phone estimates how far you are from a meet. Place search sends the query to OpenStreetMap-related geocoding so we can drop a pin.
      </Body>
      <Body style={{ marginBottom: 14 }}>
        Delete your account in Us → Delete account. That removes the Againsoon account, session, and couple data on this device.
      </Body>
      <Body muted small>
        Questions: hello@againsoon.app
      </Body>
    </Screen>
  );
}
